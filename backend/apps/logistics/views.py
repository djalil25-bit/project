from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import DeliveryRequest, DeliveryStatusChoices
from .serializers import DeliveryRequestSerializer, DeliveryStatusUpdateSerializer
from apps.accounts.permissions import IsTransporterRole, IsFarmerRole
from apps.orders.models import OrderStatusChoices, DeliveryStatusChoices as OrderDeliveryStatus

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
        order.delivery_status = OrderDeliveryStatus.AWAITING_PICKUP
        if order.status == OrderStatusChoices.PENDING or order.status == OrderStatusChoices.CONFIRMED:
             order.status = OrderStatusChoices.CONFIRMED # Already confirmed if delivery requested
        order.save()

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
            
            # Sync with Order
            order = delivery.order
            if new_status == DeliveryStatusChoices.PICKED_UP:
                order.delivery_status = OrderDeliveryStatus.PICKED_UP
            elif new_status == DeliveryStatusChoices.IN_TRANSIT:
                order.delivery_status = OrderDeliveryStatus.IN_TRANSIT
            elif new_status == DeliveryStatusChoices.DELIVERED:
                order.delivery_status = OrderDeliveryStatus.DELIVERED
                order.status = OrderStatusChoices.CONFIRMED # Keep confirmed but delivered
            
            order.save()
            
            # Trigger notifications (keeping them simplified)
            try:
                from apps.notifications.models import create_notification, NotificationType
                if new_status == DeliveryStatusChoices.DELIVERED:
                    create_notification(
                        user=order.buyer,
                        message=f"Order #{order.id} has been delivered!",
                        notif_type=NotificationType.DELIVERY_COMPLETED,
                        link=f"/buyer-dashboard/orders"
                    )
            except ImportError:
                pass

            return Response(DeliveryRequestSerializer(delivery).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
