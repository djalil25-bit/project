import os
import re

def replace_in_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert Blue hex codes to Darker Green
    new_content = re.sub(r'#1e40af', r'#2E7D32', content, flags=re.IGNORECASE)
    new_content = re.sub(r'#1e3a8a', r'#1B5E20', new_content, flags=re.IGNORECASE)

    # Revert Tailwind classes back to emerald (or green)
    # The old code used emerald mostly. Let's revert blue back to emerald.
    new_content = re.sub(r'bg-blue-(50|100|200|300|400|500|600|700|800|900)', r'bg-emerald-\1', new_content)
    new_content = re.sub(r'text-blue-(50|100|200|300|400|500|600|700|800|900)', r'text-emerald-\1', new_content)
    new_content = re.sub(r'border-blue-(50|100|200|300|400|500|600|700|800|900)', r'border-emerald-\1', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.css')):
                filepath = os.path.join(root, file)
                replace_in_file(filepath)

if __name__ == '__main__':
    base_dir = r'c:\projet-mem\p1\frontend\src'
    print("Reverting Transporter Color to Darker Green...")
    process_directory(base_dir)
    print("\nDone.")
