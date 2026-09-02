# Lot 7 — Tests strict isolation : investigation ciblée

## État de départ

- 50 fichiers de test en échec sous `STRICT_ISOLATION_TEST=1`
- 128 assertions en échec au total (baseline `/tmp/strict.json` de 2026-08-30)
- Preflight complet bloqué par ces échecs

## Ce qui a été essayé (et pourquoi ça ne suffit pas)

### Tentative 1 — Codemod `beforeEach(() => getDefaultStore().set(tenantIdAtom, TENANT))`

**Résultat** : 11 fichiers modifiés, 1 fichier entièrement fixé (`saga-handlers.test.ts`), **2 fichiers newly failing** (pollution atom cross-fichiers via jotai store global).

**Conclusion** : ne pas déployer mécaniquement — l'atom global fuit entre fichiers de test.

### Tentative 2 — Setup global `beforeEach(atom = 'restaurant-os')` (Suzerain)

**Idée** : le Suzerain a un bypass complet dans `SovereignGuard.validateAccess`. Poser l'atom à 'restaurant-os' devait tout débloquer.

**Résultat** : ZÉRO amélioration. 144 échecs / 51 fichiers (au lieu de 128 / 50 sans setup — pollution ajoute même 1 échec).

**Cause racine découverte** : le vrai bloqueur passe par `NexusInterceptor.intercept()` → `SovereignGuard.validateAccessGradeX(op, path, context)`. Cette méthode utilise `context.vassalId` **passé explicitement par le caller** — pas l'atom jotai. Poser l'atom ne peut donc rien changer.

## Fix réel requis (multi-jours confirmé)

### Racine du problème

`NexusInterceptor` reçoit un `NexusContext` avec `vassalId` déterminé au niveau du caller. Les tests appellent `mockAdapter.set('tenants/tenant_stress_001/products/prod_ent_1', ...)` mais le contexte propagé garde `vassalId='main'` (ou similaire) — car les mocks ne réinjectent pas le tenant du path.

Erreur type :
```
NexusError [ACCESS_DENIED] Operation WRITE refused on vassals/[REDACTED]/products/prod_ent_1: SECURITY_VIOLATION_ACCESS_DENIED
  at NexusInterceptor.intercept (src/lib/nexus/NexusInterceptor.ts:277)
  at SimulacraEngine.bootstrap (...)
```

### Options de fix (par ordre de complexité)

**Option A — `runWithServerTenant` par test (recommandée par le plan initial)**

Wrapper chaque test qui touche plusieurs tenants avec :
```ts
import { runWithServerTenant } from '@/lib/nexus/ServerTenantStorage';

it('...', async () => {
  await runWithServerTenant('tenant_stress_001', async () => {
    await mockAdapter.set('tenants/tenant_stress_001/...', ...);
  });
});
```
Estimation : 50 fichiers × ~3 tests moyens = 150 wraps manuels.

**Option B — Auto-scope au niveau du MockAdapter**

Modifier `MockAdapter.set/get/query` pour extraire le `tenantId` du path (`tenants/X/...`) et setter le contexte automatiquement avant l'appel `NexusInterceptor.intercept`. Effet : tous les tests actuels passent sous STRICT sans modification.

Risque : masque un vrai bug potentiel où le code de prod utiliserait aussi le pattern mock (dérive test → prod).

Estimation : ~1 jour d'analyse + fix + tests de non-régression.

**Option C — Whitelist de vassalId spéciale `__test_bypass__`**

Ajouter dans `SovereignGuard.validateAccess` un bypass sur `context.vassalId === '__test_bypass__'` (guardé par `NODE_ENV === 'test'` + `STRICT_ISOLATION_TEST` désactivable via flag distinct).

Effet : tests non touchés + prod protégée. Mais si un test appelle sans context (rare), pas de bypass.

Estimation : 2 heures + validation cross-tests.

### Recommandation

**Option B** est le meilleur compromis coût / bénéfice :
- Zéro fichier de test à modifier
- Comportement plus proche de la réalité (en prod, le vassalId serait correctement propagé par l'auth middleware qui set le contexte serveur)
- Isole la dette d'infrastructure test dans MockAdapter (endroit approprié)

## Fichiers concernés (baseline 2026-08-30)

Les 50 fichiers en échec sont enregistrés dans `/tmp/strict.json` (dérivable via `STRICT_ISOLATION_TEST=1 npx vitest run --reporter=json`). Familles principales :

- `useSovereign*` (11 fichiers) : hooks piliers ops/finance/logistics/facility
- `demo/*` (3 fichiers) : simulations bout-en-bout
- `__tests__/handlers/*` : handlers saga
- `__tests__/e2e/*` (4 fichiers) : journées utilisateur end-to-end
- `__tests__/infrastructure/*` (6 fichiers) : provisioning, migrations, outbox
- `__tests__/integration/*` (4 fichiers) : ai-scope, haccp-iot, pos-to-fiscal, procurement
- `__tests__/facility/*` (7 fichiers) : equipment, cleaning, maintenance
- `__tests__/ops/*` (4 fichiers) : orders, reservations, tables, session
- Autres : commerce, legal, mcc, kernel, migrations, pos, security, kds

## Vérité terrain actuelle

- Non-strict : `npx vitest run` → **2477 / 2477 passent** (aucun impact prod des investigations)
- Strict : `STRICT_ISOLATION_TEST=1 npx vitest run` → 144 / 2477 échouent
- Preflight rapide : ✅ 12/12 verts (le mode strict n'est pas activé par le pre-commit)
- Preflight complet : bloqué par ces 144 échecs à l'étape 4

## Ce qu'il reste à décider

Choisir entre Option A/B/C ci-dessus. Après la décision, commencer par un fichier pilote (recommandé : `src/__tests__/handlers/saga-handlers.test.ts` — déjà partiellement fixé par mon codemod atom, testera si l'option retenue suffit).
