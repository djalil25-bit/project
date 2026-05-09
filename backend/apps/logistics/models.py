from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.orders.models import Order

class DeliveryStatusChoices(models.TextChoices):
    OPEN = 'open', 'Open'
    ASSIGNED = 'assigned', 'Assigned'
    PICKED_UP = 'picked_up', 'Picked Up'
    IN_TRANSIT = 'in_transit', 'In Transit'
    REFUSED_DELIVERY = 'refused_delivery', 'Refused Delivery'
    RETURN_IN_PROGRESS = 'return_in_progress', 'Return in Progress'
    RETURNED = 'returned', 'Returned'
    DELIVERED = 'delivered', 'Delivered'
    CANCELLED = 'cancelled', 'Cancelled'

class VehicleTypeChoices(models.TextChoices):
    TRUCK = 'truck', 'Truck'
    VAN = 'van', 'Van'
    REFRIGERATED_TRUCK = 'refrigerated_truck', 'Refrigerated Truck'
    PICKUP = 'pickup', 'Pickup'
    UTILITY = 'utility', 'Utility Vehicle'

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
    pickup_wilaya = models.CharField(max_length=100, blank=True, default='')
    delivery_location = models.TextField(blank=True, default='')
    preferred_delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    
    # Logistics Data (Upgraded)
    required_vehicle_type = models.CharField(
        max_length=50, 
        choices=VehicleTypeChoices.choices,
        default=VehicleTypeChoices.TRUCK
    )
    estimated_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estimated_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    estimated_duration = models.CharField(max_length=100, blank=True, default='', help_text="e.g. 1h 35m")
    
    # Cargo Conditions
    is_refrigerated = models.BooleanField(default=False)
    is_fragile = models.BooleanField(default=False)

    # Assignment details
    assigned_vehicle_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID of the vehicle from transporter's fleet")
    assigned_vehicle_info = models.JSONField(default=dict, blank=True, help_text="Snapshot of vehicle details at acceptance")

    # Proof of Delivery (PoD)
    pod_photo = models.ImageField(upload_to='pod/', null=True, blank=True)
    pod_recipient_name = models.CharField(max_length=100, blank=True, default='')
    pod_notes = models.TextField(blank=True, default='')
    pod_completed_at = models.DateTimeField(null=True, blank=True)

    @property
    def total_quantity(self):
        from django.db.models import Sum
        return self.order.items.aggregate(total=Sum('quantity'))['total'] or 0 # type: ignore

    def __str__(self):
        return f"Delivery for Order #{self.order.id} - {self.status}" # type: ignore


class VehicleStatusChoices(models.TextChoices):
    PENDING  = 'PENDING',  'Pending Approval'
    ACTIVE   = 'ACTIVE',   'Active'
    REJECTED = 'REJECTED', 'Rejected'


class Vehicle(TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicle_records'
    )
    plate = models.CharField(max_length=50)
    model = models.CharField(max_length=255)
    capacity = models.CharField(max_length=50, blank=True, default='')
    type = models.CharField(
        max_length=50, 
        choices=VehicleTypeChoices.choices,
        default=VehicleTypeChoices.TRUCK
    )
    fuelType = models.CharField(max_length=50, default='Diesel')
    is_active = models.BooleanField(default=True)

    # Carte Grise document
    carte_grise = models.FileField(
        upload_to='vehicles/carte_grise/', null=True, blank=True,
        help_text='Carte Grise (vehicle registration document) — JPG/PNG/PDF'
    )

    # Admin approval fields
    status = models.CharField(
        max_length=10, choices=VehicleStatusChoices.choices,
        default=VehicleStatusChoices.PENDING
    )
    rejection_reason = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_vehicles'
    )

    def __str__(self):
        return f"{self.get_type_display()} {self.plate} ({self.owner.email})" # type: ignore

