const fs = require('fs');

const replacements = [
  {
    file: 'src/__tests__/lockdown.test.ts',
    replaces: [
      { from: '../lib/sovereign/lockdown', to: '../infrastructure/services/sovereign/lockdown' }
    ]
  },
  {
    file: 'src/domain/services/MaintenanceAgent.ts',
    replaces: [
      { from: '../../lib/ai/DNAInjector', to: '@/modules/intelligence/ai/DNAInjector' }
    ]
  },
  {
    file: 'src/infrastructure/adapters/GeminiAdapter.ts',
    replaces: [
      { from: '../../lib/ai/ShieldedContext', to: '@/modules/intelligence/ai/ShieldedContext' }
    ]
  },
  {
    file: 'src/infrastructure/adapters/MasterBridge.ts',
    replaces: [
      { from: "'./TimeSync'", to: "'../services/TimeSync'" },
      { from: "'./logger'", to: "'@/lib/logger'" }
    ]
  },
  {
    file: 'src/infrastructure/adapters/NexusTransaction.ts',
    replaces: [
      { from: "'./nexus/NexusAdapter'", to: "'@/lib/nexus/NexusAdapter'" }
    ]
  },
  {
    file: 'src/infrastructure/services/audit.ts',
    replaces: [
      { from: "'./axiom'", to: "'@/lib/axiom'" }
    ]
  },
  {
    file: 'src/infrastructure/services/NexusSyncService.ts',
    replaces: [
      { from: "'./nexus/NexusBridge'", to: "'@/lib/nexus/NexusBridge'" },
      { from: "'./nexus/TelemetryService'", to: "'@/lib/nexus/TelemetryService'" },
      { from: "'./utils/Mutex'", to: "'@/lib/utils/Mutex'" },
      { from: "'./icm/TaskContext'", to: "'@/lib/icm/TaskContext'" },
      { from: "'./icm/zcpoBridge'", to: "'@/lib/icm/zcpoBridge'" }
    ]
  },
  {
    file: 'src/infrastructure/services/RuntimeValidator.ts',
    replaces: [
      { from: "'./logger'", to: "'@/lib/logger'" },
      { from: "'./brands'", to: "'@/infrastructure/branding/brands'" }
    ]
  },
  {
    file: 'src/infrastructure/services/sovereign/firestoreHydrator.ts',
    replaces: [
      { from: "'../../domain/schemas/users'", to: "'@/domain/schemas/users'" },
      { from: "'../../domain/schemas/orders'", to: "'@/domain/schemas/orders'" },
      { from: "'../../domain/schemas/inventory'", to: "'@/domain/schemas/inventory'" },
      { from: "'../../domain/schemas/ops'", to: "'@/domain/schemas/ops'" },
      { from: "'../../domain/schemas/modules'", to: "'@/domain/schemas/modules'" },
      { from: "'../../domain/schemas/finance'", to: "'@/domain/schemas/finance'" },
      { from: "'../axiom'", to: "'@/lib/axiom'" },
      { from: /catch\s*\(\s*i\s*\)/g, to: 'catch (i: any)' }
    ]
  },
  {
    file: 'src/infrastructure/services/TimeSync.ts',
    replaces: [
      { from: "'./nexus/NexusAdapter'", to: "'@/lib/nexus/NexusAdapter'" },
      { from: "'./logger'", to: "'@/lib/logger'" },
      { from: /export function validateTimePayload\(data\)/g, to: 'export function validateTimePayload(data: any)' },
      { from: /export function sync\(data\)/g, to: 'export function sync(data: any)' }
    ]
  }
];

for (const { file, replaces } of replacements) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const r of replaces) {
      if (typeof r.from === 'string') {
        content = content.replace(new RegExp(r.from, 'g'), r.to);
        // Also cover double quotes just in case
        if (r.from.startsWith("'") && r.from.endsWith("'")) {
          const fromDouble = '"' + r.from.slice(1, -1) + '"';
          const toDouble = '"' + r.to.slice(1, -1) + '"';
          content = content.replace(new RegExp(fromDouble, 'g'), toDouble);
        }
      } else {
        content = content.replace(r.from, r.to);
      }
    }
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
