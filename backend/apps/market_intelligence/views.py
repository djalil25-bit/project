from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import MarketPrice, MarketPriceHistory
from .serializers import (
    MarketPriceSerializer,
    MarketPriceAdminSerializer,
    MarketPriceHistorySerializer,
)
from apps.accounts.permissions import IsAdminRole
from apps.notifications.models import Notification, NotificationType
from apps.accounts.models import User


class MarketPricePublicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for farmers and buyers to view market prices.
    No pagination for dashboard bar (returns all).
    """
    serializer_class = MarketPriceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'trend', 'is_highlighted']
    search_fields = ['product_name']
    ordering_fields = ['current_price', 'updated_at', 'product_name']
    pagination_class = None  # Return all for the insights bar

    def get_queryset(self):
        return MarketPrice.objects.all()


class MarketPriceAdminViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for admin market price management.
    On create/update, automatically records price history and sends notifications.
    """
    serializer_class = MarketPriceAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'trend', 'is_highlighted']
    search_fields = ['product_name']
    ordering_fields = ['current_price', 'updated_at', 'product_name']

    def get_queryset(self):
        return MarketPrice.objects.all()

    def perform_create(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        # Record initial price in history
        MarketPriceHistory.objects.create(
            market_price=instance,
            price=instance.current_price,
            recorded_by=self.request.user,
        )

    def perform_update(self, serializer):
        old_price = serializer.instance.current_price
        instance = serializer.save(
            updated_by=self.request.user,
            previous_price=old_price,
        )
        # Record price change in history
        MarketPriceHistory.objects.create(
            market_price=instance,
            price=instance.current_price,
            recorded_by=self.request.user,
        )
        # Send notifications to farmers and buyers if highlighted
        if instance.is_highlighted:
            self._notify_users(instance)

    def _notify_users(self, market_price):
        """Notify all farmers and buyers about a highlighted price update."""
        trend_symbol = '↑' if market_price.trend == 'INCREASING' else '↓' if market_price.trend == 'DECREASING' else '→'
        message = (
            f"Official {market_price.product_name} market price updated: "
            f"{market_price.current_price} DA/{market_price.unit} {trend_symbol}"
        )
        if market_price.highlight_message:
            message += f" — {market_price.highlight_message}"

        users = User.objects.filter(
            role__in=['farmer', 'buyer'],
            is_active=True,
        )
        notifications = [
            Notification(
                user=u,
                message=message,
                type=NotificationType.GENERAL,
                link='/market-intelligence',
            )
            for u in users
        ]
        Notification.objects.bulk_create(notifications)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get full price history for a specific market price entry."""
        market_price = self.get_object()
        history = MarketPriceHistory.objects.filter(market_price=market_price)
        serializer = MarketPriceHistorySerializer(history, many=True)
        return Response(serializer.data)


class MarketAlertListView(APIView):
    """
    Returns only highlighted/alert market prices for the insights bar.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        alerts = MarketPrice.objects.filter(is_highlighted=True)
        serializer = MarketPriceSerializer(alerts, many=True)
        return Response(serializer.data)


class MarketSummaryView(APIView):
    """
    Returns a market summary for dashboard widgets:
    - total products tracked
    - increasing / decreasing / stable counts
    - active alerts count
    - last updated timestamp
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Max
        qs = MarketPrice.objects.all()
        summary = {
            'total_products': qs.count(),
            'increasing': qs.filter(trend='INCREASING').count(),
            'decreasing': qs.filter(trend='DECREASING').count(),
            'stable': qs.filter(trend='STABLE').count(),
            'active_alerts': qs.filter(is_highlighted=True).count(),
            'last_updated': qs.aggregate(last=Max('updated_at'))['last'],
        }
        return Response(summary)
