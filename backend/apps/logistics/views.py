from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import DeliveryRequest, DeliveryStatusChoices
from .serializers import DeliveryRequestSerializer, DeliveryStatusUpdateSerializer
from apps.accounts.permissions import IsTransporterRole, IsFarmerRole
from apps.orders.models import OrderStatusChoices
from apps.payments.models import PaymentStatusChoices

class DeliveryRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [IsFarmerRole()]
        if self.action in ['accept', 'update_status', 'my_missions']:
            return [IsTransporterRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = DeliveryRequest.objects.all().order_by('-created_at')
        if self.action in ['my_missions', 'update_status']:
            return qs.filter(transporter=user)
        # By default, open requests
        if self.action == 'list':
            return qs.filter(status=DeliveryStatusChoices.OPEN)
        return qs

    @action(detail=False, methods=['get'])
    def my_missions(self, request):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status != DeliveryStatusChoices.OPEN:
            return Response({"error": "This delivery is no longer open."}, status=status.HTTP_400_BAD_REQUEST)
        
        delivery.transporter = request.user
        delivery.status = DeliveryStatusChoices.ASSIGNED
        delivery.save()

        # Update order status
        order = delivery.order
        if order.status == OrderStatusChoices.READY_FOR_DELIVERY or order.status == OrderStatusChoices.CONFIRMED:
            order.status = OrderStatusChoices.IN_DELIVERY
            order.save()

        # --- Notifications ---
        from apps.notifications.models import create_notification, NotificationType
        # Notify Buyer
        create_notification(
            user=order.buyer,
            message=f"Order #{order.id} is now in delivery by {request.user.full_name}.",
            notif_type=NotificationType.DELIVERY_ACCEPTED,
            link=f"/buyer-dashboard"
        )
        # ---------------------

        return Response(DeliveryRequestSerializer(delivery).data)

    @action(detail=True, methods=['post'], serializer_class=DeliveryStatusUpdateSerializer)
    def update_status(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = DeliveryStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            delivery.status = new_status
            delivery.save()
            
            order = delivery.order
            if new_status == DeliveryStatusChoices.DELIVERED:
                order.status = OrderStatusChoices.DELIVERED
                order.save()
                # Complete the payment for Cash on Delivery
                if hasattr(order, 'payment'):
                    order.payment.status = PaymentStatusChoices.PAID
                    order.payment.save()
                
                # --- Notifications ---
                from apps.notifications.models import create_notification, NotificationType
                # Notify Buyer
                create_notification(
                    user=order.buyer,
                    message=f"Order #{order.id} has been delivered! Please rate your experience.",
                    notif_type=NotificationType.DELIVERY_COMPLETED,
                    link=f"/order-history"
                )
                # ---------------------
                
            return Response(DeliveryRequestSerializer(delivery).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
