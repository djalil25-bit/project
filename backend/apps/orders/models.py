from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.catalog.models import Product

class OrderStatusChoices(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    REJECTED = 'REJECTED', 'Rejected'
    CANCELLED = 'CANCELLED', 'Cancelled'

class DeliveryStatusChoices(models.TextChoices):
    AWAITING_PICKUP = 'AWAITING_PICKUP', 'Awaiting Pickup'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    DELIVERED = 'DELIVERED', 'Delivered'

class PaymentMethodChoices(models.TextChoices):
    CASH_ON_DELIVERY = 'cash_on_delivery', 'Cash on Delivery'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    MOBILE_PAYMENT = 'mobile_payment', 'Mobile Payment'

class Order(TimeStampedModel):
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=50, 
        choices=OrderStatusChoices.choices, 
        default=OrderStatusChoices.PENDING
    )
    delivery_status = models.CharField(
        max_length=50,
        choices=DeliveryStatusChoices.choices,
        default=DeliveryStatusChoices.AWAITING_PICKUP
    )
    # Delivery info
    delivery_address = models.TextField()
    wilaya = models.CharField(max_length=100, blank=True, default='')
    # Buyer contact
    buyer_phone = models.CharField(max_length=30, blank=True, default='')
    # Order metadata
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethodChoices.choices,
        default=PaymentMethodChoices.CASH_ON_DELIVERY
    )
    notes = models.TextField(blank=True, default='')
    preferred_delivery_date = models.DateField(null=True, blank=True)
    # Farmer-scoped display number: each farmer's orders are numbered 1, 2, 3...
    # Set at checkout time; NULL for legacy orders created before this feature.
    # Life cycle finalization
    buyer_confirmed_at = models.DateTimeField(null=True, blank=True)
    farmer_order_number = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    def __str__(self):
        return f"Order #{self.id} by {self.buyer.email} ({self.status})"

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_snapshot = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price at the time of order")
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='received_order_items')

    def __str__(self):
        return f"Item {self.product.title if self.product else 'Removed'} in Order #{self.order.id}"

    @property
    def item_total(self):
        return self.quantity * self.price_snapshot
