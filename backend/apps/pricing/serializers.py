from rest_framework import serializers
from .models import PricePublication

class PricePublicationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    product_name = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = PricePublication
        fields = '__all__'

    def validate(self, data):
        valid_from = data.get('valid_from')
        valid_until = data.get('valid_until')
        
        if valid_until and valid_until < valid_from:
            raise serializers.ValidationError("Valid until date must be after valid from date.")
        return data
