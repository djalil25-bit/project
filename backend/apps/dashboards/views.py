from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from apps.accounts.models import User, AccountStatusChoices, RoleChoices
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem
from apps.logistics.models import DeliveryRequest, DeliveryStatusChoices
from apps.payments.models import Payment

class AdminDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.ADMIN:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied
            
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

class FarmerDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != RoleChoices.FARMER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied
            
        my_products = Product.objects.filter(farmer=request.user).count()
        total_items_sold = OrderItem.objects.filter(farmer=request.user).count()
        total_revenue = OrderItem.objects.filter(
            farmer=request.user
        ).aggregate(total=Sum('price_snapshot'))['total'] or 0
        pending_orders = OrderItem.objects.filter(
            farmer=request.user, order__status='pending'
        ).count()
        
        return Response({
            'my_products_count': my_products,
            'total_items_sold': total_items_sold,
            'total_revenue': total_revenue,
            'pending_orders': pending_orders,
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
