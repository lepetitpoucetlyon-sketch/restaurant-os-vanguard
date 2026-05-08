#!/bin/bash

# ============================================
# ✅ KI Certification Workflow
# ============================================

KI_NAME=$1

if [ -z "$KI_NAME" ]; then
    echo "Usage: ./certify_ki.sh <ki_slug>"
    exit 1
fi

KI_PATH="/Users/mohammed-aliboudjaadar/.gemini/antigravity/knowledge/$KI_NAME"

if [ ! -d "$KI_PATH" ]; then
    echo "Error: KI '$KI_NAME' not found in $KI_PATH"
    exit 1
fi

# Update metadata to set status to verified (mockup - assuming we add a status field)
# For now, we just append a verification tag
# In a real system, we would use a JSON editor
python3 -c "
import json, os
path = '$KI_PATH/metadata.json'
with open(path, 'r') as f:
    data = json.load(f)
data['tags'].append('verified')
data['verified_at'] = '$(date -Iseconds)'
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
"

echo "KI '$KI_NAME' has been certified and promoted to verified status."
