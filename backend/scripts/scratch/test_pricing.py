import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.logistics.models import calculate_transport_fee

print("Testing calculate_transport_fee with no rules...")
res = calculate_transport_fee(100, 50, 'truck')
print(f"Result: {res}")

from apps.logistics.models import TransportPricingRule
print("\nCreating a test rule...")
TransportPricingRule.objects.update_or_create(
    vehicle_type='truck',
    defaults={
        'base_fee': 1000,
        'price_per_km': 20,
        'weight_multiplier': 5,
        'is_active': True
    }
)

print("Testing with rule...")
res = calculate_transport_fee(100, 50, 'truck')
print(f"Result: {res}")
