import os
import re

# Replacing the pastel #ADEBB3 with a vibrant, strong mint/emerald green
TARGET = '#10B981'

files = [
    r'c:\projet-mem\p1\frontend\src\pages\dashboards\TransporterDashboard.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\VehicleSettings.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\ZoneSettings.js',
    r'c:\projet-mem\p1\frontend\src\dashboards.css',
    r'c:\projet-mem\p1\frontend\src\index.css',
    r'c:\projet-mem\p1\frontend\src\layouts\MainLayout.js',
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace #ADEBB3 with #10B981
    new_content = re.sub(r'#ADEBB3', TARGET, content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"OK: {filepath}")

print(f"Done replacing pastel mint with STRONG vibrant mint {TARGET}.")
