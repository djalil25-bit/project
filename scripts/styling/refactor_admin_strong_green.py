import os
import re

def process_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"Skipping (not found): {filepath}")
        return False
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)

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
            if file.endswith('.js') or file.endswith('.jsx') or file.endswith('.css'):
                filepath = os.path.join(root, file)
                if process_file(filepath, replacements):
                    changed_files += 1
                    print(f"Updated {filepath}")
    return changed_files

# Comprehensive replacements for Admin to Stronger Ministry Green
admin_strong_green_replacements = [
    (r'#0f5c44', r'#064e3b'),
    (r'#0a3d2e', r'#022c22'),
    (r'bg-emerald-600', r'bg-[#064e3b]'), # Some buttons might use this
    (r'text-emerald-600', r'text-[#064e3b]'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    
    print("Processing Admin-related Files...")
    process_directory(os.path.join(base_dir, 'pages', 'admin'), admin_strong_green_replacements)
    process_directory(os.path.join(base_dir, 'pages', 'dashboards'), admin_strong_green_replacements)
    process_directory(os.path.join(base_dir, 'components', 'admin'), admin_strong_green_replacements)
    
    print("\nDone.")
