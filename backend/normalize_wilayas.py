import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.logistics.models import DeliveryRequest

# Normalize Transporters
trans = User.objects.filter(role='transporter')
for t in trans:
    if t.service_zones:
        new_zones = [z.replace('Algiers', 'Alger').replace('Setif', 'Sétif') for z in t.service_zones]
        if new_zones != t.service_zones:
            t.service_zones = new_zones
            t.save()
            print(f"Normalized zones for {t.email}")

# Normalize DeliveryRequests
reqs = DeliveryRequest.objects.all()
for r in reqs:
    if r.pickup_wilaya == '16':
        r.pickup_wilaya = 'Alger'
        r.save()
        print(f"Normalized pickup_wilaya for request {r.id}")

print("Normalization complete.")
