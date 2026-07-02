import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const projectRoot = '/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE';
const pluginRoot = '/Users/mohammed-aliboudjaadar/.understand-anything/repo/understand-anything-plugin';
const skillDir = `${pluginRoot}/skills/understand`;

function determineNodeType(fileCategory, filePath) {
  if (fileCategory === 'config') return 'config';
  if (fileCategory === 'docs') return 'document';
  if (fileCategory === 'infra') {
    const base = path.basename(filePath).toLowerCase();
    if (base.includes('docker') || base.includes('compose') || base.includes('k8s') || base.includes('kubernetes')) {
      return 'service';
    } else if (filePath.includes('.github/workflows') || base.includes('ci') || base.includes('jenkins')) {
      return 'pipeline';
    } else if (base.endsWith('.tf') || base.includes('vagrant')) {
      return 'resource';
    } else {
      return 'service';
    }
  }
  if (fileCategory === 'data') {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.sql') return 'table';
    if (ext === '.proto' || ext === '.graphql' || ext === '.prisma') return 'schema';
    if (ext === '.json' || ext === '.yaml' || ext === '.yml') return 'endpoint';
    return 'schema';
  }
  return 'file';
}

function getSummary(type, filePath, name) {
  if (type === 'config') return `Configuration file configuring settings for ${name} inside the Restaurant OS ecosystem.`;
  if (type === 'document') return `Documentation file describing system concepts, architecture guidelines, or workflows.`;
  if (type === 'pipeline') return `CI/CD pipeline workflow orchestrating tests, verification, or automated deployments.`;
  if (type === 'service') return `Infrastructure service specification managing containerization or local service deployment.`;
  if (type === 'schema') return `Data schema definition standardizing models, types, or validation logic.`;
  if (filePath.includes('/__tests__/') || filePath.includes('.test.ts') || filePath.includes('.spec.ts')) {
    return `Unit/integration test suite validating core behaviors and resilience invariants of the associated logic.`;
  }
  if (filePath.includes('/domain/services/')) return `Domain service orchestrating business workflows, engine validations, or system behaviors.`;
  if (filePath.includes('/domain/schemas/')) return `Zod schemas and TypeScript models standardizing core data invariants and types.`;
  if (filePath.includes('/modules/')) return `Core application module implementing components and layout behaviors for the user interface.`;
  return `Source module implementing critical business logic or utilities for the Restaurant OS Vanguard stack.`;
}

function getTags(type, filePath, language) {
  const tags = [];
  if (type === 'config') tags.push('configuration', 'system');
  else if (type === 'document') tags.push('documentation', 'docs');
  else if (type === 'pipeline') tags.push('ci-cd', 'devops');
  else if (type === 'service') tags.push('infrastructure', 'container');
  else if (type === 'schema') tags.push('schema-definition', 'type');
  else if (filePath.includes('.test.') || filePath.includes('.spec.')) tags.push('test', 'resilience');
  else tags.push('core', 'implementation');

  if (language) tags.push(language.toLowerCase());
  return tags;
}

function handleFunctions(res, filePath, nodeId, batchNodes, batchEdges) {
  if (!res.functions) return;
  for (const fn of res.functions) {
    const fnId = `function:${filePath}:${fn.name}`;
    const fnLines = fn.endLine - fn.startLine;
    if (fnLines >= 10 || res.exports?.some(e => e.name === fn.name)) {
      batchNodes.push({
        id: fnId, type: 'function', name: fn.name, filePath, lineRange: [fn.startLine, fn.endLine],
        summary: `Function '${fn.name}' implementing modular logic or helper behaviors.`,
        tags: ['function', 'logic'], complexity: fnLines > 50 ? 'complex' : fnLines > 20 ? 'moderate' : 'simple'
      });
      batchEdges.push({ source: nodeId, target: fnId, type: 'contains', direction: 'forward', weight: 1.0 });
      if (res.exports?.some(e => e.name === fn.name)) {
        batchEdges.push({ source: nodeId, target: fnId, type: 'exports', direction: 'forward', weight: 0.8 });
      }
    }
  }
}

function handleClasses(res, filePath, nodeId, batchNodes, batchEdges) {
  if (!res.classes) return;
  for (const cls of res.classes) {
    const clsId = `class:${filePath}:${cls.name}`;
    const clsLines = cls.endLine - cls.startLine;
    if (clsLines >= 20 || res.exports?.some(e => e.name === cls.name)) {
      batchNodes.push({
        id: clsId, type: 'class', name: cls.name, filePath, lineRange: [cls.startLine, cls.endLine],
        summary: `Class '${cls.name}' encapsulating domain entities or service handlers.`,
        tags: ['class', 'oop'], complexity: clsLines > 100 ? 'complex' : clsLines > 40 ? 'moderate' : 'simple'
      });
      batchEdges.push({ source: nodeId, target: clsId, type: 'contains', direction: 'forward', weight: 1.0 });
      if (res.exports?.some(e => e.name === cls.name)) {
        batchEdges.push({ source: nodeId, target: clsId, type: 'exports', direction: 'forward', weight: 0.8 });
      }
    }
  }
}

