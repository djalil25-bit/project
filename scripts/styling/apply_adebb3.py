import os
import re

TARGET = '#ADEBB3'

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
    
    # Replace #45C855 with #ADEBB3
    new_content = re.sub(r'#45C855', TARGET, content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"OK: {filepath}")

print("Done replacing #45C855 with #ADEBB3.")
