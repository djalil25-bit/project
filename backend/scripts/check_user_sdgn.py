import os
import sys

# Setup django
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.accounts.models import User
from apps.farms.models import Farm

user = User.objects.filter(full_name__icontains='sdgn').first()
if not user:
    user = User.objects.filter(email__icontains='sdgn').first()

if user:
    print(f"User: {user.full_name}, Email: {user.email}, Role: {user.role}, Status: {user.status}, Address: {user.address}")
    farm = Farm.objects.filter(owner=user).first()
    if farm:
        print(f"Farm: {farm.name}, Wilaya: {farm.wilaya}, Commune: {farm.commune}, Lat: {farm.latitude}, Lng: {farm.longitude}, Status: {farm.status}")
    else:
        print("No farm found for this user.")
else:
    print("User 'sdgn' not found.")
