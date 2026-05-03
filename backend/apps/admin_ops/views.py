from rest_framework.views import APIView
from rest_framework.response import Response
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

from .models import (
    Alert, AlertConfig, AdminMessage, MessageTemplate,
    ActivityLog, FlaggedAccount, AlertStatusChoices
)
from .serializers import (
    AlertSerializer, AlertConfigSerializer,
    AdminMessageSerializer, MessageTemplateSerializer,
    ActivityLogSerializer, FlaggedAccountSerializer
)


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
        """Product performance analytics. If ?product_id= given, show detail."""
        product_id = request.query_params.get('product_id')

        # Product list for dropdown
        products_list = list(
            Product.objects.filter(is_active=True)
            .values('id', 'title', 'category__name')
            .order_by('title')[:50]
        )

        if not product_id:
            return Response({'products': products_list})

        # Specific product analytics
        items = OrderItem.objects.filter(product_id=product_id)
        total_units = items.aggregate(t=Sum('quantity'))['t'] or 0
        total_revenue = items.aggregate(t=Sum(F('quantity') * F('price_snapshot')))['t'] or 0
        unique_sellers = items.values('farmer').distinct().count()
        unique_buyers = items.values('order__buyer').distinct().count()

        # Top 3 sellers
        top_sellers = list(
            items.values('farmer__id', 'farmer__full_name')
            .annotate(
                units=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price_snapshot')),
                avg_price=Avg('price_snapshot'),
            )
            .order_by('-revenue')[:3]
        )
        for i, s in enumerate(top_sellers):
            s['rank'] = i + 1

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
        zone = request.query_params.get('zone', '')

        # Available zones
        zones = list(
            Order.objects.exclude(wilaya='')
            .values_list('wilaya', flat=True).distinct().order_by('wilaya')
        )

        if not zone:
            return Response({'zones': zones})

        orders = Order.objects.filter(wilaya__iexact=zone)
        gmv = orders.aggregate(t=Sum('total_price'))['t'] or 0
        order_count = orders.count()
        avg_order = float(gmv / order_count) if order_count else 0
        farmers = orders.values('items__farmer').distinct().count()
        buyers = orders.values('buyer').distinct().count()

        # Top products in zone
        top_products = list(
            OrderItem.objects.filter(order__wilaya__iexact=zone)
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
            'farmers': farmers,
            'buyers': buyers,
            'top_products': top_products,
        })


class AnalyticsTopSellersAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        sellers = list(
            OrderItem.objects
            .values('farmer__id', 'farmer__full_name')
            .annotate(revenue=Sum(F('quantity') * F('price_snapshot')))
            .order_by('-revenue')[:10]
        )
        for i, s in enumerate(sellers):
            s['rank'] = i + 1
        return Response({'sellers': sellers})


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
                'stats': {
                    'listings': listing_count,
                    'orders': order_count,
                    'revenue': float(revenue),
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
        order_count = Order.objects.filter(buyer=u).count() + OrderItem.objects.filter(farmer=u).values('order').distinct().count()
        revenue = OrderItem.objects.filter(farmer=u).aggregate(t=Sum(F('quantity') * F('price_snapshot')))['t'] or 0

        return Response({
            'id': u.id, 'full_name': u.full_name, 'email': u.email,
            'phone': u.phone, 'role': u.role, 'status': u.status,
            'is_verified': u.is_verified, 'created_at': u.created_at,
            'last_login': u.last_login, 'address': u.address, 'bio': u.bio,
            'trust_level': u.trust_level, 'trust_score': u.trust_score,
            'stats': {'listings': listing_count, 'orders': order_count, 'revenue': float(revenue)},
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

        from apps.notifications.models import create_notification, NotificationType
        from django.core.mail import send_mail
        import threading

        def send_email_thread(subject, body, recipient_email):
            try:
                send_mail(
                    subject,
                    body,
                    None,  # uses DEFAULT_FROM_EMAIL
                    [recipient_email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email to {recipient_email}: {e}")

        if recipient_id == 'bulk':
            if target_role and target_role != 'all':
                recipients = User.objects.filter(role=target_role)
            else:
                recipients = User.objects.exclude(role=RoleChoices.ADMIN)

            for user in recipients:
                msg = AdminMessage.objects.create(
                    sender=request.user,
                    recipient=user,
                    channel=channel.upper(),
                    subject=subject,
                    body=body,
                    status='SENT',
                    is_reply_allowed=is_reply_allowed,
                    sent_at=timezone.now(),
                )
                create_notification(
                    user=user,
                    message=f"{subject}\n{body[:100]}...",
                    notif_type=NotificationType.GENERAL,
                    link=f"/messages?message_id={msg.id}"
                )
                if channel.upper() == 'EMAIL' and user.email:
                    threading.Thread(target=send_email_thread, args=(subject, body, user.email)).start()

            log_activity(request.user, 'Bulk Message Sent', {'target_role': target_role, 'subject': subject, 'count': recipients.count()})
            return Response({'message': f'Message sent to {recipients.count()} users'}, status=status.HTTP_201_CREATED)

        else:
            try:
                recipient = User.objects.get(pk=recipient_id)
            except User.DoesNotExist:
                return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)

            msg = AdminMessage.objects.create(
                sender=request.user,
                recipient=recipient,
                channel=channel.upper(),
                subject=subject,
                body=body,
                status='SENT',
                is_reply_allowed=is_reply_allowed,
                sent_at=timezone.now(),
            )
            create_notification(
                user=recipient,
                message=f"{subject}\n{body[:100]}...",
                notif_type=NotificationType.GENERAL,
                link=f"/messages?message_id={msg.id}"
            )
            if channel.upper() == 'EMAIL' and recipient.email:
                threading.Thread(target=send_email_thread, args=(subject, body, recipient.email)).start()

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
