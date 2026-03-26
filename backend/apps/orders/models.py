from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.catalog.models import Product

class OrderStatusChoices(models.TextChoices):
    PENDING = 'pending_farmer_confirmation', 'Pending Farmer Confirmation'
    CONFIRMED = 'confirmed', 'Confirmed'
    REJECTED = 'rejected', 'Rejected'
    CANCELLED = 'cancelled', 'Cancelled'
    READY_FOR_DELIVERY = 'ready_for_delivery', 'Ready for Delivery'
    IN_DELIVERY = 'in_delivery', 'In Delivery'
    DELIVERED = 'delivered', 'Delivered'
    COMPLETED = 'completed', 'Completed'

class Order(TimeStampedModel):
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=50, 
        choices=OrderStatusChoices.choices, 
        default=OrderStatusChoices.PENDING
    )
    delivery_address = models.TextField()

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
