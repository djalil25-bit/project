from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, CatalogProductViewSet, ProductViewSet, FavoriteViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'catalog-products', CatalogProductViewSet, basename='catalog-product')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    path('', include(router.urls)),
]
