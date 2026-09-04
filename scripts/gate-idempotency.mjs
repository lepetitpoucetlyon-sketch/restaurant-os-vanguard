#!/usr/bin/env node
/**
 * gate-idempotency — cliquet d'invariant (audit R1)
 *
 * Vérifie que tout handler consommateur d'un événement de mutation (argent,
 * stock, paie — cf. `src/shared/eventBus/mutationEvents.ts`) sera bien idempotent
 * à l'exécution. Depuis R1 (audit 2026-09), les events de mutation rendent leurs
 * handlers idempotents PAR DÉFAUT via le bus (`NexusEventBus.on` +
 * `isMutationEvent`) — le gate valide donc :
 *   - la présence d'un marqueur explicite (`idempotent: true`, `CRITICAL`,
 *     `withIdempotencyGuard`, ou `// idempotent-passive:`) ; OU
 *   - l'absence d'`idempotent: false` (opt-out) — auquel cas R1 s'applique.
 *
 * VIOLATION = handler qui opt-out explicitement (`idempotent: false`) SANS
 * marqueur explicite → risque de double-application (audit 2026-09).
 *
 * Usage : `node scripts/gate-idempotency.mjs` — exit ≠ 0 si un handler nu est trouvé.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

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

// Charger la liste des events de mutation
const mutSrc = readFileSync(join(ROOT, 'shared/eventBus/mutationEvents.ts'), 'utf8');
const MUTATION_EVENTS = new Set(
    [...mutSrc.matchAll(/^\s*'([a-z][a-z0-9_.]+)',/gm)].map((m) => m[1]),
);

const files = walk(ROOT).filter((f) => f.includes('/eventBus/'));
const onRe = /NexusEventBus\s*\.\s*on\s*\(\s*/g;
const strRe = /['"]([a-zA-Z0-9_.]+)['"]/;
const dedupMarkers = /(idempotent:\s*true|idempotent:true|withIdempotencyGuard|priority:\s*['"]CRITICAL['"]|idempotent-passive:)/;
const optOutRe = /idempotent:\s*false/;

const violations = [];
for (const f of files) {
    const txt = readFileSync(f, 'utf8');
    for (const m of txt.matchAll(onRe)) {
        const tail = txt.slice(m.index + m[0].length, m.index + m[0].length + 3000);
        const sm = strRe.exec(tail);
        if (!sm) continue;
        const ev = sm[1];
        if (!MUTATION_EVENTS.has(ev)) continue;
        // Bloc d'inscription = jusqu'à la prochaine `NexusEventBus.on(` ou fin de la portée
        const blockEnd = tail.search(/NexusEventBus\s*\.\s*on\s*\(/);
        const block = blockEnd > 0 ? tail.slice(0, blockEnd) : tail;
        // Marqueur explicite dans le bloc, ou withIdempotencyGuard référencé plus haut dans le fichier
        const hasExplicitMarker = dedupMarkers.test(block) || (txt.includes('withIdempotencyGuard') && txt.indexOf('withIdempotencyGuard') < (m.index ?? 0) + block.length + 200);
        if (hasExplicitMarker) continue;
        // Pas de marqueur explicite : R1 auto-idempotency s'applique SAUF si opt-out explicite `idempotent: false`
        if (optOutRe.test(block)) violations.push({ file: relative(process.cwd(), f), event: ev });
    }
}

if (violations.length > 0) {
    console.error(`\n❌ gate-idempotency : ${violations.length} handler(s) d'événement de mutation SANS idempotence :`);
    for (const v of violations) console.error(`   • ${v.event}   ← ${v.file}`);
    console.error(`\n   → passer 'idempotent: true' (ou 'CRITICAL', ou withIdempotencyGuard),`);
    console.error(`     ou marquer '// idempotent-passive: <raison>' si le handler ne mute rien.`);
    process.exit(1);
}
console.log(`✅ gate-idempotency : tous les consommateurs de mutation events (${MUTATION_EVENTS.size} events surveillés) sont idempotents.`);
