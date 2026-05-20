import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.catalog.models import CatalogProduct, Category, Product
from apps.catalog.serializers import ProductSerializer
from apps.farms.models import Farm
from django.contrib.auth import get_user_model

User = get_user_model()

def test_validation():
    # 1. Setup
    user = User.objects.first()
    category = Category.objects.first()
    farm = Farm.objects.filter(owner=user).first()
    cp = CatalogProduct.objects.create(
        category=category,
        name="Test Product",
        min_price=10.00,
        max_price=50.00,
        ref_price=30.00
    )
    
    print(f"Catalog Product ID: {cp.id}, Range: {cp.min_price}-{cp.max_price}")
    
    # 2. Test Serializer Validation
    # Case: Price in range (25)
    data = {
        'catalog_product': cp.id,
        'farm': farm.id,
        'title': 'Test Listing',
        'description': 'Test Desc',
        'price': '25.00',
        'stock': '10',
        'category': category.id
    }
    
    serializer = ProductSerializer(data=data, context={'request': type('obj', (object,), {'user': user})})
    is_valid = serializer.is_valid()
    print(f"Price 25.00 valid? {is_valid}")
    if not is_valid:
        print(f"Errors: {serializer.errors}")

    # Case: Price on border (10.00)
    data['price'] = '10.00'
    serializer = ProductSerializer(data=data, context={'request': type('obj', (object,), {'user': user})})
    print(f"Price 10.00 valid? {serializer.is_valid()}")
    if not serializer.is_valid():
        print(f"Errors: {serializer.errors}")

    # Case: Price outside (9.99)
    data['price'] = '9.99'
    serializer = ProductSerializer(data=data, context={'request': type('obj', (object,), {'user': user})})
    print(f"Price 9.99 valid? {serializer.is_valid()}")
    if not serializer.is_valid():
        print(f"Errors: {serializer.errors}")

    # Cleanup
    cp.delete()

if __name__ == "__main__":
    test_validation()
