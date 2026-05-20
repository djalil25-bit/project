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

# Comprehensive replacements for Transporter to New Green (#388E3C)
transporter_green_replacements = [
    (r'#3c514d', r'#388E3C'),
    (r'#2d3d3a', r'#2E7D32'), # Darker variant
    (r'#3c514d1a', r'#388E3C1a'), # Translucent variant
    (r'\[#3c514d\]', r'[#388E3C]'),
    (r'\[#2d3d3a\]', r'[#2E7D32]'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    
    print("Processing Transporter Files...")
    process_directory(os.path.join(base_dir, 'pages', 'transporter'), transporter_green_replacements)
    process_directory(os.path.join(base_dir, 'pages', 'dashboards'), transporter_green_replacements)
    process_directory(os.path.join(base_dir, 'pages', 'complaints'), transporter_green_replacements)
    
    print("\nDone.")
