import os

fixes = [
    ('src/components/layout/AmbientAudio.tsx', 'as (Window & typeof globalThis)', 'as any'),
    ('src/components/layout/Sidebar.tsx', 'settings.pmsEnabled', '(settings as any).pmsEnabled'),
    ('src/components/layout/sidebar/SidebarProfile.tsx', 'variants={profileVariants}', 'variants={profileVariants as any}'),
    ('src/__tests__/lockdown.test.ts', 'data() {', 'data(): any {'),
    ('src/hooks/useGeminiAgent.ts', 'messages[]', 'messages'),
    ('src/infrastructure/adapters/FirestoreAdapter.ts', 'callback(data as import(\'firebase/firestore\').DocumentData);', 'callback(data as any);'),
]

for path, old, new in fixes:
    if not os.path.exists(path): continue
    with open(path, 'r') as f: content = f.read()
    if old in content:
        with open(path, 'w') as f: f.write(content.replace(old, new))
        print(f"Final Patched: {path}")

print("Final Suture Complete.")
