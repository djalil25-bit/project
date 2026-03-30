from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.orders.models import Order

class DeliveryStatusChoices(models.TextChoices):
    OPEN = 'open', 'Open'
    ASSIGNED = 'assigned', 'Assigned'
    PICKED_UP = 'picked_up', 'Picked Up'
    IN_TRANSIT = 'in_transit', 'In Transit'
    DELIVERED = 'delivered', 'Delivered'
    CANCELLED = 'cancelled', 'Cancelled'

class DeliveryRequest(TimeStampedModel):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_request')
    transporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    status = models.CharField(
        max_length=20, 
        choices=DeliveryStatusChoices.choices, 
        default=DeliveryStatusChoices.OPEN
    )
    
    # Farmer fills these when requesting
    pickup_location = models.TextField(blank=True, default='')
    delivery_location = models.TextField(blank=True, default='')
    preferred_delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    vehicle_size = models.CharField(max_length=50, blank=True, default='', help_text="Required truck capacity or vehicle size")

    # Proof of Delivery (PoD)
    pod_photo = models.ImageField(upload_to='pod/', null=True, blank=True)
    pod_recipient_name = models.CharField(max_length=100, blank=True, default='')
    pod_notes = models.TextField(blank=True, default='')
    pod_completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery for Order #{self.order.id} - {self.status}"
