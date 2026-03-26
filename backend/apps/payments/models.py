from django.db import models
from apps.common.models import TimeStampedModel
from apps.orders.models import Order

class PaymentStatusChoices(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    CANCELLED = 'cancelled', 'Cancelled'

class Payment(TimeStampedModel):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, 
        choices=PaymentStatusChoices.choices, 
        default=PaymentStatusChoices.PENDING
    )
    method = models.CharField(max_length=50, default='cash_on_delivery')

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.status}"
