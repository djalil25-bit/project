from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

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
        })

class TransporterDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.TRANSPORTER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied
            
        open_count = DeliveryRequest.objects.filter(status=DeliveryStatusChoices.OPEN).count()
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
