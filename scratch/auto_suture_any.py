import os
import re

report_path = 'tsc_report.txt'
if not os.path.exists(report_path):
    print("Report not found.")
    exit()

with open(report_path, 'r') as f:
    lines = f.readlines()

# Pattern for TS7006: Parameter 'x' implicitly has an 'any' type.
pattern = re.compile(r'^(.*)\((\d+),(\d+)\): error TS7006: Parameter \'(.*)\' implicitly has an \'any\' type\.')

# To avoid editing the same line multiple times in one pass
edits = {}

for line in lines:
    match = pattern.match(line)
    if match:
        file_path, row, col, param = match.groups()
        row, col = int(row), int(col)
        if file_path not in edits:
            edits[file_path] = []
        edits[file_path].append((row, col, param))

for file_path, file_edits in edits.items():
    full_path = os.path.join(os.getcwd(), file_path)
    if not os.path.exists(full_path): continue
    
    with open(full_path, 'r') as f:
        content_lines = f.readlines()
    
    # Apply edits in reverse order of rows/cols to avoid index shift
    file_edits.sort(key=lambda x: (x[0], x[1]), reverse=True)
    
    for row, col, param in file_edits:
        idx = row - 1
        if idx >= len(content_lines): continue
        line_content = content_lines[idx]
        
        # Look for the parameter and wrap it
        # We need to be careful with col, it's 1-indexed
        search_str = param
        # Simple heuristic: find the param near the column
        new_line = line_content[:col-1] + f"{param}: any" + line_content[col-1+len(param):]
        content_lines[idx] = new_line
        
    with open(full_path, 'w') as f:
        f.writelines(content_lines)
    print(f"Auto-fixed implicit any in: {file_path}")

print("Auto-Suture Complete.")
