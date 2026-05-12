from rest_framework import serializers
from .models import MarketPrice, MarketPriceHistory


class MarketPriceHistorySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(
        source='recorded_by.full_name', read_only=True, default=''
    )

    class Meta:
        model = MarketPriceHistory
        fields = ['id', 'price', 'recorded_at', 'recorded_by_name']


class MarketPriceSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(
        source='updated_by.full_name', read_only=True, default=''
    )
    price_change_percentage = serializers.ReadOnlyField()
    trend_display = serializers.CharField(
        source='get_trend_display', read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        model = MarketPrice
        fields = [
            'id', 'product_name', 'category', 'category_display',
            'current_price', 'previous_price', 'unit', 'trend',
            'trend_display', 'market_note', 'is_highlighted',
            'highlight_message', 'updated_by', 'updated_by_name',
            'price_change_percentage',
            'ai_prediction', 'weather_impact_score', 'supply_index',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['updated_by', 'updated_by_name', 'price_change_percentage']


class MarketPriceAdminSerializer(serializers.ModelSerializer):
    """Admin serializer with write access to all fields."""
    updated_by_name = serializers.CharField(
        source='updated_by.full_name', read_only=True, default=''
    )
    price_change_percentage = serializers.ReadOnlyField()
    trend_display = serializers.CharField(
        source='get_trend_display', read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    recent_history = serializers.SerializerMethodField()

    class Meta:
        model = MarketPrice
        fields = [
            'id', 'product_name', 'category', 'category_display',
            'current_price', 'previous_price', 'unit', 'trend',
            'trend_display', 'market_note', 'is_highlighted',
            'highlight_message', 'updated_by', 'updated_by_name',
            'price_change_percentage', 'recent_history',
            'ai_prediction', 'weather_impact_score', 'supply_index',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['updated_by', 'updated_by_name', 'price_change_percentage']

    def get_recent_history(self, obj):
        history = obj.price_history.all()[:10]
        return MarketPriceHistorySerializer(history, many=True).data
