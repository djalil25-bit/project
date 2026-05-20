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
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                if process_file(filepath, replacements):
                    changed_files += 1
                    print(f"Updated {filepath}")
    return changed_files

# Admin replacements: indigo -> slate, blue -> slate, emerald -> slate (unless status)
# For simplicity, we just replace all indigo, blue to slate in admin.
admin_replacements = [
    (r'-(indigo|blue)-', r'-slate-'),
]

# Buyer replacements: indigo -> teal, blue -> teal
buyer_replacements = [
    (r'-(indigo|blue)-', r'-teal-'),
]

# Transporter replacements: amber -> indigo, blue -> indigo?
# Actually Transporter is using Indigo, let's just make sure amber/emerald etc are kept if they mean status. 
# Transporter is already Indigo, we might just leave it or replace any lingering specific accents if needed.

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src\pages'
    
    print("Processing Admin...")
    admin_changes = process_directory(os.path.join(base_dir, 'admin'), admin_replacements)
    print(f"Admin files changed: {admin_changes}")

    print("\nProcessing Buyer...")
    buyer_changes = process_directory(os.path.join(base_dir, 'buyer'), buyer_replacements)
    print(f"Buyer files changed: {buyer_changes}")

    print("\nDone.")
