from django.db import models
from apps.common.models import TimeStampedModel
from apps.catalog.models import Category, CatalogProduct
from django.utils import timezone

class PricePublication(TimeStampedModel):
    catalog_product = models.ForeignKey(CatalogProduct, on_delete=models.CASCADE, related_name='price_history', null=True, blank=True)
    
    official_price = models.DecimalField(max_digits=12, decimal_places=2, help_text="The reference/official price set by admin")
    min_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, default='kg')
    
    valid_from = models.DateField(default=timezone.now)
    valid_until = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)

    def __str__(self):
        target = self.catalog_product.name if self.catalog_product else "General"
        return f"Official Price for {target}: {self.official_price} per {self.unit}"

    @classmethod
    def get_latest_official_price(cls, catalog_product=None):
        now = timezone.now().date()
        qs = cls.objects.filter(valid_from__lte=now)
        qs = qs.filter(models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now))
        
        if catalog_product:
            return qs.filter(catalog_product=catalog_product).order_by('-valid_from').first()
            
        return None
