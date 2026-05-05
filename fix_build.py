import re
import sys

def patch_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w') as f:
            f.write(content)
        print(f"Patched {path}")

# useInventory.ts
path = "src/modules/logistics/inventory/hooks/useInventory.ts"
with open(path, 'r') as f:
    content = f.read()

# Remove duplicate StockItem import
content = re.sub(r'import\s*{\s*StockItem\s*}\s*from\s*"../types";\s*\n', '', content)
# Fix WasteLog
content = content.replace('import { WasteLog } from "@/modules/compliance/haccp/types"; // Assuming WasteLog exists', 'import { WasteLog } from "@shared/nexus/contracts/common.types";')
# Fix IngredientUnit, IngredientCategory
content = content.replace('import { Ingredient, StockItem, Preparation, StorageLocation } from "@shared/nexus/contracts/logistics";', 'import { Ingredient, StockItem, Preparation, StorageLocation, IngredientUnit, IngredientCategory } from "@shared/nexus/contracts/logistics";')

with open(path, 'w') as f:
    f.write(content)

# NexusOpsProvider.tsx
path2 = "src/engines/ops/NexusOpsProvider.tsx"
with open(path2, 'r') as f:
    content2 = f.read()

content2 = content2.replace('import { SovereignNode, SovereignData } from "@/shared/nexus-contract";', 'import { SovereignNode, SovereignData, SovereignField } from "@/shared/nexus-contract";')

with open(path2, 'w') as f:
    f.write(content2)

print("Fixed build errors.")
