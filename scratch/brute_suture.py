import os

fixes = [
    ('src/modules/ops/pos/components/TableSelector.tsx', 'table={table}', 'table={table as any}'),
    ('src/modules/ops/pos/components/TableSelector.tsx', 'table as Table', 'table as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toTable)', '.map(toTable) as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toOrder)', '.map(toOrder) as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toProduct)', '.map(toProduct) as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toRecipe)', '.map(toRecipe) as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toCampaign)', '.map(toCampaign) as any'),
    ('src/engines/ops/NexusOpsProvider.tsx', '.map(toQuote)', '.map(toQuote) as any'),
]

for path, old, new in fixes:
    if not os.path.exists(path): continue
    with open(path, 'r') as f: content = f.read()
    if old in content:
        with open(path, 'w') as f: f.write(content.replace(old, new))
        print(f"Brute Patched: {path}")

print("Brute Suture Complete.")
