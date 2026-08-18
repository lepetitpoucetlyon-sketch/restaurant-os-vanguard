#!/usr/bin/env node
/**
 * 🔄 Cycles Inspector — Analyseur Topologique et Détecteur de Hubs Circulaires
 *
 * Exécute Madge avec résolution du tsconfig.json (@/*) et extrait :
 * 1. Métriques globales (Total cycles, longueur min/max/moyenne)
 * 2. Top Hubs (les fichiers traversés par le plus de cycles)
 * 3. Typologie des cycles (Cross-Piliers vs Internes, Barrels, Types purs)
 * 4. Export JSON pour le pipeline de réduction et le Ratchet Preflight.
 *
 * Usage :
 *   node scripts/cycles-inspector.mjs [--json] [--export=path] [--threshold=966]
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

async function inspectCycles() {
    if (!jsonOutput) {
        console.log('🔍 Analyse des dépendances circulaires en cours via Madge...');
    }

    const tmpFile = path.join(os.tmpdir(), `madge-cycles-${Date.now()}.json`);
    try {
        execSync(`npx madge --circular --extensions ts,tsx --ts-config tsconfig.json --json src/ > "${tmpFile}" 2>&1`, {
            cwd: ROOT_DIR,
            shell: '/bin/bash',
        });
    } catch {
        // Madge sort avec exit code 1 si des cycles sont trouvés, ce qui est normal
    }

    if (!fs.existsSync(tmpFile)) {
        console.error('❌ Erreur : fichier temporaire Madge introuvable.');
        process.exit(1);
    }

    const rawContent = fs.readFileSync(tmpFile, 'utf-8');
    try {
        fs.unlinkSync(tmpFile);
    } catch {}

    let circularRaw = [];
    try {
        const jsonStart = rawContent.indexOf('[');
        if (jsonStart !== -1) {
            circularRaw = JSON.parse(rawContent.slice(jsonStart));
        } else {
            circularRaw = JSON.parse(rawContent || '[]');
        }
    } catch (parseErr) {
        console.error('❌ Erreur de parsing JSON Madge :', parseErr.message);
        process.exit(1);
    }

    const totalCycles = circularRaw.length;

    // Analyse des hubs
    const hubOccurrences = new Map();
    let crossPillarCycles = 0;
    let barrelCycles = 0;
    let typeCandidateCycles = 0;
    const lengths = [];

    circularRaw.forEach(cycle => {
        lengths.push(cycle.length);

        const distinctPillars = new Set();
        let hasBarrel = false;
        let hasTypeCandidate = false;

        cycle.forEach(node => {
            hubOccurrences.set(node, (hubOccurrences.get(node) || 0) + 1);

            // Détection piliers (modules/X)
            const match = node.match(/modules\/([a-zA-Z0-9_-]+)/);
            if (match) distinctPillars.add(match[1]);

            if (node.endsWith('index.ts') || node.endsWith('index.tsx')) hasBarrel = true;
            if (node.includes('types.ts') || node.includes('schemas/') || node.includes('contract')) hasTypeCandidate = true;
        });

        if (distinctPillars.size >= 2) crossPillarCycles++;
        if (hasBarrel) barrelCycles++;
        if (hasTypeCandidate) typeCandidateCycles++;
    });

    // Tri des hubs
    const sortedHubs = Array.from(hubOccurrences.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([file, count]) => ({
            file,
            count,
            percentage: ((count / totalCycles) * 100).toFixed(1) + '%',
            isBarrel: file.endsWith('index.ts') || file.endsWith('index.tsx'),
            isTypeNode: file.includes('types.ts') || file.includes('schemas/') || file.includes('contract'),
        }));

    const avgLength = lengths.length ? (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1) : 0;
    const minLength = lengths.length ? Math.min(...lengths) : 0;
    const maxLength = lengths.length ? Math.max(...lengths) : 0;

    const report = {
        timestamp: new Date().toISOString(),
        totalCycles,
        maxThreshold: MAX_THRESHOLD,
        status: totalCycles <= MAX_THRESHOLD ? 'PASS' : 'FAIL',
        metrics: {
            crossPillarCycles,
            crossPillarPercentage: totalCycles ? ((crossPillarCycles / totalCycles) * 100).toFixed(1) + '%' : '0%',
            barrelCycles,
            barrelPercentage: totalCycles ? ((barrelCycles / totalCycles) * 100).toFixed(1) + '%' : '0%',
            typeCandidateCycles,
            typeCandidatePercentage: totalCycles ? ((typeCandidateCycles / totalCycles) * 100).toFixed(1) + '%' : '0%',
            length: {
                min: minLength,
                max: maxLength,
                avg: Number(avgLength),
            },
        },
        topHubs: sortedHubs.slice(0, 20),
    };

    if (exportArg) {
        const exportPath = path.resolve(ROOT_DIR, exportArg.split('=')[1]);
        fs.mkdirSync(path.dirname(exportPath), { recursive: true });
        fs.writeFileSync(exportPath, JSON.stringify(report, null, 2), 'utf-8');
        if (!jsonOutput) console.log(`💾 Rapport exporté vers : ${exportPath}`);
    }

    if (jsonOutput) {
        console.log(JSON.stringify(report, null, 2));
        return report;
    }

    // Affichage Console Formaté
    console.log('\n============================================================');
    console.log('📊 RAPPORT D\'ANALYSE DES CYCLES CIRCULAIRES (MADGE)');
    console.log('============================================================');
    console.log(`Total Cycles Détectés  : ${totalCycles} (Seuil Ratchet Max : ${MAX_THRESHOLD})`);
    console.log(`Statut Ratchet         : ${report.status === 'PASS' ? '✅ VALIDÉ' : '❌ VIOLATION DU SEUIL'}`);
    console.log(`Cycles Cross-Piliers   : ${crossPillarCycles} (${report.metrics.crossPillarPercentage})`);
    console.log(`Cycles via Barrels     : ${barrelCycles} (${report.metrics.barrelPercentage})`);
    console.log(`Cycles avec Types/Sch. : ${typeCandidateCycles} (${report.metrics.typeCandidatePercentage})`);
    console.log(`Longueur des Chaînes   : Min ${minLength} | Max ${maxLength} | Moyenne ${avgLength}`);
    console.log('------------------------------------------------------------');
    console.log('🏆 TOP 15 DES HUBS LES PLUS IMPACTÉS :');
    sortedHubs.slice(0, 15).forEach((h, idx) => {
        const flag = h.isBarrel ? '[BARREL]' : (h.isTypeNode ? '[TYPES]' : '[CODE]');
        console.log(`  ${(idx + 1).toString().padStart(2, ' ')}. ${h.count.toString().padStart(3, ' ')} cycles (${h.percentage.padStart(5, ' ')}) ${flag} ${h.file}`);
    });
    console.log('============================================================\n');

    if (totalCycles > MAX_THRESHOLD) {
        process.exit(1);
    }
}

inspectCycles().catch(err => {
    console.error('❌ Erreur lors de l\'inspection des cycles :', err);
    process.exit(1);
});
