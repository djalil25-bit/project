from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'created_at', 'updated_at')

    def validate(self, data):
        product = data.get('product')
        quantity = data.get('quantity')
        
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
            
        if not product.is_active:
            raise serializers.ValidationError({"product": "Product is no longer active."})
            
        if quantity > product.stock:
            raise serializers.ValidationError({"quantity": f"Only {product.stock} available in stock."})
            
        return data

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'buyer', 'items', 'total_price', 'created_at', 'updated_at')
        read_only_fields = ('buyer',)

    def get_total_price(self, obj):
        return sum(item.product.price * item.quantity for item in obj.items.all())
