
import os

# Configuration
target_dir = r'c:\Users\METRO\Desktop\New folder (8)\allstartrade-clone\frontend'
extensions = ('.html', '.css', '.js')

# Color Mappings
replacements = {
    # Green -> Teal
    '22c55e': '1ECBA1',
    '34,197,94': '30,203,161',
    '34, 197, 94': '30, 203, 161',
    
    # Lime -> Orange
    'a3e635': 'FFA000',
    '163,230,53': '255,160,0',
    '163, 230, 53': '255, 160, 0',
}

def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
            # Also handle lowercase hex if applicable, though input is lowercase
            # Also handle uppercase hex
            new_content = new_content.replace(old.upper(), new)

        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

def main():
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(extensions):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
