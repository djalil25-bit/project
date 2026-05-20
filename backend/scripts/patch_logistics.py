import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.logistics.models import DeliveryRequest

reqs = DeliveryRequest.objects.all()
count = 0
for r in reqs:
    if not r.pickup_wilaya:
        first_item = r.order.items.first()
        if first_item and first_item.farmer:
            wilaya = first_item.farmer.address
            if not wilaya:
                if first_item.product and first_item.product.farm:
                    wilaya = first_item.product.farm.wilaya
            
            if wilaya:
                r.pickup_wilaya = wilaya
                r.save()
                count += 1
print(f"Patched {count} delivery requests.")
