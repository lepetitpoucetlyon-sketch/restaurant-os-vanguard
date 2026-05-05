import re

path = "src/modules/logistics/inventory/hooks/useInventory.ts"
with open(path, 'r') as f:
    content = f.read()

content = content.replace('import { SovereignNode, SovereignData, OperationalIdentity } from "@shared/nexus-contract";', 'import { SovereignNode, SovereignData, OperationalIdentity, SovereignField } from "@shared/nexus-contract";')

with open(path, 'w') as f:
    f.write(content)

path2 = "src/engines/ops/NexusOpsProvider.tsx"
with open(path2, 'r') as f:
    content2 = f.read()

# Let's check imports in NexusOpsProvider
if 'SovereignField' not in content2:
    content2 = content2.replace('import { SovereignNode, SovereignData } from', 'import { SovereignNode, SovereignData, SovereignField } from')

with open(path2, 'w') as f:
    f.write(content2)

print("Fixed.")
