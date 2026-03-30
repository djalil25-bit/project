from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from django.utils import timezone
from .models import DeliveryRequest, DeliveryStatusChoices
from .serializers import (
    DeliveryRequestSerializer, 
    DeliveryStatusUpdateSerializer,
    ProofOfDeliverySerializer
)
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

    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        user = self.request.user
        
        # 1. Check if farmer owner
        if not order.items.filter(farmer=user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only request delivery for orders containing your products.")
            
        # 2. Check if already exists (OneToOneField replacement logic)
        if hasattr(order, 'delivery_request'):
             existing = order.delivery_request
             if existing.status == DeliveryStatusChoices.CANCELLED:
                 # Remove cancelled request to allow a new one
                 existing.delete()
             else:
                 from rest_framework.exceptions import ValidationError
                 raise ValidationError({"error": f"A delivery request already exists for this order (Status: {existing.status})."})
             
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        qs = DeliveryRequest.objects.all().order_by('-created_at')
        
        if user.role == 'transporter':
            if self.action in ['my_missions', 'update_status']:
                return qs.filter(transporter=user)
            
            from django.db.models import Q
            return qs.filter(Q(transporter=user) | Q(status=DeliveryStatusChoices.OPEN))
            
        elif user.role == 'farmer':
            return qs.filter(order__items__farmer=user).distinct()
            
        elif user.role == 'buyer':
            return qs.filter(order__buyer=user)
            
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

    @action(detail=True, methods=['post'], serializer_class=ProofOfDeliverySerializer)
    def complete_with_pod(self, request, pk=None):
        delivery = self.get_object()
        if delivery.transporter != request.user:
            return Response({"error": "Not your assigned delivery."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProofOfDeliverySerializer(data=request.data)
        if serializer.is_valid():
            delivery.pod_recipient_name = serializer.validated_data.get('pod_recipient_name')
            delivery.pod_notes = serializer.validated_data.get('pod_notes', '')
            if 'pod_photo' in request.FILES:
                delivery.pod_photo = request.FILES['pod_photo']
            
            delivery.pod_completed_at = timezone.now()
            delivery.status = DeliveryStatusChoices.DELIVERED
            delivery.save()
            
            # Sync with Order
            order = delivery.order
            order.delivery_status = OrderDeliveryStatus.DELIVERED
            order.status = OrderStatusChoices.CONFIRMED
            order.save()
            
            # Notifications
            try:
                from apps.notifications.models import create_notification, NotificationType
                create_notification(
                    user=order.buyer,
                    message=f"Order #{order.id} has been delivered! Proof of delivery is available.",
                    notif_type=NotificationType.DELIVERY_COMPLETED,
                    link=f"/buyer-dashboard/orders"
                )
            except Exception:
                pass

            return Response(DeliveryRequestSerializer(delivery).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
