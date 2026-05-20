import os

TARGET = '#10B981'

files = [
    r'c:\projet-mem\p1\frontend\src\pages\dashboards\TransporterDashboard.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\VehicleSettings.js',
    r'c:\projet-mem\p1\frontend\src\pages\transporter\ZoneSettings.js',
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replacements for remaining indigo classes
    replacements = [
        ('from-indigo-600', f'from-[{TARGET}]'),
        ('to-indigo-700', f'to-[{TARGET}]'),
        ('hover:from-indigo-500', f'hover:from-[{TARGET}]'),
        ('hover:to-indigo-600', f'hover:to-[{TARGET}]'),
        ('shadow-indigo-600/30', f'shadow-[{TARGET}]/30'),
        ('hover:shadow-indigo-600/40', f'hover:shadow-[{TARGET}]/40'),
        ('from-indigo-400', f'from-[{TARGET}]/80'),
        ('to-indigo-600', f'to-[{TARGET}]'),
        ('bg-indigo-600', f'bg-[{TARGET}]'),
        ('hover:bg-indigo-700', f'hover:bg-[#059669]'),
        ('shadow-indigo-600/20', f'shadow-[{TARGET}]/20'),
        ('bg-indigo-100', f'bg-[{TARGET}]/10'),
        ('text-indigo-800', f'text-[{TARGET}]'),
        ('border-indigo-200', f'border-[{TARGET}]/30'),
        ('bg-purple-100', f'bg-[{TARGET}]/10'),
        ('text-purple-800', f'text-[{TARGET}]'),
        ('border-purple-200', f'border-[{TARGET}]/30'),
        ('border-t-indigo-600', f'border-t-[{TARGET}]'),
        ('hover:border-indigo-200', f'hover:border-[{TARGET}]/30'),
        ('hover:bg-indigo-50', f'hover:bg-[{TARGET}]/10'),
        ('text-indigo-500', f'text-[{TARGET}]'),
        ('text-indigo-600', f'text-[{TARGET}]'),
        ('text-indigo-700', f'text-[#059669]'),
        ('text-indigo-800', f'text-[#059669]'),
        ('bg-indigo-50', f'bg-[{TARGET}]/10'),
        ('bg-indigo-500', f'bg-[{TARGET}]'),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")
