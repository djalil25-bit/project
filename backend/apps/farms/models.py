from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel

class Farm(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    size_hectares = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.owner.full_name})"

class HarvestRecord(TimeStampedModel):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='harvests')
    crop_name = models.CharField(max_length=255)
    harvest_date = models.DateField()
    yield_quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Quantity in kg or standard units")
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.crop_name} - {self.harvest_date} ({self.farm.name})"
