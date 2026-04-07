from rest_framework import serializers
from .models import Category, CatalogProduct, Product, Favorite
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
    is_favorite = serializers.SerializerMethodField()
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('farmer', 'created_at', 'updated_at', 'is_favorite')

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Favorite.objects.filter(user=request.user, product=obj).exists()

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
        latest = PricePublication.get_latest_official_price(
            catalog_product=obj.catalog_product, 
            category=obj.category
        )
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
        farm = data.get('farm', getattr(self.instance, 'farm', None))
        request = self.context.get('request')
        if farm and request and getattr(farm, 'owner_id', None) != request.user.id:
            raise serializers.ValidationError({"farm": "Product must belong to one of your own farms."})
        
        # Strict Price Validation against CatalogProduct range
        catalog_product = data.get('catalog_product', getattr(self.instance, 'catalog_product', None))
        price = data.get('price', getattr(self.instance, 'price', None))
        
        if catalog_product and price is not None:
            min_p = catalog_product.min_price
            max_p = catalog_product.max_price
            
            if (min_p is not None and price < min_p) or (max_p is not None and price > max_p):
                # Return field-specific error
                raise serializers.ValidationError({
                    "price": "Your price is outside the admin-approved range. Please review the admin prices."
                })

        if price is not None and price <= 0:
            raise serializers.ValidationError({"price": "Price must be positive."})
            
        stock = data.get('stock', getattr(self.instance, 'stock', None))
        if stock is not None and stock < 0:
            raise serializers.ValidationError({"stock": "Stock cannot be negative."})
        
        category = data.get('category', getattr(self.instance, 'category_id', None))
        # Ensure category is present if catalog_product is not
        if not catalog_product and not category:
            raise serializers.ValidationError({"category": "Category is required if not selecting from catalog."})
            
        return data

class FavoriteSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'product_detail', 'created_at']
        read_only_fields = ['user', 'created_at']

class FavoriteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'product']
