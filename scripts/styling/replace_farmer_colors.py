import re

filepath = r'c:\projet-mem\p1\frontend\src\pages\farmer\FarmerStats.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '#10B981': '#2E6F40',
    '#059669': '#255933',
    'bg-emerald-50': 'bg-[#f0faf4]',
    'border-emerald-100/50': 'border-[#cee8d9]/50',
    'border-emerald-100': 'border-[#cee8d9]',
    'border-emerald-200': 'border-[#a2d4b5]',
    'text-emerald-600': 'text-[#2E6F40]',
    'text-emerald-700': 'text-[#255933]',
    'text-emerald-800': 'text-[#1A4024]',
    'hover:text-emerald-600': 'hover:text-[#2E6F40]',
    'hover:text-emerald-800': 'hover:text-[#1A4024]',
    'bg-emerald-200': 'bg-[#a2d4b5]',
    'selection:bg-emerald-200': 'selection:bg-[#a2d4b5]',
    'border-t-emerald-600': 'border-t-[#2E6F40]',
    'group-hover:bg-emerald-100': 'group-hover:bg-[#cee8d9]',
    'hover:border-emerald-200': 'hover:border-[#a2d4b5]',
    'from-emerald-400': 'from-[#4a8c5f]',
    'to-teal-500': 'to-[#2E6F40]',
    'from-emerald-500': 'from-[#2E6F40]',
    'to-emerald-600': 'to-[#255933]',
    'from-emerald-700': 'from-[#1A4024]',
    'to-emerald-800': 'to-[#112a18]',
    'bg-emerald-500': 'bg-[#2E6F40]',
    'text-emerald-300': 'text-[#a2d4b5]',
    'hover:shadow-[0_12px_40px_rgb(16,185,129,0.08)]': 'hover:shadow-[0_12px_40px_rgb(46,111,64,0.15)]'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Color replacements applied.")
