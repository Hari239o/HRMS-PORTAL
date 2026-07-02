import os
import glob

# Path to the src directory
src_path = 'client/src/**/*.jsx'
files = glob.glob(src_path, recursive=True)

for file in files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find lines with 'fixed inset-0' and 'z-50'
        lines = content.split('\n')
        modified = False
        for i, line in enumerate(lines):
            if 'fixed ' in line and 'z-50' in line:
                # Upgrade z-index to z-[100] for modals
                lines[i] = line.replace('z-50', 'z-[100]')
                modified = True
        
        if modified:
            with open(file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            print(f"Updated: {file}")
            
    except Exception as e:
        print(f"Error processing {file}: {e}")

print("Global modal z-index update complete.")
