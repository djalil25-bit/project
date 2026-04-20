from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, CatalogProduct, Product, Favorite
from .serializers import (
    CategorySerializer, 
    CatalogProductSerializer, 
    ProductSerializer,
    FavoriteSerializer,
    FavoriteCreateSerializer
)
from apps.accounts.permissions import IsFarmerRole, IsAdminRole

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-id')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

class CatalogProductViewSet(viewsets.ModelViewSet):
    """Admin defines the catalog. Farmers browse to select."""
    serializer_class = CatalogProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name']

    def get_queryset(self):
        return CatalogProduct.objects.filter(is_active=True).select_related('category').order_by('-id')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

class ProductViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'farm', 'farmer', 'is_active', 'catalog_product']
    search_fields = ['title', 'description', 'farmer__full_name']
    ordering_fields = ['price', 'created_at']

    def get_queryset(self):
        qs = Product.objects.select_related('farmer', 'farm', 'category', 'catalog_product').all().order_by('-id')
        user = self.request.user
        if user.role == 'farmer':
            if self.request.query_params.get('my_products') == 'true':
                return qs.filter(farmer=user)
        if self.action == 'list' and user.role == 'buyer':
            qs = qs.filter(is_active=True, stock__gt=0)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Log errors to help diagnose 400 Bad Request
            print(f"DEBUG: Product creation failed validation: {serializer.errors}")
            print(f"DEBUG: Request.data: {request.data}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print(f"DEBUG: Product update failed validation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsFarmerRole]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        catalog_product = serializer.validated_data.get('catalog_product')
        # Automatically set category and unit if missing but catalog_product is present
        extra_args = {'farmer': self.request.user, 'is_active': True}
        if catalog_product:
            if not serializer.validated_data.get('category'):
                extra_args['category'] = catalog_product.category
            if not serializer.validated_data.get('unit'):
                extra_args['unit'] = catalog_product.default_unit
        
        serializer.save(**extra_args)

    def perform_update(self, serializer):
        if self.get_object().farmer != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only modify your own products.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.farmer != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own products.")
        instance.delete()

class FavoriteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product', 'product__farmer', 'product__farm').order_by('-id')

    def get_serializer_class(self):
        if self.action == 'create':
            return FavoriteCreateSerializer
        return FavoriteSerializer

    def perform_create(self, serializer):
        # Prevent duplicates
        if Favorite.objects.filter(user=self.request.user, product=serializer.validated_data['product']).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Product already in favorites.")
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['delete'])
    def remove(self, request):
        product_id = request.data.get('product')
        if not product_id:
            return Response({"error": "Product ID required"}, status=400)
        
        Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=204)
