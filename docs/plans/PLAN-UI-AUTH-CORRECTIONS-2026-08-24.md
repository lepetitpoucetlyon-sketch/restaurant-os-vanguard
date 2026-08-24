# Plan de corrections UI + Auth + Sécurité — Restaurant OS

> **Auteur** : session `restaurant-ui-refonte` (Claude Code)
> **Date** : 2026-08-24 · **MAJ v2** avec section P-1 sécurité après audit 3-agents
> **État de départ** : commits `227c5012d` · `c349f186b` · `d11579742` · `ee9355c26` · `4110cad3c`
> **Objectif** : (1) colmater les failles de sécurité et RBAC identifiées par l'audit, (2) refermer la boucle sur les 3 bugs auth déjà fixés, (3) éliminer la dette structurelle latente, (4) finir la refonte visuelle sur les 18 pages ops restantes, (5) attester une qualité "impeccable" mesurable.

---

## Sommaire

- [0. Contexte & prérequis](#0-contexte--prérequis)
- [**P-1 — Sécurité & RBAC (nouvelle, 3–5 j) — À FAIRE EN PREMIER**](#p-1--sécurité--rbac-35-j--à-faire-en-premier)
- [P0 — Fermeture bugs restants (½–1 j)](#p0--fermeture-bugs-restants-½1-j)
- [P1 — Dette structurelle (2–3 j)](#p1--dette-structurelle-23-j)
- [P2 — Refonte visuelle complète (10 j)](#p2--refonte-visuelle-complète-10-j)
- [P3 — Certification impeccable (3–5 j)](#p3--certification-impeccable-35-j)
- [Séquencement recommandé](#séquencement-recommandé)
- [Definition of Done](#definition-of-done)
- [Annexes](#annexes)

---

## 0. Contexte & prérequis

### 0.1 État des lieux (post commits déjà landés)

| Livré | Détail | Files |
|---|---|---|
| 4 pages custom-refondues | POS, KDS, floor-plan, réservations avec header éditorial + action groups | `src/app/(client)/(ops)/{pos,floor-plan,reservations}/page.tsx` + `src/modules/ops/production/kds/components/KDSHeader.tsx` |
| PageShell v2 | Kicker + Playfair 34px + `<PageShell.{Group,CTA,Tab,Fraction}>` | `src/shared/components/ui/PageShell.tsx` |
| 10 pages migrées | `kicker` explicite + sub-components | inventory, haccp, bar, finance, menu-builder, facility, migration, suppliers, settings/branding, pms |
| 3 bugs auth fixés | (1) dev PIN persist, (2) AuthGate loading fence, (3) authedFetch dev bypass | `useNexusAuthLogic.ts` · `AuthSession.tsx` · `AuthGate.tsx` · `authedFetch.ts` |

### 0.2 Ce qui reste

**🔴 Sécurité critique** (identifié par audit 3-agents 2026-08-24) :
- **28 routes API sans auth guard** (contracts/sign, card-imprint, accounting-portal exports, billing, callback bancaire, promotions, push, widget public…)
- **6 ActionGuards / PageGuard manquants côté client** (FEC export, clôture Z, banque, KDS bump_order, accounting-portal entière, POS void)
- **`FinanceEntrySchema.lines: z.array(z.any())`** — lignes comptables non typées → NF525 fragile
- **8 pages ops avec `<Tabs>` sans `<TabGuard>`** — trou RBAC per-onglet
- **Login PIN `try{}catch{}` swallow** — DX cassée
- **2 toggles floor-plan gelés** (`_setViewMode`, `_setShowGrid`) — feature morte

**Latent** : 2 duplications de code, 1 token manquant, 2 breakpoint tokens manquants.

**Visuel** : 18 pages ops non refondues, 15 modules dashboards non touchés, 4 pages custom mixant tokens et valeurs hardcodées.
- 28 hardcodes `bg-white/[…]` (invisible light mode)
- 232 `text-white` sans variante `dark:`
- 88 hex hardcodés en JSX
- 85 `text-[8-10px]` dans ops (1147 dans modules)
- 217 combos `font-black + uppercase + tracking-widest`
- 4 copies exactes d'un chip → à extraire en `<ToolbarChip>`

**Qualité** : `/impeccable critique|polish|audit` jamais lancé en full-pass. Hook design pas encore en CI.

### 0.3 Contraintes rappelées

- **Sidebar / Topbar / MobileNavBar / navConfig** : délégués à la session `antigravity-scrapling-nav` avec consigne 2026-08-24 (aligner sur PageShell v2). Cf. `.claude/sessions.md`.
- **Verticales gym / coworking / florist / veterinary** : verrouillées par `item2-3-perf-parite`
- **0 composant existant supprimé** (contrainte user rappelée dans les 2 commits UI)
- `npm run preflight` doit rester vert à chaque commit
- Session Claude Code inscrite dans `.claude/sessions.md` sous `restaurant-ui-refonte` (active, partagée avec Antigravity)

### 0.4 Coordination Antigravity (nav)

**Handover explicite** — la session `antigravity-scrapling-nav` reçoit la mission d'aligner la nav sur le nouveau design. Livrables attendus :
- `DesktopSidebar.tsx` : items (40+) en `text-sm font-medium tracking-tight` (fini le `text-[9-10px] font-black uppercase tracking-widest`), section headers en Playfair italic 11px kicker, active state = underline gold ou `bg-accent-gold/12`
- `DesktopTopbar.tsx` : search + branding + user chip → conteneur `bg-surface-glass border border-border/40 rounded-xl` avec dividers, tokens uniquement
- `MobileNavBar.tsx` : bottom nav 4-5 items, icons 20-22px, labels 11px medium, active tab underline top 2px gold, `bg-surface-card/95 backdrop-blur-xl`
- `navConfig.ts` : ajouter les tuiles vers `/suppliers`, `/kiosk`, `/pms`, `/hygiene` (créées dans le commit `1a13093c2`) qui existent mais ne sont pas dans le menu → trou UX

**Interface partagée** : Antigravity peut consommer `PageShell.tsx` (v2) pour réutiliser les sous-composants `<PageShell.Group>`, `<PageShell.Tab>` s'il veut factoriser.

---

## P-1 — Sécurité & RBAC (3–5 j) — À FAIRE EN PREMIER

> **Section ajoutée le 2026-08-24 après audit 3-agents.**
> Cette catégorie recouvre les failles P0 identifiées : 28 routes API sans auth, 6 ActionGuards manquants, `FinanceEntrySchema.lines` non typé, 8 pages ops sans TabGuard, login PIN swallow. Toutes ces failles sont **exposables à un utilisateur non authentifié ou à un rôle sous-privilégié**. Elles doivent être colmatées **avant** toute refonte visuelle supplémentaire.

### P-1.1 · 28 routes API non gardées — audit et gate

**Fichiers concernés** (les plus critiques listés par sévérité) :

**🔴 Signature contrats / cartes / exports comptables** :
- `tenant/contracts/[contractId]/sign` — signature contrat client
- `reservations/card-imprint` — empreinte carte bancaire
- `finance/accounting-portal/{transmit,pack,summary}` — exports FEC comptables

**🔴 Facturation / callbacks bancaires** :
- `billing/{signup,dunning}`
- `finance/bank/callback`

**🟠 Réservations / promotions / push / connecteurs** :
- `google/reserve/{bookings,merchants,availability,services}`
- `promotions`, `push/send`, `resolve-domain`
- `widget/{book,setup-intent,availability}`
- `connectors/{reservations,reviews}/sync`
- `haccp/iot-push`, `facility/hardware/diagnostics`
- `mcc/contracts`, `tenant/api-keys/validate`, `tenant/domain/check`
- `auth/google/callback`, `cron/{daily-backup,weekly-report}` (Vercel cron — token secret Vercel requis)

Tous sous `src/app/api/**/route.ts`.

**Fix pattern** — créer un helper serveur unifié `requireAnyAuth` :
```ts
// src/lib/server/requireAnyAuth.ts
import { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { DEV_PIN_BYPASS_HEADER } from '@/lib/authConstants';

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: 'admin' | 'directeur' | 'manager' | /* … */;
  isDevBypass: boolean;
};

export async function requireAnyAuth(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization') ?? '';

  // 1. Dev bypass — accepté SEULEMENT en NODE_ENV=development
  if (
    process.env.NODE_ENV === 'development' &&
    authHeader === DEV_PIN_BYPASS_HEADER
  ) {
    return {
      userId: 'dev-admin',
      tenantId: process.env.DEV_TENANT_ID ?? '__dev__',
      role: 'admin',
      isDevBypass: true,
    };
  }

  // 2. Firebase JWT (production + tenants réels)
  if (!authHeader.startsWith('Bearer ')) {
    throw new Response(null, { status: 401 });
  }
  const token = authHeader.slice(7);
  const decoded = await verifyIdToken(token);
  return {
    userId: decoded.uid,
    tenantId: decoded.tenantId,
    role: decoded.role,
    isDevBypass: false,
  };
}
```

**Migration** :
```ts
// Avant
export async function POST(req: NextRequest) {
  const body = await req.json();
  // ... logique métier
}

// Après
import { requireAnyAuth } from '@/lib/server/requireAnyAuth';

export async function POST(req: NextRequest) {
  const auth = await requireAnyAuth(req);  // throws 401 si pas d'auth
  const body = await req.json();
  // ... logique métier + auth.tenantId scope check
}
```

**Verification** :
- Test manuel : sans header Authorization, chaque route retourne 401 (pas 200)
- Test Playwright : parcours dev PIN 9999 → toutes les routes tenant renvoient 200
- Grep `requireAnyAuth|requireTenantUser|adminAuthGuard|verifyIdToken` sur les route.ts doit exclure les 4 endpoints publics légitimes (health, status, menu.json, manifest.ts, webhooks/*) et ne rien laisser d'autre non gardé.

**Estimation** : ~1 j (créer helper + migrer 28 routes en batch)

---

### P-1.2 · 6 ActionGuards / PageGuard manquants côté client

**Fixes atomiques** :

**a) `accounting-portal/page.tsx` — pas de PageGuard**
- Wrapper `export default withPageGuard(AccountingPortalPage, 'accounting_portal')` (comme les 33 autres pages ops)
- Supprimer `tenantId: 'demo-restaurant'` hardcoded en ligne 76 → lire depuis `useTenant().activeTenantId`

**b) `AuditTab.tsx:27` — bouton "Exporter FEC" nu**
```tsx
// Avant
<button onClick={handleExportFEC}>Exporter FEC</button>

// Après
<ActionGuard page="finance" action="export_fec">
  <button onClick={handleExportFEC}>Exporter FEC</button>
</ActionGuard>
```

**c) `AccountingTab.tsx:181` — clôture Z avec permission fantôme `close_period`**
- `DEFAULT_ACTION_ACCESS.finance` définit `seal_zday`, pas `close_period`
- Changer `useActionPermission("finance", "close_period")` → `useActionPermission("finance", "seal_zday")`
- Sinon la guard tombe en fallback (peut être autorisée pour n'importe qui selon le fallback)

**d) `BankTab.tsx:54,62` — `onConnectBank` + `onSync` nus**
- Ajouter dans `DEFAULT_ACTION_ACCESS.finance` : `reconcile_bank: ['admin','directeur','comptable']`
- Wrapper les 2 boutons dans `<ActionGuard page="finance" action="reconcile_bank">`

**e) `KDSTicket.tsx:137-155` — `bump_order` nu**
- Wrapper le bouton `handleMarkReady` dans `<ActionGuard page="kds" action="bump_order">`
- Ajouter `clear_station` à la matrice si un bouton dédié existe

**f) `CartItemContextMenu.tsx` — `void_line` nu (POS)**
- Le context menu propose "Annuler ligne" sans guard côté action (déjà gardé au niveau page via `refundPerm`, mais le fallback UI reste cliquable)
- Wrapper le menu item dans `<ActionGuard page="pos" action="void_line" fallback={<DisabledItem/>}>`

**g) `FinanceDashboard.tsx:101` — mauvaise sémantique**
- "Note de frais" gardé par `export_fec` → changer pour `create_expense_claim`
- Ajouter `create_expense_claim` à la matrice avec les rôles pertinents (`admin`, `directeur`, `manager`, `comptable`)

**Estimation** : ~½ j (7 fixes atomiques)

---

### P-1.3 · `FinanceEntrySchema.lines` typage NF525

**Problème** : `finance/domain/schemas/finance.ts:44`
```ts
lines: z.array(z.any()),  // ⚠️ NF525 broken
```

**Fix** :
```ts
// Créer d'abord FinanceEntryLineSchema
export const FinanceEntryLineSchema = z.object({
  id: z.string(),
  accountNumber: z.string().regex(/^[0-9]{6,8}$/),   // PCG français
  accountLabel: z.string(),
  debitInMicrounits: MicrounitsSchema.default(0),
  creditInMicrounits: MicrounitsSchema.default(0),
  vatRate: TaxRateSchema.optional(),
  reference: z.string().optional(),
  journalCode: z.string(),
});

export type FinanceEntryLine = z.infer<typeof FinanceEntryLineSchema>;

// Puis remplacer
lines: z.array(FinanceEntryLineSchema)
  .min(2, 'Une écriture doit avoir au moins 2 lignes (partie double)')
  .refine(
    (lines) => {
      const totalDebit = lines.reduce((s, l) => s + l.debitInMicrounits, 0);
      const totalCredit = lines.reduce((s, l) => s + l.creditInMicrounits, 0);
      return totalDebit === totalCredit;
    },
    { message: 'Débit ≠ Crédit — écriture non équilibrée (viole la partie double)' }
  ),
```

**Impact potentiel** : les JournalEntry existants avec `lines` incorrectement typés peuvent échouer à la validation Zod runtime. Prévoir migration ou `.catch()` en fallback avec log.

**Vérifier aussi** :
- `TreasuryCalculator.ts:25` qui consomme `entry.lines` avec `as any` — retirer le cast une fois typé
- Tests unitaires sur `FinanceEntry` pour couvrir la partie double

**Estimation** : ~½ j (typage + migration + tests)

---

### P-1.4 · 8 pages ops avec `<Tabs>` sans `<TabGuard>`

Pages concernées (checklist) :
- [ ] `accounting-portal/page.tsx`
- [ ] `mon-espace/page.tsx`
- [ ] `leaves/page.tsx`
- [ ] `crm/page.tsx`
- [ ] `marketing/page.tsx`
- [ ] `marketing/seo/page.tsx`
- [ ] `bar/page.tsx`
- [ ] `migration/page.tsx`

Tous sous `src/app/(client)/(ops)/`.

**Pattern à appliquer** :
```tsx
// Avant
<TabsTrigger value="stock">Stocks</TabsTrigger>

// Après
<TabGuard pageKey="crm" tabKey="reports">
  <TabsTrigger value="reports">Rapports</TabsTrigger>
</TabGuard>
```

Chaque page a ses tabs à identifier — utiliser `DEFAULT_TAB_ACCESS` dans `rbac.schemas.ts` comme source. Si un tab n'y est pas défini, l'ajouter en collaboration avec le user.

**Estimation** : ~½ j (8 pages × ~4 min chacune)

---

### P-1.5 · Login PIN swallow + toggles gelés

**a) Login PIN swallow** — `useNexusAuthLogic.ts:75`
```ts
// Avant
try {
  const cloudResult = await attemptCloudLogin(...);
  if (cloudResult !== null) return cloudResult;
  return await attemptDevLogin(...);
} catch { return false; }

// Après
try {
  const cloudResult = await attemptCloudLogin(...);
  if (cloudResult !== null) return cloudResult;
  return await attemptDevLogin(...);
} catch (err) {
  logger.error('[login] échec authentification', { userId, error: err });
  // Éventuellement remonter un toast au user via un event bus
  return false;
}
```

**b) `accounting-portal/page.tsx:22` — isLoading orphelin**
```ts
// Avant
const [, setIsLoading] = useState<boolean>(true);
// isLoading n'est jamais consommé — spinner impossible

// Après
const [isLoading, setIsLoading] = useState<boolean>(true);
// Puis afficher <Loader2 spin /> quand isLoading === true
```

**c) `floor-plan/page.tsx:47-48` — toggles morts**
```ts
// Avant
const [viewMode, _setViewMode] = useState<'2d' | '3d'>('2d');
const [showGrid, _setShowGrid] = useState(true);

// Après
const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
const [showGrid, setShowGrid] = useState(true);
// Puis câbler les boutons toggle qui existent dans le toolbar
```

**d) `FinanceDashboard.tsx:101` — action fausse**
- Cf. P-1.2.g

**Estimation** : ~2 h

---

### Séquencement recommandé P-1

| Jour | Item | Charge |
|---|---|---|
| J1 matin | P-1.1 helper `requireAnyAuth` | 3 h |
| J1 aprem | P-1.1 migration 28 routes en batch (5 min/route) | 3 h |
| J2 matin | P-1.2 les 7 ActionGuards | 4 h |
| J2 aprem | P-1.4 les 8 TabGuards | 3 h |
| J3 | P-1.3 typage FinanceEntryLine + migration + tests | 1 j |
| J4 | P-1.5 quatre correctifs runtime | 3 h |
| J5 | Verification cross-matrix Playwright RBAC | 1 j |

**Total P-1 : ~5 jours** — bloque **tout** commit visuel (P0/P1/P2/P3) tant que ces failles ne sont pas colmatées.

---

## P0 — Fermeture bugs restants (½–1 j)

### P0.1 · Vérifier `adminAuthGuard` accepte `mcc-dev-bypass` sur routes tenant

**Symptôme** : `authedFetch` envoie maintenant `Bearer mcc-dev-bypass` en dev PIN (fix précédent). Mais si le guard serveur ne l'accepte que sur `/api/admin/*`, tous les appels tenant (`/api/tenant/*`, `/api/v1/*`) retournent 401/404 en dev.

**Fichiers à inspecter** :
```
src/lib/mcc/adminAuthGuard.ts   # ou équivalent — chercher où le header Authorization est parsé serveur
src/app/api/tenant/**/*.ts       # route handlers tenant — comment vérifient-ils l'auth ?
src/app/api/v1/**/*.ts           # route handlers v1
```

**Commandes de diagnostic** :
```bash
grep -rn "mcc-dev-bypass" src/lib src/app/api | head
grep -rn "adminAuthGuard\|requireTenantUser\|requireAuth" src/app/api/tenant src/app/api/v1 2>/dev/null | head
```

**Fix attendu** :
- Si les guards tenant refusent `mcc-dev-bypass` → étendre un guard commun `requireAnyAuth(req)` qui accepte : (a) JWT Firebase, (b) `mcc-dev-bypass` header **si** `process.env.NODE_ENV === 'development'`.
- Créer un helper `src/lib/server/devAuthBypass.ts` qui centralise la logique côté serveur (symétrique de mon fix client).

**Verification** :
1. `npm run dev`
2. Login PIN 9999 → aller sur `/pos`
3. DevTools > Network : filtrer sur `/api/tenant` et `/api/v1`
4. Chaque appel doit retourner 200 (pas 401/404)
5. Vérifier notamment `/api/tenant/onboarding/status` (appelé par `login/page.tsx`)

**Definition of Done** :
- 0 requête auth 401/404 en dev PIN sur navigation POS → KDS → Floor-Plan → Réservations → Inventory → Finance
- Test dans les logs preview : `preview_logs --level error` doit être vide

---

### P0.2 · Extraire `executive_dev_bypass_active` en constante partagée

**Problème** : le string `'executive_dev_bypass_active'` est dupliqué à 3 endroits :
- `src/shared/providers/hooks/useNexusAuthLogic.ts:50`
- `src/shared/providers/hooks/auth/AuthSession.tsx:12`
- `src/lib/client/authedFetch.ts:5`

Un renommage silencieux dans un seul fichier fait dériver l'auth dev sans aucun signal de compilation.

**Fix** :

1. Créer `src/lib/authConstants.ts` :
```ts
/**
 * Constantes partagées entre le client (attemptDevLogin, AuthSession, authedFetch)
 * et le serveur (adminAuthGuard) pour le bypass PIN dev tenant.
 * NE PAS RENOMMER SANS METTRE À JOUR LES 3 CALL SITES + adminAuthGuard.
 */
export const DEV_PIN_BYPASS_KEY = 'executive_dev_bypass_active';
export const DEV_PIN_BYPASS_HEADER = 'Bearer mcc-dev-bypass';
```

2. Remplacer dans les 3 fichiers :
```diff
- window.sessionStorage.setItem('executive_dev_bypass_active', userId);
+ window.sessionStorage.setItem(DEV_PIN_BYPASS_KEY, userId);

- const DEV_BYPASS_KEY = 'executive_dev_bypass_active';
+ import { DEV_PIN_BYPASS_KEY as DEV_BYPASS_KEY } from '@/lib/authConstants';

- const DEV_PIN_BYPASS_KEY = 'executive_dev_bypass_active';
+ import { DEV_PIN_BYPASS_KEY } from '@/lib/authConstants';
```

**Verification** :
- `grep -rn "'executive_dev_bypass_active'" src/` doit retourner **1 seul** hit (le fichier authConstants.ts)
- `npx tsc --noEmit` vert
- Login dev PIN 9999 fonctionne toujours

**Definition of Done** :
- 1 constante, 3+ consommateurs, 0 hardcode ailleurs

---

## P1 — Dette structurelle (2–3 j)

### P1.1 · Token `--color-surface-glass` dans `globals.css`

**Problème** : `bg-white/[0.03]` est hardcodé ~40× dans les 4 pages custom + PageShell v2. Cette valeur ne s'inverse pas en light-mode (blanc sur blanc → invisible).

**Fix** :

1. Ajouter dans `src/app/globals.css` bloc `@theme` (après `--color-surface-card`) :
```css
/* Glass tint — surface secondaire semi-transparente, s'inverse en light mode */
--color-surface-glass: rgb(255 255 255 / 0.03);
--color-surface-glass-hover: rgb(255 255 255 / 0.05);
--color-surface-glass-active: rgb(255 255 255 / 0.08);
```

2. Ajouter la version light-mode (bloc `[data-theme="light"]` déjà présent) :
```css
[data-theme="light"] {
  --color-surface-glass: rgb(0 0 0 / 0.03);
  --color-surface-glass-hover: rgb(0 0 0 / 0.05);
  --color-surface-glass-active: rgb(0 0 0 / 0.08);
}
```

3. Remplacer les hardcodes (Tailwind v4 génère `bg-surface-glass` automatiquement) :
```
Files à modifier :
- src/shared/components/ui/PageShell.tsx
- src/app/(client)/(ops)/pos/page.tsx
- src/app/(client)/(ops)/floor-plan/page.tsx
- src/app/(client)/(ops)/reservations/page.tsx
- src/modules/ops/production/kds/components/KDSHeader.tsx
```

Remplacement pattern (utiliser `sed` ou Edit) :
- `bg-white/[0.03]` → `bg-surface-glass`
- `bg-white/[0.05]` → `bg-surface-glass-hover`

**Verification** :
- `grep -rn "bg-white/\[" src/` doit retourner 0 hit après migration
- Toggle theme dark → light dans DevTools : les surfaces restent visibles dans les 2 modes
- Screenshot Playwright : diff < 2% par surface entre light et dark après migration

---

### P1.2 · Breakpoints tokens dans `globals.css`

**Problème** : `DESIGN.md` déclare `--bp-mobile/tablet/desktop/kiosk` mais **rien** n'est déclaré dans `globals.css @theme`. Résultat : `useBreakpoint` (JS) et Tailwind (classes `md:`, `lg:`) utilisent des sources différentes → dérive garantie.

**Fix** :

1. Ajouter dans `globals.css @theme` :
```css
/* Breakpoints alignés avec useBreakpoint + Tailwind v4 (émet md:, lg:, xl:, 2xl:) */
--breakpoint-sm: 40rem;    /* 640px  — mobile portrait, PDA */
--breakpoint-md: 48rem;    /* 768px  — mobile paysage / tablette */
--breakpoint-lg: 64rem;    /* 1024px — iPad landscape, tablette KDS chef */
--breakpoint-xl: 90rem;    /* 1440px — poste caisse fixe, écran mural KDS */
--breakpoint-2xl: 100rem;  /* 1600px — kiosk grand format, drive-thru */
```

2. Mettre à jour `src/shared/hooks/useBreakpoint.ts` pour lire ces mêmes valeurs :
```ts
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  kiosk: 1600,
} as const;
// Doit correspondre à --breakpoint-* dans globals.css
```

3. Documenter dans `DESIGN.md` que les 2 sources sont synchronisées.

**Verification** :
- `useBreakpoint` retourne `'mobile'` en dessous de 640, `'tablet'` entre 640-1024, etc.
- Redimensionner la fenêtre navigateur : `<ResponsiveShell>` swap au bon breakpoint

---

### P1.3 · Migrer `FinanceHeaderNav` vers `PageShell.Tab`

**Problème** : `FinanceDashboard.tsx` a 2 headers empilés — le PageShell v2 en haut, puis un vieux `FinanceHeaderNav` en-dessous avec tabs anti-pattern (`text-[9px] font-black uppercase tracking-widest`).

**Fichiers** :
- `src/modules/finance/components/FinanceDashboard.tsx`
- `src/modules/finance/components/dashboard/FinanceHeaderNav.tsx`

**Fix** :
1. Dans `FinanceDashboard.tsx`, passer les 5 tabs (`accounting`, `billing`, `bank`, `treasury`, `audit`) via la prop `tabs={…}` de `<PageShell>` avec `PageShell.Tab` (déjà utilisé sur inventory)
2. Supprimer le composant `FinanceHeaderNav` OU le laisser mais retirer son bandeau de la page (le garder si utilisé ailleurs)
3. Vérifier les 5 vues sous-jacentes (`AccountingTab`, `BillingTab`, `BankTab`, `TreasuryTab`, `AuditTab`) — elles restent inchangées

**Verification** :
- Ouvrir `/finance` en dev, cliquer sur chaque tab, aucune régression
- L'ancien header disparaît, seul PageShell v2 avec les 5 tabs underlined

---

### P1.4 · Wrapper `DevAuthBridge` (optionnel, recommandé)

**Rationale** : le fix dev-bypass touche 4 fichiers qui doivent partager une logique. Un module dédié rend l'ensemble plus robuste.

**Créer** `src/lib/auth/DevAuthBridge.ts` :
```ts
import { DEV_PIN_BYPASS_KEY } from '@/lib/authConstants';

/** Marque une session dev active (appelé par attemptDevLogin en dev). */
export function markDevBypassActive(userId: string): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DEV_PIN_BYPASS_KEY, userId);
}

/** Retire le marqueur (logout ou wipe). */
export function clearDevBypass(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(DEV_PIN_BYPASS_KEY);
}

/** Vérifie si un bypass dev est actif (client-side seulement). */
export function isDevBypassActive(): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(DEV_PIN_BYPASS_KEY) !== null;
}
```

Consommateurs à réécrire :
- `useNexusAuthLogic.attemptDevLogin` → `markDevBypassActive(userId)`
- `AuthSession.onAuthStateChanged` null-branch → `isDevBypassActive()`
- `AuthSession.clearPersistedSession` → `clearDevBypass()`
- `authedFetch` → `isDevBypassActive()`

**Bénéfice** : 1 module = 1 responsabilité, tests unitaires triviaux, impossible de désynchroniser.

---

## P2 — Refonte visuelle complète (10 j)

### P2.1 · Extraire les headers custom en sous-composants réutilisables

**Objectif** : les 4 pages custom (POS, KDS, floor-plan, réservations) ne peuvent pas utiliser PageShell v2 car elles ont des layouts opérationnels spécifiques. Mais leurs **headers** partagent le même pattern (kicker + big title + action groups). Extraire ces headers en composants dédiés.

**Créer** :
- `src/modules/ops/service/pos/components/PosHeader.tsx` — extrait du header POS
- `src/modules/ops/production/kds/components/KDSHeader.tsx` (déjà refactoré, à noter)
- `src/modules/facility/spaces/components/FloorPlanHeader.tsx` — extrait du toolbar floor-plan
- `src/modules/commerce/relation/reservations/components/ReservationsHeader.tsx` — extrait du toolbar réservations

**Contrat** : chaque header reçoit ses props (currentTable, isRushMode, categories, etc.) et retourne un JSX qui utilise les mêmes primitives que PageShell (kicker Playfair italic + big title + `PageShell.Group` + `PageShell.CTA` + `PageShell.Fraction`).

**Bénéfice** : si demain on change le style du kicker (ex : passer de italic à bold), on modifie un seul endroit (PageShell.tsx) et les 4 pages custom + 12 pages PageShell suivent.

---

### P2.2 · 18 pages ops restantes — migration en batch

**Pages concernées** (checklist) :
- [ ] `src/app/(client)/(ops)/crm/page.tsx`
- [ ] `src/app/(client)/(ops)/marketing/page.tsx`
- [ ] `src/app/(client)/(ops)/marketing/seo/page.tsx`
- [ ] `src/app/(client)/(ops)/intelligence/page.tsx`
- [ ] `src/app/(client)/(ops)/analytics/page.tsx`
- [ ] `src/app/(client)/(ops)/timeclock/page.tsx`
- [ ] `src/app/(client)/(ops)/planning/page.tsx`
- [ ] `src/app/(client)/(ops)/staff/page.tsx`
- [ ] `src/app/(client)/(ops)/leaves/page.tsx`
- [ ] `src/app/(client)/(ops)/recruitment/page.tsx`
- [ ] `src/app/(client)/(ops)/accounting-portal/page.tsx`
- [ ] `src/app/(client)/(ops)/operations/page.tsx`
- [ ] `src/app/(client)/(ops)/franchise/page.tsx`
- [ ] `src/app/(client)/(ops)/aide/page.tsx`
- [ ] `src/app/(client)/(ops)/mon-espace/page.tsx`
- [ ] `src/app/(client)/(ops)/onboarding/page.tsx`
- [ ] `src/app/(client)/(ops)/vanguard-simulator/page.tsx`
- [ ] `src/app/(client)/(ops)/welcome-staff/page.tsx`
- [ ] `src/app/(client)/(ops)/pos-mobile/page.tsx`
- [ ] `src/app/(client)/(ops)/nf525/page.tsx`
- [ ] `src/app/(client)/(ops)/registre/page.tsx`
- [ ] `src/app/(client)/(ops)/integrations/page.tsx`
- [ ] `src/app/(client)/(ops)/menu-engineering/page.tsx`
- [ ] `src/app/(client)/(ops)/kiosk/page.tsx`

**Pattern à appliquer** (30 min/page maximum) :

```tsx
// AVANT
export default function XxxPage() {
  return (
    <div>
      {/* header ad-hoc avec text-[9px] font-black uppercase */}
      <div className="...">...</div>
      {/* body */}
      <div>...</div>
    </div>
  );
}

// APRÈS
import { PageShell } from '@/shared/components/ui/PageShell';
import { XxxIcon } from 'lucide-react';

function XxxPage() {
  return (
    <PageShell
      kicker="Sous-catégorie"      // ex: "Effectifs", "Analytics", "Support"
      title="Nom éditorial court"   // titre "Playfair" affiché en 34px
      subtitle="Description utile en 1 phrase."
      icon={XxxIcon}
      breadcrumbs={[{ label: 'Opérations' }, { label: 'Nom court' }]}
      actions={/* si applicable, sinon rien */}
      tabs={/* si applicable, sinon rien */}
    >
      {/* body reste identique */}
    </PageShell>
  );
}
export default withPageGuard(XxxPage, 'xxx');
```

**Kickers suggérés par pilier** :
- Human : `Effectifs`, `Paie`, `Recrutement`
- Commerce : `Marketing`, `Fidélité`, `Clients`
- Intelligence : `IA`, `Analytics`, `Reporting`
- Compliance : `Conformité`, `Registres`, `Rappels`
- Facility : `Maintenance`, `Espaces`
- Ops : `Service`, `Production`, `Cuisine`

**Verification par page** :
1. `npx tsc --noEmit` vert
2. Preview visuel : le nouveau header apparaît, ancien header supprimé, contenu identique
3. Hook impeccable : 0 issue

---

### P2.3 · Modules dashboards (behind coquilles)

**Contexte** : 15 pages ops sont des coquilles fines (10–22 lignes) qui délèguent à un `<XDashboard />` d'un module. Ex :
```tsx
// src/app/(client)/(ops)/kds/page.tsx
function KdsPage() { return <KDSDashboard />; }
export default withPageGuard(KdsPage, 'kds');
```

C'est le `KDSDashboard` (dans `src/modules/ops/production/kds/`) qui contient le vrai code UI. Le refactor doit se faire dans le module, pas dans la page.

**Dashboards à refactorer** (ordre priorité) :
1. `src/modules/human/effectifs/hr/components/PlanningDashboard.tsx` (déjà touché partiellement)
2. `src/modules/human/effectifs/hr/components/StaffDashboard.tsx`
3. `src/modules/human/effectifs/hr/components/TimeclockDashboard.tsx`
4. `src/modules/human/effectifs/hr/components/RecruitmentDashboard.tsx`
5. `src/modules/intelligence/analytique/analytics/components/AnalyticsDashboard.tsx`
6. `src/modules/intelligence/ia/hub/components/IntelligenceDashboard.tsx`
7. `src/modules/finance/comptabilite/fiscal/components/NF525Dashboard.tsx`
8. `src/modules/compliance/reglementaire/registre/components/RegistreDashboard.tsx`
9. `src/modules/facility/spaces/components/FacilityDashboard.tsx`
10. `src/modules/commerce/relation/crm/components/CustomerDashboard.tsx`

**Chaque dashboard** :
- Extraire son header actuel
- Le remplacer par un simple `<>{children}</>` (le PageShell parent est déjà dans la coquille de page)
- OU déplacer le PageShell dans le dashboard si la coquille est vraiment vide

Estimation : ~1 j par dashboard (varie selon complexité) = 10–15 j pour les 15.

---

## P3 — Certification impeccable (3–5 j)

### P3.1 · Run `/impeccable critique` full-pass

Sur les 10 pages critiques (POS, KDS, floor-plan, réservations, inventory, haccp, bar, finance, planning, staff) :

```bash
# Chaque page a besoin d'un dev server actif
npm run dev &

# Pour chaque URL, run :
# (Claude Code invoquera le skill via son API)
/impeccable critique http://localhost:3001/pos
/impeccable critique http://localhost:3001/kds
# ... etc
```

**Output attendu** : un rapport JSON de findings (UX, hiérarchie, cognitive load, empty states, error states). À dépister par le développeur ou fixer inline.

**Livrable** : `docs/impeccable/critique-baseline-2026-08-24.md` avec pour chaque page :
- Score /100
- Top 5 findings
- Findings appliqués vs différés

---

### P3.2 · Run `/impeccable polish` en pass final

Après P3.1, sur chaque page :
```
/impeccable polish http://localhost:3001/xxx
```

**Ce que fait polish** :
- Ajuste micro-spacings (padding rythme, gutter grid)
- Aligne les baseline typographiques
- Renforce les contrastes limites AA
- Uniformise les motion easings

---

### P3.3 · Run `/impeccable audit` (a11y + perf + responsive)

```
/impeccable audit http://localhost:3001/xxx --devices=mobile,tablet,desktop
```

**Sortie** :
- Contrastes WCAG AA/AAA par élément
- Lighthouse PWA + Performance scores
- Snapshots visuels par device (avec diff pixel)
- CLS/LCP/FID mesurés

**Livrable** : `docs/impeccable/audit-final-2026-08-24.md`

---

### P3.4 · Activer le hook design en CI

```bash
npx impeccable hooks on
```

**Effet** :
- Chaque `Edit` de fichier `.tsx` UI trigger un scan
- Si des findings apparaissent → build CI rouge
- Auto-repair simple pour les findings mineurs

**Fichier généré** : `.claude/skills/impeccable/hooks/config.json` — vérifier qu'il est commité.

**Rollout** :
- Semaine 1 : hook actif en warning-only (ne bloque pas les commits)
- Semaine 2 : hook bloquant
- Threshold : score qualité ≥ 90/100

---

## Séquencement recommandé

### Jours 1–5 — P-1 SÉCURITÉ (bloquant)
- **J1 matin** — P-1.1 helper `requireAnyAuth` créé
- **J1 aprem** — P-1.1 migration 28 routes en batch (5 min/route)
- **J2 matin** — P-1.2 les 7 ActionGuards
- **J2 aprem** — P-1.4 les 8 TabGuards
- **J3** — P-1.3 typage FinanceEntryLine + partie double + tests
- **J4** — P-1.5 quatre correctifs runtime (login swallow, isLoading, toggles floor-plan, action fausse)
- **J5** — Verification cross-matrix Playwright RBAC (page × rôle × 5 rôles clés)
- **Commits par item** :
  - `feat(server): requireAnyAuth helper + migration 28 routes`
  - `fix(rbac): 6 ActionGuards + 8 TabGuards manquants`
  - `feat(finance): FinanceEntryLine typé + partie double NF525`
  - `fix(auth): login PIN error surfaced + 3 toggles/loader revived`
  - `test(rbac): matrice cross-role Playwright snapshots`

### Jour 6 (½ j) — P0
- P0.1 : Vérifier adminAuthGuard + fix si besoin
- P0.2 : Extraire `authConstants.ts`
- **Commit** : `fix(auth): consolide DEV_PIN_BYPASS_KEY + serveur accepte dev header`

### Jour 7–8 — P1
- P1.1 : Token `--color-surface-glass`
- P1.2 : Breakpoints tokens synchronisés
- P1.3 : FinanceDashboard tabs migration
- P1.4 : DevAuthBridge (optionnel)
- **Commits** :
  - `feat(tokens): --color-surface-glass token + light/dark`
  - `feat(tokens): --breakpoint-* tokens alignés useBreakpoint`
  - `refactor(finance): FinanceHeaderNav → PageShell.Tab`
  - `refactor(auth): DevAuthBridge module` (si fait)

### Jour 9 — P2.1
- Extraire les headers des 4 pages custom en sous-composants
- **Commit** : `refactor(ops): extract PosHeader, FloorPlanHeader, ReservationsHeader`

### Jours 10–13 — P2.2
- 24 pages ops migration en batch (30 min/page)
- Grouper par commits par pilier :
  - `feat(ui): 4 pages human migrées PageShell v2`
  - `feat(ui): 5 pages intelligence + analytics migrées`
  - `feat(ui): 6 pages commerce + marketing migrées`
  - `feat(ui): 5 pages compliance + facility migrées`
  - `feat(ui): 4 pages misc migrées (aide, mon-espace, onboarding, integrations)`

### Jours 14–18 — P2.3
- 10–15 dashboards modules refactorés (1 j/dashboard)
- 1 commit par pilier finalisé

### Jours 19–22 — P3
- P3.1 critique full-pass + fix findings (2 j)
- P3.2 polish (½ j)
- P3.3 audit + snapshots (1 j)
- P3.4 hook design en CI (½ j)
- **Commits** :
  - `docs(impeccable): rapport critique baseline`
  - `chore(impeccable): polish micro-adjustments 10 pages`
  - `docs(impeccable): rapport audit final + snapshots`
  - `chore(ci): activer impeccable hook en warning-only`

### Jour 23 (bonus) — Rollout hook bloquant
- Passer le hook impeccable en mode blocking
- Update AGENTS.md pour documenter la gate

### Jalons parallèles Antigravity (session `antigravity-scrapling-nav`)
- **Handover J1** : consigne posée dans sessions.md (déjà fait 2026-08-24)
- **J2–J4** : refonte sidebar / topbar / mobile navbar dans le style Empire Luxury de PageShell v2
- **J5** : ajout des tuiles navConfig pour `/suppliers`, `/kiosk`, `/pms`, `/hygiene`
- **J6** : validation cross-vertical (7 verticales × 3 devices)
- Synchronisation quotidienne via `.claude/sessions.md` (progrès de la ligne)

---

## Definition of Done

Le projet est "terminé" quand **toutes** les conditions ci-dessous sont vraies :

### Sécurité (P-1 — priorité absolue)
- [ ] Grep des `route.ts` sans marqueur `requireAnyAuth|requireTenantUser|adminAuthGuard|verifyIdToken` retourne uniquement les 4 endpoints publics légitimes (health, status, menu.json, manifest.ts, webhooks/*)
- [ ] Test manuel : chaque route API rejetée en 401 sans header Authorization
- [ ] Test Playwright dev PIN 9999 : toutes les routes tenant renvoient 200
- [ ] `AccountingPortalPage` wrappé dans `withPageGuard`, `tenantId` lu depuis `useTenant()`
- [ ] Aucun bouton FEC/Z/Bank/bump/void sans `<ActionGuard>` (grep manuel)
- [ ] `FinanceEntrySchema.lines` typé strict + refine partie double (grep `z.any\(\)` dans finance/schemas retourne 0)
- [ ] 8 pages ops (accounting-portal, mon-espace, leaves, crm, marketing, marketing/seo, bar, migration) ont TabGuard sur tous leurs onglets
- [ ] `useNexusAuthLogic.login` logge les erreurs (plus de swallow)
- [ ] `floor-plan/page.tsx` : viewMode + showGrid opérables (toggles câblés)
- [ ] `accounting-portal/page.tsx` : isLoading affiche un vrai spinner

### Auth
- [ ] `grep -rn "'executive_dev_bypass_active'" src/` retourne 1 seul hit (le module central `authConstants.ts`)
- [ ] Login PIN 9999 fonctionne + navigation entre 10 routes ops sans re-login
- [ ] DevTools > Network : 0 requête 401/404 en dev PIN sur les routes tenant
- [ ] `npm run preflight` vert

### Tokens
- [ ] `grep -rn "bg-white/\[" src/` retourne 0 hit
- [ ] `grep -rn "text-white[^-]" src/` retourne uniquement des variantes avec `dark:` associée
- [ ] Toggle theme dark ↔ light dans DevTools : chaque surface reste lisible
- [ ] `useBreakpoint` et Tailwind `md:`/`lg:` retournent les mêmes valeurs

### UI
- [ ] 34 pages ops utilisent `<PageShell>` OU un header extract-composant partagé
- [ ] 15 dashboards modules refactorés
- [ ] Snapshot Playwright cross-matrix (page × rôle × device) diff < 5%
- [ ] Session Antigravity `antigravity-scrapling-nav` a livré sidebar + topbar + mobile navbar alignés Empire Luxury + tuiles /suppliers, /kiosk, /pms, /hygiene dans navConfig

### Impeccable
- [ ] `docs/impeccable/critique-baseline-2026-08-24.md` existe et affiche score ≥ 90 sur chaque page
- [ ] `docs/impeccable/audit-final-2026-08-24.md` existe avec preuve Lighthouse ≥ 90
- [ ] Hook design actif en CI

### Non-régression
- [ ] `npx tsc --noEmit` : 0 erreur
- [ ] `npx vitest run` : toutes vertes
- [ ] `sentrux check .` : baseline inchangée (ne pas dégrader cycles/god-files)
- [ ] 17 tests e2e Playwright existants restent verts
- [ ] Aucun composant du dépôt supprimé (contrainte user)

### Coordination
- [ ] Session `restaurant-ui-refonte` mise à jour dans `.claude/sessions.md` à chaque étape majeure
- [ ] Session `antigravity-scrapling-nav` a passé sa ligne à `terminée` (nav livrée)

---

## Annexes

### A. Fichiers délégués (session `restaurant-ui-refonte` ne les touche PAS)

**Délégués à `antigravity-scrapling-nav` avec consigne alignement PageShell v2 (2026-08-24)** :
- `src/shared/components/layout/DesktopSidebar.tsx`
- `src/shared/components/layout/DesktopTopbar.tsx`
- `src/shared/components/layout/MobileNavBar.tsx`
- `src/config/navConfig.ts` (avec ajout tuiles /suppliers, /kiosk, /pms, /hygiene)

**Verrous `item2-3-perf-parite`** (hors périmètre restaurant, sans impact) :
- `src/verticals/{gym,coworking,florist,veterinary}/`

### B. Commandes de vérification récurrentes

```bash
# TSC
npx tsc --noEmit --pretty false

# Tests
npx vitest run

# Preflight complet
npm run preflight

# Barrel + cycles
sentrux check .

# Hook impeccable manuel sur un fichier
npx impeccable detect src/app/(client)/(ops)/pos/page.tsx

# Preview
# (via Claude Code preview_start "dev")
```

### C. Signatures utiles

**PageShell v2 API** :
```tsx
<PageShell
  kicker="Sous-catégorie"                    // Playfair italic 11px uppercase
  title="Titre éditorial"                    // Playfair 34px black tracking-[-0.02em]
  subtitle="Une phrase descriptive."          // 14px muted
  icon={IconLucide}                          // 20px gold discreet
  breadcrumbs={[{ label: 'X' }, ...]}
  actions={<><PageShell.Group>...</PageShell.Group></>}
  tabs={<><PageShell.Tab active={...} icon={...}>...</PageShell.Tab></>}
  alert="rush" | "critical" | "warning" | "info"    // 2px ribbon top
  status={{ label: 'Rush', tone: 'rush' }}         // pulse dot + label
  variant="default" | "compact" | "flush" | "hero"
>
  {/* body */}
</PageShell>
```

**Impeccable commands** :
```
/impeccable critique <target>     # UX + hiérarchie + cognitive load
/impeccable polish <target>       # pass final micro
/impeccable audit <target>        # a11y + perf + responsive
/impeccable animate <target>      # motion review
/impeccable colorize <target>     # palette review
/impeccable harden <target>       # error/edge/i18n
/impeccable detect <url|file>     # scan déterministe (le hook)
```

---

**Fin du plan.**
