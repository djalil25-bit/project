from django.urls import path
from .views import (
    AdminDashboardStatsAPIView, AdminAnalyticsAPIView,
    FarmerDashboardStatsAPIView, FarmerAnalyticsAPIView,
    TransporterDashboardStatsAPIView
)

urlpatterns = [
    path('admin-stats/', AdminDashboardStatsAPIView.as_view(), name='admin_stats'),
    path('admin-analytics/', AdminAnalyticsAPIView.as_view(), name='admin_analytics'),
    path('farmer-stats/', FarmerDashboardStatsAPIView.as_view(), name='farmer_stats'),
    path('farmer-analytics/', FarmerAnalyticsAPIView.as_view(), name='farmer_analytics'),
    path('transporter-stats/', TransporterDashboardStatsAPIView.as_view(), name='transporter_stats'),
]
