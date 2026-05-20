import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.catalog.models import Product
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def run_tests():
    buyer = User.objects.filter(role='buyer').first()
    if not buyer:
        print("No buyer found. Exiting.")
        return

    buyer.status = 'approved'
    buyer.is_active = True
    buyer.save()

    product = Product.objects.filter(stock__gt=3).first()
    if not product:
        print("No product with stock > 3 found. Exiting.")
        return

    original_stock = product.stock
    print(f"--- TESTING STOCK LOGIC ---")
    print(f"Product: {product.title} (ID: {product.id})")
    print(f"Initial Stock: {original_stock}")
    print(f"Buyer: {buyer.email}")

    client = APIClient(SERVER_NAME='localhost')
    refresh = RefreshToken.for_user(buyer)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    # 1. Clear cart
    CartItem.objects.filter(cart__buyer=buyer).delete()

    # 2. Add to cart & Exceed limit check
    print("\n[+] Testing Quantity constraints...")
    response_exceed = client.post('/api/v1/cart/items/', {'product': product.id, 'quantity': original_stock + 1}, format='json')
    if response_exceed.status_code == 400:
        print("PASS: API blocked quantity exceeding stock.")
    else:
        print(f"FAIL: Exceeded stock was permitted. Status: {response_exceed.status_code}")

    # Add valid quantity
    test_qty = 3
    response_valid = client.post('/api/v1/cart/items/', {'product': product.id, 'quantity': test_qty}, format='json')
    if response_valid.status_code == 201:
        print(f"PASS: API accepted valid quantity ({test_qty}).")
    else:
        print(f"FAIL: Could not add valid quantity. Error: {response_valid.json()}")

    # 3. Checkout (Stock decrease)
    print("\n[+] Testing Checkout Stock Deduction...")
    checkout_data = {
        'delivery_address': 'Test Address 123',
        'wilaya': 'Algiers',
        'buyer_phone': '0555555555',
        'payment_method': 'cash_on_delivery',
        'notes': 'Test order'
    }
    response_checkout = client.post('/api/v1/orders/checkout/', checkout_data, format='json')
    if response_checkout.status_code == 201:
        print("PASS: Checkout successful.")
        order_id = response_checkout.json()[0]['id'] if isinstance(response_checkout.json(), list) else response_checkout.json().get('id')
    else:
        print(f"FAIL: Checkout failed. Error: {response_checkout.json()}")
        return

    # Verify Stock Database
    product.refresh_from_db()
    print(f"Stock after checkout: {product.stock}")
    if product.stock == original_stock - test_qty:
        print("PASS: Stock was correctly decreased.")
    else:
        print("FAIL: Stock was not correctly decreased.")

    # 4. Cancel Order (Stock restore)
    print("\n[+] Testing Order Cancellation Stock Restore...")
    response_cancel = client.post(f'/api/v1/orders/{order_id}/cancel/')
    if response_cancel.status_code == 200:
        print("PASS: Cancel endpoint successful.")
    else:
        print(f"FAIL: Cancel endpoint failed. Status: {response_cancel.status_code}, Msg: {response_cancel.json()}")

    product.refresh_from_db()
    print(f"Stock after cancellation: {product.stock}")
    if product.stock == original_stock:
        print("PASS: Stock was successfully restored.")
    else:
        print("FAIL: Stock was not restored.")

if __name__ == '__main__':
    run_tests()
