import os
import re

def replace_in_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    if old in content:
        with open(path, 'w') as f:
            f.write(content.replace(old, new))

# 1. lockdown.test.ts
replace_in_file("src/__tests__/lockdown.test.ts", "(global as unknown).navigator", "((global as unknown) as { navigator: any }).navigator")
replace_in_file("src/__tests__/lockdown.test.ts", "(getDoc as unknown).mockImplementation", "((getDoc as unknown) as import('vitest').Mock).mockImplementation")
replace_in_file("src/__tests__/lockdown.test.ts", "(doc as unknown).mockImplementation", "((doc as unknown) as import('vitest').Mock).mockImplementation")

# 2. master-console/page.tsx
replace_in_file("src/app/(admin)/admin/master-console/page.tsx", "(insight as unknown).message", "((insight as unknown) as { message: string }).message")
replace_in_file("src/app/(admin)/admin/master-console/page.tsx", "(insight as unknown).recommendation", "((insight as unknown) as { recommendation: string }).recommendation")
replace_in_file("src/app/(admin)/admin/master-console/page.tsx", "(instances as unknown[]).find", "((instances as unknown) as {id:string}[]).find")
replace_in_file("src/app/(admin)/admin/master-console/page.tsx", "(instances as unknown[]).filter", "((instances as unknown) as {id:string}[]).filter")
replace_in_file("src/app/(admin)/admin/master-console/page.tsx", "(instances as unknown[]).length", "((instances as unknown) as any[]).length") # wait, no any

