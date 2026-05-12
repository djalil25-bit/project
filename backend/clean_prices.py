import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.catalog.models import CatalogProduct
from apps.pricing.models import PricePublication
from django.utils import timezone

# Wipe all existing fake price publications
PricePublication.objects.all().delete()

# Create exactly one real baseline entry for each product based on its current actual price today
products = CatalogProduct.objects.all()

for product in products:
    if product.ref_price is not None:
        PricePublication.objects.create(
            catalog_product=product,
            valid_from=timezone.now().date(),
            official_price=product.ref_price,
            min_price=product.min_price,
            max_price=product.max_price,
            unit=getattr(product, 'default_unit', getattr(product, 'unit', 'kg')),
            notes='System baseline (Current Price)'
        )

print("Fake data wiped. Real baseline created successfully.")
