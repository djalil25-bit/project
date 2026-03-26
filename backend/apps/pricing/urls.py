from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PricePublicationViewSet

router = DefaultRouter()
router.register(r'price-publications', PricePublicationViewSet, basename='price-publication')

urlpatterns = [
    path('', include(router.urls)),
]
