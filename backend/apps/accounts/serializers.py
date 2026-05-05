from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from .models import (
    RoleChoices, AccountStatusChoices,
    FarmerProfile, BuyerProfile, TransporterProfile,
    BuyerTypeChoices, UserDocument, DocumentTypeChoices,
    DocumentReviewStatus,
)

User = get_user_model()

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'application/pdf'}
MAX_FILE_SIZE_MB = 5


def _validate_file(file):
    """Shared file validator: type + size."""
    content_type = getattr(file, 'content_type', None)
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise serializers.ValidationError(
            "Only JPG, PNG, and PDF files are accepted."
        )
    if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise serializers.ValidationError(
            f"File size must not exceed {MAX_FILE_SIZE_MB} MB."
        )
    return file


# ─── Auth / Token ──────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email    = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user'] = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'is_verified': user.is_verified,
            'is_email_verified': user.is_email_verified,
            'trust_level': user.trust_level,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
            'dashboard_route': f"/{user.role}-dashboard"
        }
        return token

    def validate(self, attrs):
        email    = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(_("Both email and password are required."))

        from django.contrib.auth import authenticate
        user = authenticate(username=email, password=password)

        if user is None:
            raise serializers.ValidationError(_("No active account found with the given credentials"))

        if not user.is_active:
            raise serializers.ValidationError(_("Account is inactive."))

        if not user.is_email_verified:
            raise serializers.ValidationError(_("Please verify your email address before logging in."))

        # Allow PENDING users to login — frontend redirects them to /pending
        if user.status == AccountStatusChoices.REJECTED:
            raise serializers.ValidationError(_("Your account registration was rejected."))
        elif user.status == AccountStatusChoices.SUSPENDED:
            raise serializers.ValidationError(_("Your account is currently suspended."))

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role,
                'status': user.status,
                'is_verified': user.is_verified,
                'is_email_verified': user.is_email_verified,
                'trust_level': user.trust_level,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'dashboard_route': f"/{user.role}-dashboard"
            }
        }
        return data


