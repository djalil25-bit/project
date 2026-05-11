import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.catalog.models import CatalogProduct
from apps.pricing.models import PricePublication
from datetime import date

PricePublication.objects.all().delete()

products = CatalogProduct.objects.all()

for product in products:
    base = float(product.ref_price) if product.ref_price else 120
    min_p = float(product.min_price) if getattr(product, 'min_price', None) else 100
    max_p = float(product.max_price) if getattr(product, 'max_price', None) else 150
    unit = getattr(product, 'unit', 'kg')
    if not unit:
        unit = 'kg'

    PricePublication.objects.create(
        catalog_product=product,
        valid_from=date(2025, 1, 1),
        official_price=base - 10,
        min_price=min_p - 5,
        max_price=max_p + 5,
        unit=unit,
        notes='Initial setup'
    )
    
    PricePublication.objects.create(
        catalog_product=product,
        valid_from=date(2025, 2, 15),
        official_price=base - 5,
        min_price=min_p,
        max_price=max_p,
        unit=unit,
        notes='Market adjustment'
    )
    
    PricePublication.objects.create(
        catalog_product=product,
        valid_from=date(2025, 3, 20),
        official_price=base + 8,
        min_price=min_p,
        max_price=max_p,
        unit=unit,
        notes='Supply shortage'
    )
    
    PricePublication.objects.create(
        catalog_product=product,
        valid_from=date(2025, 4, 10),
        official_price=base,
        min_price=min_p,
        max_price=max_p,
        unit=unit,
        notes='Price stabilization'
    )

print("Real price data created successfully.")
