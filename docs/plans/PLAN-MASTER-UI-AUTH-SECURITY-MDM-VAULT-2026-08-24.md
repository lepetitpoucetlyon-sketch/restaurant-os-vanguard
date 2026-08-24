# Plan Directeur Fusionné — UI, Auth, Sécurité Noyau, Flotte MDM & Coffre-fort Numérique

> **Statut** : Document de Référence Unique & Exhaustif (SSOT)  
> **Auteurs** : Antigravity IDE & Claude Code (Sessions `restaurant-ui-refonte` & `antigravity-scrapling-nav`)  
> **Date** : 2026-08-24 · **Version** : v3.1 Master Unified  
> **État de départ** : Commits `227c5012d` · `c349f186b` · `d11579742` · `ee9355c26` · `4110cad3c` · `1a13093c2`  
> **Objectifs** :
> 1. Colmater les failles critiques de sécurité et RBAC (28 routes API, 6 ActionGuards, 8 TabGuards, typage NF525).
> 2. Déployer la Flotte de Terminaux MDM avec Kill-Switch à distance et Remote Wipe déconnecté.
> 3. Déployer le Step-Up Biométrique (FaceID / TouchID / Passkeys) pour les actions critiques patron & salarié.
> 4. Déployer le Coffre-fort Numérique Salarié (`StaffDigitalVault`) conforme Code du travail L3243-2 et RGPD.
> 5. Éliminer la dette structurelle latente (tokens `--color-surface-glass`, breakpoints `@theme`, DevAuthBridge).
> 6. Finaliser la navigation Empire Luxury (Sidebar, Topbar, MobileNavBar, navConfig) et migrer les 24 pages ops vers `PageShell v2`.
> 7. Certifier une qualité "Impeccable" mesurable (score ≥ 90/100 sur mobile, tablette, desktop).

---

## 📑 Sommaire

