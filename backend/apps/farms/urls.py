from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, HarvestRecordViewSet

router = DefaultRouter()
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r'harvest-records', HarvestRecordViewSet, basename='harvest-record')

urlpatterns = [
    path('', include(router.urls)),
]
