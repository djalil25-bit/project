from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryRequestViewSet

router = DefaultRouter()
router.register(r'deliveries', DeliveryRequestViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
]
