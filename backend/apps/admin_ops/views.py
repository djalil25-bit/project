from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status
from django.db.models import Q, Sum, Count, Avg, Min, Max, F
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsAdminRole
from apps.accounts.models import User, AccountStatusChoices, RoleChoices
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem, OrderStatusChoices
from apps.payments.models import Payment
from apps.farms.models import Farm
from apps.logistics.models import Vehicle, DeliveryRequest

from .models import (
    Alert, AlertConfig, AdminMessage, MessageTemplate,
    ActivityLog, FlaggedAccount, AlertStatusChoices
)
from .serializers import (
    AlertSerializer, AlertConfigSerializer,
    AdminMessageSerializer, MessageTemplateSerializer,
    ActivityLogSerializer, FlaggedAccountSerializer
)
from django.core.mail import send_mail
from apps.notifications.models import create_notification, NotificationType
import threading
from django.db import connection


# ─── UTILITY: log admin actions ───────────────────────────────────
def log_activity(actor, action, details=None, ip=None, action_status='success'):
    ActivityLog.objects.create(
        actor=actor,
        actor_type=actor.role if actor else 'system',
        action=action,
        details_json=details or {},
        ip_address=ip,
        status=action_status,
    )


# ═══════════════════════════════════════════════════════════════════
# 1. DASHBOARD KPIs
# ═══════════════════════════════════════════════════════════════════
class DashboardKPIsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        total_gmv = Order.objects.aggregate(t=Sum('total_price'))['t'] or 0
        today = timezone.now().date()
        orders_today = Order.objects.filter(created_at__date=today).count()
        active_users = User.objects.filter(status=AccountStatusChoices.APPROVED).count()
        active_alerts = Alert.objects.filter(status=AlertStatusChoices.ACTIVE).count()
        pending_verifications = User.objects.filter(status=AccountStatusChoices.PENDING).count()
        total_farmers = User.objects.filter(role=RoleChoices.FARMER).count()
        total_buyers = User.objects.filter(role=RoleChoices.BUYER).count()
        total_orders = Order.objects.count()
        total_products = Product.objects.filter(is_active=True).count()

        recent_alerts_qs = Alert.objects.filter(status=AlertStatusChoices.ACTIVE).order_by('-created_at')[:3]
        recent_alerts = [{
            'id': a.id,
            'alert_type': a.alert_type,
            'severity': a.severity,
            'created_at': a.created_at,
        } for a in recent_alerts_qs]

        return Response({
            'total_gmv': float(total_gmv),
            'orders_today': orders_today,
            'active_users': active_users,
            'active_alerts': active_alerts,
            'pending_verifications': pending_verifications,
            'total_farmers': total_farmers,
            'total_buyers': total_buyers,
            'total_orders': total_orders,
            'total_products': total_products,
            'recent_alerts': recent_alerts,
        })


# ═══════════════════════════════════════════════════════════════════
# 2. GLOBAL SEARCH
# ═══════════════════════════════════════════════════════════════════
class GlobalSearchAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'accounts': [], 'orders': [], 'products': []})

        results = {'accounts': [], 'orders': [], 'products': []}

        # Accounts
        users = User.objects.filter(
            Q(full_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        )[:10]
        for u in users:
            results['accounts'].append({
                'id': u.id, 'full_name': u.full_name, 'email': u.email,
                'role': u.role, 'status': u.status,
            })

        # Orders
        order_q = Q(buyer__full_name__icontains=query) | Q(buyer__email__icontains=query)
        if query.isdigit():
            order_q |= Q(id=int(query))
        for o in Order.objects.select_related('buyer').filter(order_q)[:10]:
            results['orders'].append({
                'id': o.id, 'buyer_name': o.buyer.full_name,
                'total_price': float(o.total_price), 'status': o.status,
                'created_at': o.created_at,
            })

        # Products
        for p in Product.objects.select_related('category', 'farmer').filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )[:10]:
            results['products'].append({
                'id': p.id, 'title': p.title,
                'category': p.category.name if p.category else '',
                'price': float(p.price), 'stock': float(p.stock),
                'farmer_name': p.farmer.full_name if p.farmer else '',
            })

        return Response(results)


# ═══════════════════════════════════════════════════════════════════
# 3. ALERTS
# ═══════════════════════════════════════════════════════════════════
class AlertListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AlertSerializer

    def get_queryset(self):
        qs = Alert.objects.all()
        st = self.request.query_params.get('status')
        tp = self.request.query_params.get('type')
        if st:
            qs = qs.filter(status=st.upper())
        if tp and tp != 'all':
            qs = qs.filter(alert_type=tp.upper())
        return qs


class AlertSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Alert.objects.filter(status=AlertStatusChoices.ACTIVE).values('alert_type').annotate(count=Count('id'))
        summary = {item['alert_type']: item['count'] for item in qs}
        return Response(summary)


class AlertActionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status:
            alert.status = new_status.upper()
            if new_status.upper() == 'RESOLVED':
                alert.resolved_at = timezone.now()
            alert.save()
            log_activity(request.user, 'Alert Status Changed',
                         {'alert_id': pk, 'new_status': new_status})
        return Response(AlertSerializer(alert).data)


class AlertConfigListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AlertConfigSerializer
    queryset = AlertConfig.objects.all()


# ═══════════════════════════════════════════════════════════════════
# 4. TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════
class TransactionListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Order.objects.select_related('buyer').prefetch_related('items__product', 'items__farmer').all()

        # Filters
        search = request.query_params.get('search', '').strip()
        st = request.query_params.get('status')
        zone = request.query_params.get('zone')
        sort_key = request.query_params.get('sort', '-created_at')

        if search:
            sq = Q(buyer__full_name__icontains=search) | Q(buyer__email__icontains=search)
            if search.isdigit():
                sq |= Q(id=int(search))
            # search in order items product title
            sq |= Q(items__product__title__icontains=search)
            # search in order items farmer name
            sq |= Q(items__farmer__full_name__icontains=search)
            qs = qs.filter(sq).distinct()

        if st and st != 'all':
            qs = qs.filter(status=st)
        if zone and zone != 'all':
            qs = qs.filter(wilaya__icontains=zone)

        # Sorting
        sort_map = {
            'date': '-created_at', '-date': 'created_at',
            'value': '-total_price', '-value': 'total_price',
            'status': 'status', '-status': '-status',
        }
        qs = qs.order_by(sort_map.get(sort_key, '-created_at'))

        # Pagination
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 20))
        total = qs.count()
        start = (page - 1) * per_page
        orders = qs[start:start + per_page]

        results = []
        for o in orders:
            items = o.items.all()
            first_item = items.first()
            farmer = first_item.farmer if first_item else None
            product_name = first_item.product.title if first_item and first_item.product else 'N/A'
            qty = sum(float(i.quantity) for i in items)

            results.append({
                'id': o.id,
                'created_at': o.created_at,
                'buyer_name': o.buyer.full_name,
                'buyer_zone': o.wilaya or '',
                'farmer_name': farmer.full_name if farmer else 'N/A',
                'farmer_zone': '',
                'product': product_name,
                'quantity': qty,
                'total_price': float(o.total_price),
                'order_subtotal': float(o.order_subtotal),
                'transport_fee': float(o.transport_fee),
                'status': o.status,
                'delivery_status': o.delivery_status,
                'payment_method': o.payment_method,
            })

        return Response({
            'results': results,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': -(-total // per_page),  # ceil div
        })


class TransactionDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, pk):
        try:
            o = Order.objects.select_related('buyer').prefetch_related(
                'items__product__category', 'items__farmer', 'timeline'
            ).get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        items_data = []
        for item in o.items.all():
            items_data.append({
                'product': item.product.title if item.product else 'Removed',
                'category': item.product.category.name if item.product and item.product.category else '',
                'quantity': float(item.quantity),
                'price_snapshot': float(item.price_snapshot),
                'item_total': float(item.item_total),
                'farmer_name': item.farmer.full_name if item.farmer else 'N/A',
                'farmer_email': item.farmer.email if item.farmer else '',
                'farmer_phone': item.farmer.phone if item.farmer else '',
                'farmer_verified': item.farmer.is_verified if item.farmer else False,
            })

        timeline_data = [{
            'status': t.status, 'note': t.note,
            'actor': t.actor.full_name if t.actor else 'System',
            'created_at': t.created_at,
        } for t in o.timeline.all()]

        return Response({
            'id': o.id,
            'created_at': o.created_at,
            'buyer': {
                'id': o.buyer.id, 'name': o.buyer.full_name,
                'email': o.buyer.email, 'phone': o.buyer.phone or o.buyer_phone,
                'zone': o.wilaya, 'verified': o.buyer.is_verified,
            },
            'items': items_data,
            'order_subtotal': float(o.order_subtotal),
            'transport_fee': float(o.transport_fee),
            'total_price': float(o.total_price),
            'status': o.status,
            'delivery_status': o.delivery_status,
            'delivery_address': o.delivery_address,
            'wilaya': o.wilaya,
            'commune': o.commune,
            'payment_method': o.payment_method,
            'refusal_reason': o.refusal_reason,
            'refusal_note': o.refusal_note,
            'notes': o.notes,
            'timeline': timeline_data,
        })


class TransactionActionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'verify':
            order.status = OrderStatusChoices.CONFIRMED
        elif action == 'flag':
            order.notes = (order.notes or '') + '\n[FLAGGED by admin]'
        elif action == 'cancel':
            order.status = OrderStatusChoices.CANCELLED
        else:
            return Response({'error': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

        order.save()
        order.add_timeline_entry(order.status, actor=request.user, note=f'Admin action: {action}')
        log_activity(request.user, f'Transaction {action}', {'order_id': pk})

        return Response({'status': order.status, 'message': f'Order {action} successful'})


# ═══════════════════════════════════════════════════════════════════
# 5. ANALYTICS
# ═══════════════════════════════════════════════════════════════════
class AnalyticsProductAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        """Product performance analytics. If ?product_title= given, show detail."""
        product_title = request.query_params.get('product_title')

        # Product list for dropdown (unique titles)
        products_list = list(
            Product.objects.filter(is_active=True)
            .values('title', 'category__name')
            .distinct()
            .order_by('title')[:50]
        )

        if not product_title:
            return Response({'products': products_list})

        # Specific product analytics across all farmers
        items = OrderItem.objects.filter(product__title=product_title)
        total_units = items.aggregate(t=Sum('quantity'))['t'] or 0
        total_revenue = items.aggregate(t=Sum(F('quantity') * F('price_snapshot')))['t'] or 0
        unique_sellers = items.values('product__farm__owner').distinct().count()
        unique_buyers = items.values('order__buyer').distinct().count()

        # Top 3 sellers for this product
        top_sellers = list(
            items.values('product__farm__owner__id', 'product__farm__owner__full_name')
            .annotate(
                units=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price_snapshot')),
                avg_price=Avg('price_snapshot'),
            )
            .order_by('-revenue')[:3]
        )
        for i, s in enumerate(top_sellers):
            s['rank'] = i + 1
            s['farmer__id'] = s.pop('product__farm__owner__id', None)
            s['farmer__full_name'] = s.pop('product__farm__owner__full_name', None)

        # Sales trend (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        trend = list(
            items.filter(created_at__gte=thirty_days_ago)
            .annotate(day=TruncDay('created_at'))
            .values('day')
            .annotate(sales=Sum('quantity'))
            .order_by('day')
        )
        for t in trend:
            t['day'] = t['day'].strftime('%b %d')
            t['sales'] = float(t['sales'])

        # Price analysis
        price_stats = items.aggregate(
            avg_price=Avg('price_snapshot'),
            min_price=Min('price_snapshot'),
            max_price=Max('price_snapshot'),
        )

        return Response({
            'products': products_list,
            'total_units': float(total_units),
            'total_revenue': float(total_revenue),
            'unique_sellers': unique_sellers,
            'unique_buyers': unique_buyers,
            'top_sellers': top_sellers,
            'trend': trend,
            'avg_price': float(price_stats['avg_price'] or 0),
            'min_price': float(price_stats['min_price'] or 0),
            'max_price': float(price_stats['max_price'] or 0),
        })


class AnalyticsZoneAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        zone = request.query_params.get('zone', 'All Zones')

        # 58 Wilayas of Algeria
        zones = [
            "All Zones", "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", 
            "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", 
            "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", 
            "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", 
            "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", 
            "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", 
            "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", 
            "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
        ]

        # Filter base querysets
        from apps.accounts.models import User
        if zone == "All Zones":
            orders = Order.objects.all()
            
            farmers = User.objects.filter(role='farmer').count()
            buyers = User.objects.filter(role='buyer').count()
            transporters = User.objects.filter(role='transporter').count()
            
            users = User.objects.all()
            online_farms = Farm.objects.filter(status='ACTIVE').count()
            online_vehicles = Vehicle.objects.filter(status='ACTIVE').count()
        else:
            orders = Order.objects.filter(wilaya__iexact=zone)
            
            farmers = User.objects.filter(role='farmer', farms__wilaya__iexact=zone).distinct().count()
            buyers = User.objects.filter(role='buyer', orders__wilaya__iexact=zone).distinct().count()
            transporters = User.objects.filter(role='transporter', deliveries__order__wilaya__iexact=zone).distinct().count()
            
            # Combine all users associated with this zone to calculate registration trends
            zone_users_ids = set(
                list(User.objects.filter(role='farmer', farms__wilaya__iexact=zone).values_list('id', flat=True)) +
                list(User.objects.filter(role='buyer', orders__wilaya__iexact=zone).values_list('id', flat=True)) +
                list(User.objects.filter(role='transporter', deliveries__order__wilaya__iexact=zone).values_list('id', flat=True))
            )
            users = User.objects.filter(id__in=zone_users_ids)
            online_farms = Farm.objects.filter(status='ACTIVE', wilaya__iexact=zone).count()
            online_vehicles = Vehicle.objects.filter(status='ACTIVE', owner__deliveries__order__wilaya__iexact=zone).distinct().count()

        gmv = orders.aggregate(t=Sum('total_price'))['t'] or 0
        order_count = orders.count()
        avg_order = float(gmv / order_count) if order_count else 0

        # User Registration Trend (Last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        registration_trend = list(
            users.filter(created_at__gte=thirty_days_ago)
            .annotate(day=TruncDay('created_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        for t in registration_trend:
            t['day'] = t['day'].strftime('%b %d')

        # Top products in zone
        if zone == "All Zones":
            order_items = OrderItem.objects.exclude(product__title__isnull=True)
        else:
            order_items = OrderItem.objects.filter(order__wilaya__iexact=zone).exclude(product__title__isnull=True)
            
        top_products = list(
            order_items
            .values('product__title')
            .annotate(units=Sum('quantity'), revenue=Sum(F('quantity') * F('price_snapshot')))
            .order_by('-revenue')[:5]
        )

        return Response({
            'zones': zones,
            'zone': zone,
            'gmv': float(gmv),
            'order_count': order_count,
            'avg_order': avg_order,
            'actors': {
                'farmers': farmers,
                'buyers': buyers,
                'transporters': transporters,
                'online_farms': online_farms,
                'online_vehicles': online_vehicles
            },
            'registration_trend': registration_trend,
            'top_products': top_products,
        })


class AnalyticsTopSellersAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from apps.accounts.models import User
        year = request.query_params.get('year')
        
        # Base Querysets
        sellers_qs = OrderItem.objects.all()
        buyers_qs = Order.objects.all()
        from apps.logistics.models import DeliveryRequest
        transporters_qs = DeliveryRequest.objects.filter(status='delivered')
        
        if year and year.isdigit():
            y = int(year)
            sellers_qs = sellers_qs.filter(created_at__year=y)
            buyers_qs = buyers_qs.filter(created_at__year=y)
            transporters_qs = transporters_qs.filter(created_at__year=y)

        # 1. Top Sellers (Farmers)
        sellers = list(
            sellers_qs
            .values('farmer__id', 'farmer__full_name', 'farmer__email', 'farmer__phone', 'farmer__badges')
            .annotate(revenue=Sum(F('quantity') * F('price_snapshot')))
            .order_by('-revenue')[:5]
        )
        for i, s in enumerate(sellers):
            s['rank'] = i + 1
            s['id'] = s.pop('farmer__id', None)
            s['name'] = s.pop('farmer__full_name', None)
            s['email'] = s.pop('farmer__email', None)
            s['phone'] = s.pop('farmer__phone', None)
            s['badges'] = s.pop('farmer__badges', [])
            s['metric_label'] = 'Revenue'
            s['metric_value'] = s.pop('revenue', 0)

        # 2. Top Buyers
        buyers = list(
            buyers_qs
            .values('buyer__id', 'buyer__full_name', 'buyer__email', 'buyer__phone', 'buyer__badges')
            .annotate(spend=Sum('total_price'))
            .order_by('-spend')[:5]
        )
        for i, b in enumerate(buyers):
            b['rank'] = i + 1
            b['id'] = b.pop('buyer__id', None)
            b['name'] = b.pop('buyer__full_name', None)
            b['email'] = b.pop('buyer__email', None)
            b['phone'] = b.pop('buyer__phone', None)
            b['badges'] = b.pop('buyer__badges', [])
            b['metric_label'] = 'Total Spend'
            b['metric_value'] = b.pop('spend', 0)

        # 3. Top Transporters
        transporters = list(
            transporters_qs
            .values('transporter__id', 'transporter__full_name', 'transporter__email', 'transporter__phone', 'transporter__badges')
            .annotate(deliveries_count=Count('id'))
            .order_by('-deliveries_count')[:5]
        )
        for i, t in enumerate(transporters):
            t['rank'] = i + 1
            t['id'] = t.pop('transporter__id', None)
            t['name'] = t.pop('transporter__full_name', None)
            t['email'] = t.pop('transporter__email', None)
            t['phone'] = t.pop('transporter__phone', None)
            t['badges'] = t.pop('transporter__badges', [])
            t['metric_label'] = 'Deliveries Completed'
            t['metric_value'] = t.pop('deliveries_count', 0)

        return Response({
            'sellers': sellers,
            'buyers': buyers,
            'transporters': transporters
        })

class AwardBadgeAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        from apps.accounts.models import User
        user_id = request.data.get('user_id')
        badge = request.data.get('badge')
        
        if not user_id or not badge:
            return Response({'error': 'user_id and badge are required'}, status=400)
            
        try:
            user = User.objects.get(id=user_id)
            if badge not in user.badges:
                user.badges.append(badge)
                user.save()
            return Response({'message': 'Badge awarded successfully!', 'badges': user.badges})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


# ═══════════════════════════════════════════════════════════════════
# 6. ACCOUNTS
# ═══════════════════════════════════════════════════════════════════
class AccountSearchAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = User.objects.exclude(role=RoleChoices.ADMIN)

        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role')
        st = request.query_params.get('status')

        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        if role and role != 'all':
            qs = qs.filter(role=role)
        if st and st != 'all':
            qs = qs.filter(status=st)

        users = qs.order_by('-created_at')[:100]
        results = []
        for u in users:
            # Real stats from DB
            listing_count = Product.objects.filter(farmer=u, is_active=True).count() if u.role == 'farmer' else 0
            order_count = Order.objects.filter(buyer=u).count() if u.role == 'buyer' else (
                OrderItem.objects.filter(farmer=u).values('order').distinct().count() if u.role == 'farmer' else 0
            )
            revenue = OrderItem.objects.filter(farmer=u).aggregate(
                t=Sum(F('quantity') * F('price_snapshot'))
            )['t'] or 0 if u.role == 'farmer' else 0

            # Transporter specific stats
            vehicle_count = Vehicle.objects.filter(owner=u).count() if u.role == 'transporter' else 0
            mission_count = DeliveryRequest.objects.filter(transporter=u).count() if u.role == 'transporter' else 0

            results.append({
                'id': u.id,
                'full_name': u.full_name,
                'email': u.email,
                'phone': u.phone,
                'role': u.role,
                'status': u.status,
                'is_verified': u.is_verified,
                'created_at': u.created_at,
                'last_login': u.last_login,
                'address': u.address,
                'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
                'stats': {
                    'listings': listing_count,
                    'orders': order_count,
                    'revenue': float(revenue),
                    'vehicles': vehicle_count,
                    'missions': mission_count,
                },
            })

        return Response(results)


class AccountDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, pk):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        listing_count = Product.objects.filter(farmer=u, is_active=True).count()
        order_count = Order.objects.filter(buyer=u).count() if u.role == 'buyer' else (
            OrderItem.objects.filter(farmer=u).values('order').distinct().count() if u.role == 'farmer' else 0
        )
        revenue = OrderItem.objects.filter(farmer=u).aggregate(t=Sum(F('quantity') * F('price_snapshot')))['t'] or 0
        
        vehicle_count = Vehicle.objects.filter(owner=u).count() if u.role == 'transporter' else 0
        mission_count = DeliveryRequest.objects.filter(transporter=u).count() if u.role == 'transporter' else 0

        return Response({
            'id': u.id, 'full_name': u.full_name, 'email': u.email,
            'phone': u.phone, 'role': u.role, 'status': u.status,
            'is_verified': u.is_verified, 'created_at': u.created_at,
            'last_login': u.last_login, 'address': u.address, 'bio': u.bio,
            'trust_level': u.trust_level, 'trust_score': u.trust_score,
            'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
            'stats': {
                'listings': listing_count, 
                'orders': order_count, 
                'revenue': float(revenue),
                'vehicles': vehicle_count,
                'missions': mission_count,
            },
        })


class AccountActionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'suspend':
            user.status = AccountStatusChoices.SUSPENDED
            user.save()
        elif action == 'verify' or action == 'approve':
            user.status = AccountStatusChoices.APPROVED
            user.is_verified = True
            user.verification_date = timezone.now()
            user.save()
            
            # Auto-create Farm if Farmer and doesn't exist yet
            if user.role == RoleChoices.FARMER:
                try:
                    profile = user.farmerprofile
                    if not Farm.objects.filter(owner=user).exists():
                        # The user.address field stores the Wilaya string in this system
                        Farm.objects.create(
                            owner=user,
                            name=profile.farm_name or f"{user.full_name}'s Farm",
                            location=profile.farm_location or user.address,
                            wilaya=user.address or '', 
                            size_hectares=profile.farm_size_hectares,
                        )
                except Exception as e:
                    # Log error but don't fail the verification
                    print(f"Failed to auto-create farm for {user.email}: {e}")
            
            user.save()
        elif action == 'reject':
            user.status = AccountStatusChoices.REJECTED
            user.save()
        elif action == 'reactivate':
            user.status = AccountStatusChoices.APPROVED
            user.save()
        else:
            return Response({'error': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

        log_activity(request.user, f'Account {action}', {'user_id': pk, 'user_email': user.email})
        return Response({'status': user.status, 'message': f'Account {action} successful'})


# ═══════════════════════════════════════════════════════════════════
# 7. MESSAGES
# ═══════════════════════════════════════════════════════════════════
class MessageSendAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        target_role = request.data.get('target_role')
        subject = request.data.get('subject', '')
        body = request.data.get('body', '')
        channel = request.data.get('channel', 'IN_APP')
        is_reply_allowed = request.data.get('is_reply_allowed', False)

        if not recipient_id or not subject or not body:
            return Response({'error': 'recipient_id, subject, and body are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        def get_html_content(subject, body):
            return f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #064e3b; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">AgriGov Institutional</h1>
                </div>
                <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                    <h2 style="margin-top: 0; color: #0f172a; font-size: 18px;">{subject}</h2>
                    <div style="white-space: pre-wrap; font-size: 14px; margin-bottom: 24px;">{body}</div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
                        <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                            Official Administrative Transmission • AgriGov Platform
                        </p>
                    </div>
                </div>
            </div>
            """

        def dispatch_email_sync(msg_id, subject, body, recipient_email):
            """Helper to send email synchronously."""
            try:
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.EMAIL_HOST_USER, # Simpler sender for higher compatibility
                    recipient_list=[recipient_email],
                    html_message=get_html_content(subject, body),
                    fail_silently=False,
                )
                AdminMessage.objects.filter(pk=msg_id).update(status='SENT', sent_at=timezone.now())
                return True
            except Exception as e:
                print(f"CRITICAL: Failed to send email to {recipient_email}: {str(e)}")
                AdminMessage.objects.filter(pk=msg_id).update(status='FAILED')
                return False

        def bulk_dispatch_thread(subject, body, recipients_data):
            """Thread for bulk email dispatch."""
            for msg_id, email in recipients_data:
                dispatch_email_sync(msg_id, subject, body, email)
            connection.close() # Important for threads

        if recipient_id == 'bulk':
            if target_role and target_role != 'all':
                recipients = User.objects.filter(role=target_role)
            else:
                recipients = User.objects.exclude(role=RoleChoices.ADMIN)

            msgs = [
                AdminMessage(
                    sender=request.user,
                    recipient=user,
                    channel=channel.upper(),
                    subject=subject,
                    body=body,
                    status='PENDING',
                    is_reply_allowed=is_reply_allowed,
                ) for user in recipients
            ]
            
            created_msgs = AdminMessage.objects.bulk_create(msgs)
            
            recipients_email_data = []
            for msg in created_msgs:
                create_notification(
                    user=msg.recipient,
                    message=f"{subject}\n{body[:100]}...",
                    notif_type=NotificationType.GENERAL,
                    link=f"/messages?message_id={msg.id}"
                )
                if channel.upper() == 'EMAIL' and msg.recipient.email:
                    recipients_email_data.append((msg.id, msg.recipient.email))

            if recipients_email_data:
                threading.Thread(
                    target=bulk_dispatch_thread, 
                    args=(subject, body, recipients_email_data)
                ).start()
            else:
                AdminMessage.objects.filter(id__in=[m.id for m in created_msgs]).update(status='SENT', sent_at=timezone.now())

            log_activity(request.user, 'Bulk Message Sent', {'target_role': target_role, 'subject': subject, 'count': len(created_msgs)})
            return Response({'message': f'Message initialized for {len(created_msgs)} users'}, status=status.HTTP_201_CREATED)

        else:
            try:
                recipient = User.objects.get(pk=recipient_id)
            except (User.DoesNotExist, ValueError):
                return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)

            msg = AdminMessage.objects.create(
                sender=request.user,
                recipient=recipient,
                channel=channel.upper(),
                subject=subject,
                body=body,
                status='PENDING',
                is_reply_allowed=is_reply_allowed,
            )
            
            create_notification(
                user=recipient,
                message=f"{subject}\n{body[:100]}...",
                notif_type=NotificationType.GENERAL,
                link=f"/messages?message_id={msg.id}"
            )

            if channel.upper() == 'EMAIL' and recipient.email:
                # Individual emails are now sent synchronously to avoid threading issues in local dev
                dispatch_email_sync(msg.id, subject, body, recipient.email)
            else:
                msg.status = 'SENT'
                msg.sent_at = timezone.now()
                msg.save()

            log_activity(request.user, 'Message Sent', {'to': recipient.email, 'subject': subject})
            return Response(AdminMessageSerializer(msg).data, status=status.HTTP_201_CREATED)



class MessageHistoryAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AdminMessageSerializer

    def get_queryset(self):
        return AdminMessage.objects.select_related('sender', 'recipient').filter(sender=self.request.user).order_by('-created_at')


class MessageInboxAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AdminMessageSerializer

    def get_queryset(self):
        qs = AdminMessage.objects.select_related('sender', 'recipient').filter(recipient=self.request.user)
        role = self.request.query_params.get('role')
        if role and role != 'all':
            qs = qs.filter(sender__role=role)
        return qs.order_by('-created_at')


class MessageTemplateListAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = MessageTemplateSerializer
    queryset = MessageTemplate.objects.all()


class RecipientSearchAPIView(APIView):
    """Quick user search for message recipient autocomplete."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        users = User.objects.filter(
            Q(full_name__icontains=q) | Q(email__icontains=q)
        ).exclude(role=RoleChoices.ADMIN)[:10]
        return Response([
            {'id': u.id, 'full_name': u.full_name, 'email': u.email, 'role': u.role}
            for u in users
        ])


# ═══════════════════════════════════════════════════════════════════
# 8. MONITORING
# ═══════════════════════════════════════════════════════════════════
class ActivityLogAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = ActivityLog.objects.select_related('actor').all()

        search = request.query_params.get('search', '').strip()
        actor_type = request.query_params.get('actor_type')
        date_range = request.query_params.get('date_range', '30d')

        # Date filter
        hours_map = {'24h': 24, '7d': 168, '30d': 720}
        hours = hours_map.get(date_range, 720)
        cutoff = timezone.now() - timedelta(hours=hours)
        qs = qs.filter(timestamp__gte=cutoff)

        if search:
            qs = qs.filter(
                Q(action__icontains=search) |
                Q(actor__full_name__icontains=search)
            )
        if actor_type and actor_type != 'all':
            qs = qs.filter(actor_type=actor_type)

        page = int(request.query_params.get('page', 1))
        per_page = 20
        total = qs.count()
        start = (page - 1) * per_page
        logs = qs[start:start + per_page]

        results = []
        for l in logs:
            results.append({
                'id': l.id,
                'timestamp': l.timestamp,
                'actor': l.actor.full_name if l.actor else 'System',
                'actor_type': l.actor_type,
                'action': l.action,
                'details': l.details_json,
                'status': l.status,
                'ip_address': l.ip_address,
            })

        return Response({
            'results': results,
            'total': total,
            'page': page,
            'total_pages': -(-total // per_page),
        })


class FlaggedAccountListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = FlaggedAccountSerializer
    queryset = FlaggedAccount.objects.select_related('account').all()


class FlaggedAccountActionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            flag = FlaggedAccount.objects.get(pk=pk)
        except FlaggedAccount.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status:
            flag.status = new_status.upper()
            if new_status.upper() == 'RESOLVED':
                flag.resolved_at = timezone.now()
            flag.save()
            log_activity(request.user, 'Flagged Account Updated',
                         {'flag_id': pk, 'new_status': new_status})
        return Response(FlaggedAccountSerializer(flag).data)


# ═══════════════════════════════════════════════════════════════════
# 9. FARM APPROVALS
# ═══════════════════════════════════════════════════════════════════
class FarmApprovalListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from apps.farms.models import Farm
        qs = Farm.objects.select_related('owner').all().order_by('-created_at')

        status_filter = request.query_params.get('status', 'PENDING')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter.upper())

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(owner__full_name__icontains=search) |
                Q(wilaya__icontains=search)
            )

        results = []
        for f in qs[:100]:
            results.append({
                'id': f.id,
                'name': f.name,
                'location': f.location,
                'wilaya': f.wilaya,
                'commune': f.commune,
                'size_hectares': float(f.size_hectares) if f.size_hectares else None,
                'image': f.image.url if f.image else None,
                'registry_document': f.registry_document.url if f.registry_document else None,
                'status': f.status,
                'rejection_reason': f.rejection_reason,
                'created_at': f.created_at,
                'reviewed_at': f.reviewed_at,
                'owner_id': f.owner.id,
                'owner_name': f.owner.full_name,
                'owner_email': f.owner.email,
                'owner_phone': f.owner.phone,
            })

        return Response(results)


class FarmApprovalActionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        from apps.farms.models import Farm, AssetStatusChoices
        try:
            farm = Farm.objects.get(pk=pk)
        except Farm.DoesNotExist:
            return Response({'error': 'Farm not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'approve' or 'reject'

        if action == 'approve':
            farm.status = AssetStatusChoices.ACTIVE
            farm.rejection_reason = ''
            farm.reviewed_at = timezone.now()
            farm.reviewed_by = request.user
            farm.save()

            # Notify farmer
            from apps.notifications.models import create_notification, NotificationType
            create_notification(
                user=farm.owner,
                message=f'Your farm "{farm.name}" has been approved! You can now list products.',
                notif_type=NotificationType.FARM_APPROVED,
                link='/farmer-dashboard/farms'
            )
            log_activity(request.user, 'Farm Approved', {'farm_id': pk, 'farm_name': farm.name})
            return Response({'status': farm.status, 'message': 'Farm approved successfully'})

        elif action == 'reject':
            reason = request.data.get('reason', '')
            if not reason:
                return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)

            farm.status = AssetStatusChoices.REJECTED
            farm.rejection_reason = reason
            farm.reviewed_at = timezone.now()
            farm.reviewed_by = request.user
            farm.save()

            from apps.notifications.models import create_notification, NotificationType
            create_notification(
                user=farm.owner,
                message=f'Your farm "{farm.name}" was rejected. Reason: {reason}',
                notif_type=NotificationType.FARM_REJECTED,
                link='/farmer-dashboard/farms'
            )
            log_activity(request.user, 'Farm Rejected', {'farm_id': pk, 'reason': reason})
            return Response({'status': farm.status, 'message': 'Farm rejected'})

        return Response({'error': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════
# 10. VEHICLE APPROVALS
# ═══════════════════════════════════════════════════════════════════
class VehicleApprovalListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from apps.logistics.models import Vehicle
        qs = Vehicle.objects.select_related('owner').all().order_by('-created_at')

        status_filter = request.query_params.get('status', 'PENDING')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter.upper())

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(plate__icontains=search) |
                Q(model__icontains=search) |
                Q(owner__full_name__icontains=search)
            )

        results = []
        for v in qs[:100]:
            results.append({
                'id': v.id,
                'plate': v.plate,
                'model': v.model,
                'capacity': v.capacity,
                'type': v.type,
                'fuelType': v.fuelType,
                'is_active': v.is_active,
                'carte_grise': v.carte_grise.url if v.carte_grise else None,
                'status': v.status,
                'rejection_reason': v.rejection_reason,
                'created_at': v.created_at,
                'reviewed_at': v.reviewed_at,
                'owner_id': v.owner.id,
                'owner_name': v.owner.full_name,
                'owner_email': v.owner.email,
                'owner_phone': v.owner.phone,
            })

        return Response(results)


class VehicleApprovalActionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        from apps.logistics.models import Vehicle, VehicleStatusChoices
        try:
            vehicle = Vehicle.objects.get(pk=pk)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')

        if action == 'approve':
            vehicle.status = VehicleStatusChoices.ACTIVE
            vehicle.rejection_reason = ''
            vehicle.reviewed_at = timezone.now()
            vehicle.reviewed_by = request.user
            vehicle.save()

            from apps.notifications.models import create_notification, NotificationType
            create_notification(
                user=vehicle.owner,
                message=f'Your vehicle "{vehicle.model}" ({vehicle.plate}) has been approved!',
                notif_type=NotificationType.VEHICLE_APPROVED,
                link='/transporter-dashboard/vehicles'
            )
            log_activity(request.user, 'Vehicle Approved', {'vehicle_id': pk, 'plate': vehicle.plate})
            return Response({'status': vehicle.status, 'message': 'Vehicle approved successfully'})

        elif action == 'reject':
            reason = request.data.get('reason', '')
            if not reason:
                return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)

            vehicle.status = VehicleStatusChoices.REJECTED
            vehicle.rejection_reason = reason
            vehicle.reviewed_at = timezone.now()
            vehicle.reviewed_by = request.user
            vehicle.save()

            from apps.notifications.models import create_notification, NotificationType
            create_notification(
                user=vehicle.owner,
                message=f'Your vehicle "{vehicle.model}" ({vehicle.plate}) was rejected. Reason: {reason}',
                notif_type=NotificationType.VEHICLE_REJECTED,
                link='/transporter-dashboard/vehicles'
            )
            log_activity(request.user, 'Vehicle Rejected', {'vehicle_id': pk, 'reason': reason})
            return Response({'status': vehicle.status, 'message': 'Vehicle rejected'})

        return Response({'error': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

