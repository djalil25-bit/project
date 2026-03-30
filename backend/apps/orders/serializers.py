from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusChoices
from apps.payments.serializers import PaymentSerializer
from apps.catalog.serializers import ProductSerializer

class ProductDetailMini(serializers.Serializer):
    """Minimal product info embedded inside order items for buyer view."""
    title = serializers.CharField()
    unit = serializers.CharField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    image = serializers.ImageField()
    farm_name = serializers.SerializerMethodField()
    farmer_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name')
    description = serializers.CharField()
    stock = serializers.DecimalField(max_digits=12, decimal_places=2)
    quality = serializers.CharField()

    def get_farm_name(self, obj):
        return obj.farm.name if obj.farm else None
    def get_farmer_name(self, obj):
        return obj.farmer.full_name if obj.farmer else None


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True)
    product_unit = serializers.CharField(source='product.unit', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    item_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    buyer_name = serializers.CharField(source='order.buyer.full_name', read_only=True)
    buyer_email = serializers.CharField(source='order.buyer.email', read_only=True)
    buyer_phone = serializers.CharField(source='order.buyer_phone', read_only=True)
    buyer_wilaya = serializers.CharField(source='order.wilaya', read_only=True)
    buyer_address = serializers.CharField(source='order.delivery_address', read_only=True)
    buyer_notes = serializers.CharField(source='order.notes', read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    delivery_status = serializers.CharField(source='order.delivery_status', read_only=True)
    payment_method = serializers.CharField(source='order.payment_method', read_only=True)
    price_per_unit = serializers.DecimalField(source='price_snapshot', max_digits=12, decimal_places=2, read_only=True)
    preferred_delivery_date = serializers.DateField(source='order.preferred_delivery_date', read_only=True)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    farm_name = serializers.SerializerMethodField()
    product_detail = ProductDetailMini(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            'id', 'order_id', 'buyer_name', 'buyer_email', 'buyer_phone',
            'buyer_wilaya', 'buyer_address', 'buyer_notes', 'payment_method',
            'preferred_delivery_date', 'product_name', 'product_unit', 'product_image',
            'quantity', 'price_per_unit', 'item_total', 'order_status',
            'delivery_status', 'created_at', 'farmer_name', 'farm_name',
            'product_detail'
        )

    def get_farm_name(self, obj):
        try:
            return obj.product.farm.name if obj.product and obj.product.farm else None
        except Exception:
            return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    # delivery_request_details = serializers.SerializerMethodField()
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'buyer', 'buyer_name', 'buyer_email', 'total_price', 'status',
            'delivery_status', 'delivery_address', 'wilaya', 'buyer_phone',
            'payment_method', 'notes', 'preferred_delivery_date',
            'items', 'payment', 'created_at', 'updated_at', 'farmer_order_number'
        )
        read_only_fields = ('buyer', 'total_price', 'status', 'farmer_order_number')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return ret
            
        user = request.user
        
        # 1. Scope items for farmers
        if user.role == 'farmer':
            farmer_items = instance.items.filter(farmer=user)
            ret['items'] = OrderItemSerializer(farmer_items, many=True).data
            ret['farmer_total'] = sum((item.quantity or 0) * (item.price_snapshot or 0) for item in farmer_items)

        # 2. Add Delivery Request & PoD for Farmer, Buyer, and Admin
        # Note: Transporters access PoD via the /deliveries/ endpoint directly
        if user.role in ['farmer', 'buyer', 'admin'] or user.is_staff:
            if hasattr(instance, 'delivery_request'):
                from apps.logistics.serializers import DeliveryRequestSerializer
                ret['delivery_request'] = DeliveryRequestSerializer(instance.delivery_request).data
                ret['has_delivery_request'] = True
            else:
                ret['has_delivery_request'] = False
                ret['delivery_request'] = None
                
        return ret


class CheckoutSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(required=True)
    wilaya = serializers.CharField(required=False, allow_blank=True, default='')
    buyer_phone = serializers.CharField(required=False, allow_blank=True, default='')
    payment_method = serializers.ChoiceField(
        choices=['cash_on_delivery', 'bank_transfer', 'mobile_payment'],
        default='cash_on_delivery',
        required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    preferred_delivery_date = serializers.DateField(required=False, allow_null=True, default=None)


class FarmerOrderItemStatusSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['confirm', 'reject'])
