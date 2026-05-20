import os
import re

TARGET = '#45C855'
DARK_TARGET = '#2DA83B'  # darker companion for hover states

def safe_replace(filepath, replacements):
    """Read file, apply replacements, validate, write."""
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if len(content) < 50:
        print(f"  SKIP (too small): {filepath}")
        return
    
    original = content
    for old, new in replacements:
        content = re.sub(re.escape(old), new, content, flags=re.IGNORECASE)
    
    if len(content) < len(original) * 0.5:
        print(f"  ABORT (safety): {filepath}")
        return
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK: {filepath}")
    else:
        print(f"  NO CHANGE: {filepath}")

# --- TransporterDashboard.js ---
# KPI icon colors to use transporter green
print("TransporterDashboard.js")
safe_replace(r'c:\projet-mem\p1\frontend\src\pages\dashboards\TransporterDashboard.js', [
    ("#d97706", TARGET),   # amber KPI icons -> green
    ("#1d4ed8", TARGET),   # blue KPI icons -> green
    ("#16a34a", TARGET),   # green KPI icons -> our green
    ("#059669", TARGET),   # emerald KPI icons -> our green
    ("#fef3c7", f"{TARGET}1a"),  # amber bg -> green tint
    ("#dbeafe", f"{TARGET}1a"),  # blue bg -> green tint
    ("#dcfce7", f"{TARGET}1a"),  # green bg -> green tint
    ("#ecfdf5", f"{TARGET}1a"),  # emerald bg -> green tint
])

# --- VehicleSettings.js ---
print("VehicleSettings.js")
safe_replace(r'c:\projet-mem\p1\frontend\src\pages\transporter\VehicleSettings.js', [
    ("#388E3C", TARGET),
    ("#2E7D32", TARGET),
    ("#1B5E20", DARK_TARGET),
])

# --- ZoneSettings.js ---
print("ZoneSettings.js")
safe_replace(r'c:\projet-mem\p1\frontend\src\pages\transporter\ZoneSettings.js', [
    ("#388E3C", TARGET),
    ("#2E7D32", TARGET),
    ("#1B5E20", DARK_TARGET),
])

# --- dashboards.css ---
print("dashboards.css")
safe_replace(r'c:\projet-mem\p1\frontend\src\dashboards.css', [
    ("#388E3C", TARGET),
    ("#2E7D32", TARGET),
])

# --- MainLayout.js (transporter accent only) ---
print("MainLayout.js")
fp = r'c:\projet-mem\p1\frontend\src\layouts\MainLayout.js'
if os.path.exists(fp):
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    # Only change the transporter accent line
    content = content.replace("transporter: '#d97706'", f"transporter: '{TARGET}'")
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {fp}")

# --- index.css (transporter token) ---
print("index.css")
fp2 = r'c:\projet-mem\p1\frontend\src\index.css'
if os.path.exists(fp2):
    with open(fp2, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("--transporter-green: #2E7D32", f"--transporter-green: {TARGET}")
    content = content.replace("--transporter-green: #388E3C", f"--transporter-green: {TARGET}")
    with open(fp2, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {fp2}")

print("\nAll done safely.")
