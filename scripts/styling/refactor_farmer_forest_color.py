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

# Comprehensive replacements for Farmer to Forest Green (#2E6F40)
forest_green_replacements = [
    # General emerald classes
    (r'-(emerald|green)-600', r'-[#2E6F40]'),
    (r'-(emerald|green)-700', r'-[#255933]'),
    (r'-(emerald|green)-500', r'-[#2E6F40]'),
    (r'-(emerald|green)-400', r'-[#4a8c5f]'), # Lighter variant
    (r'-(emerald|green)-300', r'-[#76b08a]'), # Even lighter
    (r'-(emerald|green)-200', r'-[#a2d4b5]'),
    (r'-(emerald|green)-100', r'-[#cee8d9]'),
    (r'-(emerald|green)-50', r'-[#f0faf4]'),
    
    # Hover states
    (r'hover:bg-emerald-400', r'hover:bg-[#4a8c5f]'),
    (r'hover:bg-emerald-600', r'hover:bg-[#255933]'),
    
    # Shadow and Ring
    (r'shadow-emerald-500', r'shadow-[#2E6F40]'),
    (r'shadow-emerald-700', r'shadow-[#255933]'),
    
    # Hardcoded hex codes that might be present
    (r'#16A34A', r'#2E6F40'), # emerald-600
    (r'#059669', r'#2E6F40'), # emerald-600 (alternative)
    (r'#22543d', r'#2E6F40'), # custom dark green
    (r'#1a402e', r'#255933'), # even darker
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    
    print("Processing Farmer Pages...")
    process_directory(os.path.join(base_dir, 'pages', 'farmer'), forest_green_replacements)
    
    print("Processing Farmer Dashboards...")
    process_file(os.path.join(base_dir, 'pages', 'dashboards', 'FarmerDashboard.js'), forest_green_replacements)
    process_file(os.path.join(base_dir, 'pages', 'dashboards', 'FarmerWeatherPage.js'), forest_green_replacements)
    
    print("\nDone.")
