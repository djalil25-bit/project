import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.farms.models import Farm
from apps.accounts.models import User

def sync_farms():
    print("Starting farm wilaya synchronization...")
    farms = Farm.objects.all().select_related('owner')
    updated_count = 0
    
    for farm in farms:
        farmer_wilaya = farm.owner.address
        if farm.wilaya != farmer_wilaya:
            print(f"Syncing Farm '{farm.name}' (Owner: {farm.owner.email}): '{farm.wilaya}' -> '{farmer_wilaya}'")
            farm.wilaya = farmer_wilaya
            farm.save()
            updated_count += 1
            
    print(f"Done. Updated {updated_count} farms.")

if __name__ == "__main__":
    sync_farms()
