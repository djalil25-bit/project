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

        cart_items = list(cart.items.select_related('product', 'product__farmer').all())
        if not cart_items:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        vdata = serializer.validated_data
        delivery_address = vdata['delivery_address']
        wilaya = vdata.get('wilaya', '')
        buyer_phone = vdata.get('buyer_phone', '')
        payment_method = vdata.get('payment_method', 'cash_on_delivery')
        notes = vdata.get('notes', '')
        preferred_delivery_date = vdata.get('preferred_delivery_date', None)

        try:
            with transaction.atomic():
                from collections import defaultdict
                from apps.notifications.models import create_notification, NotificationType

                # Validate all items first before touching anything
                for item in cart_items:
                    product = item.product
                    if not product.is_active:
                        raise ValueError(f"Product '{product.title}' is no longer active.")
                    if item.quantity > product.stock:
                        raise ValueError(
                            f"Insufficient stock for '{product.title}'. "
                            f"Requested {item.quantity}, available {product.stock}."
                        )

                # Group items by farmer ID (use ID as key to avoid ORM object identity issues)
                items_by_farmer_id = defaultdict(list)
                farmer_map = {}
                for item in cart_items:
                    fid = item.product.farmer_id
                    items_by_farmer_id[fid].append(item)
                    farmer_map[fid] = item.product.farmer

                created_orders = []

                for fid, items in items_by_farmer_id.items():
                    farmer = farmer_map[fid]
                    # Calculate total for this farmer's items only
                    farmer_total = sum(item.product.price * item.quantity for item in items)

                    # Create ONE order per farmer
                    order = Order.objects.create(
                        buyer=user,
                        total_price=farmer_total,
                        status=OrderStatusChoices.PENDING,
                        delivery_address=delivery_address,
                        wilaya=wilaya,
                        buyer_phone=buyer_phone,
                        payment_method=payment_method,
                        notes=notes,
                        preferred_delivery_date=preferred_delivery_date,
                    )

                    for item in items:
                        product = item.product
                        product.stock -= item.quantity
                        product.save()

                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=item.quantity,
                            price_snapshot=product.price,
                            farmer=farmer
                        )

                    Payment.objects.create(
                        order=order,
                        amount=farmer_total,
                        status=PaymentStatusChoices.PENDING,
                        method=payment_method
                    )

                    create_notification(
                        user=farmer,
                        message=f"New order #{order.id} received from {user.full_name or user.email}.",
                        notif_type=NotificationType.ORDER_PLACED,
                        link="/farmer-dashboard"
                    )

                    created_orders.append(order)

                # Clear cart after all orders are created
                cart.items.all().delete()

                return Response(
                    OrderSerializer(created_orders, many=True).data,
                    status=status.HTTP_201_CREATED
                )

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def handle_exception(self, exc):
        if isinstance(exc, ValueError):
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)


class FarmerOrderViewSet(viewsets.ViewSet):
    """
    For farmers to view and manage orders received.
    Each row is one Order from a buyer.
    """
    permission_classes = [IsFarmerRole]

    def list(self, request):
        orders = Order.objects.filter(items__farmer=request.user).distinct().order_by('-created_at')
        from .serializers import OrderSerializer
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            # Ensure the order contains items belonging to this farmer
            order = Order.objects.get(pk=pk, items__farmer=request.user)
            from .serializers import OrderSerializer
            serializer = OrderSerializer(order, context={'request': request})
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='status')
    def change_status(self, request, pk=None):
        try:
            # Ensure the farmer has items in this order
            order = Order.objects.get(pk=pk, items__farmer=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found or access denied for your account."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = FarmerOrderItemStatusSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            from apps.notifications.models import create_notification, NotificationType
            
            if action_type == 'confirm':
                if order.status == OrderStatusChoices.PENDING:
                    order.status = OrderStatusChoices.CONFIRMED
                    order.save()
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} is being prepared by the farmer.",
                        notif_type=NotificationType.ORDER_CONFIRMED,
                        link=f"/buyer-dashboard/orders"
                    )
                    return Response({'status': 'ok', 'message': f'Order #{order.id} confirmed successfully.', 'order_status': order.status})
                else:
                    return Response({'error': f'Order #{order.id} is already {order.status.lower()}. Action skipped.'}, status=status.HTTP_400_BAD_REQUEST)
            
            elif action_type == 'reject':
                if order.status == OrderStatusChoices.PENDING:
                    order.status = OrderStatusChoices.REJECTED
                    order.save()
                    # Restore stock
                    farmer_items = order.items.filter(farmer=request.user)
                    for item in farmer_items:
                        if item.product:
                            item.product.stock += item.quantity
                            item.product.save()
                    
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} could not be fulfilled by the farmer.",
                        notif_type=NotificationType.ORDER_REJECTED,
                        link=f"/buyer-dashboard/orders"
                    )
                    return Response({'status': 'ok', 'message': f'Order #{order.id} rejected. Inventory restored.', 'order_status': order.status})
                else:
                    return Response({'error': f'Cannot reject order in {order.status.lower()} state.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='delivery')
    def update_delivery(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk, items__farmer=request.user)
        except Order.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        from .models import DeliveryStatusChoices
        if new_status in DeliveryStatusChoices.values:
            order.delivery_status = new_status
            order.save()
            return Response({'status': 'ok', 'delivery_status': order.delivery_status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
