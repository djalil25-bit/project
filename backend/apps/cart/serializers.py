from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    # pyrefly: ignore [bad-override]
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'created_at', 'updated_at')

    def validate(self, attrs):
        # On partial updates (PATCH), product may not be in data - use instance
        product = attrs.get('product', None)
        if product is None and self.instance is not None:
            product = self.instance.product

        # Validate quantity only if it's being changed
        if 'quantity' in attrs:
            # Coerce to integer to avoid unnecessary decimal precision errors
            qty = round(float(attrs['quantity']))
            attrs['quantity'] = qty
            if qty <= 0:
                raise serializers.ValidationError({'quantity': 'Quantity must be greater than zero.'})
            if product is not None:
                if qty > product.stock:
                    raise serializers.ValidationError({'quantity': f'Only {product.stock} in stock.'})
                if qty < product.min_order_quantity:
                    raise serializers.ValidationError({'quantity': f'Minimum order quantity is {product.min_order_quantity} {product.unit}.'})

        # Validate product activity only if product is known
        if product is not None and not product.is_active:
            raise serializers.ValidationError({'product': 'Product is no longer available.'})

        return attrs

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    # pyrefly: ignore [bad-override]
    class Meta:
        model = Cart
        fields = ('id', 'buyer', 'items', 'total_price', 'created_at', 'updated_at')
        read_only_fields = ('buyer',)

    def get_total_price(self, obj):
        total = 0
        for item in obj.items.all():
            qty = item.quantity
            price = item.product.price
            discount_pct = 0
            if item.product.bulk_discount_rules:
                # Sort descending by min_qty to find the highest applicable tier
                rules = sorted(item.product.bulk_discount_rules, key=lambda x: float(x.get('min_qty', 0)), reverse=True)
                for rule in rules:
                    if float(qty) >= float(rule.get('min_qty', 0)):
                        discount_pct = float(rule.get('discount_pct', 0))
                        break
            
            final_price = float(price) * (1 - (discount_pct / 100))
            total += final_price * float(qty)
        return round(total, 2)
