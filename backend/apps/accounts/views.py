from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    AdminUserActionSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
)
from .models import RoleChoices, AccountStatusChoices
from .permissions import IsAdminRole

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ProfileView(APIView):
    """GET/PATCH user's own profile including profile picture."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = ProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully.'})

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        user = self.request.user
        print(f"[DEBUG AdminUsers] User: {user.email}, Role: {user.role}, Is Superuser: {user.is_superuser}, Is Staff: {user.is_staff}")
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        role_filter = self.request.query_params.get('role', None)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if role_filter:
            qs = qs.filter(role=role_filter)
        return qs

    @action(detail=True, methods=['post'], serializer_class=AdminUserActionSerializer)
    def change_status(self, request, pk=None):
        user = self.get_object()
        serializer = AdminUserActionSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            if action_type == 'approve':
                user.status = AccountStatusChoices.APPROVED
                # Send notification to user
                try:
                    from apps.notifications.models import Notification, NotificationType
                    Notification.objects.create(
                        user=user,
                        message=f"Congratulations! Your account has been approved. You can now access the platform.",
                        type=NotificationType.USER_APPROVED,
                    )
                except Exception:
                    pass
            elif action_type == 'reject':
                user.status = AccountStatusChoices.REJECTED
            elif action_type == 'suspend':
                user.status = AccountStatusChoices.SUSPENDED
            elif action_type == 'reactivate':
                user.status = AccountStatusChoices.APPROVED
            user.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
