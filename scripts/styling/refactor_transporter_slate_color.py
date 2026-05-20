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
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                if process_file(filepath, replacements):
                    changed_files += 1
                    print(f"Updated {filepath}")
    return changed_files

# More comprehensive replacements for Transporter to Logistics Slate (#3c514d)
transporter_slate_replacements = [
    (r'-(indigo|blue)-100', r'-[#3c514d]/20'),
    (r'-(indigo|blue)-200', r'-[#3c514d]/30'),
    (r'-(indigo|blue)-800', r'-[#2d3d3a]'),
    (r'text-(indigo|blue)-900', r'text-[#2d3d3a]'),
    (r'-(indigo|blue)-600', r'-[#3c514d]'),
    (r'hover:bg-indigo-700', r'hover:bg-[#2d3d3a]'),
    (r'text-(indigo|blue)-600', r'text-[#3c514d]'),
    (r'bg-(indigo|blue)-50', r'bg-[#3c514d]/10'),
    (r'border-(indigo|blue)-100', r'border-[#3c514d]/20'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    
    print("Processing Transporter Dashboards...")
    process_file(os.path.join(base_dir, 'pages', 'dashboards', 'TransporterDashboard.js'), transporter_slate_replacements)
    
    print("\nDone.")
