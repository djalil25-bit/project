from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import TimeStampedModel

class RoleChoices(models.TextChoices):
    FARMER = 'farmer', _('Farmer')
    BUYER = 'buyer', _('Buyer')
    TRANSPORTER = 'transporter', _('Transporter')
    ADMIN = 'admin', _('Admin')

class AccountStatusChoices(models.TextChoices):
    PENDING = 'pending', _('Pending')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')
    SUSPENDED = 'suspended', _('Suspended')

class DocumentStatusChoices(models.TextChoices):
    NONE = 'none', _('None')
    PENDING = 'pending', _('Pending')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')

class TrustLevelChoices(models.TextChoices):
    NEW = 'new', _('New')
    BRONZE = 'bronze', _('Bronze')
    SILVER = 'silver', _('Silver')
    GOLD = 'gold', _('Gold')
    PLATINUM = 'platinum', _('Platinum')

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
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, TimeStampedModel):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)

    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.BUYER)
    status = models.CharField(max_length=20, choices=AccountStatusChoices.choices, default=AccountStatusChoices.PENDING)

    # Trust & Verification foundation
    is_verified = models.BooleanField(default=False)
    document_status = models.CharField(max_length=20, choices=DocumentStatusChoices.choices, default=DocumentStatusChoices.NONE)
    trust_score = models.IntegerField(default=0)
    trust_level = models.CharField(max_length=20, choices=TrustLevelChoices.choices, default=TrustLevelChoices.NEW)
    verification_date = models.DateTimeField(null=True, blank=True)

    # Profile fields
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    address = models.TextField(blank=True)
    bio = models.TextField(blank=True)

    # Transporter-specific
    vehicles = models.JSONField(default=list, blank=True)
    service_zones = models.JSONField(default=list, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    @property
    def is_approved(self):
        return self.status == AccountStatusChoices.APPROVED
