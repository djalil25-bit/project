from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from apps.accounts.permissions import IsBuyerRole

class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsBuyerRole]

    def get_cart(self):
        cart, _ = Cart.objects.get_or_create(buyer=self.request.user)
        return cart

    def list(self, request):
        cart = self.get_cart()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='items')
    def add_item(self, request):
        cart = self.get_cart()
        serializer = CartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            product = serializer.validated_data['product']
            quantity = serializer.validated_data['quantity']
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart, 
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                # Add quantity but enforce stock limit
                new_quantity = cart_item.quantity + quantity
                if new_quantity > product.stock:
                    return Response({'error': 'Exceeds available stock'}, status=status.HTTP_400_BAD_REQUEST)
                cart_item.quantity = new_quantity
                cart_item.save()
            return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put', 'patch'], url_path='items/(?P<product_id>[^/.]+)')
    def update_item(self, request, product_id=None):
        cart = self.get_cart()
        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        
        serializer = CartItemSerializer(cart_item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'], url_path='items/(?P<product_id>[^/.]+)')
    def remove_item(self, request, product_id=None):
        cart = self.get_cart()
        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        cart_item.delete()
        return Response(CartSerializer(cart).data, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'], url_path='clear')
    def clear_cart(self, request):
        cart = self.get_cart()
        cart.items.all().delete()
        return Response({'status': 'Cart cleared'}, status=status.HTTP_204_NO_CONTENT)
