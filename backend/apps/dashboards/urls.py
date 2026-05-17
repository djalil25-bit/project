from django.urls import path
from .views import (
    AdminDashboardStatsAPIView, AdminAnalyticsAPIView, AdminMapDataAPIView,
    FarmerDashboardStatsAPIView, FarmerAnalyticsAPIView,
    TransporterDashboardStatsAPIView, ActorMessageAPIView,
    WeatherAPIView, PublicLandingStatsAPIView,
)

urlpatterns = [
    path('admin-stats/', AdminDashboardStatsAPIView.as_view(), name='admin_stats'),
    path('admin-analytics/', AdminAnalyticsAPIView.as_view(), name='admin_analytics'),
    path('admin-map-data/', AdminMapDataAPIView.as_view(), name='admin_map_data'),
    path('farmer-stats/', FarmerDashboardStatsAPIView.as_view(), name='farmer_stats'),
    path('farmer-analytics/', FarmerAnalyticsAPIView.as_view(), name='farmer_analytics'),
    path('transporter-stats/', TransporterDashboardStatsAPIView.as_view(), name='transporter_stats'),
    path('actor-messages/', ActorMessageAPIView.as_view(), name='actor_messages'),
    path('weather/', WeatherAPIView.as_view(), name='weather'),
    path('public-stats/', PublicLandingStatsAPIView.as_view(), name='public_stats'),
]
