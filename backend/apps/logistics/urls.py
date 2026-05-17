from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryRequestViewSet, VehicleViewSet

router = DefaultRouter()
router.register(r'deliveries', DeliveryRequestViewSet, basename='delivery')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')


urlpatterns = [
    path('', include(router.urls)),
]
