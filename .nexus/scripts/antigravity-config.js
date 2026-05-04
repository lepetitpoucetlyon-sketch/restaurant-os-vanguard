const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🛰️ ANTIGRAVITY CONFIG ORCHESTRATOR
 * Goal: Centralize environment detection and shell execution.
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(REPO_ROOT, '.antigravity/env.json');

// Priority search paths for Mac/Homebrew environments
const SEARCH_PATHS = [
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin'
];

function resolveBinary(name) {
    for (const p of SEARCH_PATHS) {
        const fullPath = path.join(p, name);
        if (fs.existsSync(fullPath)) return fullPath;
    }
    try {
        return execSync(`which ${name}`, { stdio: 'pipe' }).toString().trim();
    } catch (e) {
        return name; // Fallback to just the name
    }
}

const config = {
    binaries: {
        node: resolveBinary('node'),
        npm: resolveBinary('npm'),
        npx: resolveBinary('npx'),
        python3: resolveBinary('python3')
    },
    paths: SEARCH_PATHS.join(':'),
    repoRoot: REPO_ROOT
};

// Standardized Execution Options
const EXEC_OPTS = {
    cwd: REPO_ROOT,
    env: {
        ...process.env,
        PATH: `${config.paths}:${process.env.PATH}`
    },
    stdio: 'inherit'
};

function run(command, args = [], options = {}) {
    const cmd = `${config.binaries.node} ${command} ${args.join(' ')}`;
    return execSync(cmd, { ...EXEC_OPTS, ...options });
}

module.exports = {
    config,
    EXEC_OPTS,
    run,
    resolveBinary
};

// Auto-save env if it doesn't exist
if (!fs.existsSync(path.dirname(ENV_FILE))) fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
if (!fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, JSON.stringify(config, null, 2));
}
