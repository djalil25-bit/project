from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusChoices
from apps.payments.serializers import PaymentSerializer
from apps.catalog.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    item_total = serializers.SerializerMethodField()
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('order', 'product', 'quantity', 'price_snapshot', 'farmer')

    def get_item_total(self, obj):
        return float(obj.quantity * obj.price_snapshot) if obj.quantity and obj.price_snapshot else 0

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'buyer', 'total_price', 'status', 'delivery_address', 'items', 'payment', 'created_at', 'updated_at')
        read_only_fields = ('buyer', 'total_price', 'status')

class CheckoutSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(required=True)

class FarmerOrderItemStatusSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['confirm', 'reject'])
