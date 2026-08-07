import fs from 'fs';
import path from 'path';

const busPath = './src/shared/eventBus/NexusEventBus.ts';
// First restore NexusEventBus.ts to its original content if needed from git
const originalBus = fs.readFileSync(busPath, 'utf8');

// We will build a clean single catalog file or modular files.
// Let's create `src/shared/eventBus/events/catalog.ts` containing the full NexusEvents interface,
// and import `NexusEvents` into `NexusEventBus.ts`!

const interfaceMatch = originalBus.match(/export interface NexusEvents \{([\s\S]+?)\n\}/);
if (!interfaceMatch) {
    console.log('Already imported NexusEvents, skipping split.');
    process.exit(0);
}

const eventsDir = './src/shared/eventBus/events';
fs.mkdirSync(eventsDir, { recursive: true });

const catalogContent = `import type { CartItem } from '@/modules/ops/workflow/engine/types';\n\nexport interface NexusEvents {\n${interfaceMatch[1]}\n}\n`;
fs.writeFileSync(path.join(eventsDir, 'catalog.ts'), catalogContent, 'utf8');

const busHeader = `import type { NexusEvents } from './events/catalog';\n\nexport type NexusEventName = keyof NexusEvents;\nexport type NexusEventPayload<E extends NexusEventName> = NexusEvents[E];`;

const newBusContent = originalBus.replace(/export interface NexusEvents \{[\s\S]+?\n\}/, busHeader);
fs.writeFileSync(busPath, newBusContent, 'utf8');
console.log('NexusEventBus.ts modularized cleanly with events/catalog.ts.');
