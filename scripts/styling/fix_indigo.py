import os
import re

def fix_colors(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace indigo/purple backgrounds
    content = re.sub(r'bg-indigo-(?:50|100)', r'bg-[#ADEBB3]/20', content)
    content = re.sub(r'bg-purple-(?:50|100)', r'bg-[#ADEBB3]/20', content)
    
    # Replace solid indigo backgrounds with #ADEBB3
    content = re.sub(r'bg-indigo-(?:500|600|700)', r'bg-[#ADEBB3]', content)
    
    # Replace indigo/purple text (use a darker green for readability, or just #ADEBB3 if it's a glowing accent)
    # Since #ADEBB3 is light, for text-indigo-800/900 we use a darker green like #2DA83B
    content = re.sub(r'text-indigo-(?:700|800|900)', r'text-[#2DA83B]', content)
    content = re.sub(r'text-purple-(?:700|800|900)', r'text-[#2DA83B]', content)
    content = re.sub(r'text-indigo-(?:400|500|600)', r'text-[#ADEBB3]', content)
    
    # Replace border colors
    content = re.sub(r'border-indigo-(?:200|300)', r'border-[#ADEBB3]/50', content)
    content = re.sub(r'border-purple-(?:200|300)', r'border-[#ADEBB3]/50', content)
    
    # Specifically in TransporterDashboard.js, there is "text-indigo-600" for hover
    content = re.sub(r'hover:text-indigo-600', r'hover:text-[#ADEBB3]', content)
    content = re.sub(r'hover:bg-indigo-50', r'hover:bg-[#ADEBB3]/10', content)
    content = re.sub(r'hover:border-indigo-200', r'hover:border-[#ADEBB3]/30', content)
    
    # Zone Settings specific
    content = content.replace('bg-indigo-950', 'bg-[#1A5C24]')
    content = content.replace('text-indigo-300', 'text-[#ADEBB3]')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

files = [
    r'c:\projet-mem\p1\frontend\src\pages\dashboards\TransporterDashboard.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\VehicleSettings.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\ZoneSettings.js',
]

for f in files:
    fix_colors(f)
