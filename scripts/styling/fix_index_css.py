import re

filepath = r'c:\projet-mem\p1\frontend\src\index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the buyer and info classes
content = re.sub(r'(\.role-buyer\s*{[^}]*color:\s*)#2E7D32', r'\1#1e40af', content)
content = re.sub(r'(\.alert-info\s*{[^}]*color:\s*)#2E7D32', r'\1#1e40af', content)
content = re.sub(r'(\.badge-primary\s*{[^}]*color:\s*)#2E7D32', r'\1#1e40af', content)
content = re.sub(r'(\.avatar-role-buyer\s*{[^}]*background:\s*linear-gradient\([^,]+,\s*#[a-f0-9]+,\s*)#2E7D32', r'\1#1e40af', content, flags=re.IGNORECASE)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed index.css")