- [0. Contexte, Invariants & Anti-Conflits](#0-contexte-invariants--anti-conflits)
- [P-1 — Sécurité Noyau, RBAC, Flotte MDM & Kill-Switch (À FAIRE EN PREMIER)](#p-1--sécurité-noyau-rbac-flotte-mdm--kill-switch-à-faire-en-premier)
  - [P-1.1 · Helper `requireAnyAuth` & Sécurisation des 28 Routes API](#p-11--helper-requireanyauth--sécurisation-des-28-routes-api)
  - [P-1.2 · Flotte de Terminaux MDM & Kill-Switch à Distance (`DeviceFleetManager`)](#p-12--flotte-de-terminaux-mdm--kill-switch-à-distance-devicefleetmanager)
  - [P-1.3 · 6 ActionGuards / PageGuard Manquants Côté Client](#p-13--6-actionguards--pageguard-manquants-côté-client)
  - [P-1.4 · Typage Strict NF525 `FinanceEntrySchema.lines` (Partie Double)](#p-14--typage-strict-nf525-financeentryschemalines-partie-double)
  - [P-1.5 · 8 Pages Ops avec `<TabGuard>` RBAC](#p-15--8-pages-ops-avec-tabguard-rbac)
  - [P-1.6 · 4 Correctifs Runtime Immédiats](#p-16--4-correctifs-runtime-immédiats)
- [P0 — Fermeture Bugs Auth, Dev Bridge & 2FA Prod](#p0--fermeture-bugs-auth-dev-bridge--2fa-prod)
  - [P0.1 · Vérification `adminAuthGuard` & `mcc-dev-bypass`](#p01--vérification-adminauthguard--mcc-dev-bypass)
  - [P0.2 · Extraction de `authConstants.ts`](#p02--extraction-de-authconstantsts)
  - [P0.3 · Module Centralisé `DevAuthBridge.ts`](#p03--module-centralisé-devauthbridgets)
  - [P0.4 · Configuration 2FA / MFA Multi-Canaux en Production](#p04--configuration-2fa--mfa-multi-canaux-en-production)
- [P1 — Dette Structurelle, Biométrie & Coffre-fort Numérique](#p1--dette-structurelle-biométrie--coffre-fort-numérique)
  - [P1.1 · Token `--color-surface-glass` dans `globals.css` (Dark/Light Inversion)](#p11--token---color-surface-glass-dans-globalscss-darklight-inversion)
  - [P1.2 · Synchronisation des Breakpoints Tokens `@theme`](#p12--synchronisation-des-breakpoints-tokens-theme)
  - [P1.3 · Authentification Biométrique Step-Up (`useBiometricAuth.ts`)](#p13--authentification-biométrique-step-up-usebiometricauthts)
  - [P1.4 · Le Coffre-fort Numérique Salarié (`StaffDigitalVault`)](#p14--le-coffre-fort-numérique-salarié-staffdigitalvault)
  - [P1.5 · Migration `FinanceHeaderNav` vers `PageShell.Tab`](#p15--migration-financeheadernav-vers-pageshelltab)
- [P2 — Refonte Visuelle Complète & Navigation Empire Luxury](#p2--refonte-visuelle-complète--navigation-empire-luxury)
  - [P2.1 · Extraction des Headers Custom en Sous-Composants](#p21--extraction-des-headers-custom-en-sous-composants)
  - [P2.2 · Navigation Empire Luxury Antigravity (`DesktopSidebar`, `DesktopTopbar`, `MobileNavBar`, `navConfig`)](#p22--navigation-empire-luxury-antigravity-desktopsidebar-desktoptopbar-mobilenavbar-navconfig)
  - [P2.3 · Migration en Batch des 24 Pages Ops vers `PageShell v2`](#p23--migration-en-batch-des-24-pages-ops-vers-pageshell-v2)
  - [P2.4 · Refonte des 15 Dashboards Modules Métiers](#p24--refonte-des-15-dashboards-modules-métiers)
- [P3 — Certification Qualité Impeccable & CI Gate](#p3--certification-qualité-impeccable--ci-gate)
  - [P3.1 · Run `/impeccable critique` Full-Pass](#p31--run-impeccable-critique-full-pass)
  - [P3.2 · Run `/impeccable polish`](#p32--run-impeccable-polish)
  - [P3.3 · Run `/impeccable audit` (a11y + perf + responsive)](#p33--run-impeccable-audit-a11y--perf--responsive)
  - [P3.4 · Activation du Hook Design CI Bloquant](#p34--activation-du-hook-design-ci-bloquant)
- [Séquencement Chronologique Jour par Jour](#séquencement-chronologique-jour-par-jour)
- [Definition of Done Strict](#definition-of-done-strict)

---

## 0. Contexte, Invariants & Anti-Conflits

### 0.1 Invariants Légaux & Architecturaux Strictement Respectés
- **Loi 1 & 2 (AGENTS.md)** : Zéro `--no-verify`, zéro contournement de gate, correction du code à la source.
- **Loi 5 (ADR-015)** : Imports de piliers uniquement via `@/modules/<pilier>`, zéro import profond cross-module.
- **Loi 6 (Coordination Multi-Agents)** : Enregistrement dans `.claude/sessions.md` avec chemins explicites.
- **Charte §1 & §2** : Clés d'idempotence déterministes et opérations atomiques sans Read-Modify-Write concurrente.
- **Charte §4 & §5** : Durées en UTC absolu (`Date.now()`) et devises en microunités entières (`MicrounitsSchema`).
- **Fiscalité NF525 & DGFiP** : Immuabilité WORM du grand livre et chaîne de scellement inaltérable.
- **Droit du Travail (Art. L3243-2) & RGPD** : Coffre-fort numérique salarié certifié à vie avec export ZIP.

### 0.2 Répartition des Périmètres Multi-Agents
- **Session `antigravity-scrapling-nav` (Antigravity)** :
  - `src/shared/components/layout/DesktopSidebar.tsx`
  - `src/shared/components/layout/DesktopTopbar.tsx`
  - `src/shared/components/layout/MobileNavBar.tsx`
  - `src/config/navConfig.ts`
  - `src/modules/security/services/DeviceFleetManager.ts` & `src/shared/hooks/useBiometricAuth.ts`
- **Session `restaurant-ui-refonte` (Claude Code)** :
  - `src/lib/server/requireAnyAuth.ts`
  - `src/shared/components/rbac/*`
  - `src/app/(client)/(ops)/*`
  - `src/modules/*/components/*`
- **Verrous `item2-3-perf-parite` (Claude Code)** :
  - `src/verticals/{gym,coworking,florist,veterinary}/` (protégés, non touchés)

---

## P-1 — Sécurité Noyau, RBAC, Flotte MDM & Kill-Switch (À FAIRE EN PREMIER)

### P-1.1 · Helper `requireAnyAuth` & Sécurisation des 28 Routes API

**Fichiers critiques concernés** :
- Signature contrats / cartes : `tenant/contracts/[contractId]/sign`, `reservations/card-imprint`
- Facturation / callbacks bancaires : `billing/{signup,dunning}`, `finance/bank/callback`
- Exports comptables FEC : `finance/accounting-portal/{transmit,pack,summary}`
- Réservations / connecteurs : `google/reserve/*`, `connectors/*`, `widget/*`
- IoT & Diagnostics : `haccp/iot-push`, `facility/hardware/diagnostics`, `push/send`
- MCC & Domaines : `mcc/contracts`, `tenant/api-keys/validate`, `tenant/domain/check`, `cron/*`

**Helper unifié (`src/lib/server/requireAnyAuth.ts`)** :
```ts
import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { DEV_PIN_BYPASS_HEADER } from '@/lib/authConstants';
import { DeviceFleetManager } from '@/modules/security/services/DeviceFleetManager';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
  deviceId?: string;
  isDevBypass: boolean;
}

export async function requireAnyAuth(req: NextRequest | Request): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization') ?? '';
  const deviceId = req.headers.get('x-device-id') ?? undefined;

  // 1. Contrôle Kill-Switch Flotte MDM
  if (deviceId && await DeviceFleetManager.isDeviceRevoked(deviceId)) {
    throw new Response(JSON.stringify({ error: 'DEVICE_REVOKED', message: 'Cet appareil a été révoqué à distance.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Dev bypass (NODE_ENV === 'development' uniquement)
  if (process.env.NODE_ENV === 'development' && (authHeader === DEV_PIN_BYPASS_HEADER || authHeader === 'Bearer mcc-dev-bypass')) {
    return {
      userId: 'dev-admin',
      tenantId: req.headers.get('x-nexus-tenant-id') ?? process.env.DEV_TENANT_ID ?? '__dev__',
      role: 'admin',
      deviceId,
      isDevBypass: true,
    };
  }

  // 3. JWT Firebase Production
  if (!authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  initFirebaseAdmin();
  const token = authHeader.slice(7);
  const decoded = await getAuth().verifyIdToken(token);

  return {
    userId: decoded.uid,
    tenantId: (decoded.tenantId as string) ?? (decoded.clientId as string) ?? 'default',
    role: (decoded.role as string) ?? 'staff',
    deviceId,
    isDevBypass: false,
  };
}
```

---

### P-1.2 · Flotte de Terminaux MDM & Kill-Switch à Distance (`DeviceFleetManager`)

1. **Service MDM** (`src/modules/security/services/DeviceFleetManager.ts`) :
   - Enregistrement & empreinte : `deviceId`, `userId`, `deviceName`, `deviceType`, `os`, `browser`, `lastIp`, `lastWifiBssid`, `lastActiveAt`, `status: 'active' | 'revoked'`.
   - Méthode `revokeDevice(tenantId, deviceId, revokedBy)` :
     - Passe le statut à `revoked` dans Firestore.
     - Invalide le token de session JWT.
     - Émet l'événement `security.device_remote_wipe`.
     - Écrit le log d'audit inaltérable.
2. **Réception Client du Remote Wipe** :
   - À réception du signal (ou au prochain appel 403), le client purge `Dexie.delete()`, `sessionStorage.clear()` et verrouille l'écran.
3. **Tableau de Bord Visuel** :
   - Panneau de gestion de flotte dans `/facility/hardware` et onglet "Appareils" dans `/staff/[id]`.

---

### P-1.3 · 6 ActionGuards / PageGuard Manquants Côté Client

- **`accounting-portal/page.tsx`** : Envelopper dans `withPageGuard(AccountingPortalPage, 'accounting_portal')` + lire `tenantId` depuis `useTenant().activeTenantId`.
- **`AuditTab.tsx:27`** : Envelopper le bouton "Exporter FEC" dans `<ActionGuard page="finance" action="export_fec">`.
- **`AccountingTab.tsx:181`** : Aligner la clôture Z sur la permission réelle `seal_zday`.
- **`BankTab.tsx:54,62`** : Envelopper les boutons de connexion et synchronisation dans `<ActionGuard page="finance" action="reconcile_bank">`.
- **`KDSTicket.tsx:137-155`** : Envelopper `handleMarkReady` dans `<ActionGuard page="kds" action="bump_order">`.
- **`CartItemContextMenu.tsx`** : Envelopper l'annulation de ligne de caisse dans `<ActionGuard page="pos" action="void_line">`.
- **`FinanceDashboard.tsx:101`** : Remplacer l'action erronée de note de frais par `<ActionGuard page="finance" action="create_expense_claim">`.

---

### P-1.4 · Typage Strict NF525 `FinanceEntrySchema.lines` (Partie Double)

**Fichier** : `src/modules/finance/domain/schemas/finance.ts`
```ts
export const FinanceEntryLineSchema = z.object({
  id: z.string(),
  accountNumber: z.string().regex(/^[0-9]{6,8}$/, 'Numéro de compte PCG français invalide'),
  accountLabel: z.string().min(1),
  debitInMicrounits: MicrounitsSchema.default(0),
  creditInMicrounits: MicrounitsSchema.default(0),
  vatRate: TaxRateSchema.optional(),
  reference: z.string().optional(),
  journalCode: z.string().min(1),
});

export const FinanceEntryLinesStrictSchema = z.array(FinanceEntryLineSchema)
  .min(2, 'Une écriture comptable doit comporter au moins 2 lignes')
  .refine(
    (lines) => {
      const totalDebit = lines.reduce((acc, line) => acc + line.debitInMicrounits, 0);
      const totalCredit = lines.reduce((acc, line) => acc + line.creditInMicrounits, 0);
      return totalDebit === totalCredit;
    },
    { message: 'VIOLATION NF525 : Débit !== Crédit (Écriture déséquilibrée)' }
  );
```

---

### P-1.5 · 8 Pages Ops avec `<TabGuard>` RBAC
- [ ] `src/app/(client)/(ops)/accounting-portal/page.tsx`
- [ ] `src/app/(client)/(ops)/mon-espace/page.tsx`
- [ ] `src/app/(client)/(ops)/leaves/page.tsx`
- [ ] `src/app/(client)/(ops)/crm/page.tsx`
- [ ] `src/app/(client)/(ops)/marketing/page.tsx`
- [ ] `src/app/(client)/(ops)/marketing/seo/page.tsx`
- [ ] `src/app/(client)/(ops)/bar/page.tsx`
- [ ] `src/app/(client)/(ops)/migration/page.tsx`

---

### P-1.6 · 4 Correctifs Runtime Immédiats
1. **Login PIN swallow** (`useNexusAuthLogic.ts:75`) : Logger l'erreur réelle via `logger.error`.
2. **`accounting-portal/page.tsx:22`** : Consommer `isLoading` pour afficher un spinner `<Loader2 className="animate-spin" />`.
3. **`floor-plan/page.tsx:47-48`** : Câbler les setters `setViewMode` (2D/3D) et `setShowGrid` aux boutons de la barre d'outils.
4. **`TreasuryCalculator.ts:25`** : Retirer le cast `as any` suite au typage strict de `FinanceEntryLine`.

---

## P0 — Fermeture Bugs Auth, Dev Bridge & 2FA Prod

### P0.1 · Vérification `adminAuthGuard` & `mcc-dev-bypass`
- S'assurer que `adminAuthGuard.ts` et `requireAnyAuth.ts` acceptent le header `Bearer mcc-dev-bypass` et `Bearer dev-tenant-bypass` en dev pour toutes les routes `/api/tenant/*` et `/api/v1/*`.

### P0.2 · Extraction de `authConstants.ts`
- Centraliser dans `src/lib/authConstants.ts` :
  - `DEV_PIN_BYPASS_KEY = 'executive_dev_bypass_active'`
  - `DEV_PIN_BYPASS_HEADER = 'Bearer mcc-dev-bypass'`
- Remplacer dans `useNexusAuthLogic.ts`, `AuthSession.tsx` et `authedFetch.ts`.

### P0.3 · Module Centralisé `DevAuthBridge.ts`
- Créer `src/lib/auth/DevAuthBridge.ts` avec `markDevBypassActive()`, `clearDevBypass()`, `isDevBypassActive()`.

### P0.4 · Configuration 2FA / MFA Multi-Canaux en Production
- Panneau `/settings/security` permettant au patron de choisir les méthodes autorisées :
  - **SMS / Téléphone** (OTP 6 chiffres)
  - **Email** (Code temporaire / Magic Link)
  - **App Authenticator (TOTP)** (Google, Microsoft, Apple Passwords)
  - **Passkeys / Biométrie (WebAuthn)** (FaceID, TouchID, YubiKey)
  - **Backup Codes** (10 clés de secours d'urgence)

---

## P1 — Dette Structurelle, Biométrie & Coffre-fort Numérique

### P1.1 · Token `--color-surface-glass` dans `globals.css` (Dark/Light Inversion)
Ajouter dans `globals.css @theme` :
```css
--color-surface-glass: rgb(255 255 255 / 0.03);
--color-surface-glass-hover: rgb(255 255 255 / 0.05);
--color-surface-glass-active: rgb(255 255 255 / 0.08);

[data-theme="light"] {
  --color-surface-glass: rgb(0 0 0 / 0.03);
  --color-surface-glass-hover: rgb(0 0 0 / 0.05);
  --color-surface-glass-active: rgb(0 0 0 / 0.08);
}
```
Remplacer les 40 occurrences de `bg-white/[0.03]` par `bg-surface-glass`.

### P1.2 · Synchronisation des Breakpoints Tokens `@theme`
Aligner `globals.css` avec `useBreakpoint.ts` :
- `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1440px`, `2xl: 1600px`.

### P1.3 · Authentification Biométrique Step-Up (`useBiometricAuth.ts`)
Hook WebAuthn/Passkeys natif pour sécuriser les opérations sensibles :
- **👑 Patron / Gérant** : Clôture Z fiscale NF525, Export FEC, Virements Open Banking, Annulation caisse > 50€, Modification salaires.
- **👨‍🍳 Salarié** : Pointage entrée/sortie anti-fraude, Signature électronique des contrats eIDAS, Déverrouillage coffre-fort.

### P1.4 · Le Coffre-fort Numérique Salarié (`StaffDigitalVault`)
Intégré dans [`/mon-espace`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/app/(client)/(ops)/mon-espace/page.tsx) :
- Scellement SHA-256 des bulletins de paie, contrats de travail signés, attestations HACCP et déclarations d'accidents.
- Pérennité à vie (accès garanti même après le départ du salarié).
- Bouton `« 📦 Télécharger mon Coffre-fort (Archive ZIP certifiée) »`.

### P1.5 · Migration `FinanceHeaderNav` vers `PageShell.Tab`
- Supprimer l'ancien bandeau empilé `FinanceHeaderNav` et passer les 5 onglets via `<PageShell tabs={...}>`.

---

## P2 — Refonte Visuelle Complète & Navigation Empire Luxury

### P2.1 · Extraction des Headers Custom en Sous-Composants
- `src/modules/ops/service/pos/components/PosHeader.tsx`
- `src/modules/facility/spaces/components/FloorPlanHeader.tsx`
- `src/modules/commerce/relation/reservations/components/ReservationsHeader.tsx`
- `src/modules/ops/production/kds/components/KDSHeader.tsx` (déjà fait)

### P2.2 · Navigation Empire Luxury Antigravity
- `DesktopSidebar.tsx` : Typo `text-sm font-medium tracking-tight`, kickers Playfair italic 11px, active state gold underline 2px.
- `DesktopTopbar.tsx` : Conteneur `bg-surface-glass border border-border/40 rounded-xl` avec dividers verticaux.
- `MobileNavBar.tsx` : 4-5 items principaux, active tab gold underline, `bg-surface-card/95 backdrop-blur-xl`.
- `navConfig.ts` : Ajout des tuiles `/suppliers`, `/kiosk`, `/pms`, `/hygiene`.

### P2.3 · Migration en Batch des 24 Pages Ops vers `PageShell v2`
Migration avec Kicker Playfair italic + Titre 34px + Breadcrumbs + Actions :
- `crm`, `marketing`, `marketing/seo`, `intelligence`, `analytics`, `timeclock`, `planning`, `staff`, `leaves`, `recruitment`, `accounting-portal`, `operations`, `franchise`, `aide`, `mon-espace`, `onboarding`, `vanguard-simulator`, `welcome-staff`, `pos-mobile`, `nf525`, `registre`, `integrations`, `menu-engineering`, `kiosk`.

### P2.4 · Refonte des 15 Dashboards Modules Métiers
Nettoyage des en-têtes internes doublons dans les dashboards :
`PlanningDashboard`, `StaffDashboard`, `TimeclockDashboard`, `RecruitmentDashboard`, `AnalyticsDashboard`, `IntelligenceDashboard`, `NF525Dashboard`, `RegistreDashboard`, `FacilityDashboard`, `CustomerDashboard`...

---

## P3 — Certification Qualité Impeccable & CI Gate

### P3.1 · Run `/impeccable critique` Full-Pass
- Audit UX, hiérarchie visuelle, charge cognitive sur les 10 pages critiques (Score ≥ 90/100).
- Livrable : `docs/impeccable/critique-baseline-2026-08-24.md`.

### P3.2 · Run `/impeccable polish`
- Alignement micro-spacings, rythme vertical, courbes d'animation (`--ease-out-expo`).

### P3.3 · Run `/impeccable audit` (a11y + perf + responsive)
- Contrastes WCAG AA/AAA, performance Lighthouse (FCP < 1.2s), snapshots multi-devices.
- Livrable : `docs/impeccable/audit-final-2026-08-24.md`.

### P3.4 · Activation du Hook Design CI Bloquant
- Commande : `npx impeccable hooks on`. Bloque tout commit dégradant la note qualité sous 90/100.

---

## Séquencement Chronologique Jour par Jour

```
Jours 1–5  : SÉCURITÉ P-1 (28 routes API, Flotte MDM Kill-Switch, 6 ActionGuards, 8 TabGuards, FinanceEntryLines NF525, 4 runtime fixes)
Jour 6     : AUTH P0 (DevAuthBridge, authConstants.ts, tests bypass dev)
Jours 7–8  : TOKENS & COFFRE-FORT P1 (--color-surface-glass, useBiometricAuth, StaffDigitalVault)
Jours 9–13 : NAVIGATION & REFONTE UI P2 (DesktopSidebar/Topbar/Mobile, 24 pages ops migrées PageShell v2)
Jours 14–18: DASHBOARDS MODULES P2.4 (15 dashboards nettoyés)
Jours 19–23: CERTIFICATION IMPECCABLE P3 (Critique, Polish, Audit, Hook CI bloquant)
```

---

## Definition of Done Strict

- [ ] **Sécurité API** : Rejet 401 sur toutes les 28 routes sans `Authorization` valide.
- [ ] **Flotte MDM & Kill-Switch** : Blocage 403 immédiat d'un device révoqué + purge locale Dexie.
- [ ] **Partie Double NF525** : 0 `z.any()` dans `FinanceEntrySchema.lines` et validation `totalDebit === totalCredit`.
- [ ] **RBAC Étudié** : 6 ActionGuards + 8 TabGuards opérationnels.
- [ ] **Biométrie Step-Up** : FaceID/TouchID requis pour Clôture Z, FEC, Virements et Pointage.
- [ ] **Coffre-fort Salarié** : `StaffDigitalVault` scellé SHA-256 avec export archive ZIP.
- [ ] **Tokens Inversibles** : 0 `bg-white/[` résiduel (remplacé par `bg-surface-glass`).
- [ ] **Navigation Complète** : Tuiles `/suppliers`, `/kiosk`, `/pms`, `/hygiene` actives dans `navConfig.ts`.
- [ ] **Compilation & Gates** : `npx tsc --noEmit` = 0 erreur, `npm run verify:gates` & `npm run preflight` = 100% verts.
- [ ] **Intégrité Multi-Agents** : `.claude/sessions.md` à jour, 0 composant supprimé, respect d'ADR-015.
