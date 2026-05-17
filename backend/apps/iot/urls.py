from django.urls import path
from .views import (
    SensorDataView, AlertsView, AlertHistoryView, 
    AdminIoTOverviewView, AlertHistoryListView,
    SensorStatsView, SoilByWilayaView, FarmComparisonView,
    AIRecommendationsView,
)

urlpatterns = [
    path('data/', SensorDataView.as_view(), name='iot-data-create'),
    path('data/<int:farm_id>/', SensorDataView.as_view(), name='iot-data-list'),
    path('alerts/<int:farm_id>/', AlertsView.as_view(), name='iot-alerts'),
    path('alerts/history/<int:farm_id>/', AlertHistoryView.as_view(), name='iot-alerts-history'),
    
    # AI Recommendations
    path('ai-recommendations/<int:farm_id>/', AIRecommendationsView.as_view(), name='iot-ai-recommendations'),

    # Admin IoT Routes
    path('admin/overview/', AdminIoTOverviewView.as_view(), name='iot-admin-overview'),
    path('admin/alerts-history/', AlertHistoryListView.as_view(), name='iot-admin-alerts-history'),
    path('admin/sensor-stats/', SensorStatsView.as_view(), name='iot-admin-sensor-stats'),
    path('admin/soil-by-wilaya/', SoilByWilayaView.as_view(), name='iot-admin-soil-by-wilaya'),
    path('admin/farm-comparison/', FarmComparisonView.as_view(), name='iot-admin-farm-comparison'),
]
