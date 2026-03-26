from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.farms.models import Farm

class Category(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True, default='🌱')

    def __str__(self):
        return self.name

class CatalogProduct(TimeStampedModel):
    """Admin-defined product catalog. Farmers select from this list."""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='catalog_products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_unit = models.CharField(max_length=50, default='kg')
    is_active = models.BooleanField(default=True)
    # Reference pricing set by admin
    ref_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Admin reference price")
    min_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

class QualityChoices(models.TextChoices):
    HIGH = 'HIGH', 'High'
    MEDIUM = 'MEDIUM', 'Medium'
    LOW = 'LOW', 'Low'

class Product(TimeStampedModel):
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    catalog_product = models.ForeignKey(CatalogProduct, on_delete=models.SET_NULL, null=True, blank=True, related_name='listings')

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price per unit")
    unit = models.CharField(max_length=50, default='kg')
    stock = models.DecimalField(max_digits=12, decimal_places=2)
    quality = models.CharField(
        max_length=20,
        choices=QualityChoices.choices,
        default=QualityChoices.MEDIUM
    )
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.farmer.full_name}"
