from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, CatalogProductViewSet, ProductViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'catalog-products', CatalogProductViewSet, basename='catalog-product')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
