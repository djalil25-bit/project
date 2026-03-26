from rest_framework import serializers
from .models import DeliveryRequest
from apps.orders.serializers import OrderSerializer

class DeliveryRequestSerializer(serializers.ModelSerializer):
    order_detail = OrderSerializer(source='order', read_only=True)

    class Meta:
        model = DeliveryRequest
        fields = '__all__'
        read_only_fields = ('order', 'created_at', 'updated_at')

class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['picked_up', 'in_transit', 'delivered', 'cancelled'])
