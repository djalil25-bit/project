from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, CatalogProduct, Product
from .serializers import CategorySerializer, CatalogProductSerializer, ProductSerializer
from apps.accounts.permissions import IsFarmerRole, IsAdminRole

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
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
        return CatalogProduct.objects.filter(is_active=True).select_related('category')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'farm', 'farmer', 'is_active', 'catalog_product']
    search_fields = ['title', 'description', 'farmer__full_name']
    ordering_fields = ['price', 'created_at']

    def get_queryset(self):
        qs = Product.objects.select_related('farmer', 'farm', 'category', 'catalog_product').all()
        user = self.request.user
        if user.role == 'farmer':
            if self.request.query_params.get('my_products') == 'true':
                return qs.filter(farmer=user)
        if self.action == 'list' and user.role == 'buyer':
            qs = qs.filter(is_active=True, stock__gt=0)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsFarmerRole]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        catalog_product = serializer.validated_data.get('catalog_product')
        # Automatically set category and unit if missing but catalog_product is present
        extra_args = {'farmer': self.request.user}
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
