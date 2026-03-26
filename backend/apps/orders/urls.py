from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, FarmerOrderViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'farmer-orders', FarmerOrderViewSet, basename='farmer-order')

urlpatterns = [
    path('', include(router.urls)),
]
