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
    UserDocumentSerializer,
    AdminDocumentReviewSerializer,
    AdminUserDetailSerializer,
)
from .models import RoleChoices, AccountStatusChoices, UserDocument
from .permissions import IsAdminRole

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    POST /auth/register/
    Accepts multipart/form-data with common + role-specific fields and file uploads.
    Creates User, role-specific profile, and UserDocument records atomically.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Handle multi-value farm_photos from FormData
        data = request.data.copy()
        farm_photos = request.FILES.getlist('farm_photos')

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Inject farm_photos list into validated_data before create
        validated = serializer.validated_data
        if farm_photos:
            validated['farm_photos'] = farm_photos

        user = serializer.create(validated)
        refresh = CustomTokenObtainPairSerializer.get_token(user)

        return Response(
            {
                'message': 'Registration successful.',
                'email': user.email,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'role': user.role,
                    'status': user.status,
                    'is_verified': user.is_verified,
                    'is_email_verified': user.is_email_verified,
                    'trust_level': user.trust_level,
                    'profile_picture': user.profile_picture.url if user.profile_picture else None,
                    'dashboard_route': f"/{user.role}-dashboard"
                }
            },
            status=status.HTTP_201_CREATED
        )


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
        serializer = ProfileSerializer(
            request.user, data=request.data, partial=True, context={'request': request}
        )
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


# ─── Documents ─────────────────────────────────────────────────────────────────

class UserDocumentListView(generics.ListAPIView):
    """
    GET /auth/documents/
    Authenticated user can view their own uploaded documents (read-only).
    """
    serializer_class = UserDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserDocument.objects.filter(user=self.request.user)


# ─── Admin ─────────────────────────────────────────────────────────────────────

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminUserDetailSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        print(f"[DEBUG AdminUsers] User: {user.email}, Role: {user.role}, Is Superuser: {user.is_superuser}")
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        role_filter   = self.request.query_params.get('role', None)
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
                user.status       = AccountStatusChoices.APPROVED
                user.is_verified  = True
                from django.utils import timezone
                user.verification_date = timezone.now()
                if user.trust_level == 'new':
                    user.trust_level = 'bronze'
                if user.trust_score < 20:
                    user.trust_score = 20
                try:
                    from apps.notifications.models import Notification, NotificationType
                    Notification.objects.create(
                        user=user,
                        message="Congratulations! Your account has been approved. You can now access the platform.",
                        type=NotificationType.USER_APPROVED,
                    )
                except Exception:
                    pass
            elif action_type == 'reject':
                user.status      = AccountStatusChoices.REJECTED
                user.is_verified = False
            elif action_type == 'suspend':
                user.status = AccountStatusChoices.SUSPENDED
            elif action_type == 'reactivate':
                user.status      = AccountStatusChoices.APPROVED
                user.is_verified = True
            user.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='documents')
    def documents(self, request, pk=None):
        """GET /auth/admin/users/{id}/documents/ — list a user's uploaded documents."""
        user = self.get_object()
        docs = UserDocument.objects.filter(user=user)
        serializer = UserDocumentSerializer(docs, many=True, context={'request': request})
        return Response(serializer.data)


class AdminDocumentReviewView(generics.UpdateAPIView):
    """
    PATCH /auth/admin/documents/{id}/
    Admin reviews a specific document (approve / reject with note).
    """
    queryset = UserDocument.objects.all()
    serializer_class = AdminDocumentReviewSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names = ['patch']
