import os
import sys

# Setup django
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.farms.models import Farm, AssetStatusChoices
from apps.accounts.models import AccountStatusChoices

farms = Farm.objects.filter(
    status__in=[AssetStatusChoices.ACTIVE, AssetStatusChoices.PENDING],
    owner__status__in=[AccountStatusChoices.APPROVED, AccountStatusChoices.PENDING]
).select_related('owner').values(
    'id', 'name', 'wilaya', 'commune', 'latitude', 'longitude',
    'status', 'owner__full_name', 'owner__status'
)
print("Farms query result:", list(farms))
