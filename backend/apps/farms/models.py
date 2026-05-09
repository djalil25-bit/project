from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class AssetStatusChoices(models.TextChoices):
    PENDING  = 'PENDING',  'Pending Approval'
    ACTIVE   = 'ACTIVE',   'Active'
    REJECTED = 'REJECTED', 'Rejected'


class Farm(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255) # Keep for broad display
    wilaya = models.CharField(max_length=100, blank=True, default='')
    commune = models.CharField(max_length=100, blank=True, default='')
    size_hectares = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='farms/', null=True, blank=True,
                              help_text='Optional representative image for this farm.')
    registry_document = models.FileField(
        upload_to='farms/documents/', null=True, blank=True,
        help_text='Registry document or certificate for this farm — JPG/PNG/PDF'
    )

    # Admin approval fields
    status = models.CharField(
        max_length=10, choices=AssetStatusChoices.choices,
        default=AssetStatusChoices.PENDING
    )
    rejection_reason = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_farms'
    )
    objects = models.Manager()

    def __str__(self):
        return f"{self.name} ({self.owner.full_name})" # type: ignore

class HarvestRecord(TimeStampedModel):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='harvests')
    crop_name = models.CharField(max_length=255)
    harvest_date = models.DateField()
    yield_quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Quantity in kg or standard units")
    notes = models.TextField(blank=True)
    objects = models.Manager()

    def __str__(self):
        return f"{self.crop_name} - {self.harvest_date} ({self.farm.name})"
