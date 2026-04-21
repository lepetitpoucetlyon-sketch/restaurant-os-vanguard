import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST() {
    try {
        const repoRoot = path.resolve(process.cwd());
        const pushScript = path.join(repoRoot, 'scripts/antigravity-push.js');
        const ledgerPath = path.join(repoRoot, 'nexus-ledger.json');
        
        // Environment Detection
        const searchPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
        let nodeBin = 'node';
        
        for (const p of searchPaths) {
            const fullPath = path.join(p, 'node');
            if (fs.existsSync(fullPath)) {
                nodeBin = fullPath;
                break;
            }
        }

        console.log(`🚀 API Push: Running ${nodeBin} ${pushScript}`);
        
        // Execute the push script with enhanced environment
        const output = execSync(`${nodeBin} ${pushScript}`, { 
            cwd: repoRoot,
            env: { 
                ...process.env, 
                PATH: `${searchPaths.join(':')}:${process.env.PATH}` 
            },
            stdio: 'pipe'
        }).toString();

        // Audit Logging: Update Nexus Ledger
        if (fs.existsSync(ledgerPath)) {
            const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
            ledger.last_global_sync = new Date().toISOString();
            if (!ledger.system_alerts) ledger.system_alerts = [];
            ledger.system_alerts.unshift(`Success: Global Fleet Sync performed at ${new Date().toLocaleTimeString()}`);
            if (ledger.system_alerts.length > 5) ledger.system_alerts.pop();
            fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
        }

        return NextResponse.json({
            success: true,
            output,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Git Push API Error:', error);
        const err = error as { message?: string; stdout?: Buffer; stderr?: Buffer };
        return NextResponse.json({ 
            success: false, 
            error: err.message || 'Failed to execute git push.',
            output: err.stdout?.toString() || err.stderr?.toString()
        }, { status: 500 });
    }
}
