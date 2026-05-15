from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryRequestViewSet, VehicleViewSet, TransportPricingRuleViewSet

router = DefaultRouter()
router.register(r'deliveries', DeliveryRequestViewSet, basename='delivery')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'transport-pricing-rules', TransportPricingRuleViewSet, basename='pricing-rule')


urlpatterns = [
    path('', include(router.urls)),
]
