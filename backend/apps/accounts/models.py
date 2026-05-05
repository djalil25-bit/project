from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import TimeStampedModel


# ─── Choices ───────────────────────────────────────────────────────────────────

class RoleChoices(models.TextChoices):
    FARMER      = 'farmer',      _('Farmer')
    BUYER       = 'buyer',       _('Buyer')
    TRANSPORTER = 'transporter', _('Transporter')
    ADMIN       = 'admin',       _('Admin')

class AccountStatusChoices(models.TextChoices):
    PENDING   = 'pending',   _('Pending')
    APPROVED  = 'approved',  _('Approved')
    REJECTED  = 'rejected',  _('Rejected')
    SUSPENDED = 'suspended', _('Suspended')

class DocumentStatusChoices(models.TextChoices):
    NONE     = 'none',     _('None')
    PENDING  = 'pending',  _('Pending')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')

class TrustLevelChoices(models.TextChoices):
    NEW      = 'new',      _('New')
    BRONZE   = 'bronze',   _('Bronze')
    SILVER   = 'silver',   _('Silver')
    GOLD     = 'gold',     _('Gold')
    PLATINUM = 'platinum', _('Platinum')


# ─── User ──────────────────────────────────────────────────────────────────────

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        if 'status' not in extra_fields:
            if extra_fields.get('role') == RoleChoices.ADMIN:
                extra_fields['status'] = AccountStatusChoices.APPROVED
                extra_fields['is_verified'] = True
            else:
                extra_fields['status'] = AccountStatusChoices.PENDING
                extra_fields['is_verified'] = False
                extra_fields['is_email_verified'] = False
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', RoleChoices.ADMIN)
        extra_fields.setdefault('status', AccountStatusChoices.APPROVED)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_email_verified', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TimeStampedModel):
    username = None
    email    = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    phone     = models.CharField(max_length=20, blank=True)

    role   = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.BUYER)
    status = models.CharField(max_length=20, choices=AccountStatusChoices.choices, default=AccountStatusChoices.PENDING)

    # Trust & Verification
    is_verified       = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=True)  # Default True to keep existing accounts valid
    document_status   = models.CharField(max_length=20, choices=DocumentStatusChoices.choices, default=DocumentStatusChoices.NONE)
    trust_score       = models.IntegerField(default=0)
    trust_level       = models.CharField(max_length=20, choices=TrustLevelChoices.choices, default=TrustLevelChoices.NEW)
    verification_date = models.DateTimeField(null=True, blank=True)

    # Profile fields
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    address         = models.TextField(blank=True)
    bio             = models.TextField(blank=True)

    # Transporter-specific (legacy JSON — kept for backward compatibility)
    vehicles     = models.JSONField(default=list, blank=True)
    service_zones = models.JSONField(default=list, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    @property
    def is_approved(self):
        return self.status == AccountStatusChoices.APPROVED


# ─── Role-specific profiles ────────────────────────────────────────────────────

class ProductionTypeChoices(models.TextChoices):
    CEREALS    = 'cereals',    _('Cereals')
    VEGETABLES = 'vegetables', _('Vegetables')
    FRUITS     = 'fruits',     _('Fruits')
    LIVESTOCK  = 'livestock',  _('Livestock')
    MIXED      = 'mixed',      _('Mixed')


class FarmerProfile(models.Model):
    """Extended farmer registration data. Extends the existing migration-0004 model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmerprofile')
    # Legacy capacity fields (kept from migration 0004 — do not remove)
    farm_size_hectares = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    farm_capacity_tons = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    # Registration fields (added in migration 0005)
    farm_name       = models.CharField(max_length=255, blank=True, default='')
    farm_location   = models.CharField(max_length=255, blank=True, default='')
    production_type = models.CharField(
        max_length=20, choices=ProductionTypeChoices.choices, blank=True, default=''
    )

    def __str__(self):
        return f"FarmerProfile({self.user.email})"


class BuyerTypeChoices(models.TextChoices):
    INDIVIDUAL = 'individual', _('Individual')
    BUSINESS   = 'business',   _('Business')


class BuyerProfile(models.Model):
    """Buyer-specific registration data."""
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyerprofile')
    buyer_type   = models.CharField(max_length=20, choices=BuyerTypeChoices.choices, default=BuyerTypeChoices.INDIVIDUAL)
    company_name = models.CharField(max_length=255, blank=True, default='')
    tax_number   = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"BuyerProfile({self.user.email})"


class VehicleTypeChoices(models.TextChoices):
    TRUCK        = 'truck',        _('Truck')
    VAN          = 'van',          _('Van')
    REFRIGERATED = 'refrigerated', _('Refrigerated Truck')
    OTHER        = 'other',        _('Other')


class TransporterProfile(models.Model):
    """Transporter-specific registration data."""
    user          = models.OneToOneField(User, on_delete=models.CASCADE, related_name='transporterprofile')
    vehicle_type  = models.CharField(max_length=20, choices=VehicleTypeChoices.choices, default=VehicleTypeChoices.TRUCK)
    plate_number  = models.CharField(max_length=50, blank=True, default='')
    capacity_tons = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)

    def __str__(self):
        return f"TransporterProfile({self.user.email})"


# ─── Document model ────────────────────────────────────────────────────────────

class DocumentTypeChoices(models.TextChoices):
    FARMER_ID            = 'farmer_id',           _('Farmer ID')
    FARM_PHOTO           = 'farm_photo',           _('Farm Photo')
    TRADE_REGISTER       = 'trade_register',       _('Trade Register')
    DRIVING_LICENSE      = 'driving_license',      _('Driving License')
    VEHICLE_REGISTRATION = 'vehicle_registration', _('Vehicle Registration')


class DocumentReviewStatus(models.TextChoices):
    PENDING  = 'pending',  _('Pending Review')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')


class UserDocument(models.Model):
    """Per-document upload with individual admin review status."""
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DocumentTypeChoices.choices)
    file          = models.FileField(upload_to='documents/%Y/%m/')
    status        = models.CharField(
        max_length=10, choices=DocumentReviewStatus.choices,
        default=DocumentReviewStatus.PENDING
    )
    reviewer_note = models.TextField(blank=True, default='')
    reviewed_at   = models.DateTimeField(null=True, blank=True)
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.document_type} — {self.user.email} ({self.status})"


class OTPCode(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code       = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - {self.code}"
