from rest_framework import viewsets, permissions
from .models import PricePublication
from .serializers import PricePublicationSerializer
from apps.accounts.permissions import IsAdminRole

class PricePublicationViewSet(viewsets.ModelViewSet):
    queryset = PricePublication.objects.all().order_by('-valid_from')
    serializer_class = PricePublicationSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]
