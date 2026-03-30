from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, AdminComplaintViewSet

router = DefaultRouter()
router.register(r'', ComplaintViewSet, basename='complaints')

admin_router = DefaultRouter()
admin_router.register(r'', AdminComplaintViewSet, basename='admin-complaints')

urlpatterns = [
    path('management/', include(admin_router.urls)), # /api/complaints/management/
    path('', include(router.urls)), # /api/complaints/
]
