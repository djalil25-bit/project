import os
import re

def process_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace lime green #32CD32 with mint green #ADEBB3
    new_content = re.sub(r'#32CD32', r'#ADEBB3', content, flags=re.IGNORECASE)

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
    print("Done — mint green applied.")
