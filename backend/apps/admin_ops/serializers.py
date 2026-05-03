from rest_framework import serializers
from .models import Alert, AlertConfig, AdminMessage, MessageTemplate, ActivityLog, FlaggedAccount


class AlertConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertConfig
        fields = '__all__'


class AlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True, default='')

    class Meta:
        model = Alert
        fields = '__all__'


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = '__all__'


class AdminMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True, default='')
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True, default='')
    recipient_email = serializers.CharField(source='recipient.email', read_only=True, default='')

    class Meta:
        model = AdminMessage
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = '__all__'


class FlaggedAccountSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.full_name', read_only=True, default='')
    account_email = serializers.CharField(source='account.email', read_only=True, default='')
    account_status = serializers.CharField(source='account.status', read_only=True, default='')
    reason = serializers.CharField(source='description', read_only=True)

    class Meta:
        model = FlaggedAccount
        fields = '__all__'
