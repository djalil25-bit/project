from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from .models import RoleChoices, AccountStatusChoices

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['user'] = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'is_verified': user.is_verified,
            'trust_level': user.trust_level,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
            'dashboard_route': f"/{user.role}-dashboard"
        }
        return token

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(_("Both email and password are required."))

        from django.contrib.auth import authenticate
        user = authenticate(username=email, password=password)

        if user is None:
            raise serializers.ValidationError(_("No active account found with the given credentials"))

        if not user.is_active:
            raise serializers.ValidationError(_("Account is inactive."))

        # Check account status
        if user.status == AccountStatusChoices.PENDING:
            raise serializers.ValidationError(_("Your account is pending admin approval."))
        elif user.status == AccountStatusChoices.REJECTED:
            raise serializers.ValidationError(_("Your account registration was rejected."))
        elif user.status == AccountStatusChoices.SUSPENDED:
            raise serializers.ValidationError(_("Your account is currently suspended."))

        # Success - generate tokens
        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        # Add custom claims / user info
        data['user'] = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'is_verified': user.is_verified,
            'trust_level': user.trust_level,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
            'dashboard_route': f"/{user.role}-dashboard"
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone', 'role', 'status', 
            'is_verified', 'trust_level', 'trust_score', 'profile_picture', 'created_at'
        )
        read_only_fields = ('id', 'status', 'is_verified', 'trust_level', 'trust_score', 'created_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'phone', 'role')

    def validate_role(self, value):
        if value == RoleChoices.ADMIN:
            raise serializers.ValidationError(_("Cannot self-register as admin."))
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', RoleChoices.BUYER)
        )
        return user

class AdminUserActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'suspend', 'reactivate'])

class ProfileSerializer(serializers.ModelSerializer):
    """For profile GET/PATCH. Exposes all profile-related fields."""
    profile_completeness = serializers.SerializerMethodField()

    class Meta:
        model = User
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
        
        filled = 0
        for field in fields:
            val = getattr(obj, field)
            if val:
                filled += 1
        return int((filled / len(fields)) * 100)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
