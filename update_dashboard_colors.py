
import sys
import os

files = [
    r'c:\Users\METRO\Desktop\New folder (8)\allstartrade-clone\frontend\css\dashboard.css'
]

for path in files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace Green (34,197,94) with Teal (30,203,161)
        # Handle spaces in rgba
        content = content.replace('34, 197, 94', '30, 203, 161')
        content = content.replace('34,197,94', '30,203,161')

        # Replace Lime (163,230,53) with Orange (255,160,0)
        content = content.replace('163, 230, 53', '255, 160, 0')
        content = content.replace('163,230,53', '255,160,0')
        
        # Replace pure Green rgba(0,255,0) with Teal
        content = content.replace('0,255,0', '30,203,161')
        content = content.replace('0, 255, 0', '30, 203, 161')

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully updated {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")
