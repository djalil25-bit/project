from rest_framework import serializers
from .models import Complaint
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'role', 'profile_picture')

class ComplaintSerializer(serializers.ModelSerializer):
    creator_details = UserMinimalSerializer(source='creator', read_only=True)
    target_user_details = UserMinimalSerializer(source='target_user', read_only=True)
    order_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Complaint
        fields = (
            'id', 'creator', 'creator_details', 'target_user', 'target_user_details',
            'order', 'order_details', 'delivery', 'title', 'description', 'complaint_type',
            'status', 'attachment', 'admin_notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('creator', 'status', 'admin_notes', 'created_at', 'updated_at')

    def get_order_details(self, obj):
        if obj.order:
            from apps.orders.serializers import OrderSerializer
            return OrderSerializer(obj.order, context=self.context).data
        return None

class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = (
            'id', 'target_user', 'order', 'delivery', 'title', 
            'description', 'complaint_type', 'attachment'
        )

class AdminComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ('status', 'admin_notes')
