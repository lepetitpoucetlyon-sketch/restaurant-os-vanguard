import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
    try {
        const repoRoot = path.resolve(process.cwd());
        
        // Execute git commands to get status
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot }).toString().trim();
        const status = execSync('git status --porcelain', { cwd: repoRoot }).toString().trim();
        const modifiedCount = status ? status.split('\n').length : 0;
        
        // Get last commit summary
        const lastCommit = execSync('git log -1 --format=%s', { cwd: repoRoot }).toString().trim();

        return NextResponse.json({
            success: true,
            branch,
            modifiedCount,
            lastCommit,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Git Status API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to retrieve git status. Ensure git is installed and repository is initialized.' 
        }, { status: 500 });
    }
}
