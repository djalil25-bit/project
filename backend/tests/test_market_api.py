
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import requests

# Login
login = requests.post('http://localhost:8000/api/v1/auth/login/', json={
    'email': 'admin@agrigov.com',
    'password': 'admin123'
})
token = login.json().get('access', '')
headers = {'Authorization': f'Bearer {token}'}

# Test prices endpoint
r = requests.get('http://localhost:8000/api/v1/market/prices/', headers=headers)
print(f'Prices - Status: {r.status_code}')
data = r.json()
print(f'  Count: {len(data)}')
for p in data[:5]:
    print(f"  {p['product_name']}: {p['current_price']} DA/{p['unit']} ({p['trend']})")

# Test alerts
r2 = requests.get('http://localhost:8000/api/v1/market/alerts/', headers=headers)
print(f'\nAlerts - Status: {r2.status_code}')
alerts = r2.json()
print(f'  Count: {len(alerts)}')
for a in alerts:
    print(f"  ALERT: {a['product_name']} - {a.get('highlight_message','')}")

# Test summary
r3 = requests.get('http://localhost:8000/api/v1/market/summary/', headers=headers)
print(f'\nSummary - Status: {r3.status_code}')
print(f'  {r3.json()}')

print('\n All Market Intelligence APIs working!')
