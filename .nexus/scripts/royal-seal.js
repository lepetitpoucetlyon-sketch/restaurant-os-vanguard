const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🏛️ THE ROYAL SEAL [GRADE X]
 * Goal: Link Architectural Integrity to Version Control.
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const AUDIT_SCRIPT = path.join(REPO_ROOT, 'scripts/hegemony-isolation-audit.js');

function runCommand(cmd) {
    try {
        return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' });
    } catch (error) {
        return { error: true, output: error.stdout || error.message };
    }
}

function seal() {
    console.log('🏛️  INITIATING ROYAL SEAL PROTOCOL [GRADE X]...');

    // 1. RUN ISOLATION AUDIT
    console.log('🔍 Running Hegemony Isolation Audit...');
    const auditStatus = runCommand(`/usr/local/bin/node ${AUDIT_SCRIPT}`);

    if (auditStatus.error) {
        console.error('❌ ROYAL SEAL BLOCKED: Architectural Integrity Violation Detected!');
        console.error(auditStatus.output);
        process.exit(1);
    }

    console.log('✅ Architectural Integrity Confirmed.');

    // 2. PREPARE VERSIONING
    console.log('📦 Staging files for Sceau Royal...');
    runCommand('git add .');

    const commitMsg = `[GRADE X] Singularity Sealed: Transformation complete (Actes 0-4)`;
    console.log(`🖋️  Signing commit: ${commitMsg}`);
    
    const commitResult = runCommand(`git commit -m "${commitMsg}"`);
    
    if (commitResult.error) {
        console.error('❌ Commit Failed.');
        console.error(commitResult.output);
        process.exit(1);
    }

    console.log('\n💎 SINGULARITY SCÉLLÉE AVEC SUCCÈS.');
    console.log('L\'histoire de l\'Empire est gravée dans le marbre binaire.');
}

seal();
