from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel

class NotificationType(models.TextChoices):
    ORDER_PLACED = 'order_placed', 'Order Placed'
    ORDER_CONFIRMED = 'order_confirmed', 'Order Confirmed'
    ORDER_REJECTED = 'order_rejected', 'Order Rejected'
    DELIVERY_ACCEPTED = 'delivery_accepted', 'Delivery Accepted'
    DELIVERY_COMPLETED = 'delivery_completed', 'Delivery Completed'
    DELIVERY_REQUEST = 'delivery_request', 'Delivery Request'
    USER_APPROVED = 'user_approved', 'Account Approved'
    USER_PENDING = 'user_pending', 'User Pending Approval'
    COMPLAINT_UPDATE = 'complaint_update', 'Complaint Status Updated'
    GENERAL = 'general', 'General'

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.GENERAL)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.user.email}: {self.message[:50]}"

def create_notification(user, message, notif_type=NotificationType.GENERAL, link=''):
    """Helper to create a notification."""
    Notification.objects.create(user=user, message=message, type=notif_type, link=link)
