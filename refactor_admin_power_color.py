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

power_color_replacements = [
    (r'bg-slate-900', r'bg-[#0a3d2e]'),
    (r'bg-slate-800', r'bg-[#0a3d2e]'),
    (r'border-slate-800', r'border-[#0f5c44]'),
    (r'from-emerald-900/40 via-teal-900/20', r'from-[#166534]/30 via-transparent'),
    (r'bg-slate-600', r'bg-[#0f5c44]'),
    (r'hover:bg-slate-700', r'hover:bg-[#166534]'),
    (r'text-slate-600', r'text-[#0f5c44]'),
    (r'border-slate-600', r'border-[#0f5c44]'),
    (r'ring-slate-600', r'ring-[#0f5c44]'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    
    print("Processing Admin Pages...")
    process_directory(os.path.join(base_dir, 'pages', 'admin'), power_color_replacements)
    
    print("Processing Admin Dashboards...")
    process_file(os.path.join(base_dir, 'pages', 'dashboards', 'AdminDashboard.js'), power_color_replacements)
    
    print("\nDone.")
