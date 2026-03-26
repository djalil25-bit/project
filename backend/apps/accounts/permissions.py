from rest_framework.permissions import BasePermission
from .models import RoleChoices, AccountStatusChoices

class IsApprovedUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved)

class IsAdminRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.ADMIN

class IsFarmerRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.FARMER

class IsBuyerRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.BUYER

class IsTransporterRole(IsApprovedUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == RoleChoices.TRANSPORTER
