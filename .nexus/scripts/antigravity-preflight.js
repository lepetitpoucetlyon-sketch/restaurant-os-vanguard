const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { config, EXEC_OPTS } = require('./antigravity-config');

/**
 * 🛡️ ANTIGRAVITY CHAOS SHIELD / PRE-FLIGHT v1.0
 * Goal: Validate and protect Empire Stability Index.
 */

const REPO_ROOT = config.repoRoot;
const REPORT_PATH = path.join(REPO_ROOT, '.antigravity/sentinel-report.json');

async function runPreflight() {
    console.log('🛡️  Antigravity Pre-flight: Initiating Chaos Shield...');

    // 1. Read Baseline
    let baseline = null;
    if (fs.existsSync(REPORT_PATH)) {
        baseline = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
        console.log(`📍 Baseline Stability Score: ${baseline.metrics.overallStability.toFixed(1)}%`);
    }

    // 2. Run New Audit
    console.log('🔄 Running Fresh Sentinel Audit...');
    try {
        execSync(`${config.binaries.node} scripts/antigravity-sentinel.js`, EXEC_OPTS);
    } catch (e) {
        console.error('❌ Sentinel Audit Failed.');
        process.exit(1);
    }

    // 3. Compare Results
    const currentReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    const currentScore = currentReport.metrics.overallStability;

    console.log(`\n📊 Final Assessment:`);
    console.log(`   - Baseline: ${baseline ? baseline.metrics.overallStability.toFixed(1) : 'N/A'}%`);
    console.log(`   - Current:  ${currentScore.toFixed(1)}%`);

    if (baseline && currentScore < baseline.metrics.overallStability - 0.5) {
        console.log('⚠️  REGRESSION DÉTECTÉE : L\'indice de stabilité a chuté !');
        console.log('❌ Échec du bouclier Chaos. Révise ton code avant de soumettre.');
        process.exit(1);
    } else {
        console.log('✅ Empire Stable. Tous les systèmes sont au vert.');
        process.exit(0);
    }
}

runPreflight();
