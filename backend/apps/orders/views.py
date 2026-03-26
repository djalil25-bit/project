from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import Order, OrderItem, OrderStatusChoices
from .serializers import OrderSerializer, CheckoutSerializer, FarmerOrderItemStatusSerializer
from apps.cart.models import Cart
from apps.payments.models import Payment, PaymentStatusChoices
from apps.accounts.permissions import IsBuyerRole, IsFarmerRole

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'buyer':
            return Order.objects.filter(buyer=user).order_by('-created_at')
        return Order.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsBuyerRole], serializer_class=CheckoutSerializer)
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        try:
            cart = Cart.objects.get(buyer=user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        delivery_address = serializer.validated_data['delivery_address']

        with transaction.atomic():
            total_price = 0
            for item in cart_items:
                product = item.product
                if not product.is_active:
                    raise ValueError(f"Product {product.title} is no longer active.")
                if item.quantity > product.stock:
                    raise ValueError(f"Insufficient stock for {product.title}. Requested {item.quantity}, available {product.stock}.")
                
                total_price += product.price * item.quantity

            order = Order.objects.create(
                buyer=user,
                total_price=total_price,
                status=OrderStatusChoices.PENDING,
                delivery_address=delivery_address
            )

            for item in cart_items:
                product = item.product
                product.stock -= item.quantity
                product.save()

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item.quantity,
                    price_snapshot=product.price,
                    farmer=product.farmer
                )

            Payment.objects.create(
                order=order,
                amount=total_price,
                status=PaymentStatusChoices.PENDING,
                method='cash_on_delivery'
            )

            from apps.notifications.models import create_notification, NotificationType
            farmers = {item.farmer for item in cart_items if item.farmer}
            for farmer in farmers:
                create_notification(
                    user=farmer,
                    message=f"New order #{order.id} received.",
                    notif_type=NotificationType.ORDER_PLACED,
                    link=f"/farmer-dashboard"
                )

            cart_items.delete()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def handle_exception(self, exc):
        if isinstance(exc, ValueError):
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)


class FarmerOrderViewSet(viewsets.ViewSet):
    """
    For farmers to view and manage items ordered from them.
    Each farmer sees and manages the order at the OrderItem level.
    """
    permission_classes = [IsFarmerRole]

    def list(self, request):
        from apps.orders.serializers import OrderItemSerializer
        items = OrderItem.objects.filter(farmer=request.user).order_by('-created_at')
        serializer = OrderItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='status')
    def change_status(self, request, pk=None):
        try:
            item = OrderItem.objects.get(pk=pk, farmer=request.user)
        except OrderItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        serializer = FarmerOrderItemStatusSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            order = item.order
            
            from apps.notifications.models import create_notification, NotificationType
            
            if action_type == 'confirm':
                if order.status == OrderStatusChoices.PENDING:
                    order.status = OrderStatusChoices.CONFIRMED
                    order.save()
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} confirmed by farmer.",
                        notif_type=NotificationType.ORDER_CONFIRMED,
                        link=f"/buyer-dashboard"
                    )
            elif action_type == 'reject':
                if order.status == OrderStatusChoices.PENDING:
                    order.status = OrderStatusChoices.REJECTED
                    order.save()
                    # Restore stock
                    if item.product:
                        item.product.stock += item.quantity
                        item.product.save()
                    
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} rejected by farmer.",
                        notif_type=NotificationType.ORDER_REJECTED,
                        link=f"/buyer-dashboard"
                    )
            
            return Response({'status': 'ok', 'order_status': order.status})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='delivery')
    def update_delivery(self, request, pk=None):
        try:
            item = OrderItem.objects.get(pk=pk, farmer=request.user)
        except OrderItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        from .models import DeliveryStatusChoices
        if new_status in DeliveryStatusChoices.values:
            order = item.order
            order.delivery_status = new_status
            order.save()
            return Response({'status': 'ok', 'delivery_status': order.delivery_status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
