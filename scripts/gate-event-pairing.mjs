#!/usr/bin/env node
/**
 * gate-event-pairing — cliquet d'invariant (audit 3.1b)
 *
 * Vérifie que tout event du bus a AU MOINS un émetteur ET au moins un consommateur.
 * Un event émis-sans-consommateur = effet de bord perdu ; consommé-sans-émetteur =
 * handler mort ou émetteur manquant. Le mode informatif détecte aussi les events
 * bridgés dynamiquement via `VerticalEventBridge` (règles data-driven).
 *
 * Ce cliquet est INFORMATIF par défaut (warnings, exit 0) car ~50% du catalogue
 * concerne des events verticaux normalement bridgés (auto/hotel/health/… → order.paid)
 * ou volontairement en attente. Passer `--strict` pour bloquer sur le sous-ensemble
 * fiscal/argent/stock où la dette est intolérable.
 *
 * Usage :
 *   node scripts/gate-event-pairing.mjs           # informatif
 *   node scripts/gate-event-pairing.mjs --strict  # bloque sur le noyau sensible
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const STRICT = process.argv.includes('--strict');

// Sous-ensemble sensible pour le mode --strict : mutations argent/stock/paie
const STRICT_PREFIXES = ['order.', 'payment.', 'invoice.', 'stock.', 'inventory.', 'payroll.', 'fiscal.', 'hr.hcr_'];

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
const emitRe = /\.(?:emit|emitDurable|dispatchServerEvent)\s*(?:<[^>]*>)?\s*\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
const onRe = /\.on\s*\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
const bridgeSrcRe = /source:\s*['"]([a-zA-Z0-9_.]+)['"]/g;
const bridgeTgtRe = /target:\s*['"]([a-zA-Z0-9_.]+)['"]/g;

const emitted = new Set();
const consumed = new Set();

for (const f of files) {
    const txt = readFileSync(f, 'utf8');
    for (const m of txt.matchAll(emitRe)) emitted.add(m[1]);
    for (const m of txt.matchAll(onRe)) consumed.add(m[1]);
    // VerticalEventBridge : source subscribed, target emitted, tous deux dynamiques
    if (f.includes('VerticalEventBridge')) {
        for (const m of txt.matchAll(bridgeSrcRe)) consumed.add(m[1]);
        for (const m of txt.matchAll(bridgeTgtRe)) emitted.add(m[1]);
    }
}

const emitNotConsumed = [...emitted].filter((e) => !consumed.has(e) && e.includes('.')).sort();
const consumeNotEmitted = [...consumed].filter((c) => !emitted.has(c) && c.includes('.')).sort();

console.log(`ℹ️  events émis=${emitted.size}  consommés=${consumed.size}`);
console.log(`   émis-sans-consommateur : ${emitNotConsumed.length}   consommés-sans-émetteur : ${consumeNotEmitted.length}`);

if (STRICT) {
    const sensitiveOrphans = [
        ...emitNotConsumed.filter((e) => STRICT_PREFIXES.some((p) => e.startsWith(p))),
        ...consumeNotEmitted.filter((c) => STRICT_PREFIXES.some((p) => c.startsWith(p))),
    ];
    if (sensitiveOrphans.length > 0) {
        console.error(`\n❌ gate-event-pairing --strict : ${sensitiveOrphans.length} event(s) sensible(s) non apparié(s) :`);
        for (const e of sensitiveOrphans) console.error(`   • ${e}`);
        process.exit(1);
    }
    console.log(`✅ gate-event-pairing --strict : noyau sensible (${STRICT_PREFIXES.join(', ')}) intégralement apparié.`);
    process.exit(0);
}

if (emitNotConsumed.length > 0) {
    console.log(`\n⚠️  Émis-sans-consommateur (top 10) :`);
    for (const e of emitNotConsumed.slice(0, 10)) console.log(`     →x ${e}`);
    if (emitNotConsumed.length > 10) console.log(`     … et ${emitNotConsumed.length - 10} de plus.`);
}
if (consumeNotEmitted.length > 0) {
    console.log(`\n⚠️  Consommés-sans-émetteur (top 10) :`);
    for (const c of consumeNotEmitted.slice(0, 10)) console.log(`     x→ ${c}`);
    if (consumeNotEmitted.length > 10) console.log(`     … et ${consumeNotEmitted.length - 10} de plus.`);
}
console.log(`\nMode informatif — passer --strict pour bloquer sur le noyau sensible.`);
