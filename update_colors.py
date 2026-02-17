
import sys

path = r'c:\Users\METRO\Desktop\New folder (8)\allstartrade-clone\frontend\css\style.css'
try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace Green (34,197,94) with Teal (30,203,161)
    content = content.replace('34,197,94', '30,203,161')

    # Replace Lime (163,230,53) with Orange (255,160,0)
    content = content.replace('163,230,53', '255,160,0')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated CSS colors.")
except Exception as e:
    print(f"Error: {e}")
