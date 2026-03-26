from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusChoices
from apps.payments.serializers import PaymentSerializer
from apps.catalog.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    item_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    buyer_name = serializers.CharField(source='order.buyer.full_name', read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    delivery_status = serializers.CharField(source='order.delivery_status', read_only=True)
    price_per_unit = serializers.DecimalField(source='price_snapshot', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            'id', 'order_id', 'buyer_name', 'product_name', 'product_image',
            'quantity', 'price_per_unit', 'item_total', 'order_status',
            'delivery_status', 'created_at'
        )

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
