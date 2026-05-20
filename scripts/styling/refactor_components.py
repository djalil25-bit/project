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

def process_directory(directory, replacements):
    changed_files = 0
    if not os.path.exists(directory):
        return 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                if process_file(filepath, replacements):
                    changed_files += 1
                    print(f"Updated {filepath}")
    return changed_files

admin_replacements = [
    (r'-(indigo|blue)-', r'-slate-'),
]

buyer_replacements = [
    (r'-(indigo|blue)-', r'-teal-'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src\components'
    
    print("Processing Admin Components...")
    admin_changes = process_directory(os.path.join(base_dir, 'admin'), admin_replacements)
    print(f"Admin components changed: {admin_changes}")

    print("\nProcessing Market Components (Buyer)...")
    market_changes = process_directory(os.path.join(base_dir, 'market'), buyer_replacements)
    print(f"Market components changed: {market_changes}")

    print("\nDone.")
