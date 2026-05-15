from rest_framework import serializers
from .models import Farm, HarvestRecord

class FarmSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:  # type: ignore[override]
        model = Farm
        fields = '__all__'
        read_only_fields = (
            'owner', 'created_at', 'updated_at',
            'status', 'rejection_reason', 'reviewed_at', 'reviewed_by',
        )

class HarvestRecordSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(
        source='farm.name', read_only=True)
    farm_wilaya = serializers.CharField(
        source='farm.wilaya', read_only=True)

    class Meta:  # type: ignore[override]
        model = HarvestRecord
        fields = [
            'id', 'farm', 'farm_name', 'farm_wilaya',
            'crop_name', 'year', 'quantity_produced',
            'unit', 'record_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at',
                            'updated_at', 'farm_name',
                            'farm_wilaya']

    def validate_farm(self, value):
        # Farmer can only add records to their own farms
        request = self.context.get('request')
        if request and value.owner != request.user:
            raise serializers.ValidationError(
                "You can only add harvest records to your own farms."
            )
        return value

    def validate_year(self, value):
        from datetime import date
        if value > date.today().year:
            raise serializers.ValidationError(
                "Year cannot be in the future."
            )
        if value < 1900:
            raise serializers.ValidationError(
                "Year is not valid."
            )
        return value

    def validate_quantity_produced(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than 0."
            )
        return value
