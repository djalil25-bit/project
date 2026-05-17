from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
import requests
import os

from apps.accounts.models import User, AccountStatusChoices, RoleChoices
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem, OrderStatusChoices
from apps.logistics.models import DeliveryRequest, DeliveryStatusChoices
from apps.payments.models import Payment
from apps.accounts.permissions import IsAdminRole

class AdminDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        user = request.user
        print(f"[DEBUG AdminStats] User: {user.email}, Role: {user.role}, Is Superuser: {user.is_superuser}, Is Staff: {user.is_staff}")
            
        pending_users = User.objects.filter(status=AccountStatusChoices.PENDING).count()
        total_users = User.objects.exclude(role=RoleChoices.ADMIN).count()
        total_products = Product.objects.filter(is_active=True).count()
        total_orders = Order.objects.count()
        total_revenue = Payment.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        total_farmers = User.objects.filter(role=RoleChoices.FARMER, status=AccountStatusChoices.APPROVED).count()
        total_buyers = User.objects.filter(role=RoleChoices.BUYER, status=AccountStatusChoices.APPROVED).count()
        
        return Response({
            'pending_users': pending_users,
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_farmers': total_farmers,
            'total_buyers': total_buyers,
        })


class AdminMapDataAPIView(APIView):
    """Returns farm & transporter location data for the admin map overview."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from apps.farms.models import Farm, AssetStatusChoices
        from apps.accounts.models import AccountStatusChoices

        # Farms that are ACTIVE or PENDING, and whose owner is APPROVED or PENDING
        farms = Farm.objects.filter(
            status__in=[AssetStatusChoices.ACTIVE, AssetStatusChoices.PENDING],
            owner__status__in=[AccountStatusChoices.APPROVED, AccountStatusChoices.PENDING]
        ).select_related('owner').values(
            'id', 'name', 'wilaya', 'commune', 'latitude', 'longitude',
            'status', 'owner__full_name', 'owner__status'
        )

        # Transporters — use their registered wilaya as approximate location
        # Map wilaya codes to approximate center coordinates
        WILAYA_COORDS = {
            '1': (27.87, -0.29), '2': (36.16, 1.33), '3': (33.8, 2.88),
            '4': (35.87, 7.11), '5': (35.56, 6.17), '6': (36.76, 5.08),
            '7': (34.85, 5.73), '8': (31.62, -2.22), '9': (36.47, 2.83),
            '10': (36.38, 3.9), '11': (22.79, 5.53), '12': (35.4, 8.12),
            '13': (34.88, -1.31), '14': (35.37, 1.32), '15': (36.71, 4.05),
            '16': (36.75, 3.06), '17': (34.67, 3.25), '18': (36.82, 5.77),
            '19': (36.19, 5.41), '20': (34.83, 0.15), '21': (36.87, 6.91),
            '22': (35.19, -0.63), '23': (36.9, 7.77), '24': (36.46, 7.43),
            '25': (36.37, 6.61), '26': (36.26, 2.75), '27': (35.93, 0.09),
            '28': (35.7, 4.54), '29': (35.4, 0.14), '30': (31.95, 5.33),
            '31': (35.7, -0.63), '32': (33.68, 1.0), '33': (26.51, 8.48),
            '34': (36.07, 4.76), '35': (36.77, 3.47), '36': (36.77, 8.31),
            '37': (27.67, -8.15), '38': (35.6, 1.81), '39': (33.37, 6.86),
            '40': (35.43, 7.14), '41': (36.29, 7.95), '42': (36.59, 2.45),
            '43': (36.45, 6.26), '44': (36.26, 1.97), '45': (33.27, -0.31),
            '46': (35.3, -1.14), '47': (32.49, 3.67), '48': (35.74, 0.56),
        }

        # Mapping for city names to codes (fallback)
        CITY_TO_CODE = {
            'Adrar': '1', 'Chlef': '2', 'Laghouat': '3', 'Oum El Bouaghi': '4',
            'Batna': '5', 'Béjaïa': '6', 'Biskra': '7', 'Béchar': '8',
            'Blida': '9', 'Bouira': '10', 'Tamanrasset': '11', 'Tébessa': '12',
            'Tlemcen': '13', 'Tiaret': '14', 'Tizi Ouzou': '15', 'Algiers': '16',
            'Djelfa': '17', 'Jijel': '18', 'Sétif': '19', 'Saïda': '20',
            'Skikda': '21', 'Sidi Bel Abbès': '22', 'Annaba': '23', 'Guelma': '24',
            'Constantine': '25', 'Médéa': '26', 'Mostaganem': '27', "M'Sila": '28',
            'Mascara': '29', 'Ouargla': '30', 'Oran': '31', 'El Bayadh': '32',
            'Illizi': '33', 'Bordj Bou Arréridj': '34', 'Boumerdès': '35',
            'El Tarf': '36', 'Tindouf': '37', 'Tissemsilt': '38', 'El Oued': '39',
            'Khenchela': '40', 'Souk Ahras': '41', 'Tipaza': '42', 'Mila': '43',
            'Aïn Defla': '44', 'Naâma': '45', 'Aïn Témouchent': '46',
            'Ghardaïa': '47', 'Relizane': '48'
        }

        farm_list = []
        import random
        for f in farms:
            lat, lng = f['latitude'], f['longitude']
            # Fallback to wilaya coordinates if exact GPS is missing
            if lat is None or lng is None:
                wilaya_key = str(f['wilaya']).strip()
                # If it's a name, get the code
                if not wilaya_key.isdigit():
                    wilaya_key = CITY_TO_CODE.get(wilaya_key)
                
                coords = WILAYA_COORDS.get(wilaya_key)
                if coords:
                    # Add a small jitter (approx 1-2km) so they don't overlap perfectly
                    lat = coords[0] + (random.uniform(-0.01, 0.01))
                    lng = coords[1] + (random.uniform(-0.01, 0.01))
            
            if lat is not None and lng is not None:
                farm_list.append({
                    'id': f['id'],
                    'name': f['name'],
                    'wilaya': f['wilaya'],
                    'commune': f['commune'],
                    'latitude': lat,
                    'longitude': lng,
                    'status': f['status'],
                    'owner_name': f['owner__full_name'],
                })

        return Response({
            'farms': farm_list,
        })

class AdminAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        timeframe = request.query_params.get('timeframe', 'all')
        now = timezone.now()
        
        # Base filters
        payment_filter = {'status': 'paid'}
        user_filter = {}
        item_filter = {}
        
        if timeframe == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            payment_filter['created_at__gte'] = start_date
            user_filter['created_at__gte'] = start_date
            item_filter['created_at__gte'] = start_date
        elif timeframe == 'year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            payment_filter['created_at__gte'] = start_date
            user_filter['created_at__gte'] = start_date
            item_filter['created_at__gte'] = start_date

        # 1. Role Distribution (Always show full system status for context)
        roles_count = User.objects.values('role').annotate(count=Count('id'))
        roles_distribution = [
            {'name': role['role'], 'value': role['count']}
            for role in roles_count if role['role'] != RoleChoices.ADMIN
        ]

        # 2. Revenue over time (Monthly)
        revenue_trend = []
        payments = Payment.objects.filter(**payment_filter) \
                   .annotate(month=TruncMonth('created_at')) \
                   .values('month') \
                   .annotate(total=Sum('amount')) \
                   .order_by('month')
        
        for p in payments:
            if p['month']:
                revenue_trend.append({
                    'month': p['month'].strftime('%b %Y'),
                    'revenue': p['total']
                })

        # 3. Category Distribution
        categories_count = Product.objects.filter(is_active=True) \
                           .values('category__name') \
                           .annotate(count=Count('id')) \
                           .order_by('-count')[:5]
        
        category_distribution = [
            {'name': cat['category__name'], 'value': cat['count']}
            for cat in categories_count if cat['category__name']
        ]

        # 4. New users over time (Monthly)
        users_trend = []
        users_by_month = User.objects.exclude(role=RoleChoices.ADMIN).filter(**user_filter) \
                         .annotate(month=TruncMonth('created_at')) \
                         .values('month') \
                         .annotate(count=Count('id')) \
                         .order_by('month')

        for u in users_by_month:
            if u['month']:
                users_trend.append({
                    'month': u['month'].strftime('%b %Y'),
                    'users': u['count']
                })

        # 5. Top 3 Farmers by Sales
        top_farmers_qs = OrderItem.objects.filter(farmer__isnull=False, **item_filter).values(
            'farmer__id', 'farmer__full_name'
        ).annotate(
            total_sales=Sum(F('quantity') * F('price_snapshot')),
            total_orders=Count('order', distinct=True)
        ).order_by('-total_sales')[:3]
        
        top_farmers = [
            {
                'id': f['farmer__id'],
                'name': f['farmer__full_name'],
                'sales': float(f['total_sales'] or 0),
                'orders': f['total_orders']
            } for f in top_farmers_qs
        ]

        # 6. Top 3 Best-Selling Products
        top_products_qs = OrderItem.objects.filter(product__isnull=False, **item_filter).values(
            'product__id', 'product__title'
        ).annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price_snapshot'))
        ).order_by('-quantity_sold')[:3]
        
        top_products = [
            {
                'id': p['product__id'],
                'name': p['product__title'],
                'quantity': float(p['quantity_sold'] or 0),
                'revenue': float(p['revenue'] or 0)
            } for p in top_products_qs
        ]

        return Response({
            'role_distribution': roles_distribution,
            'revenue_trend': revenue_trend,
            'category_distribution': category_distribution,
            'users_trend': users_trend,
            'top_farmers': top_farmers,
            'top_products': top_products
        })

class FarmerDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.FARMER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied

        farmer = request.user
        my_products = Product.objects.filter(farmer=farmer).count()
        total_items_sold = OrderItem.objects.filter(farmer=farmer).count()
        total_revenue = OrderItem.objects.filter(
            farmer=farmer
        ).aggregate(total=Sum(F('quantity') * F('price_snapshot')))['total'] or 0
        pending_orders = Order.objects.filter(
            items__farmer=farmer, status=OrderStatusChoices.PENDING
        ).distinct().count()

        # Last 24h pending orders for dashboard feed
        cutoff = timezone.now() - timedelta(hours=24)
        recent_qs = Order.objects.filter(
            items__farmer=farmer,
            status=OrderStatusChoices.PENDING,
            created_at__gte=cutoff
        ).distinct().order_by('-created_at')[:5]

        recent_pending = []
        for o in recent_qs:
            recent_pending.append({
                'id': o.id,
                'farmer_order_number': o.farmer_order_number,
                'buyer_name': o.buyer.full_name or o.buyer.email,
                'total': float(o.total_price),
                'created_at': o.created_at.isoformat(),
            })

        return Response({
            'my_products_count': my_products,
            'total_items_sold': total_items_sold,
            'total_revenue': float(total_revenue),
            'pending_orders': pending_orders,
            'recent_pending_orders': recent_pending,
            'wilaya': farmer.address,  # Farmer's primary wilaya from registration
        })

class TransporterDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.TRANSPORTER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied
            
        from django.db.models import Q
        service_zones = request.user.service_zones or []
        
        open_q = Q(status=DeliveryStatusChoices.OPEN)
        if service_zones:
            zone_q = Q(pickup_wilaya='') | Q(pickup_wilaya__isnull=True)
            for zone in service_zones:
                if zone.strip():
                    zone_q |= Q(pickup_wilaya__iexact=zone.strip())
            open_q &= zone_q

        open_count = DeliveryRequest.objects.filter(open_q).count()
        my_active = DeliveryRequest.objects.filter(
            transporter=request.user,
            status__in=[DeliveryStatusChoices.ASSIGNED, DeliveryStatusChoices.PICKED_UP, DeliveryStatusChoices.IN_TRANSIT]
        ).count()
        my_completed = DeliveryRequest.objects.filter(
            transporter=request.user, status=DeliveryStatusChoices.DELIVERED
        ).count()
        
        return Response({
            'open_requests': open_count,
            'my_active_missions': my_active,
            'my_completed_missions': my_completed,
            'service_zones': service_zones,
        })


class FarmerAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.FARMER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied

        farmer = request.user
        timeframe = request.query_params.get('timeframe', 'all')
        now = timezone.now()

        item_filter = {'farmer': farmer}
        if timeframe == 'month':
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            item_filter['created_at__gte'] = start
        elif timeframe == 'year':
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            item_filter['created_at__gte'] = start

        # 1. Monthly revenue trend
        revenue_trend = []
        rev_qs = OrderItem.objects.filter(**item_filter) \
            .annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(revenue=Sum(F('quantity') * F('price_snapshot'))) \
            .order_by('month')
        for r in rev_qs:
            if r['month']:
                revenue_trend.append({
                    'month': r['month'].strftime('%b %Y'),
                    'revenue': float(r['revenue'] or 0)
                })

        # 2. Monthly order count trend
        orders_trend = []
        orders_qs = OrderItem.objects.filter(**item_filter) \
            .annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(order_count=Count('order', distinct=True)) \
            .order_by('month')
        for o in orders_qs:
            if o['month']:
                orders_trend.append({
                    'month': o['month'].strftime('%b %Y'),
                    'orders': o['order_count']
                })

        # 3. Best performing farms (by revenue)
        from apps.farms.models import Farm
        farms_perf = OrderItem.objects.filter(**item_filter) \
            .filter(product__farm__owner=farmer) \
            .values('product__farm__id', 'product__farm__name') \
            .annotate(
                revenue=Sum(F('quantity') * F('price_snapshot')),
                orders=Count('order', distinct=True)
            ).order_by('-revenue')[:5]
        best_farms = [
            {'id': f['product__farm__id'], 'name': f['product__farm__name'],
             'revenue': float(f['revenue'] or 0), 'orders': f['orders']}
            for f in farms_perf
        ]

        # 4. Best selling products (farmer's own)
        top_products = OrderItem.objects.filter(**item_filter) \
            .values('product__id', 'product__title') \
            .annotate(
                qty=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price_snapshot'))
            ).order_by('-qty')[:5]
        best_products = [
            {'id': p['product__id'], 'name': p['product__title'],
             'qty': float(p['qty'] or 0), 'revenue': float(p['revenue'] or 0)}
            for p in top_products
        ]

        # 5. Summary totals
        totals = OrderItem.objects.filter(**item_filter).aggregate(
            total_revenue=Sum(F('quantity') * F('price_snapshot')),
            total_orders=Count('order', distinct=True),
        )

        return Response({
            'revenue_trend': revenue_trend,
            'orders_trend': orders_trend,
            'best_farms': best_farms,
            'best_products': best_products,
            'total_revenue': float(totals['total_revenue'] or 0),
            'total_orders': totals['total_orders'] or 0,
        })

from django.db.models import Q
from rest_framework import status
from apps.admin_ops.models import AdminMessage, MessageStatusChoices, MessageChannelChoices
from apps.admin_ops.serializers import AdminMessageSerializer

class ActorMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == RoleChoices.ADMIN:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admins should use admin_ops endpoints.")

        # Inbox / History for actor
        qs = AdminMessage.objects.filter(Q(recipient=user) | Q(sender=user)).order_by('-created_at')
        return Response(AdminMessageSerializer(qs, many=True).data)

    def post(self, request):
        user = request.user
        if user.role == RoleChoices.ADMIN:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admins should use admin_ops endpoints.")

        parent_id = request.data.get('parent_id')
        body = request.data.get('body')

        if not parent_id or not body:
            return Response({"error": "parent_id and body are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parent_msg = AdminMessage.objects.get(id=parent_id)
        except AdminMessage.DoesNotExist:
            return Response({"error": "Parent message not found."}, status=status.HTTP_404_NOT_FOUND)

        if not parent_msg.is_reply_allowed:
            return Response({"error": "Replies are not allowed for this message."}, status=status.HTTP_403_FORBIDDEN)

        admin_recipient = parent_msg.sender if parent_msg.sender and parent_msg.sender.role == RoleChoices.ADMIN else User.objects.filter(role=RoleChoices.ADMIN).first()
        
        reply = AdminMessage.objects.create(
            sender=user,
            recipient=admin_recipient,
            channel=MessageChannelChoices.IN_APP,
            subject=f"Re: {parent_msg.subject}",
            body=body,
            status=MessageStatusChoices.SENT,
            parent=parent_msg,
            sent_at=timezone.now()
        )

        from apps.notifications.models import create_notification, NotificationType
        create_notification(
            user=admin_recipient,
            message=f"New reply from {user.full_name or user.email}: {body[:50]}...",
            notif_type=NotificationType.GENERAL,
            link=f"/admin-dashboard/messages?tab=inbox"
        )

        return Response(AdminMessageSerializer(reply).data, status=status.HTTP_201_CREATED)


class WeatherAPIView(APIView):
    """
    Secure proxy for OpenWeatherMap.
    GET /dashboards/weather/?farm_id=<id>
    Returns current weather + 5-day / 3-hour forecast aggregated per day.
    Falls back to city "Algiers" if the farm has no GPS coordinates or a valid city name.
    """
    permission_classes = [IsAuthenticated]

    # Algerian wilaya code → main city name (for farms that store wilaya as "16", "9", etc.)
    WILAYA_CODE_TO_CITY = {
        '1': 'Adrar', '2': 'Chlef', '3': 'Laghouat', '4': 'Oum El Bouaghi',
        '5': 'Batna', '6': 'Béjaïa', '7': 'Biskra', '8': 'Béchar',
        '9': 'Blida', '10': 'Bouira', '11': 'Tamanrasset', '12': 'Tébessa',
        '13': 'Tlemcen', '14': 'Tiaret', '15': 'Tizi Ouzou', '16': 'Algiers',
        '17': 'Djelfa', '18': 'Jijel', '19': 'Sétif', '20': 'Saïda',
        '21': 'Skikda', '22': 'Sidi Bel Abbès', '23': 'Annaba', '24': 'Guelma',
        '25': 'Constantine', '26': 'Médéa', '27': 'Mostaganem', '28': "M'Sila",
        '29': 'Mascara', '30': 'Ouargla', '31': 'Oran', '32': 'El Bayadh',
        '33': 'Illizi', '34': 'Bordj Bou Arréridj', '35': 'Boumerdès',
        '36': 'El Tarf', '37': 'Tindouf', '38': 'Tissemsilt', '39': 'El Oued',
        '40': 'Khenchela', '41': 'Souk Ahras', '42': 'Tipaza', '43': 'Mila',
        '44': 'Aïn Defla', '45': 'Naâma', '46': 'Aïn Témouchent',
        '47': 'Ghardaïa', '48': 'Relizane', '49': 'El MGhair', '50': 'El Menia',
        '51': 'Ouled Djellal', '52': 'Bordj Badji Mokhtar', '53': 'Béni Abbès',
        '54': 'Timimoun', '55': 'Touggourt', '56': 'Djanet', '57': 'In Salah',
        '58': 'In Guezzam',
    }

    def _resolve_city(self, wilaya_value, user=None):
        """
        Convert a wilaya field value to a searchable city name.
        Handles: numeric codes ("9", "16"), city names ("Blida"), None.
        Always returns a valid string for OpenWeatherMap's ?q= parameter.
        """
        if not wilaya_value:
            # Fallback to user's registered wilaya (stored in address)
            if user and user.address:
                wilaya_value = user.address
            else:
                return 'Algiers'
        
        stripped = str(wilaya_value).strip()
        # If it's a numeric code, map it
        if stripped.isdigit():
            return self.WILAYA_CODE_TO_CITY.get(stripped, 'Algiers')
        # Otherwise use it directly (it's already a city/wilaya name)
        return stripped if stripped else 'Algiers'

    def get(self, request):
        from apps.farms.models import Farm

        api_key = os.environ.get('OPENWEATHER_API_KEY', '')
        if not api_key:
            return Response({'error': 'Weather service not configured.'}, status=503)

        farm_id = request.query_params.get('farm_id')
        wilaya_param = request.query_params.get('wilaya')

        lat, lon = None, None
        farm_name = 'Algeria'
        city = 'Algiers'  # safe default

        if wilaya_param:
            city = self._resolve_city(wilaya_param, user=request.user)
            farm_name = wilaya_param
        elif farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=request.user)
                farm_name = farm.name
                lat = farm.latitude
                lon = farm.longitude
                city = self._resolve_city(farm.wilaya, user=request.user)
            except Farm.DoesNotExist:
                city = self._resolve_city(None, user=request.user)
        else:
            # Global fallback for user without specific farm selection
            city = self._resolve_city(None, user=request.user)
            farm_name = request.user.address or 'Algeria'

        # Build geo params — prefer lat/lon (most accurate), fall back to city name
        if lat and lon:
            geo_params = {'lat': lat, 'lon': lon}
        else:
            geo_params = {'q': f'{city},DZ'}

        base_params = {**geo_params, 'appid': api_key, 'units': 'metric', 'lang': 'en'}

        # --- Current weather ---
        try:
            current_resp = requests.get(
                'https://api.openweathermap.org/data/2.5/weather',
                params=base_params, timeout=8
            )
            current_resp.raise_for_status()
            current_data = current_resp.json()
        except Exception as e:
            return Response({'error': f'Weather API error: {str(e)}'}, status=502)

        current = {
            'temp': round(current_data['main']['temp']),
            'feels_like': round(current_data['main']['feels_like']),
            'humidity': current_data['main']['humidity'],
            'wind_speed': round(current_data['wind']['speed'] * 3.6, 1),  # m/s → km/h
            'description': current_data['weather'][0]['description'].capitalize(),
            'icon_code': current_data['weather'][0]['icon'],
            'city': current_data.get('name', city),
            'country': current_data.get('sys', {}).get('country', 'DZ'),
        }

        # --- 5-day / 3-hour forecast → aggregate to daily ---
        try:
            forecast_resp = requests.get(
                'https://api.openweathermap.org/data/2.5/forecast',
                params=base_params, timeout=8
            )
            forecast_resp.raise_for_status()
            forecast_data = forecast_resp.json()
        except Exception:
            return Response({'current': current, 'forecast': [], 'farm_name': farm_name})

        from collections import defaultdict
        days = defaultdict(list)
        for item in forecast_data.get('list', []):
            date_str = item['dt_txt'][:10]  # "YYYY-MM-DD"
            days[date_str].append(item)

        forecast = []
        for date_str in sorted(days.keys())[:6]:  # today + 5 days
            entries = days[date_str]
            temps = [e['main']['temp'] for e in entries]
            # Pick the noon entry if available, else the middle entry
            noon_entries = [e for e in entries if '12:00' in e['dt_txt']]
            representative = noon_entries[0] if noon_entries else entries[len(entries)//2]

            forecast.append({
                'date': date_str,
                'temp_min': round(min(temps)),
                'temp_max': round(max(temps)),
                'icon_code': representative['weather'][0]['icon'],
                'description': representative['weather'][0]['description'].capitalize(),
                'humidity': round(sum(e['main']['humidity'] for e in entries) / len(entries)),
                'wind_speed': round(sum(e['wind']['speed'] for e in entries) / len(entries) * 3.6, 1),
            })

        # Extract all 3-hour intervals for the hourly forecast widget, including the date
        hourly = []
        for item in forecast_data.get('list', []):
            hourly.append({
                'date': item['dt_txt'][:10],   # "YYYY-MM-DD"
                'time': item['dt_txt'][11:16], # "HH:MM"
                'temp': round(item['main']['temp']),
                'icon_code': item['weather'][0]['icon']
            })

        return Response({
            'farm_name': farm_name,
            'current': current,
            'forecast': forecast,
            'hourly': hourly,
        })

class PublicLandingStatsAPIView(APIView):
    from rest_framework.permissions import AllowAny
    permission_classes = [AllowAny]
    def get(self, request):
        farmers = User.objects.filter(role=RoleChoices.FARMER).count()
        wilayas = len(set(User.objects.exclude(address__isnull=True).values_list('address', flat=True)))
        if wilayas == 0:
            wilayas = 58
        return Response({'farmers': farmers, 'wilayas': wilayas})
