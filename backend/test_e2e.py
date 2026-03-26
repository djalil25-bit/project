import urllib.request
import urllib.error
import json
import uuid

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def api_request(method, path, data=None, token=None):
    url = BASE_URL + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    req_data = json.dumps(data).encode('utf-8') if data else None
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(res_body)
        except:
            return e.code, {"error": res_body}
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    suffix = str(uuid.uuid4())[:8]
    print(f"--- Starting E2E Tests (Run {suffix}) ---")
    
    # Static Admin (created via shell)
    admin_creds = {"email": "admin@agrigov.com", "password": "adminpass123"}
    
    # Login Admin
    status, res = api_request('POST', '/auth/login/', admin_creds)
    print(f"Login Admin: {status}")
    admin_token = res.get("access")

    # 1. Register Farmer
    farmer_data = {
        "email": f"farmer_{suffix}@example.com",
        "password": "password123",
        "full_name": f"Farmer User {suffix}",
        "role": "farmer"
    }
    status, res = api_request('POST', '/auth/register/', farmer_data)
    print(f"Register Farmer: {status} {res}")
    # Extract user ID from response. Based on CustomTokenObtainPairSerializer, it's in res['user']['id'] or directly if using RegisterSerializer
    # Let's check user list as admin
    
    status, res = api_request('GET', '/auth/admin/users/', token=admin_token)
    farmer_id = None
    if isinstance(res, list):
        for u in res:
            if u['email'] == farmer_data['email']:
                farmer_id = u['id']
                break
    elif 'results' in res:
        for u in res['results']:
            if u['email'] == farmer_data['email']:
                farmer_id = u['id']
                break

    # Admin approves farmer
    if farmer_id:
        status, res = api_request('POST', f'/auth/admin/users/{farmer_id}/change_status/', {"action": "approve"}, token=admin_token)
        print(f"Admin Approve Farmer: {status}")
    else:
        print("Failed to find farmer_id")
        return

    # Login Farmer
    status, res = api_request('POST', '/auth/login/', {"email": farmer_data["email"], "password": "password123"})
    print(f"Login Farmer: {status}")
    farmer_token = res.get("access")

    # 2. Create Category as Admin
    # Note: Check if categories endpoint exists. From urls.py it does.
    cat_data = {"name": f"Vegetables_{suffix}", "description": "Fresh veg"}
    status, res = api_request('POST', '/categories/', cat_data, token=admin_token)
    print(f"Create Category: {status}")
    cat_id = res.get("id")

    # 3. Create Farm as Farmer
    farm_data = {
        "name": f"My Farm {suffix}",
        "location": "123 Farm Lane",
        "size_hectares": "10.5"
    }
    status, res = api_request('POST', '/farms/', farm_data, token=farmer_token)
    print(f"Create Farm: {status} {res}")
    farm_id = res.get("id")

    # 4. Create Product as Farmer
    prod_data = {
        "farm": farm_id,
        "category": cat_id,
        "title": f"Tomatoes {suffix}",
        "description": "Red tomatoes",
        "price": "2.50",
        "unit": "kg",
        "stock": 100
    }
    status, res = api_request('POST', '/products/', prod_data, token=farmer_token)
    print(f"Create Product: {status} {res}")
    prod_id = res.get("id")

    # 5. Register Buyer
    buyer_data = {
        "email": f"buyer_{suffix}@example.com",
        "password": "password123",
        "full_name": f"Buyer User {suffix}",
        "role": "buyer"
    }
    status, res = api_request('POST', '/auth/register/', buyer_data)
    print(f"Register Buyer: {status}")

    # Admin approves buyer
    status, res = api_request('GET', '/auth/admin/users/', token=admin_token)
    buyer_id = None
    if isinstance(res, list):
        for u in res:
            if u['email'] == buyer_data['email']:
                buyer_id = u['id']
                break
    elif 'results' in res:
        for u in res['results']:
            if u['email'] == buyer_data['email']:
                buyer_id = u['id']
                break
    
    if buyer_id:
        status, res = api_request('POST', f'/auth/admin/users/{buyer_id}/change_status/', {"action": "approve"}, token=admin_token)
        print(f"Admin Approve Buyer: {status}")
    
    # Login Buyer
    status, res = api_request('POST', '/auth/login/', {"email": buyer_data["email"], "password": "password123"})
    print(f"Login Buyer: {status}")
    buyer_token = res.get("access")

    # 6. Buyer adds to cart
    cart_item_data = {"product": prod_id, "quantity": 10}
    status, res = api_request('POST', '/cart/items/', cart_item_data, token=buyer_token)
    print(f"Add to Cart: {status}")

    # 7. Buyer checkout
    checkout_data = {"delivery_address": "456 Buyer St"}
    status, res = api_request('POST', '/orders/checkout/', checkout_data, token=buyer_token)
    print(f"Checkout: {status}")
    
    if status == 201:
        print("E2E flow successful!")
    else:
        print("E2E flow failed.")

if __name__ == '__main__':
    run_tests()