# ─── Registration ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    """
    Accepts multipart/form-data with common fields + role-specific fields + files.
    Creates User, role-specific profile, and UserDocument records atomically.
    """
    # Common fields
    email            = serializers.EmailField()
    password         = serializers.CharField(write_only=True, min_length=8)
    full_name        = serializers.CharField(max_length=255)
    phone            = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role             = serializers.ChoiceField(choices=[RoleChoices.FARMER, RoleChoices.BUYER, RoleChoices.TRANSPORTER])
    wilaya           = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # ── Farmer fields ──
    farm_name        = serializers.CharField(max_length=255, required=False, allow_blank=True)
    farm_location    = serializers.CharField(max_length=255, required=False, allow_blank=True)
    production_type  = serializers.CharField(max_length=20, required=False, allow_blank=True)
    farm_size        = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.0)
    farmer_id        = serializers.FileField(required=False)   # REQUIRED for farmers — validated in validate()
    farm_photos      = serializers.ListField(                  # Multiple optional
        child=serializers.FileField(), required=False
    )

    # ── Buyer fields ──
    buyer_type       = serializers.ChoiceField(
        choices=['individual', 'business'], required=False, default='individual'
    )
    company_name     = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tax_number       = serializers.CharField(max_length=100, required=False, allow_blank=True)
    trade_register   = serializers.FileField(required=False)   # REQUIRED when buyer_type=business

    # ── Transporter fields ──
    vehicle_type     = serializers.CharField(max_length=20, required=False, allow_blank=True)
    plate_number     = serializers.CharField(max_length=50, required=False, allow_blank=True)
    capacity_tons    = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0.0)
    driving_license  = serializers.FileField(required=False)   # REQUIRED for transporters
    vehicle_registration = serializers.FileField(required=False)  # REQUIRED for transporters

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role(self, value):
        if value == RoleChoices.ADMIN:
            raise serializers.ValidationError("Cannot self-register as admin.")
        return value

    def validate(self, data):
        role = data.get('role')

        if role == RoleChoices.FARMER:
            if not data.get('farm_name'):
                raise serializers.ValidationError({'farm_name': 'Farm name is required for farmers.'})
            if not data.get('farm_location'):
                raise serializers.ValidationError({'farm_location': 'Farm location is required for farmers.'})
            if not data.get('production_type'):
                raise serializers.ValidationError({'production_type': 'Production type is required for farmers.'})
            if not data.get('farmer_id'):
                raise serializers.ValidationError({'farmer_id': 'Farmer ID document is required.'})
            # Validate farmer_id file
            _validate_file(data['farmer_id'])
            for photo in data.get('farm_photos', []):
                _validate_file(photo)

        elif role == RoleChoices.BUYER:
            buyer_type = data.get('buyer_type', 'individual')
            if buyer_type == 'business':
                if not data.get('company_name'):
                    raise serializers.ValidationError({'company_name': 'Company name is required for business buyers.'})
                if not data.get('trade_register'):
                    raise serializers.ValidationError({'trade_register': 'Trade register document is required for business buyers.'})
                _validate_file(data['trade_register'])

        elif role == RoleChoices.TRANSPORTER:
            if not data.get('vehicle_type'):
                raise serializers.ValidationError({'vehicle_type': 'Vehicle type is required for transporters.'})
            if not data.get('plate_number'):
                raise serializers.ValidationError({'plate_number': 'Plate number is required for transporters.'})
            if not data.get('driving_license'):
                raise serializers.ValidationError({'driving_license': 'Driving license document is required.'})
            if not data.get('vehicle_registration'):
                raise serializers.ValidationError({'vehicle_registration': 'Vehicle registration document is required.'})
            _validate_file(data['driving_license'])
            _validate_file(data['vehicle_registration'])

        return data

    def create(self, validated_data):
        """Atomic creation of User + profile + documents."""
        from django.db import transaction

        role   = validated_data['role']
        wilaya = validated_data.pop('wilaya', '')

        # Pop role-specific data before creating user
        farm_name       = validated_data.pop('farm_name', '')
        farm_location   = validated_data.pop('farm_location', '')
        production_type = validated_data.pop('production_type', '')
        farm_size       = validated_data.pop('farm_size', 0.0)
        farmer_id_file  = validated_data.pop('farmer_id', None)
        farm_photos     = validated_data.pop('farm_photos', [])

        buyer_type     = validated_data.pop('buyer_type', 'individual')
        company_name   = validated_data.pop('company_name', '')
        tax_number     = validated_data.pop('tax_number', '')
        trade_register = validated_data.pop('trade_register', None)

        vehicle_type         = validated_data.pop('vehicle_type', '')
        plate_number         = validated_data.pop('plate_number', '')
        capacity_tons        = validated_data.pop('capacity_tons', 0.0)
        driving_license      = validated_data.pop('driving_license', None)
        vehicle_registration = validated_data.pop('vehicle_registration', None)

        with transaction.atomic():
            user = User.objects.create_user(
                email     = validated_data['email'],
                password  = validated_data['password'],
                full_name = validated_data.get('full_name', ''),
                phone     = validated_data.get('phone', ''),
                role      = role,
                address   = wilaya,  # Store wilaya as address for now
            )

            # Create role-specific profile
            if role == RoleChoices.FARMER:
                FarmerProfile.objects.create(
                    user            = user,
                    farm_name       = farm_name,
                    farm_location   = farm_location,
                    production_type = production_type,
                    farm_size_hectares = farm_size,
                )
                if farmer_id_file:
                    UserDocument.objects.create(
                        user=user, document_type=DocumentTypeChoices.FARMER_ID, file=farmer_id_file
                    )
                for photo in farm_photos:
                    UserDocument.objects.create(
                        user=user, document_type=DocumentTypeChoices.FARM_PHOTO, file=photo
                    )

            elif role == RoleChoices.BUYER:
                BuyerProfile.objects.create(
                    user         = user,
                    buyer_type   = buyer_type,
                    company_name = company_name,
                    tax_number   = tax_number,
                )
                if trade_register:
                    UserDocument.objects.create(
                        user=user, document_type=DocumentTypeChoices.TRADE_REGISTER, file=trade_register
                    )

            elif role == RoleChoices.TRANSPORTER:
                TransporterProfile.objects.create(
                    user          = user,
                    vehicle_type  = vehicle_type,
                    plate_number  = plate_number,
                    capacity_tons = capacity_tons,
                )
                if driving_license:
                    UserDocument.objects.create(
                        user=user, document_type=DocumentTypeChoices.DRIVING_LICENSE, file=driving_license
                    )
                if vehicle_registration:
                    UserDocument.objects.create(
                        user=user, document_type=DocumentTypeChoices.VEHICLE_REGISTRATION, file=vehicle_registration
                    )

            return user


# ─── User / Profile ────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = (
            'id', 'email', 'full_name', 'phone', 'role', 'status',
            'is_verified', 'is_email_verified', 'trust_level', 'trust_score', 'profile_picture', 'created_at', 'address', 'bio'
        )
        read_only_fields = ('id', 'status', 'is_verified', 'trust_level', 'trust_score', 'created_at')


class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = '__all__'

class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = '__all__'

class TransporterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransporterProfile
        fields = '__all__'

class AdminUserDetailSerializer(UserSerializer):
    farmer_profile = FarmerProfileSerializer(source='farmerprofile', read_only=True)
    buyer_profile = BuyerProfileSerializer(source='buyerprofile', read_only=True)
    transporter_profile = TransporterProfileSerializer(source='transporterprofile', read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ('farmer_profile', 'buyer_profile', 'transporter_profile')


class AdminUserActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'suspend', 'reactivate'])


class ProfileSerializer(serializers.ModelSerializer):
    """For profile GET/PATCH. Exposes all profile-related fields."""
    profile_completeness = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            'id', 'email', 'full_name', 'phone', 'role', 'status',
            'profile_picture', 'address', 'bio', 'vehicles', 'service_zones',
            'is_verified', 'document_status', 'trust_score', 'trust_level',
            'verification_date', 'profile_completeness',
        )
        read_only_fields = ('id', 'email', 'role', 'status', 'is_verified', 'verification_date', 'profile_completeness')

    def get_profile_completeness(self, obj):
        fields = ['full_name', 'phone', 'profile_picture', 'address', 'bio']
        if obj.role == RoleChoices.TRANSPORTER:
            fields.extend(['vehicles', 'service_zones'])
        filled = sum(1 for f in fields if getattr(obj, f))
        return int((filled / len(fields)) * 100)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


# ─── Document serializers ──────────────────────────────────────────────────────

class UserDocumentSerializer(serializers.ModelSerializer):
    """Read-only serializer for listing documents (user-facing and admin-facing)."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = UserDocument
        fields = ('id', 'document_type', 'file_url', 'status', 'reviewer_note', 'uploaded_at', 'reviewed_at')
        read_only_fields = fields

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class AdminDocumentReviewSerializer(serializers.ModelSerializer):
    """Admin-only: update document status and reviewer note."""
    class Meta:
        model  = UserDocument
        fields = ('status', 'reviewer_note')

    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.status        = validated_data.get('status', instance.status)
        instance.reviewer_note = validated_data.get('reviewer_note', instance.reviewer_note)
        instance.reviewed_at   = timezone.now()
        instance.save()
        return instance


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code  = serializers.CharField(max_length=6)
