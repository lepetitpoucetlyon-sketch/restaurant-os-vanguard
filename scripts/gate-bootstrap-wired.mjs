#!/usr/bin/env node
/**
 * gate-bootstrap-wired — cliquet d'invariant (audit S1)
 *
 * Vérifie que tout service long-running exportant `start()` / `boot()` /
 * `startXxxService()` / une CONSTANTE-scheduler ait au moins UN appelant dans
 * le code applicatif. Sans ça, un bootstrap orphelin (comme CronScheduler
 * naguère) laisse mourir une feature entière sans que tsc/tests s'en rendent
 * compte — l'exact bug le plus grave de l'audit d'archi 2026-09.
 *
 * Usage : `node scripts/gate-bootstrap-wired.mjs` — exit ≠ 0 si un orphelin est trouvé.
 *
 * Exceptions : ajouter à ALLOWLIST le nom exact du symbole si le bootstrap est
 * appelé par du code EXTERNE au repo (route Vercel, Firebase Cloud Function…),
 * en documentant qui/quoi l'appelle.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const ALLOWLIST = new Set([
    'CronScheduler', // appelé par /api/cron/tick (route Vercel Cron)
    'startDLQRetryService', // appelé par NexusSyncBootstrap côté client
    'startSelfHealingInterval', // appelé par NexusSyncBootstrap côté client
]);

/** @returns {string[]} */
function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const st = statSync(p);
        if (st.isDirectory()) out.push(...walk(p));
        else if ((p.endsWith('.ts') || p.endsWith('.tsx')) && !p.includes('.test.') && !p.includes('.spec.')) out.push(p);
    }
    return out;
}

const files = walk(ROOT);
const contents = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

const defRe = /export\s+(?:async\s+)?function\s+(start\w*|boot\w*|run\w*Service)\s*\(/g;
const constRe = /export\s+const\s+(\w*Scheduler|\w*Monitor|\w*Worker|\w*Daemon)\b/g;

const symbols = new Map(); // name → definingFile
for (const [file, txt] of contents) {
    for (const m of txt.matchAll(defRe)) symbols.set(m[1], file);
    for (const m of txt.matchAll(constRe)) symbols.set(m[1], file);
}

const orphans = [];
for (const [name, defFile] of symbols) {
    if (ALLOWLIST.has(name)) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`);
    let hasCaller = false;
    for (const [f, txt] of contents) {
        if (f === defFile) continue;
        if (re.test(txt)) { hasCaller = true; break; }
    }
    if (!hasCaller) orphans.push({ name, file: relative(process.cwd(), defFile) });
}

if (orphans.length > 0) {
    console.error(`\n❌ gate-bootstrap-wired : ${orphans.length} service(s) long-running ORPHELIN(S) — aucun appelant :`);
    for (const o of orphans) console.error(`   • ${o.name}  ← ${o.file}`);
    console.error(`\n   → soit câbler un appelant, soit ajouter le nom à ALLOWLIST avec la justification.`);
    process.exit(1);
}
console.log(`✅ gate-bootstrap-wired : ${symbols.size} service(s) long-running, tous câblés ou allowlistés.`);
