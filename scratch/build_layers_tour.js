import fs from 'node:fs';
import path from 'node:path';

const projectRoot = '/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE';
const graphPath = `${projectRoot}/.understand-anything/intermediate/assembled-graph.json`;

function main() {
  console.log('Building layers and tours...');

  if (!fs.existsSync(graphPath)) {
    console.error('assembled-graph.json not found!');
    process.exit(1);
  }

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  const nodes = graph.nodes || [];

  // Group files into layers
  const layers = [
    {
      id: 'layer:presentation-ui',
      name: 'Presentation & UI Layer',
      description: 'Contains React components, next pages, layouts, and styles making up the visual face of Restaurant OS.',
      nodeIds: []
    },
    {
      id: 'layer:domain-logic',
      name: 'Domain Logic & Engines',
      description: 'Contains business logic engines, domain services, state machines, and core orchestrators.',
      nodeIds: []
    },
    {
      id: 'layer:data-schemas',
      name: 'Data & Schema Definitions',
      description: 'Standardizes models, Zod schemas, data contracts, and type invariants across tenant instances.',
      nodeIds: []
    },
    {
      id: 'layer:infrastructure-config',
      name: 'Infrastructure & Configuration',
      description: 'Manages multi-tenant isolation, deployment sidecars, build files, and environment specifications.',
      nodeIds: []
    },
    {
      id: 'layer:verification-tests',
      name: 'Verification & Quality Gates',
      description: 'Includes vitest suites, Playwright E2E files, and ChaosMonkey simulation runners.',
      nodeIds: []
    }
  ];

  const layerPresentation = layers[0];
  const layerDomain = layers[1];
  const layerData = layers[2];
  const layerInfra = layers[3];
  const layerTest = layers[4];

  // We only place file-level nodes (file, config, document, service, pipeline, schema, resource, table, endpoint) in layers
  const fileTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'schema', 'resource', 'table', 'endpoint']);

  for (const node of nodes) {
    if (!fileTypes.has(node.type)) continue;

    const id = node.id;
    const filePath = node.filePath || '';

    if (filePath.includes('__tests__') || filePath.endsWith('.test.ts') || filePath.endsWith('.spec.ts') || filePath.endsWith('.test.tsx')) {
      layerTest.nodeIds.push(id);
    } else if (filePath.startsWith('src/app/') || filePath.startsWith('src/components/') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
      layerPresentation.nodeIds.push(id);
    } else if (filePath.startsWith('src/domain/schemas/') || filePath.endsWith('.json') || filePath.endsWith('.rules') || filePath.endsWith('.graphql') || filePath.endsWith('.proto')) {
      layerData.nodeIds.push(id);
    } else if (filePath.startsWith('src/domain/services/') || filePath.startsWith('src/infrastructure/') || filePath.startsWith('src/engines/') || filePath.startsWith('src/modules/') || filePath.startsWith('src/shared/')) {
      layerDomain.nodeIds.push(id);
    } else {
      layerInfra.nodeIds.push(id);
    }
  }

  // Write layers.json
  fs.writeFileSync(`${projectRoot}/.understand-anything/intermediate/layers.json`, JSON.stringify(layers, null, 2), 'utf-8');
  console.log(`Assigned nodes to layers:`);
  for (const l of layers) {
    console.log(`  - ${l.name}: ${l.nodeIds.length} nodes`);
  }

  // Create a stunning tour.json
  const tour = [
    {
      order: 1,
      title: 'Vanguard Architecture Core',
      description: 'Start with CLAUDE.md and package.json to understand the suzerain/vassal multi-tenant structure and microunit conventions.',
      nodeIds: ['document:CLAUDE.md', 'config:package.json']
    },
    {
      order: 2,
      title: 'Visual Presentational Ground',
      description: 'Explore the root Next.js layout and tailwind configs styling the high-fidelity dark glassmorphism dashboard.',
      nodeIds: ['file:src/app/layout.tsx', 'file:src/app/(client)/(ops)/pos/page.tsx']
    },
    {
      order: 3,
      title: 'NF525 Fiscal Compliant Guard',
      description: 'Trace the scellement chain logic and standard journal entries ensuring absolute fiscal compliance for transaction audits.',
      nodeIds: ['file:src/domain/schemas/finance.ts']
    },
    {
      order: 4,
      title: 'Core Resiliency & Stress Monkey Tests',
      description: 'Deep dive into SinFonia grade-X chaos suites verifying transaction integrity under network blackouts and heavy loads.',
      nodeIds: ['file:src/__tests__/stress/ChaosMonkey.stress.test.ts']
    }
  ];

  // Filter tour nodeIds to make sure every entry exists in the nodes list
  const activeIds = new Set(nodes.map(n => n.id));
  for (const step of tour) {
    step.nodeIds = step.nodeIds.filter(id => activeIds.has(id));
  }

  fs.writeFileSync(`${projectRoot}/.understand-anything/intermediate/tour.json`, JSON.stringify(tour, null, 2), 'utf-8');
  console.log(`Wrote tour.json with ${tour.length} steps.`);
}

main();
