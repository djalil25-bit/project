from rest_framework import serializers
from .models import DeliveryRequest
from apps.orders.models import Order, OrderItem

class MissionOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True)
    product_unit = serializers.CharField(source='product.unit', read_only=True)
    product_quality = serializers.CharField(source='product.quality', default='Standard', read_only=True)
    farm_name = serializers.CharField(source='product.farm.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_unit', 'product_quality', 'quantity', 'farm_name']

class MissionOrderSerializer(serializers.ModelSerializer):
    items = MissionOrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'items', 'buyer_name', 'delivery_address', 'wilaya', 'refusal_reason', 'refusal_note']

class DeliveryRequestSerializer(serializers.ModelSerializer):
    order_detail = MissionOrderSerializer(source='order', read_only=True)

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'order', 'order_detail', 'transporter', 'status', 
            'pickup_location', 'delivery_location', 'preferred_delivery_date', 
            'notes', 'vehicle_size', 'created_at', 'updated_at',
            'total_quantity', 'assigned_vehicle_id', 'assigned_vehicle_info',
            'pod_photo', 'pod_recipient_name', 'pod_notes', 'pod_completed_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'transporter', 'pod_completed_at', 'total_quantity')

class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['picked_up', 'in_transit', 'delivered', 'cancelled'])

class ProofOfDeliverySerializer(serializers.Serializer):
    pod_recipient_name = serializers.CharField(max_length=100, required=True)
    pod_notes = serializers.CharField(required=False, allow_blank=True)
    pod_photo = serializers.ImageField(required=False, allow_null=True)

class DeliveryRequestPoDSerializer(serializers.ModelSerializer):
    """
    Simplified version of DeliveryRequest for nesting inside Orders.
    Prevents recursion and only exposes fields needed by Farmer/Buyer.
    """
    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'status', 'pod_photo', 'pod_recipient_name', 
            'pod_notes', 'pod_completed_at'
        ]
        read_only_fields = fields
