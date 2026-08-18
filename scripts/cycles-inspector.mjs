#!/usr/bin/env node
/**
 * 🔄 Cycles Inspector — Analyseur Topologique et Détecteur de Hubs Circulaires
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const exportArg = args.find(a => a.startsWith('--export='));
const thresholdArg = args.find(a => a.startsWith('--threshold='));
const MAX_THRESHOLD = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 966;

function runMadge() {
    const tmpFile = path.join(os.tmpdir(), `madge-cycles-${Date.now()}.json`);
    try {
        execSync(`npx madge --circular --extensions ts,tsx --ts-config tsconfig.json --json src/ > "${tmpFile}" 2>&1`, {
            cwd: ROOT_DIR,
            shell: '/bin/bash',
        });
    } catch {
        // Madge exits 1 when cycles exist
    }

    if (!fs.existsSync(tmpFile)) return [];
    const content = fs.readFileSync(tmpFile, 'utf-8');
    try { fs.unlinkSync(tmpFile); } catch {}

    const start = content.indexOf('[');
    return JSON.parse(start !== -1 ? content.slice(start) : (content || '[]'));
}

function classifyCycle(cycle, hubOccurrences) {
    const distinctPillars = new Set();
    let hasBarrel = false;
    let hasTypeCandidate = false;

    for (const node of cycle) {
        hubOccurrences.set(node, (hubOccurrences.get(node) || 0) + 1);
        const match = node.match(/modules\/([a-zA-Z0-9_-]+)/);
        if (match) distinctPillars.add(match[1]);
        if (node.endsWith('index.ts') || node.endsWith('index.tsx')) hasBarrel = true;
        if (node.includes('types.ts') || node.includes('schemas/') || node.includes('contract')) hasTypeCandidate = true;
    }

    return {
        isCrossPillar: distinctPillars.size >= 2,
        hasBarrel,
        hasTypeCandidate,
    };
}

function buildReport(circularRaw) {
    const hubOccurrences = new Map();
    let crossPillar = 0;
    let barrels = 0;
    let types = 0;

    for (const cycle of circularRaw) {
        const res = classifyCycle(cycle, hubOccurrences);
        if (res.isCrossPillar) crossPillar++;
        if (res.hasBarrel) barrels++;
        if (res.hasTypeCandidate) types++;
    }

    const total = circularRaw.length;
    const sortedHubs = Array.from(hubOccurrences.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([file, count]) => ({
            file,
            count,
            percentage: ((count / (total || 1)) * 100).toFixed(1) + '%',
            isBarrel: file.endsWith('index.ts') || file.endsWith('index.tsx'),
            isTypeNode: file.includes('types.ts') || file.includes('schemas/') || file.includes('contract'),
        }));

    return {
        timestamp: new Date().toISOString(),
        totalCycles: total,
        maxThreshold: MAX_THRESHOLD,
        status: total <= MAX_THRESHOLD ? 'PASS' : 'FAIL',
        metrics: {
            crossPillarCycles: crossPillar,
            barrelCycles: barrels,
            typeCandidateCycles: types,
            lengths: {
                min: circularRaw.length ? Math.min(...circularRaw.map(c => c.length)) : 0,
                max: circularRaw.length ? Math.max(...circularRaw.map(c => c.length)) : 0,
            }
        },
        topHubs: sortedHubs.slice(0, 15),
        cycles: circularRaw,
    };
}

function main() {
    if (!jsonOutput) {
        console.log('🔍 Analyse des dépendances circulaires en cours via Madge...\n');
    }

    const raw = runMadge();
    const report = buildReport(raw);

    if (exportArg) {
        const dest = path.resolve(ROOT_DIR, exportArg.split('=')[1]);
        fs.writeFileSync(dest, JSON.stringify(report, null, 2), 'utf-8');
    }

    if (jsonOutput) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        console.log('============================================================');
        console.log("📊 RAPPORT D'ANALYSE DES CYCLES CIRCULAIRES (MADGE)");
        console.log('============================================================');
        console.log(`Total Cycles Détectés  : ${report.totalCycles} (Seuil Ratchet Max : ${MAX_THRESHOLD})`);
        console.log(`Statut Ratchet         : ${report.status === 'PASS' ? '✅ VALIDÉ' : '❌ SEUIL DÉPASSÉ'}`);
        console.log(`Cycles Cross-Piliers   : ${report.metrics.crossPillarCycles}`);
        console.log(`Cycles via Barrels     : ${report.metrics.barrelCycles}`);
        console.log('============================================================\n');
    }

    if (report.status !== 'PASS') {
        process.exit(1);
    }
}

main();
