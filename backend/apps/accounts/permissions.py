from rest_framework.permissions import BasePermission
from .models import RoleChoices, AccountStatusChoices

class IsApprovedUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved)

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not bool(user and user.is_authenticated):
            return False
        # Allow if role is admin OR if user is staff/superuser
        is_admin = (user.role == RoleChoices.ADMIN) or user.is_superuser or user.is_staff
        return bool(is_admin)

class IsFarmerRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.FARMER

class IsBuyerRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.BUYER

class IsTransporterRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.TRANSPORTER
