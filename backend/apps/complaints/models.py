from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.orders.models import Order
from apps.logistics.models import DeliveryRequest

class ComplaintTypeChoices(models.TextChoices):
    ORDER = 'ORDER', 'Order Issue'
    DELIVERY = 'DELIVERY', 'Delivery Problem'
    PRODUCT = 'PRODUCT', 'Product Quality'
    PAYMENT = 'PAYMENT', 'Payment/Transaction'
    OTHER = 'OTHER', 'Other'

class ComplaintStatusChoices(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    IN_REVIEW = 'IN_REVIEW', 'In Review'
    RESOLVED = 'RESOLVED', 'Resolved'
    REJECTED = 'REJECTED', 'Rejected'
    CLOSED = 'CLOSED', 'Closed'

class Complaint(TimeStampedModel):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_complaints'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='complaints_against'
    )
    order = models.ForeignKey(
        Order, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='complaints'
    )
    delivery = models.ForeignKey(
        DeliveryRequest, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='complaints'
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    complaint_type = models.CharField(
        max_length=20, 
        choices=ComplaintTypeChoices.choices, 
        default=ComplaintTypeChoices.ORDER
    )
    status = models.CharField(
        max_length=20, 
        choices=ComplaintStatusChoices.choices, 
        default=ComplaintStatusChoices.OPEN
    )
    
    attachment = models.ImageField(upload_to='complaints/evidence/', null=True, blank=True)
    admin_notes = models.TextField(blank=True, default='', help_text="Notes from admin on resolution")
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title} by {self.creator.email}"
