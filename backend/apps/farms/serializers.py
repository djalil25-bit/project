from rest_framework import serializers
from .models import Farm, HarvestRecord

class FarmSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Farm
        fields = '__all__'
        read_only_fields = (
            'owner', 'created_at', 'updated_at',
            'status', 'rejection_reason', 'reviewed_at', 'reviewed_by',
        )

class HarvestRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HarvestRecord
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        farm = data.get('farm')
        user = self.context['request'].user
        if farm and farm.owner != user:
            raise serializers.ValidationError("You can only add harvest records to your own farms.")
        return data
