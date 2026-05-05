from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    CurrentUserView,
    AdminUserViewSet,
    ProfileView,
    ChangePasswordView,
    UserDocumentListView,
    AdminDocumentReviewView,
)

router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/',         RegisterView.as_view(),              name='register'),
    path('login/',            CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/',          TokenRefreshView.as_view(),          name='token_refresh'),
    path('me/',               CurrentUserView.as_view(),           name='me'),
    path('profile/',          ProfileView.as_view(),               name='profile'),
    path('change-password/',  ChangePasswordView.as_view(),        name='change_password'),
    # Documents
    path('documents/',        UserDocumentListView.as_view(),      name='user-documents'),
    path('admin/documents/<int:pk>/', AdminDocumentReviewView.as_view(), name='admin-document-review'),
    path('', include(router.urls)),
]