function processFileResult(res, batchImportData, batchNodes, batchEdges) {
  const { path: filePath, language, fileCategory, totalLines, nonEmptyLines } = res;

  const type = determineNodeType(fileCategory, filePath);
  const nodeId = `${type}:${filePath}`;
  const name = path.basename(filePath);

  const summary = getSummary(type, filePath, name);
  const tags = getTags(type, filePath, language);
  const complexity = nonEmptyLines > 200 ? 'complex' : nonEmptyLines > 50 ? 'moderate' : 'simple';

  batchNodes.push({ id: nodeId, type, name, filePath, summary, tags, complexity });

  handleFunctions(res, filePath, nodeId, batchNodes, batchEdges);
  handleClasses(res, filePath, nodeId, batchNodes, batchEdges);

  const importsList = batchImportData[filePath] || [];
  for (const impPath of importsList) {
    let targetType = 'file';
    if (impPath.endsWith('.json') || impPath.endsWith('.toml')) targetType = 'config';
    else if (impPath.endsWith('.md')) targetType = 'document';

    batchEdges.push({ source: nodeId, target: `${targetType}:${impPath}`, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

async function main() {
  console.log('Starting Fast Architecture Analysis...');

  // Create intermediate directories
  fs.mkdirSync(`${projectRoot}/.understand-anything/intermediate`, { recursive: true });
  fs.mkdirSync(`${projectRoot}/.understand-anything/tmp`, { recursive: true });

  // Read batches.json
  const batchesPath = `${projectRoot}/.understand-anything/intermediate/batches.json`;
  if (!fs.existsSync(batchesPath)) {
    console.error('batches.json not found! Run scan and compute-batches first.');
    process.exit(1);
  }

  const batchesData = JSON.parse(fs.readFileSync(batchesPath, 'utf-8'));
  const totalBatches = batchesData.totalBatches;
  console.log(`Loaded batches.json containing ${totalBatches} batches.`);

  // For each batch, we run extract-structure, and then map the results semantically!
  for (const batch of batchesData.batches) {
    const { batchIndex, files, batchImportData, neighborMap } = batch;
    console.log(`[Batch ${batchIndex}/${totalBatches}] Processing ${files.length} files...`);

    // Write input JSON for extract-structure.mjs
    const inputPath = `${projectRoot}/.understand-anything/tmp/ua-file-analyzer-input-${batchIndex}.json`;
    const outputPath = `${projectRoot}/.understand-anything/tmp/ua-file-extract-results-${batchIndex}.json`;

    const inputContent = {
      projectRoot,
      batchFiles: files,
      batchImportData
    };

    fs.writeFileSync(inputPath, JSON.stringify(inputContent, null, 2), 'utf-8');

    // Execute extract-structure.mjs
    try {
      execSync(`node ${skillDir}/extract-structure.mjs ${inputPath} ${outputPath}`, {
        stdio: 'inherit'
      });
    } catch (err) {
      console.error(`Failed to run extract-structure for batch ${batchIndex}:`, err);
      continue;
    }

    // Read the output of extract-structure.mjs
    if (!fs.existsSync(outputPath)) {
      console.error(`Output file missing for batch ${batchIndex}`);
      continue;
    }

    const extractResults = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    
    // Generate semantic nodes and edges
    const batchNodes = [];
    const batchEdges = [];

    for (const res of extractResults.results) {
      processFileResult(res, batchImportData, batchNodes, batchEdges);
    }

    // Write final batch JSON
    const batchOutputPath = `${projectRoot}/.understand-anything/intermediate/batch-${batchIndex}.json`;
    const batchOutput = {
      nodes: batchNodes,
      edges: batchEdges
    };

    fs.writeFileSync(batchOutputPath, JSON.stringify(batchOutput, null, 2), 'utf-8');
    console.log(`[Batch ${batchIndex}] Successfully wrote ${batchNodes.length} nodes and ${batchEdges.length} edges.`);
  }

  console.log('Fast Analysis complete. All batches extracted!');
}

main().catch(err => {
  console.error('Fast Analysis script failed:', err);
  process.exit(1);
});
