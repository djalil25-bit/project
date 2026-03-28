from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'created_at', 'updated_at')

    def validate(self, data):
        # On partial updates (PATCH), product may not be in data - use instance
        product = data.get('product', None)
        if product is None and self.instance is not None:
            product = self.instance.product

        # Validate quantity only if it's being changed
        if 'quantity' in data:
            # Coerce to integer to avoid unnecessary decimal precision errors
            qty = int(round(float(data['quantity'])))
            data['quantity'] = qty
            if qty <= 0:
                raise serializers.ValidationError({'quantity': 'Quantity must be greater than zero.'})
            if product is not None and qty > product.stock:
                raise serializers.ValidationError({'quantity': f'Only {product.stock} in stock.'})

        # Validate product activity only if product is known
        if product is not None and not product.is_active:
            raise serializers.ValidationError({'product': 'Product is no longer available.'})

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
