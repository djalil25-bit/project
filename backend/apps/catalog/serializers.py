from rest_framework import serializers
from .models import Category, CatalogProduct, Product
from apps.pricing.models import PricePublication

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CatalogProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = CatalogProduct
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    farmer_email = serializers.CharField(source='farmer.email', read_only=True)
    # Catalog product info
    catalog_product_name = serializers.CharField(source='catalog_product.name', read_only=True, default=None)
    ref_price = serializers.DecimalField(source='catalog_product.ref_price', max_digits=12, decimal_places=2, read_only=True, default=None)
    min_price = serializers.DecimalField(source='catalog_product.min_price', max_digits=12, decimal_places=2, read_only=True, default=None)
    max_price = serializers.DecimalField(source='catalog_product.max_price', max_digits=12, decimal_places=2, read_only=True, default=None)

    official_price_comparison = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('farmer', 'created_at', 'updated_at')

    def get_official_price_comparison(self, obj):
        # Prefer catalog product pricing over legacy PricePublication
        if obj.catalog_product and obj.catalog_product.ref_price:
            cp = obj.catalog_product
            ref = cp.ref_price
            diff = obj.price - ref
            diff_pct = (diff / ref * 100) if ref > 0 else 0
            return {
                'official_price': float(ref),
                'min_price': float(cp.min_price) if cp.min_price else None,
                'max_price': float(cp.max_price) if cp.max_price else None,
                'difference': float(diff),
                'difference_percentage': round(float(diff_pct), 2),
                'status': 'above' if diff > 0 else ('below' if diff < 0 else 'equal'),
            }
        latest = PricePublication.get_latest_official_price(category=obj.category, product=obj)
        if not latest:
            return None
        diff = obj.price - latest.official_price
        diff_percentage = (diff / latest.official_price) * 100 if latest.official_price > 0 else 0
        return {
            'official_price': float(latest.official_price),
            'difference': float(diff),
            'difference_percentage': round(float(diff_percentage), 2),
            'status': 'above' if diff > 0 else ('below' if diff < 0 else 'equal'),
        }

    def validate(self, data):
        farm = data.get('farm')
        user = self.context['request'].user
        if farm and farm.owner != user:
            raise serializers.ValidationError({"farm": "Product must belong to one of your own farms."})
        if data.get('price', 0) <= 0:
            raise serializers.ValidationError({"price": "Price must be positive."})
        if data.get('stock', 0) < 0:
            raise serializers.ValidationError({"stock": "Stock cannot be negative."})
        return data
