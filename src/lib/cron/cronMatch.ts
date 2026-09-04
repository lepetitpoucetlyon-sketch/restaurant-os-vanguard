/**
 * cronMatch — évaluateur minimal d'expressions cron 5 champs, SANS dépendance.
 *
 * Champs : minute(0-59) heure(0-23) jour-du-mois(1-31) mois(1-12) jour-semaine(0-6, 0=dimanche).
 * Syntaxe supportée par champ : `*`, `a`, `a-b`, `a,b,c`, `* /N`, `a-b/N`.
 * Suffisant pour les schedules du dépôt (`59 23 * * *`, `0 3 1 * *`, `* /5 * * * *`, `0 * * * *`).
 *
 * ⚠️ Fuseau : l'évaluation utilise l'heure du process (UTC sur Vercel). Les schedules
 * des jobs sont donc interprétés en UTC. Un affinage par fuseau tenant est un chantier
 * séparé (BusinessClock) ; l'objectif ici est que les jobs S'EXÉCUTENT (audit S1).
 */

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
    if (field === '*') return true;
    for (const part of field.split(',')) {
        let step = 1;
        let range = part;
        const slash = part.indexOf('/');
        if (slash !== -1) {
            step = parseInt(part.slice(slash + 1), 10) || 1;
            range = part.slice(0, slash);
        }
        let lo = min;
        let hi = max;
        if (range !== '*') {
            const dash = range.indexOf('-');
            if (dash !== -1) {
                lo = parseInt(range.slice(0, dash), 10);
                hi = parseInt(range.slice(dash + 1), 10);
            } else {
                lo = parseInt(range, 10);
                hi = lo;
            }
        }
        if (Number.isNaN(lo) || Number.isNaN(hi)) continue;
        if (value >= lo && value <= hi && (value - lo) % step === 0) return true;
    }
    return false;
}

/** True si `date` (précision minute) satisfait l'expression cron 5 champs. */
export function matchesCron(expr: string, date: Date): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    const [min, hour, dom, month, dow] = parts;
    return (
        fieldMatches(min, date.getUTCMinutes(), 0, 59) &&
        fieldMatches(hour, date.getUTCHours(), 0, 23) &&
        fieldMatches(dom, date.getUTCDate(), 1, 31) &&
        fieldMatches(month, date.getUTCMonth() + 1, 1, 12) &&
        fieldMatches(dow, date.getUTCDay(), 0, 6)
    );
}

/**
 * True si l'expression est due dans la fenêtre `(now - windowMinutes, now]`.
 * Aligner `windowMinutes` sur l'intervalle du tick (ex. 5) garantit que chaque
 * minute planifiée est couverte EXACTEMENT une fois (pas de double exécution),
 * en défense supplémentaire de l'idempotence propre des jobs.
 */
export function isCronDueWithin(expr: string, now: Date, windowMinutes: number): boolean {
    const w = Math.max(1, Math.floor(windowMinutes));
    for (let i = 0; i < w; i++) {
        if (matchesCron(expr, new Date(now.getTime() - i * 60_000))) return true;
    }
    return false;
}
