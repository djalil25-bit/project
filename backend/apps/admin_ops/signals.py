from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from decimal import Decimal
from apps.catalog.models import Product
from apps.admin_ops.models import Alert, AlertTypeChoices, AlertSeverityChoices, FlaggedAccount
from apps.accounts.models import User, DocumentStatusChoices

# 1. Fraud Detection (Critical) - List Quantity vs Capacity
@receiver(post_save, sender=Product)
def check_fraud_behavior(sender, instance, created, **kwargs):
    if instance.stock is not None and instance.farmer_id:
        try:
            profile = getattr(instance.farmer, 'farmerprofile', None)
            if profile and profile.farm_capacity_tons > 0 and instance.stock > profile.farm_capacity_tons:
                # Stock is greater than farm capacity
                details = {
                    "product_id": instance.id,
                    "product_title": instance.title,
                    "farmer_id": instance.farmer.id,
                    "farmer_email": instance.farmer.email,
                    "discrepancy": f"Listed: {instance.stock}t | Farm Capacity: {profile.farm_capacity_tons}t"
                }
                Alert.objects.create(
                    alert_type=AlertTypeChoices.SUSPICIOUS_ACTIVITY,
                    severity=AlertSeverityChoices.CRITICAL,
                    product=instance,
                    details_json=details
                )
        except Exception:
            pass

# 2. Rapid Stock Depletion (High Demand)
@receiver(pre_save, sender=Product)
def capture_original_stock(sender, instance, **kwargs):
    if instance.pk:
        try:
            original = Product.objects.get(pk=instance.pk)
            instance.__original_stock = original.stock
        except Product.DoesNotExist:
            instance.__original_stock = None
    else:
        instance.__original_stock = None

@receiver(post_save, sender=Product)
def check_stock_depletion(sender, instance, created, **kwargs):
    original_stock = getattr(instance, '__original_stock', None)
    if original_stock is not None and original_stock > 0:
        if instance.stock == 0 or instance.stock <= (original_stock * Decimal('0.2')):
            details = {
                "product_id": instance.id,
                "product_title": instance.title,
                "previous_stock": float(original_stock),
                "current_stock": float(instance.stock),
                "message": "Stock dropped rapidly (by >80% or to 0)."
            }
            Alert.objects.create(
                alert_type=AlertTypeChoices.STOCK_IMBALANCE,
                severity=AlertSeverityChoices.HIGH,
                product=instance,
                details_json=details
            )

# 3. Farmer Reporting Threshold
@receiver(post_save, sender=FlaggedAccount)
def check_reporting_threshold(sender, instance, created, **kwargs):
    if created:
        flag_count = FlaggedAccount.objects.filter(account=instance.account).count()
        if flag_count > 5:
            details = {
                "account_id": instance.account.id,
                "account_email": instance.account.email,
                "flag_count": flag_count,
                "message": f"Account has received {flag_count} user reports."
            }
            Alert.objects.create(
                alert_type=AlertTypeChoices.USER_REPORT,
                severity=AlertSeverityChoices.MEDIUM,
                details_json=details
            )

# 4. Verification Queue
@receiver(pre_save, sender=User)
def capture_original_user_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            original = User.objects.get(pk=instance.pk)
            instance.__original_document_status = original.document_status
        except User.DoesNotExist:
            instance.__original_document_status = None
    else:
        instance.__original_document_status = None

@receiver(post_save, sender=User)
def check_verification_queue(sender, instance, created, **kwargs):
    original_status = getattr(instance, '__original_document_status', None)
    if instance.document_status == DocumentStatusChoices.PENDING and original_status != DocumentStatusChoices.PENDING:
        details = {
            "account_id": instance.id,
            "account_email": instance.email,
            "message": "New documents uploaded for verification."
        }
        Alert.objects.create(
            alert_type=AlertTypeChoices.VERIFICATION_PENDING,
            severity=AlertSeverityChoices.LOW,
            details_json=details
        )
