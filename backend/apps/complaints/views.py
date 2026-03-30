from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Complaint, ComplaintStatusChoices
from .serializers import (
    ComplaintSerializer, 
    ComplaintCreateSerializer, 
    AdminComplaintUpdateSerializer
)
from apps.notifications.models import create_notification, NotificationType

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'

class ComplaintViewSet(viewsets.ModelViewSet):
    """
    User viewset for managing own complaints.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'complaint_type']
    ordering_fields = ['created_at']

    def get_queryset(self):
        # Users see complaints they created
        return Complaint.objects.filter(creator=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
        # Notify Admin? (Optional but good)
        # For now, just create
        pass

class AdminComplaintViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all complaints.
    """
    permission_classes = [IsAdminUser]
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'complaint_type', 'creator__role']
    search_fields = ['title', 'description', 'creator__email', 'creator__full_name']
    ordering_fields = ['created_at', 'updated_at']

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AdminComplaintUpdateSerializer
        return ComplaintSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # Notify the creator about status change
        msg = f"Your complaint '{instance.title}' has been updated to status: {instance.status}."
        if instance.admin_notes:
            msg += f" Resolution notes: {instance.admin_notes[:100]}..."
            
        create_notification(
            user=instance.creator,
            message=msg,
            notif_type=NotificationType.COMPLAINT_UPDATE,
            link='/complaints'
        )
