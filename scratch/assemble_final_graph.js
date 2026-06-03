import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const projectRoot = '/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE';
const pluginRoot = '/Users/mohammed-aliboudjaadar/.understand-anything/repo/understand-anything-plugin';
const skillDir = `${pluginRoot}/skills/understand`;

function main() {
  console.log('Assembling final graph...');

  // Get current git commit hash
  let commitHash = 'unknown';
  try {
    commitHash = execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim();
  } catch (err) {
    console.warn('Could not read git commit hash:', err.message);
  }

  // Load assembled nodes & edges
  const assembledGraphPath = `${projectRoot}/.understand-anything/intermediate/assembled-graph.json`;
  const assembled = JSON.parse(fs.readFileSync(assembledGraphPath, 'utf-8'));

  // Load layers
  const layersPath = `${projectRoot}/.understand-anything/intermediate/layers.json`;
  const layers = JSON.parse(fs.readFileSync(layersPath, 'utf-8'));

  // Load tour
  const tourPath = `${projectRoot}/.understand-anything/intermediate/tour.json`;
  const tour = JSON.parse(fs.readFileSync(tourPath, 'utf-8'));

  // Load scan results
  const scanResultPath = `${projectRoot}/.understand-anything/intermediate/scan-result.json`;
  const scanResult = JSON.parse(fs.readFileSync(scanResultPath, 'utf-8'));

  // Extract metadata from scanResult
  const filePaths = scanResult.files.map(f => f.path);
  const languagesSet = new Set(scanResult.files.map(f => f.language));
  const languages = Array.from(languagesSet);
  const frameworks = ['Next.js', 'React', 'Firebase', 'TypeScript', 'TailwindCSS'];

  // Assemble full KnowledgeGraph JSON object
  const finalGraph = {
    version: '1.0.0',
    project: {
      name: 'Restaurant OS Core',
      languages,
      frameworks,
      description: 'The core sovereign engine orchestrating the Restaurant OS multi-tenant dashboard and POS terminals.',
      analyzedAt: new Date().toISOString(),
      gitCommitHash: commitHash
    },
    nodes: assembled.nodes || [],
    edges: assembled.edges || [],
    layers,
    tour
  };

  // Save to /Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/.understand-anything/knowledge-graph.json
  const finalGraphPath = `${projectRoot}/.understand-anything/knowledge-graph.json`;
  fs.writeFileSync(finalGraphPath, JSON.stringify(finalGraph, null, 2), 'utf-8');
  console.log(`Saved final knowledge graph to ${finalGraphPath}`);

  // Create fingerprint-input.json
  const fingerprintInput = {
    projectRoot,
    sourceFilePaths: filePaths,
    gitCommitHash: commitHash
  };
  const fingerprintInputPath = `${projectRoot}/.understand-anything/intermediate/fingerprint-input.json`;
  fs.writeFileSync(fingerprintInputPath, JSON.stringify(fingerprintInput, null, 2), 'utf-8');
  console.log(`Wrote fingerprint-input.json`);

  // Execute build-fingerprints.mjs
  try {
    execSync(`node ${skillDir}/build-fingerprints.mjs ${fingerprintInputPath}`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('Successfully completed fingerprints baseline!');
  } catch (err) {
    console.error('Failed to build fingerprints:', err);
    process.exit(1);
  }

  // Write meta.json
  const meta = {
    lastAnalyzedAt: new Date().toISOString(),
    gitCommitHash: commitHash,
    version: '1.0.0',
    analyzedFiles: filePaths.length
  };
  fs.writeFileSync(`${projectRoot}/.understand-anything/meta.json`, JSON.stringify(meta, null, 2), 'utf-8');
  console.log('Wrote meta.json');

  // Cleanup intermediate files (preserving scan-result.json)
  const intermediateDir = `${projectRoot}/.understand-anything/intermediate`;
  const files = fs.readdirSync(intermediateDir);
  for (const f of files) {
    if (f !== 'scan-result.json') {
      fs.rmSync(path.join(intermediateDir, f), { recursive: true, force: true });
    }
  }

  // Clean tmp
  fs.rmSync(`${projectRoot}/.understand-anything/tmp`, { recursive: true, force: true });
  console.log('Cleaned up intermediate and temp files.');

  console.log('Assembled successfully!');
}

main();
