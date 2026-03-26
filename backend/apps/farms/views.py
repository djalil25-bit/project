from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Farm, HarvestRecord
from .serializers import FarmSerializer, HarvestRecordSerializer
from apps.accounts.permissions import IsFarmerRole

class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsFarmerRole]

    def get_queryset(self):
        # Farmers can only see/edit their own farms
        return Farm.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class HarvestRecordViewSet(viewsets.ModelViewSet):
    serializer_class = HarvestRecordSerializer
    permission_classes = [IsAuthenticated, IsFarmerRole]

    def get_queryset(self):
        # Farmers can only see/edit harvest records for their own farms
        return HarvestRecord.objects.filter(farm__owner=self.request.user)
