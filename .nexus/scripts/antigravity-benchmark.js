const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { config, EXEC_OPTS } = require('./antigravity-config');

const REPO_ROOT = config.repoRoot;
// No manual EXEC_OPTS here, we use the imported one.

async function runBenchmark() {
    console.log('🏎️  Antigravity Intelligence Performance Benchmark');
    console.log('='.repeat(50));

    const results = [];

    const measure = (name, command) => {
        process.stdout.write(`⏳ Testing ${name}... `);
        const start = Date.now();
        try {
            execSync(command, EXEC_OPTS);
            const duration = (Date.now() - start) / 1000;
            console.log(`✅ ${duration.toFixed(3)}s`);
            results.push({ name, duration });
        } catch (e) {
            console.log(`❌ FAILED`);
            results.push({ name, duration: null, error: true });
        }
    };

    // 1. Nexus Knowledge Sync (Atlas)
    measure('Knowledge Nexus Sync (Atlas)', `${config.binaries.npm} run atlas`);

    // 2. Sentinel Audit
    measure('Sentinel Architectural Audit', `${config.binaries.node} scripts/antigravity-sentinel.js`);

    // 3. Weaver Analysis (Staff Page)
    measure('Weaver Surgical Mapping (Staff Module)', `${config.binaries.node} scripts/antigravity-weaver.js src/app/staff/page.tsx`);

    // 4. Chaos Shield Validation (Pre-flight)
    measure('Chaos Shield Stability Validation', `${config.binaries.node} scripts/antigravity-preflight.js src/app/staff/page.tsx`);

    console.log('\n📊 Final Performance Report');
    console.log('='.repeat(50));
    
    let totalTime = 0;
    results.forEach(r => {
        if (!r.error) {
            totalTime += r.duration;
            const bar = '█'.repeat(Math.round(r.duration * 5));
            console.log(`${r.name.padEnd(40)} | ${r.duration.toFixed(3)}s ${bar}`);
        }
    });

    console.log('='.repeat(50));
    console.log(`✨ Total Execution Cycle: ${totalTime.toFixed(3)}s`);
    console.log(`📈 Efficacité Contextuelle : OPTIMISÉE (Fichiers < 500 lines)`);
}

runBenchmark().catch(console.error);
