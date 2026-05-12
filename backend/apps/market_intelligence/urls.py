from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketPricePublicViewSet,
    MarketPriceAdminViewSet,
    MarketAlertListView,
    MarketSummaryView,
)

router = DefaultRouter()
router.register(r'prices', MarketPricePublicViewSet, basename='market-prices')
router.register(r'admin/prices', MarketPriceAdminViewSet, basename='market-prices-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('alerts/', MarketAlertListView.as_view(), name='market-alerts'),
    path('summary/', MarketSummaryView.as_view(), name='market-summary'),
]
