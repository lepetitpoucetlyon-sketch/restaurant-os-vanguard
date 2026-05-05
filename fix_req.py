def replace(path, original, new_top_import, new_usage):
    with open(path, 'r') as f:
        content = f.read()
    if original in content:
        content = new_top_import + '\n' + content
        content = content.replace(original, new_usage)
        with open(path, 'w') as f:
            f.write(content)

replace('src/engines/core/NexusCoreProvider.tsx', "const { NexusSutures } = require('@/store/nexusSutures');", "import { NexusSutures } from '@/store/nexusSutures';", "")
replace('src/lib/MasterBridge.ts', "const { tenantIdAtom } = require('@nexus/state/SovereignGenome'); // Breaking circular dependency via direct shard import", "import { tenantIdAtom } from '@/shared/nexus/state/SovereignGenome';", "")
replace('src/domain/services/ChaosMonkey.ts', "const { SovereignMath } = require('@shared/services/SovereignMath');", "import { SovereignMath } from '@/shared/services/SovereignMath';", "")
replace('src/domain/services/ChaosMonkey.ts', "const { CycleGuard } = require('@shared/nexus/guards/CycleGuard');", "import { CycleGuard } from '@/shared/nexus/guards/CycleGuard';", "")
replace('src/domain/services/ChaosMonkey.ts', "const { ResilienceSlayer } = require('@domain/services/ResilienceSlayer');", "import { ResilienceSlayer } from '@/domain/services/ResilienceSlayer';", "")

