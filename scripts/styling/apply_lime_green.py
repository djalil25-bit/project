import os
import re

def process_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The user wants lime green #32CD32
    new_content = re.sub(r'#2E7D32', r'#32CD32', content, flags=re.IGNORECASE)
    new_content = re.sub(r'#388E3C', r'#32CD32', new_content, flags=re.IGNORECASE)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

if __name__ == '__main__':
    files = [
        r'c:\projet-mem\p1\frontend\src\pages\dashboards\TransporterDashboard.js',
        r'c:\projet-mem\p1\frontend\src\pages\transporter\VehicleSettings.js',
        r'c:\projet-mem\p1\frontend\src\pages\transporter\ZoneSettings.js',
        r'c:\projet-mem\p1\frontend\src\dashboards.css',
        r'c:\projet-mem\p1\frontend\src\index.css',
        r'c:\projet-mem\p1\frontend\src\layouts\MainLayout.js'
    ]
    for f in files:
        process_file(f)
    print("Done applying lime green to transporter.")
