from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class TrendChoice(models.TextChoices):
    INCREASING = 'INCREASING', 'Increasing'
    DECREASING = 'DECREASING', 'Decreasing'
    STABLE = 'STABLE', 'Stable'


class MarketCategory(models.TextChoices):
    VEGETABLES = 'VEGETABLES', 'Vegetables'
    FRUITS = 'FRUITS', 'Fruits'
    CEREALS = 'CEREALS', 'Cereals'
    LEGUMES = 'LEGUMES', 'Legumes'
    DAIRY = 'DAIRY', 'Dairy'
    MEAT = 'MEAT', 'Meat'
    OTHER = 'OTHER', 'Other'


class MarketPrice(TimeStampedModel):
    """
    Official market price for an agricultural product.
    Managed by admin for market intelligence insights.
    Future-ready: supports AI predictions, weather impact, IoT analytics.
    """
    product_name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20,
        choices=MarketCategory.choices,
        default=MarketCategory.VEGETABLES
    )
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    previous_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Previous price for change calculation"
    )
    unit = models.CharField(max_length=20, default='KG')
    trend = models.CharField(
        max_length=20,
        choices=TrendChoice.choices,
        default=TrendChoice.STABLE
    )
    market_note = models.TextField(blank=True, default='')
    is_highlighted = models.BooleanField(
        default=False,
        help_text="If True, this price will appear as a highlighted alert"
    )
    highlight_message = models.CharField(
        max_length=500, blank=True, default='',
        help_text="Custom alert message when highlighted"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='market_prices_updated'
    )

    # Future-ready fields
    ai_prediction = models.JSONField(
        null=True, blank=True,
        help_text="Reserved for AI market prediction data"
    )
    weather_impact_score = models.FloatField(
        null=True, blank=True,
        help_text="Reserved for weather impact analysis"
    )
    supply_index = models.FloatField(
        null=True, blank=True,
        help_text="Reserved for supply/demand analytics"
    )

    class Meta:
        ordering = ['-is_highlighted', '-updated_at']
        verbose_name = 'Market Price'
        verbose_name_plural = 'Market Prices'

    def __str__(self):
        return f"{self.product_name}: {self.current_price} DA/{self.unit} ({self.get_trend_display()})"

    @property
    def price_change_percentage(self):
        """Calculate percentage change from previous price."""
        if self.previous_price and self.previous_price > 0:
            change = ((self.current_price - self.previous_price) / self.previous_price) * 100
            return round(change, 1)
        return 0


class MarketPriceHistory(TimeStampedModel):
    """
    Historical record of market price changes for trend visualization.
    Automatically created when a MarketPrice is updated.
    """
    market_price = models.ForeignKey(
        MarketPrice,
        on_delete=models.CASCADE,
        related_name='price_history'
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    class Meta:
        ordering = ['-recorded_at']
        verbose_name = 'Market Price History'
        verbose_name_plural = 'Market Price Histories'

    def __str__(self):
        return f"{self.market_price.product_name}: {self.price} @ {self.recorded_at}"
