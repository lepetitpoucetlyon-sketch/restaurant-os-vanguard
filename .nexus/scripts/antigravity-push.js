const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { config, EXEC_OPTS } = require('./antigravity-config');

/**
 * 🚀 ANTIGRAVITY PUSH ENGINE
 * Goal: Industrial-grade, silent synchronization for Restaurant OS Core.
 */

const DRY_RUN = process.argv.includes('--dry-run');
const LOCK_FILE = path.join(config.repoRoot, '.git/antigravity-sync.lock');

function _loadManifestStability(repoRoot) {
    try {
        const manifestPath = path.join(repoRoot, '../extensions/ghost-commander-os/CDC_MANIFEST.json');
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (manifest.globalStatus && manifest.globalStatus.empireStability !== undefined) {
                return ` | Empire Stability: ${manifest.globalStatus.empireStability}%`;
            }
        }
    } catch (e) { /* Fallback to default message */ }
    return '';
}

async function pushWork() {
    // 0. Lock Prevention
    if (fs.existsSync(LOCK_FILE)) {
        const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
        if (lockAge < 300000) { // 5 minutes safety
            console.log('⏳ Une synchronisation est déjà en cours. Skip.');
            return;
        }
        fs.unlinkSync(LOCK_FILE);
    }
    fs.writeFileSync(LOCK_FILE, process.pid.toString());

    console.log('🚀 Antigravity Push : Synchronisation silencieuse...');

    try {
        // 1. Detect Changes
        const status = execSync('git status --porcelain', { ...EXEC_OPTS, stdio: 'pipe' }).toString().trim();
        if (!status) {
            console.log('✨ Système à jour.');
            fs.unlinkSync(LOCK_FILE);
            return;
        }

        // 1.1 Detect Current Branch
        const currentBranch = execSync('git branch --show-current', { ...EXEC_OPTS, stdio: 'pipe' }).toString().trim() || 'main';

        // 2. Stage Changes
        if (!DRY_RUN) {
            execSync('git add .', { ...EXEC_OPTS });
        }

        // 3. Generate Commit Message
        const date = new Date().toISOString();
        const stabilitySuffix = _loadManifestStability(config.repoRoot);

        const commitMsg = `[EMPIRE-AUTO] Pulse Stabilization Sync - ${date}${stabilitySuffix}`;

        // 4. Commit (Forced non-interactive)
        if (!DRY_RUN) {
            try {
                const safeMsg = commitMsg.replace(/"/g, '\\"');
                // Use --no-edit and GIT_EDITOR=true to block ANY editor popup
                execSync(`GIT_EDITOR=true git commit -m "${safeMsg}" --no-edit`, { ...EXEC_OPTS });
            } catch (e) { /* Nothing to commit */ }
        }

        // 5. Push to current branch
        if (!DRY_RUN) {
            execSync(`git push origin ${currentBranch} --quiet`, { ...EXEC_OPTS });
            console.log(`✅ Sync terminée sur la branche [${currentBranch}].`);
        }

    } catch (error) {
        console.error('❌ Sync Error:', error.message);
    } finally {
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    }
}

pushWork().catch(() => {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
});
