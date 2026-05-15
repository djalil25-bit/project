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
    STANDARD = 'standard', 'Standard (Any)'
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
    pickup_commune = models.CharField(max_length=100, blank=True, default='')
    
    delivery_location = models.TextField(blank=True, default='')
    delivery_wilaya = models.CharField(max_length=100, blank=True, default='')
    delivery_commune = models.CharField(max_length=100, blank=True, default='')
    
    delivery_latitude = models.FloatField(null=True, blank=True)
    delivery_longitude = models.FloatField(null=True, blank=True)
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
    
    # Car Photo
    car_photo = models.ImageField(
        upload_to='vehicles/photos/', null=True, blank=True,
        help_text='Photo of the vehicle (optional)'
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

class TransportPricingRule(TimeStampedModel):
    vehicle_type = models.CharField(
        max_length=50, 
        choices=VehicleTypeChoices.choices,
        unique=True,
        help_text="The vehicle type this rule applies to."
    )
    base_fee = models.DecimalField(
        max_digits=12, decimal_places=2, default=500.00,
        help_text="Minimum cost just to start the mission."
    )
    price_per_km = models.DecimalField(
        max_digits=10, decimal_places=2, default=15.00,
        help_text="Cost added for each kilometer of travel."
    )
    weight_multiplier = models.FloatField(
        default=0.01,
        help_text="Multiplier applied based on total weight/quantity. (e.g. price += weight * multiplier)"
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Pricing Rule: {self.get_vehicle_type_display()}"

    class Meta:
        verbose_name = "Transport Pricing Rule"
        verbose_name_plural = "Transport Pricing Rules"


def calculate_transport_fee(distance, weight_kg, vehicle_type):
    """
    Unified pricing engine. Price is based on distance and weight, 
    but is constant across all vehicle types to ensure consistency.
    """
    try:
        safe_distance = float(distance) if distance is not None else 0.0
        safe_weight = float(weight_kg) if weight_kg is not None else 0.0
        
        # Always use 'standard' rule for universal pricing as requested
        rule = TransportPricingRule.objects.filter(vehicle_type='standard', is_active=True).first()
        if not rule:
            # Fallback to the first active rule if standard is missing
            rule = TransportPricingRule.objects.filter(is_active=True).first()

        if not rule:
            # Absolute system fallback if no rules exist in DB
            base = 500.0
            dist_cost = safe_distance * 15.0
            weight_cost = safe_weight * 0.1
            source = "SYSTEM_DEFAULT"
            weight_mult = 0.1
        else:
            base = float(rule.base_fee)
            dist_cost = safe_distance * float(rule.price_per_km)
            weight_cost = safe_weight * float(rule.weight_multiplier)
            source = f"RULE_{rule.id}"
            weight_mult = float(rule.weight_multiplier)

        total = base + dist_cost + weight_cost

        return {
            "total": round(total, 2),
            "breakdown": {
                "base": round(base, 2),
                "distance": round(dist_cost, 2),
                "weight": round(weight_cost, 2),
                "weight_multiplier": weight_mult
            },
            "rule_source": source
        }
    except Exception as e:
        return {
            "total": 0,
            "breakdown": {"base": 0, "distance": 0, "weight": 0, "weight_multiplier": 0},
            "rule_source": f"ERROR: {str(e)}"
        }
