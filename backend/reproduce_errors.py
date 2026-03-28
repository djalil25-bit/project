import os, django, json
from rest_framework.test import APIClient
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.accounts.models import User
from apps.orders.models import Order

def test_backend():
    farmer = User.objects.filter(role='farmer', status='approved').first()
    if not farmer: return print('No farmer')
    order = Order.objects.filter(items__farmer=farmer, status='PENDING').first()
    if not order: return print('No pending order')
    
    client = APIClient()
    client.force_authenticate(user=farmer)
    
    print(f'--- TEST 1: ACCEPT ORDER #{order.id} ---')
    res = client.post(f'/api/v1/farmer-orders/{order.id}/status/', {'action': 'confirm'}, format='json')
    print(f'Status: {res.status_code}, Body: {res.data}')
    
    print(f'\n--- TEST 2: CREATE DELIVERY REQUEST FOR ORDER #{order.id} ---')
    # Use exact fields requested: order, pickup_location, delivery_destination, preferred_date, notes, required_truck_capacity
    data = {
        'order': order.id,
        'pickup_location': 'Farm A',
        'delivery_destination': 'City Center',
        'preferred_date': '2026-04-10',
        'notes': 'Careful with cargo',
        'required_truck_capacity': 'medium'
    }
    res = client.post('/api/v1/delivery-requests/', data, format='json')
    print(f'Status: {res.status_code}, Body: {res.data}')

test_backend()
