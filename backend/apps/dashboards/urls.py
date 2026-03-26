from django.urls import path
from .views import AdminDashboardStatsAPIView, FarmerDashboardStatsAPIView, TransporterDashboardStatsAPIView

urlpatterns = [
    path('admin-stats/', AdminDashboardStatsAPIView.as_view(), name='admin_stats'),
    path('farmer-stats/', FarmerDashboardStatsAPIView.as_view(), name='farmer_stats'),
    path('transporter-stats/', TransporterDashboardStatsAPIView.as_view(), name='transporter_stats'),
]
