import os
import re

def process_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

admin_replacements = [
    (r'-(indigo|blue)-', r'-slate-'),
]

buyer_replacements = [
    (r'-(indigo|blue)-', r'-teal-'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src\pages'
    
    # Process specific dashboard files
    dashboards = os.path.join(base_dir, 'dashboards')
    
    admin_dash = os.path.join(dashboards, 'AdminDashboard.js')
    if os.path.exists(admin_dash) and process_file(admin_dash, admin_replacements):
        print(f"Updated {admin_dash}")
        
    buyer_dash = os.path.join(dashboards, 'BuyerDashboard.js')
    if os.path.exists(buyer_dash) and process_file(buyer_dash, buyer_replacements):
        print(f"Updated {buyer_dash}")

    print("\nDone.")
