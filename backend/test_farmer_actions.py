import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from apps.accounts.models import User
from rest_framework.test import APIClient

def test_farmer_order_actions():
    # Find a farmer
    farmer = User.objects.filter(status='approved', role='farmer').first()
    if not farmer:
        print("No approved farmer found.")
        return

    # Find a pending order that belongs to this farmer
    order = Order.objects.filter(items__farmer=farmer, status='PENDING').first()
    if not order:
        print(f"No pending order found for farmer {farmer.email}.")
        return

    print(f"Testing actions for Order #{order.id} (Status: {order.status}) as farmer {farmer.email}")

    client = APIClient()
    client.force_authenticate(user=farmer)

    # Test Retrieve
    url_retrieve = f'/api/v1/farmer-orders/{order.id}/'
    response_retrieve = client.get(url_retrieve)
    print(f"GET {url_retrieve}")
    print(f"Response Status: {response_retrieve.status_code}")
    if response_retrieve.status_code == 200:
        print(f"Retrieve Success: {response_retrieve.data.get('id')}")
    else:
        print(f"Retrieve Failed: {response_retrieve.content}")

    # Test Confirm
    url_status = f'/api/v1/farmer-orders/{order.id}/status/'
    response_status = client.post(url_status, {'action': 'confirm'}, format='json')
    print(f"POST {url_status} with action=confirm")
    print(f"Response Status: {response_status.status_code}")
    try:
        print(f"Response Data: {response_status.data}")
    except:
        print(f"Response Content: {response_status.content}")

    # Check status
    order.refresh_from_db()
    print(f"New Order Status: {order.status}")

if __name__ == '__main__':
    test_farmer_order_actions()
