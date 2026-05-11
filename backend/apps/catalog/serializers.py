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
    farmer_phone = serializers.CharField(source='farmer.phone', read_only=True)
    farm_wilaya = serializers.CharField(source='farm.wilaya', read_only=True)
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

    def validate(self, attrs):
        from decimal import Decimal, InvalidOperation

        # --- Farm ownership check ---
        # `attrs.get('farm')` yields the Farm *object* (PrimaryKeyRelatedField converts it).
        # Fall back to the existing instance farm on partial updates.
        farm = attrs.get('farm', getattr(self.instance, 'farm', None))
        request = self.context.get('request')
        if farm is not None and request is not None:
            farm_owner_id = getattr(farm, 'owner_id', None)
            if farm_owner_id is not None and farm_owner_id != request.user.id:
                raise serializers.ValidationError(
                    {"farm": "Product must belong to one of your own farms."}
                )
            # Enforce farm approval status
            if hasattr(farm, 'status') and farm.status != 'ACTIVE':
                raise serializers.ValidationError(
                    {"farm": "This farm is not yet approved by admin. You cannot create products until your farm is approved."}
                )

        # --- Price range validation ---
        # On partial updates catalog_product may not be in `attrs`; fall back to instance.
        catalog_product = attrs.get('catalog_product', getattr(self.instance, 'catalog_product', None))
        price = attrs.get('price', getattr(self.instance, 'price', None))

        if catalog_product is not None and price is not None:
            # Ensure both sides are Decimal to avoid str/float comparison bugs.
            try:
                price_dec = Decimal(str(price))
                raw_min_p = Decimal(str(catalog_product.min_price)) if catalog_product.min_price is not None else None
                raw_max_p = Decimal(str(catalog_product.max_price)) if catalog_product.max_price is not None else None
            except InvalidOperation:
                price_dec = raw_min_p = raw_max_p = None

            if price_dec is not None:
                # Defensive normalization: ensure min is lower and max is upper
                min_p = raw_min_p
                max_p = raw_max_p
                if raw_min_p is not None and raw_max_p is not None:
                    min_p = min(raw_min_p, raw_max_p)
                    max_p = max(raw_min_p, raw_max_p)

                too_low  = min_p is not None and price_dec < min_p
                too_high = max_p is not None and price_dec > max_p
                if too_low or too_high:
                    hint = ""
                    if min_p is not None and max_p is not None:
                        hint = f" Allowed range: {min_p} – {max_p} DZD."
                    elif min_p is not None:
                        hint = f" Minimum allowed: {min_p} DZD."
                    elif max_p is not None:
                        hint = f" Maximum allowed: {max_p} DZD."
                    raise serializers.ValidationError({
                        "price": (
                            "Your asking price is outside the admin-approved range."
                            + hint
                        )
                    })

        if price is not None:
            try:
                if Decimal(str(price)) <= 0:
                    raise serializers.ValidationError({"price": "Price must be positive."})
            except InvalidOperation:
                raise serializers.ValidationError({"price": "Invalid price value."})

        stock = attrs.get('stock', getattr(self.instance, 'stock', None))
        if stock is not None:
            try:
                if Decimal(str(stock)) < 0:
                    raise serializers.ValidationError({"stock": "Stock cannot be negative."})
            except InvalidOperation:
                raise serializers.ValidationError({"stock": "Invalid stock value."})

        # --- Category requirement ---
        # Allow instance.category (object) or instance.category_id (int) as fallback.
        category = attrs.get('category') or getattr(self.instance, 'category', None)
        if not catalog_product and not category:
            raise serializers.ValidationError(
                {"category": "Category is required if not selecting from catalog."}
            )

        return attrs

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
