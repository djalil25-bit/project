import os
import re

def process_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace pastel mint #ADEBB3 with stronger mint #66D972
    new_content = re.sub(r'#ADEBB3', r'#66D972', content, flags=re.IGNORECASE)

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
        r'c:\projet-mem\p1\frontend\src\layouts\MainLayout.js',
        r'c:\projet-mem\p1\frontend\src\pages\complaints\ComplaintFormPage.js',
        r'c:\projet-mem\p1\frontend\src\pages\complaints\UserComplaints.js',
    ]
    for f in files:
        process_file(f)
    print("Done — stronger mint green applied.")
