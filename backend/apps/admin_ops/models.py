from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User
from apps.catalog.models import Product

class AlertSeverityChoices(models.TextChoices):
    LOW = 'LOW', _('Low')
    MEDIUM = 'MEDIUM', _('Medium')
    HIGH = 'HIGH', _('High')
    CRITICAL = 'CRITICAL', _('Critical')

class AlertStatusChoices(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    INVESTIGATING = 'INVESTIGATING', _('Investigating')
    RESOLVED = 'RESOLVED', _('Resolved')
    DISMISSED = 'DISMISSED', _('Dismissed')

class AlertTypeChoices(models.TextChoices):
    PRICE_ANOMALY = 'PRICE_ANOMALY', _('Price Anomaly')
    STOCK_IMBALANCE = 'STOCK_IMBALANCE', _('Stock Imbalance')
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY', _('Suspicious Activity')
    USER_REPORT = 'USER_REPORT', _('User Report')
    VERIFICATION_PENDING = 'VERIFICATION_PENDING', _('Verification Pending')
    SYSTEM_ALERT = 'SYSTEM_ALERT', _('System Alert')

class Alert(models.Model):
    alert_type = models.CharField(max_length=50, choices=AlertTypeChoices.choices)
    severity = models.CharField(max_length=20, choices=AlertSeverityChoices.choices, default=AlertSeverityChoices.MEDIUM)
    status = models.CharField(max_length=20, choices=AlertStatusChoices.choices, default=AlertStatusChoices.ACTIVE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    zone = models.CharField(max_length=255, blank=True, null=True)
    details_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type} - {self.severity} ({self.status})"


class AlertConfig(models.Model):
    alert_type = models.CharField(max_length=50, choices=AlertTypeChoices.choices, unique=True)
    enabled = models.BooleanField(default=True)
    threshold_value = models.FloatField(default=0.0)
    config_json = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Config: {self.alert_type} ({'Enabled' if self.enabled else 'Disabled'})"


class MessageChannelChoices(models.TextChoices):
    IN_APP = 'IN_APP', _('In-App')
    EMAIL = 'EMAIL', _('Email')
    SMS = 'SMS', _('SMS')

class MessageStatusChoices(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    SENT = 'SENT', _('Sent')
    FAILED = 'FAILED', _('Failed')
    READ = 'READ', _('Read')

class MessageTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    variables_json = models.JSONField(default=list, blank=True, help_text="List of available variables e.g. ['user_name', 'action_url']")

    def __str__(self):
        return self.name


class AdminMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_admin_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_admin_messages')
    channel = models.CharField(max_length=20, choices=MessageChannelChoices.choices, default=MessageChannelChoices.IN_APP)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=MessageStatusChoices.choices, default=MessageStatusChoices.PENDING)
    is_reply_allowed = models.BooleanField(default=False)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ActivityLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    actor_type = models.CharField(max_length=50, blank=True)
    action = models.CharField(max_length=100)
    details_json = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=50, default='SUCCESS')
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor_type} at {self.timestamp}"


class FlagStatusChoices(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
    INVESTIGATING = 'INVESTIGATING', _('Investigating')
    RESOLVED = 'RESOLVED', _('Resolved')

class FlaggedAccount(models.Model):
    account = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flags')
    flag_type = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=AlertSeverityChoices.choices, default=AlertSeverityChoices.MEDIUM)
    status = models.CharField(max_length=20, choices=FlagStatusChoices.choices, default=FlagStatusChoices.PENDING)
    flagged_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-flagged_at']

    def __str__(self):
        return f"Flagged: {self.account.email} - {self.flag_type}"
