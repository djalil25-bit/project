import os
import re

def process_file(filepath, replacements):
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

replacements = [
    (r'-(indigo|blue)-', r'-teal-'),
]

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src\pages\complaints'
    for f in ['UserComplaints.js', 'ComplaintFormPage.js']:
        path = os.path.join(base_dir, f)
        if os.path.exists(path) and process_file(path, replacements):
            print(f"Updated {path}")
