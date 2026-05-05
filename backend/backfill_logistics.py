
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.logistics.models import DeliveryRequest
from apps.farms.models import Farm

def backfill_pickup_wilaya():
    requests = DeliveryRequest.objects.filter(pickup_wilaya='')
    print(f"Found {requests.count()} requests with empty pickup_wilaya.")
    
    updated = 0
    for req in requests:
        order = req.order
        first_item = order.items.first()
        if first_item and first_item.farmer:
            wilaya = ''
            if first_item.product and first_item.product.farm and first_item.product.farm.wilaya:
                wilaya = first_item.product.farm.wilaya
            
            if not wilaya:
                wilaya = first_item.farmer.address # Farmer profile address fallback
            
            if not wilaya:
                any_farm = Farm.objects.filter(owner=first_item.farmer).first()
                if any_farm:
                    wilaya = any_farm.wilaya
            
            if wilaya:
                req.pickup_wilaya = wilaya.strip()
                req.save()
                updated += 1
                print(f"Updated Request #{req.id} with wilaya: {wilaya}")
            else:
                print(f"Could not find wilaya for Request #{req.id}")
                
    print(f"Successfully updated {updated} requests.")

if __name__ == "__main__":
    backfill_pickup_wilaya()
