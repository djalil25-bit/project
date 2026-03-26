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

def verify():
    suffix = str(uuid.uuid4())[:8]
    print(f"--- Verifying Price Validation (Run {suffix}) ---")
    
    # 1. Login Admin
    admin_creds = {"email": "admin@agrigov.com", "password": "adminpass123"}
    status, res = api_request('POST', '/auth/login/', admin_creds)
    if status != 200:
        print(f"Failed to login admin: {status} {res}")
        return
    admin_token = res.get("access")
    print("Admin logged in.")

    # 2. Create Category
    cat_data = {"name": f"Validation Cat {suffix}", "description": "Test category"}
    status, res = api_request('POST', '/categories/', cat_data, token=admin_token)
    if status != 201:
        print(f"Failed to create category: {status} {res}")
        return
    cat_id = res.get("id")
    print(f"Category created: {cat_id}")

    # 3. Create CatalogProduct with range 5-43
    cp_data = {
        "category": cat_id,
        "name": f"Validation Product {suffix}",
        "min_price": "5.00",
        "max_price": "43.00",
        "ref_price": "20.00",
        "is_active": True
    }
    status, res = api_request('POST', '/catalog-products/', cp_data, token=admin_token)
    if status != 201:
        print(f"Failed to create catalog product: {status} {res}")
        return
    cp_id = res.get("id")
    print(f"Catalog Product created: {cp_id} (Range: 5 - 43)")

    # 4. Register and Approve Farmer
    farmer_data = {
        "email": f"farmer_v_{suffix}@example.com",
        "password": "password123",
        "full_name": f"Farmer V {suffix}",
        "role": "farmer"
    }
    status, res = api_request('POST', '/auth/register/', farmer_data)
    if status != 201:
        print(f"Failed to register farmer: {status} {res}")
        return
    
    # Find farmer ID
    status, res = api_request('GET', '/auth/admin/users/', token=admin_token)
    farmer_id = None
    for u in (res.get('results', []) if isinstance(res, dict) else res):
        if u['email'] == farmer_data['email']:
            farmer_id = u['id']
            break
    
    if not farmer_id:
        print("Failed to find farmer ID")
        return
    
    api_request('POST', f'/auth/admin/users/{farmer_id}/change_status/', {"action": "approve"}, token=admin_token)
    print("Farmer registered and approved.")

    # 5. Login Farmer
    status, res = api_request('POST', '/auth/login/', {"email": farmer_data["email"], "password": "password123"})
    farmer_token = res.get("access")
    print("Farmer logged in.")

    # 6. Create Farm
    farm_data = {"name": f"V Farm {suffix}", "location": "Test Loc", "size_hectares": "5"}
    status, res = api_request('POST', '/farms/', farm_data, token=farmer_token)
    farm_id = res.get("id")
    print(f"Farm created: {farm_id}")

    # 7. Test Valid Price (39) with Image and auto-derivation
    # Create a dummy image multipart payload
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Authorization': f'Bearer {farmer_token}'
    }
    
    parts = []
    prod_payload = {
        "catalog_product": str(cp_id),
        "farm": str(farm_id),
        "title": "Valid Listing with Image",
        "description": "Desc",
        "price": "39.00",
        "stock": "10"
    }
    
    for key, value in prod_payload.items():
        parts.append(f'--{boundary}')
        parts.append(f'Content-Disposition: form-data; name="{key}"')
        parts.append('')
        parts.append(value)
        
    # Add a dummy file
    parts.append(f'--{boundary}')
    parts.append(f'Content-Disposition: form-data; name="image"; filename="test.jpg"')
    parts.append('Content-Type: image/jpeg')
    parts.append('')
    parts.append('\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x37\xff\xd9')
    parts.append(f'--{boundary}--')
    parts.append('')
    
    body = '\r\n'.join(parts).encode('latin-1')
    
    url = BASE_URL + '/products/'
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            res = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        status = e.code
        res = json.loads(e.read().decode('utf-8'))

    if status == 201:
        print("✅ SUCCESS: Product created with Image and auto-derivation worked.")
    else:
        print(f"❌ FAILURE: Product creation failed: {status} {res}")

    # 8. Test Invalid Price High (44)
    prod_payload["price"] = "44.00"
    prod_payload["title"] = "Invalid High Listing"
    # Convert and send as multipart again? Or just use json since we tested multipart
    status, res = api_request('POST', '/products/', prod_payload, token=farmer_token)
    if status == 400 and "Your price is outside the admin-approved range" in str(res):
        print("✅ SUCCESS: Price 44 rejected with correct message.")
    else:
        print(f"❌ FAILURE: Price 44 behavior unexpected: {status} {res}")

    # 9. Test Invalid Price Low (2)
    prod_payload["price"] = "2.00"
    prod_payload["title"] = "Invalid Low Listing"
    status, res = api_request('POST', '/products/', prod_payload, token=farmer_token)
    if status == 400 and "Your price is outside the admin-approved range" in str(res):
        print("✅ SUCCESS: Price 2 rejected with correct message.")
    else:
        print(f"❌ FAILURE: Price 2 behavior unexpected: {status} {res}")

if __name__ == '__main__':
    verify()
