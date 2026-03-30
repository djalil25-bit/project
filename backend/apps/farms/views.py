from rest_framework import viewsets, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, F

from .models import Farm, HarvestRecord
from .serializers import FarmSerializer, HarvestRecordSerializer
from apps.accounts.permissions import IsFarmerRole
from apps.catalog.models import Product
from apps.orders.models import OrderItem


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsFarmerRole]

    def get_queryset(self):
        return Farm.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'], url_path='stats')
    def farm_stats(self, request, pk=None):
        farm = self.get_object()
        timeframe = request.query_params.get('timeframe', 'all')
        now = timezone.now()
        item_filter = {'product__farm': farm}
        if timeframe == 'month':
            item_filter['created_at__gte'] = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == 'year':
            item_filter['created_at__gte'] = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        product_count = Product.objects.filter(farm=farm, farmer=request.user).count()
        order_count = OrderItem.objects.filter(**item_filter).values('order').distinct().count()
        revenue = OrderItem.objects.filter(**item_filter).aggregate(
            total=Sum(F('quantity') * F('price_snapshot'))
        )['total'] or 0

        best_products = OrderItem.objects.filter(**item_filter).values(
            'product__id', 'product__title'
        ).annotate(qty=Sum('quantity'), rev=Sum(F('quantity') * F('price_snapshot'))).order_by('-qty')[:3]

        return Response({
            'farm_id': farm.id,
            'farm_name': farm.name,
            'product_count': product_count,
            'order_count': order_count,
            'revenue': float(revenue),
            'best_products': [{'id': p['product__id'], 'name': p['product__title'],
                                'qty': float(p['qty'] or 0), 'revenue': float(p['rev'] or 0)}
                               for p in best_products],
        })


class HarvestRecordViewSet(viewsets.ModelViewSet):
    serializer_class = HarvestRecordSerializer
    permission_classes = [IsAuthenticated, IsFarmerRole]

    def get_queryset(self):
        return HarvestRecord.objects.filter(farm__owner=self.request.user)
