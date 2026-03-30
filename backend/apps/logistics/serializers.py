from rest_framework import serializers
from .models import DeliveryRequest
from apps.orders.serializers import OrderSerializer

class DeliveryRequestSerializer(serializers.ModelSerializer):
    order_detail = OrderSerializer(source='order', read_only=True)

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'order', 'order_detail', 'transporter', 'status', 
            'pickup_location', 'delivery_location', 'preferred_delivery_date', 
            'notes', 'vehicle_size', 'created_at', 'updated_at',
            'pod_photo', 'pod_recipient_name', 'pod_notes', 'pod_completed_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'transporter', 'pod_completed_at')

class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['picked_up', 'in_transit', 'delivered', 'cancelled'])

class ProofOfDeliverySerializer(serializers.Serializer):
    pod_recipient_name = serializers.CharField(max_length=100, required=True)
    pod_notes = serializers.CharField(required=False, allow_blank=True)
    pod_photo = serializers.ImageField(required=False, allow_null=True)
