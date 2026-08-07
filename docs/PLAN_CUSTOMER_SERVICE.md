# Plan Customer Service — Généralisation Multi-Verticale

> **Périmètre** : Système SAV IA (support tickets, analyse Gemini, review MCC, changelog)
> générisé pour les 8 verticales (restaurant · hotel · bakery · salon · clinic · garage · retail · custom)
> et doté d'une surface UI côté tenant complète.
>
> **Date** : 2026-08-07
> **Auteur** : Mohammed-Ali Boudjaadar

---

## 0. État des lieux — Audit rapide

### ✅ Ce qui existe et fonctionne

| Composant | Fichier | Couverture |
|-----------|---------|-----------|
| `SupportTicketSchema` + `SupportDraftSchema` | `modules/intelligence/domain/schemas/supportTicket.ts` | Zod complet, 7 statuts |
| `SupportTicketAnalysisHandler` | `shared/eventBus/handlers/SupportTicketAnalysisHandler.ts` | Gemini, JSON structuré, validation Zod, ChangelogService |
| `POST /api/tenant/support/tickets` | Soumission + emit + await draft synchrone | ✅ |
| `GET /api/tenant/support/tickets` | Liste par tenantId (depuis JWT) | ✅ |
| `GET /api/admin/fleet/support-ai/drafts` | File review MCC | ✅ |
| `POST /api/admin/fleet/support-ai/drafts` | approve / reject / correct / auto-apply | ✅ |
| `SupportDraftsPanel` | `mcc/components/SupportDraftsPanel.tsx` | Complet, dans PatchCenterTab |
| `TenantChangelogPanel` | `mcc/components/TenantChangelogPanel.tsx` | Filtre fleet + par tenant |
| `SupportAIPanel` | `mcc/components/SupportAIPanel.tsx` | Diagnostic MCC-initiated (POST /diagnose) |
| `OnboardingHelpButton` | `onboarding/wizard/OnboardingHelpButton.tsx` | Formulaire dans l'assistant d'import |
| `requireTenantUserWithRole(minRole)` | `lib/server/adminAuthGuard.ts` | RBAC intra-tenant **déjà implémenté** |
| `WebPush` / `usePushSubscription` | `lib/push/usePushSubscription.ts` | Fonctionnel, clés VAPID conditionnelles |

### ❌ Ce qui manque

| Gap | Criticité | Impact |
|-----|-----------|--------|
| UI tenant globale (widget flottant + historique) | 🔴 P0 | Système tourne à vide — aucun tenant ne peut soumettre depuis l'app principale |
| Prompt IA hardcodé "Restaurant OS" | 🔴 P1 | Vocabulaire faux pour garage / salon / clinique |
| RBAC intra-tenant non appliqué sur `/tickets` | 🟠 P2 | N'importe quel rôle peut soumettre |
| RAG non branché dans l'analyse | 🟠 P2 | `code_fix` générés sans connaissance du code |
| Escalade déclarée mais jamais déclenchée | 🟡 P3 | Tickets high-risk ne remontent pas au MCC |
| Notification tenant post `draft_ready` | 🟡 P3 | Tenant ne sait pas que son ticket a été analysé |
| `OnboardingHelpButton` envoie un body non conforme | 🟡 P3 | `subject`, `context.source`, `priority` ignorés par le schema |

---

## 1. Architecture cible

```
┌──────────────────────────────────────────────────────────────────┐
│  TENANT (8 verticales)                                            │
│                                                                   │
│  Toute page ops ──► SupportHelpWidget (FAB "?")                  │
│       ↕                     ↕                                     │
│  [formulaire]        [historique tickets]                         │
│       │                     ↑                                     │
│       ▼                     │                                     │
│  POST /api/tenant/support/tickets  ──────────────────────────┐   │
│  (Auth: requireTenantUserWithRole('manager'))                 │   │
└──────────────────────────────────────────────────────────────┼───┘
                                                               │
                              ┌────────────────────────────────▼─────┐
                              │  NexusEventBus 'support.ticket_submitted' │
                              └────────────────────────────────┬─────┘
                                                               │
                    ┌──────────────────────────────────────────▼──────────────┐
                    │  SupportTicketAnalysisHandler                             │
                    │                                                           │
                    │  1. buildContextSnapshot(tenantId) → cfg (no secrets)    │
                    │  2. VERTICAL_SUPPORT_CONTEXT[cfg.variant] → vocabulaire   │
                    │  3. [optionnel] HermesKnowledgeManager.query(desc) → RAG  │
                    │  4. GeminiProvider → SupportDraft (JSON validé Zod)       │
                    │  5. Si confidence<0.4 || riskLevel='high' → escalate=true │
                    │  6. Nexus.adapter.set('mcc/supportTickets/{id}', draft)   │
                    │  7. ChangelogService.record(SUPPORT_DRAFT_GENERATED)       │
                    │  8. [si escalated] emit 'support.ticket_escalated'        │
                    └──────────────────────────────────────────┬──────────────┘
                                                               │
              ┌────────────────────────────────────────────────┼───┐
              │  MCC (Super Admin)                             │   │
              │                                                │   │
              │  PatchCenterTab                                │   │
              │  └── SupportDraftsPanel ◄─────────────────────┘   │
              │       approve / reject / correct / auto-apply       │
              │  └── TenantChangelogPanel                           │
              └─────────────────────────────────────────────────────┘
```

---

## 2. Phase 1 — Socle vertical-aware (P0 + P1)

**Durée estimée : 1 journée**
**Prérequis : aucun**

---

### 1A. Vocabulaire vertical — `VERTICAL_SUPPORT_CONTEXT`

**Fichier à créer** : `src/shared/eventBus/handlers/support/verticalSupportContexts.ts`

```typescript
import type { PlatformVariant } from '@/domain/schemas/tenant';

export interface VerticalSupportContext {
  /** Nom du produit affiché dans le system prompt */
  productName: string;
  /** Description métier en 2 phrases pour le LLM */
  businessDescription: string;
  /** Vocabulaire clé : termes que le LLM doit utiliser (pas inventer) */
  keyTerms: string[];
  /** Modules phares à citer si actifs */
  featuredModules: string[];
}

export const VERTICAL_SUPPORT_CONTEXTS: Record<PlatformVariant, VerticalSupportContext> = {
  restaurant: {
    productName: 'Restaurant OS',
    businessDescription:
      'Logiciel tout-en-un de gestion de restaurant : encaissement NF525 (POS), ' +
      'affichage cuisine (KDS), réservations, stocks, comptabilité, HACCP, RH.',
    keyTerms: ['ticket', 'table', 'couvert', 'service', 'addition', 'caisse journée',
               'Z de caisse', 'fournée', 'plan de salle', 'module HACCP', 'NF525'],
    featuredModules: ['pos', 'kds', 'reservations', 'inventory', 'haccp', 'accounting'],
  },
  hotel: {
    productName: 'Hôtel OS',
    businessDescription:
      'Logiciel de gestion hôtelière : réception (Front Desk), gestion des chambres, ' +
      'check-in/check-out, housekeeping, facturation séjour, conciergerie.',
    keyTerms: ['check-in', 'check-out', 'chambre', 'séjour', 'réservation', 'folio',
               'housekeeping', 'service en chambre', 'tarif rack', 'channel manager'],
    featuredModules: ['frontdesk', 'rooms', 'reservations', 'billing', 'pos'],
  },
  bakery: {
    productName: 'Bakery OS',
    businessDescription:
      'Logiciel de gestion de boulangerie-pâtisserie : caisse, gestion de production ' +
      '(fournées), commandes fournisseurs, fidélité client, vitrine en ligne.',
    keyTerms: ['fournée', 'production', 'pâton', 'mise en fermentation', 'caisse',
               'commande fournisseur', 'carte fidélité', 'précommande', 'viennoiserie'],
    featuredModules: ['pos', 'production', 'inventory', 'loyalty', 'showcase'],
  },
  salon: {
    productName: 'Salon OS',
    businessDescription:
      'Logiciel de gestion de salon de coiffure et instituts de beauté : agenda, ' +
      'gestion techniciens, prestations, fidélité client, caisse.',
    keyTerms: ['rendez-vous', 'prestation', 'technicien', 'couleur', 'balayage',
               'agenda', 'créneau', 'client fidèle', 'bon cadeau', 'caisse'],
    featuredModules: ['agenda', 'pos', 'staff', 'loyalty', 'crm'],
  },
  clinic: {
    productName: 'Clinic OS',
    businessDescription:
      'Logiciel de gestion de cabinet médical ou paramédical : agenda consultations, ' +
      'dossier patient, feuille de soins, facturation CPAM, ordonnances.',
    keyTerms: ['consultation', 'patient', 'praticien', 'ordonnance', 'feuille de soins',
               'CPAM', 'téléconsultation', 'agenda médical', 'acte', 'cotation NGAP'],
    featuredModules: ['agenda', 'patients', 'billing', 'pos'],
  },
  garage: {
    productName: 'Garage OS',
    businessDescription:
      'Logiciel de gestion de garage automobile : bon de réparation (OR), ' +
      'planning atelier, facturation VGE, stock pièces détachées, gestion flotte client.',
    keyTerms: ['bon de réparation', 'ordre de réparation', 'OR', 'VGE', 'immatriculation',
               'main-d\'œuvre', 'pièce', 'devis', 'diagnostic OBD', 'planning atelier'],
    featuredModules: ['pos', 'repairs', 'inventory', 'fleet', 'billing'],
  },
  retail: {
    productName: 'Retail OS',
    businessDescription:
      'Logiciel de caisse et gestion de commerce de détail : caisse multi-écran, ' +
      'inventaire, étiquettes, fidélité, vitrine e-commerce.',
    keyTerms: ['caisse', 'article', 'référence', 'code-barres', 'inventaire',
               'rupture', 'étiquette prix', 'promotion', 'carte fidélité', 'vitrine'],
    featuredModules: ['pos', 'inventory', 'loyalty', 'showcase', 'analytics'],
  },
  custom: {
    productName: 'Business OS',
    businessDescription:
      'Plateforme de gestion multi-métier configurable : modules activables selon ' +
      'les besoins spécifiques du client.',
    keyTerms: ['module', 'configuration', 'caisse', 'stock', 'client', 'planning'],
    featuredModules: [],
  },
};
```

**Modification de `SupportTicketAnalysisHandler.ts`** :

```typescript
// Remplacer le SYSTEM_PROMPT statique par une fonction dynamique
import { VERTICAL_SUPPORT_CONTEXTS } from './support/verticalSupportContexts';
import type { PlatformVariant } from '@/domain/schemas/tenant';

function buildSystemPrompt(variant: PlatformVariant): string {
  const ctx = VERTICAL_SUPPORT_CONTEXTS[variant];
  return `Tu es un agent SAV L0 pour ${ctx.productName}, ${ctx.businessDescription}
Un opérateur vient de soumettre une requête depuis sa propre plateforme.

Vocabulaire métier à utiliser obligatoirement : ${ctx.keyTerms.join(', ')}.
Modules phares du produit : ${ctx.featuredModules.join(', ')}.

Tu analyses cette requête à la lumière du contexte réel de l'instance (version, modules actifs, overrides) et tu prépares un BROUILLON structuré — jamais une action appliquée directement. Un opérateur MCC validera, corrigera ou refusera ce brouillon.`;
}

// Dans buildContextSnapshot : extraire le variant
function buildContextSnapshot(tenantId: string, rawConfig: unknown): { snapshot: string; variant: PlatformVariant } {
  const parsed = TenantConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    return {
      snapshot: JSON.stringify({ tenantId, warning: 'tenantConfig non disponible ou invalide' }),
      variant: 'restaurant',  // fallback sûr
    };
  }
  const cfg = parsed.data;
  const variant = cfg.variant ?? 'restaurant';
  return {
    snapshot: JSON.stringify({
      tenantId,
      variant,
      tier: cfg.tier,
      billingPlan: cfg.billing?.plan,
      enabledModules: cfg.marketplace?.enabledModules ?? [],
      capabilities: cfg.capabilities ?? {},
      features: cfg.features ?? {},
      customFeatures: cfg.customFeatures ?? {},
      overrides: cfg.overrides ?? {},
      status: cfg.status ? {
        maintenanceMode: cfg.status.maintenanceMode,
        targetVersion:   cfg.status.targetVersion,
        targetState:     cfg.status.targetState,
        licenceStatus:   cfg.status.licenceStatus,
      } : undefined,
    }),
    variant,
  };
}

// Dans analyze() :
const { snapshot: contextSnapshot, variant } = buildContextSnapshot(tenantId, rawConfig);
const systemPrompt = buildSystemPrompt(variant);
// Passer systemPrompt à GeminiProvider au lieu du SYSTEM_PROMPT statique
```

---

### 1B. `SupportHelpWidget` — composant universel côté tenant

**Fichier à créer** : `src/shared/components/support/SupportHelpWidget.tsx`

Ce composant est un **FAB flottant** (Floating Action Button) `?` en bas à droite de toutes les pages ops.
Il s'affiche si `tenant.capabilities.mod_support !== false`.

**Structure interne** :
```
SupportHelpWidget (FAB)
├── [fermé] → bouton "?" animé
└── [ouvert] → drawer/panel en bas à droite
    ├── Tab 1 : "Nouveau ticket"  (formulaire)
    │   ├── Textarea description (10-2000 chars)
    │   ├── [optionnel] URL screenshot
    │   ├── Bouton "Envoyer"
    │   └── État inline : loading (analyse IA…) → succès/échec
    └── Tab 2 : "Mes tickets"  (historique)
        ├── Liste GET /api/tenant/support/tickets
        ├── Badge statut par ligne
        └── Expand → draft (résumé + rootCause) si draft_ready/approved/applied
```

**Hooks internes** :
- `useSupportTickets()` — GET list + polling toutes les 15s si ticket en statut `analyzing`
- `useSubmitSupportTicket()` — POST + état local de la soumission

**Props** :
```typescript
interface SupportHelpWidgetProps {
  /** Override position (default 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left';
  /** Contexte de page injecté automatiquement dans la description */
  pageContext?: string;
}
```

**Intégration dans le layout** :
Ajouter dans `src/shared/components/layout/NexusProviderStack.tsx` (après `VerticalUIProvider`) :

```tsx
import { SupportHelpWidget } from '@/shared/components/support/SupportHelpWidget';

// Dans le JSX, après l'arbre enfants :
<>
  {children}
  <SupportHelpWidgetGate />
</>
```

`SupportHelpWidgetGate` = composant client qui lit `useTenant()` et affiche le widget
si `capabilities?.mod_support !== false`.

**Respect `withVerticalOverride`** :
```typescript
// En bas de SupportHelpWidget.tsx
const SupportHelpWidgetBase = SupportHelpWidgetImpl;
export const SupportHelpWidget = withVerticalOverride('SupportHelpWidget', SupportHelpWidgetBase);
```

Ajouter `'SupportHelpWidget'` à `OverrideableComponent` dans `IVerticalUIPlugin.ts`.

---

### 1C. Gate `mod_support` + Capability par défaut

**Fichier modifié** : `src/modules/intelligence/domain/schemas/supportTicket.ts`  
Aucune modification schema — la gate est dans `SupportHelpWidgetGate`.

**Logique de défaut** :
```typescript
// mod_support = true par défaut pour tous les tiers
// Exception : tier FREE → false (pas de support IA)
const hasSupport =
  capabilities?.mod_support !== false &&
  tenant.tier !== 'FREE';
```

**Ajout dans `TenantOverridePanel`** (section Accès IA déjà existante) :
```tsx
// Dans la section "Accès Branding", ajouter un toggle similaire :
// mod_support : Activer le support IA self-service côté tenant
```

---

## 3. Phase 2 — RBAC + Qualité IA (P2)

**Durée estimée : 0.5 journée**
**Prérequis : Phase 1 déployée**

---

### 2A. RBAC intra-tenant sur la route tickets

**Fichier modifié** : `src/app/api/tenant/support/tickets/route.ts`

`requireTenantUser` (actuellement utilisé) ne vérifie pas le rôle interne.
`requireTenantUserWithRole(minRole)` **existe déjà** dans `adminAuthGuard.ts`.

**Changement minimal** :
```typescript
// AVANT
const caller = await requireTenantUser(req);

// APRÈS
// Default : 'manager' — configurable via tenantConfig.support.minRole
const minRole = (tenantSupportConfig?.minRole as PermissionRole | undefined) ?? 'manager';
const caller = await requireTenantUserWithRole(req, minRole);
```

**Configuration** : ajouter dans `TenantConfigSchema` :
```typescript
// Dans src/domain/schemas/tenant.ts
support: z.object({
  minRole: z.enum(['staff', 'manager', 'owner', 'admin']).default('manager'),
  maxTicketsPerDay: z.number().int().min(1).max(50).default(10),
  enabledFeatures: z.array(z.string()).default([]),
}).optional(),
```

**Rate limiting** : vérifier dans le handler que le tenant n'a pas dépassé
`maxTicketsPerDay` tickets dans les dernières 24h (via `Nexus.adapter.query('mcc/supportTickets', { where: [...] })`).

---

### 2B. RAG branché dans l'analyse IA

**Fichier modifié** : `src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts`

**Stratégie** : inject conditionnel — si LightRAG offline, l'analyse continue sans RAG.

```typescript
import { HermesKnowledgeManager } from '@/modules/intelligence/knowledge/rag/HermesKnowledgeManager';

async function buildRagContext(tenantId: string, description: string): Promise<string> {
  try {
    // Vérifier si RAG disponible
    const health = await HermesKnowledgeManager.healthCheck();
    if (health.status !== 'online') return '';

    const results = await HermesKnowledgeManager.query({
      query: description,
      tenantId,
      maxChunks: 3,
      minScore: 0.7,
    });

    if (!results.length) return '';

    return '\n\nContexte codebase (extrait RAG) :\n' +
      results.map(r => `[${r.source}]\n${r.content}`).join('\n---\n');
  } catch {
    // RAG optionnel — ne pas faire échouer l'analyse
    return '';
  }
}

// Dans analyze() :
const ragContext = await buildRagContext(tenantId, description);
const userPrompt = buildUserPrompt(description, screenshotUrl, contextSnapshot, ragContext);
```

**Modification de `buildUserPrompt`** :
```typescript
function buildUserPrompt(
  description: string,
  screenshotUrl: string | undefined,
  contextSnapshot: string,
  ragContext: string,  // ajout
): string {
  return `Requête opérateur : ${description}
${screenshotUrl ? `Screenshot : ${screenshotUrl}` : ''}

Contexte réel de l'instance du tenant :
${contextSnapshot}
${ragContext}

Retourne UNIQUEMENT un objet JSON valide...`;
}
```

---

## 4. Phase 3 — Clôture de boucle (P3)

**Durée estimée : 0.5 journée**
**Prérequis : Phase 2 déployée**

---

### 3A. Escalade automatique

**Événement à ajouter dans `NexusEventBus`** : `support.ticket_escalated`

**Payload** :
```typescript
'support.ticket_escalated': {
  ticketId: string;
  tenantId: string;
  riskLevel: 'high';
  confidence: number;
  draftTitle: string;
}
```

**Trigger dans `SupportTicketAnalysisHandler`** (après `draft_ready`) :
```typescript
if (draft.riskLevel === 'high' || draft.confidence < 0.4) {
  await Nexus.adapter.set(ticketPath, { escalated: true }, { merge: true });
  await NexusEventBus.emit('support.ticket_escalated', {
    v: 1,
    ticketId,
    tenantId,
    riskLevel: draft.riskLevel,
    confidence: draft.confidence,
    draftTitle: draft.title,
  });
  logger.warn(`[SupportTicketAnalysis] Ticket ${ticketId} ESCALADÉ (risk=${draft.riskLevel}, confidence=${draft.confidence})`);
}
```

**Handler d'escalade à créer** : `src/shared/eventBus/handlers/SupportEscalationHandler.ts`
- Envoie une notification WebPush aux utilisateurs MCC (rôle `fleet_admin`)
- Log dans ChangelogService avec category `MAINTENANCE`

---

### 3B. Notification tenant après `draft_ready`

**Dans `SupportTicketAnalysisHandler`**, après écriture du draft :
```typescript
import { sendWebPushToRole } from '@/lib/push/webPushService';

// Après Nexus.adapter.set(ticketPath, { draft, status: 'draft_ready' })
await sendWebPushToRole(tenantId, 'manager', {
  title: `${VERTICAL_SUPPORT_CONTEXTS[variant].productName} — Ticket analysé`,
  body: draft.title,
  url: '/aide/tickets',
  icon: '/icon-192.png',
}).catch(() => {}); // WebPush optionnel
```

---

### 3C. Page dédiée `/aide/tickets`

**Fichier à créer** : `src/app/(client)/(ops)/aide/page.tsx`

Vue complète historique tickets pour le tenant :
- Liste tous les tickets (`GET /api/tenant/support/tickets`)
- Statut visuel (même palette que `SupportDraftsPanel`)
- Détail expand : description → draft.summary → rootCause → kind

Page légère, sans logique métier complexe.

---

### 3D. Fix `OnboardingHelpButton`

**Problème** : envoie `subject`, `context.source`, `priority` ignorés par `POST /api/tenant/support/tickets`.
`DescriptionSchema` exige 10-2000 chars — le champ `description` seul est parsé.

**Fix** :
```typescript
// AVANT
body: JSON.stringify({
  subject: `[Onboarding] Aide...`,
  description: message,
  context: { step: currentStep, ... },
  priority: 'high',
})

// APRÈS
body: JSON.stringify({
  description: `[Onboarding - ${category ?? 'import'}] ${message}${
    currentStep ? `\n\nÉtape : ${currentStep}` : ''
  }${errorContext ? `\nErreur : ${errorContext}` : ''}`.slice(0, 2000),
})
```

---

## 5. Fichiers impactés — Matrice complète

| Fichier | Action | Phase |
|---------|--------|-------|
| `shared/eventBus/handlers/support/verticalSupportContexts.ts` | 🆕 Créer | 1A |
| `shared/eventBus/handlers/SupportTicketAnalysisHandler.ts` | ✏️ Modifier | 1A + 2B + 3A + 3B |
| `shared/components/support/SupportHelpWidget.tsx` | 🆕 Créer | 1B |
| `shared/components/support/useSupportTickets.ts` | 🆕 Créer (hook) | 1B |
| `shared/components/layout/NexusProviderStack.tsx` | ✏️ Ajouter gate widget | 1B |
| `shared/plugins/IVerticalUIPlugin.ts` | ✏️ Ajouter `SupportHelpWidget` | 1B |
| `domain/schemas/tenant.ts` | ✏️ Ajouter `support` sub-schema | 2A |
| `app/api/tenant/support/tickets/route.ts` | ✏️ RBAC + rate limit | 2A |
| `shared/eventBus/handlers/SupportEscalationHandler.ts` | 🆕 Créer | 3A |
| `shared/eventBus/registerHandlers/intelligence.ts` | ✏️ Enregistrer escalation handler | 3A |
| `app/(client)/(ops)/aide/page.tsx` | 🆕 Créer | 3C |
| `modules/commerce/acquisition/onboarding/wizard/OnboardingHelpButton.tsx` | ✏️ Fix body | 3D |
| `app/(admin)/admin/mcc/components/TenantOverridePanel.tsx` | ✏️ Toggle mod_support | 1C |

---

## 6. Intégration verticale par vertical

| Vertical | Override `SupportHelpWidget` | Vocabulaire custom | RAG topics |
|----------|-----------------------------|--------------------|------------|
| restaurant | ❌ (défaut suffisant) | ticket, table, Z de caisse | pos, kds, nf525 |
| hotel | ❌ | check-in, folio, chambre | frontdesk, rooms |
| bakery | ❌ | fournée, production | pos, production |
| salon | ✅ Couleur palette salon | rendez-vous, technicien | agenda, staff |
| clinic | ✅ Design épuré, over white | patient, ordonnance | agenda, patients |
| garage | ✅ Icône clé + OR | bon de réparation, OR | repairs, fleet |
| retail | ❌ | article, caisse, inventaire | pos, inventory |
| custom | ❌ | module, configuration | — |

Les 3 overrides marqués ✅ ont une charte visuelle fortement distincte.
À implémenter dans `src/verticals/{salon,clinic,garage}/ui.ts` (Phase 1B, optionnel).

---

## 7. Schéma de données (Nexus — provider agnostique)

> Toutes les lectures/écritures passent par `Nexus.adapter.get/set/query` —
> le provider sous-jacent (Firestore, Simulacra, Mock) est transparent.
> Ne jamais accéder à Firestore directement.

```
mcc/
└── supportTickets/
    └── {ticketId}/          ← SupportTicketSchema
        ├── id
        ├── tenantId
        ├── source            'tenant_submission' | 'mcc_manual'
        ├── description
        ├── screenshotUrl?
        ├── status            new → analyzing → draft_ready / analysis_failed
        │                     → approved / rejected / applied
        ├── diagnostic?       SupportDiagnosticSchema (si /diagnose)
        ├── draft?            SupportDraftSchema
        │   ├── kind          'config_patch' | 'code_fix' | 'evolution_proposal'
        │   ├── title
        │   ├── summary
        │   ├── rootCause?
        │   ├── proposedPatch? { ...tenantConfig.overrides fragment }
        │   ├── codeBrief?
        │   ├── riskLevel     'low' | 'medium' | 'high'
        │   ├── autoApplicable
        │   └── confidence    0.0 → 1.0
        ├── analysisError?
        ├── escalated         boolean (default false)
        ├── createdAt
        ├── createdBy         uid (depuis le token vérifié — jamais du body)
        ├── resolvedAt?
        ├── resolvedBy?
        └── resolutionNote?
```

---

## 8. Séquence d'événements complète (happy path)

```
1. Manager ouvre SupportHelpWidget → Tab "Nouveau ticket"
2. Saisit description → POST /api/tenant/support/tickets
   Auth: requireTenantUserWithRole('manager') ✅
3. API : crée ticket (status=new), émet NexusEventBus 'support.ticket_submitted'
4. SupportTicketAnalysisHandler.analyze() :
   a. status = 'analyzing'
   b. buildContextSnapshot → variant = 'garage'
   c. buildSystemPrompt('garage') → vocabulaire OR, bon de réparation...
   d. [optionnel] buildRagContext → 3 chunks LightRAG
   e. GeminiProvider.generateText → JSON SupportDraft
   f. SupportDraftSchema.safeParse ✅
   g. status = 'draft_ready', draft stocké
   h. ChangelogService.record(SUPPORT_DRAFT_GENERATED)
   i. [si high risk] escalated=true, emit 'support.ticket_escalated'
   j. WebPush → manager du tenant "Ticket analysé"
5. API répond { ticketId, status: 'draft_ready', draft }
6. Widget tenant affiche : "Votre demande a été analysée."
   → résumé draft.summary visible si confidence > 0.8
7. [MCC] SupportDraftsPanel charge le ticket → approve + auto-apply
8. ChangelogService.record(OVERRIDE_APPLIED)
9. WebPush → manager "Votre demande a été résolue (patch appliqué)"
```

---

## 9. Tests à écrire

| Test | Fichier | Assertion clé |
|------|---------|---------------|
| Prompt correct par variant | `handlers/SupportTicketAnalysisHandler.test.ts` | `buildSystemPrompt('garage')` contient "bon de réparation" |
| RBAC staff bloqué | `api/tenant/support/tickets/route.test.ts` | staff → 403 |
| RBAC manager autorisé | idem | manager → 201 |
| RAG non disponible → analyse continue | `SupportTicketAnalysisHandler.test.ts` | LightRAG mock offline → draft_ready quand même |
| Escalade si high risk | idem | draft.riskLevel='high' → escalated=true + event émis |
| Widget masqué si mod_support=false | `SupportHelpWidget.test.tsx` | capabilities.mod_support=false → null render |
| OnboardingHelpButton body conforme | `OnboardingHelpButton.test.tsx` | body.description >= 10 chars |

---

## 10. Ordre d'exécution recommandé

```
Sprint A (1 journée) — Visible immédiatement
│
├── 1A. verticalSupportContexts.ts + modifier SupportTicketAnalysisHandler
│         → le LLM parle le bon vocabulaire pour toutes les verticales
│
└── 1B. SupportHelpWidget + NexusProviderStack
          → première surface UI tenant, test E2E possible dès ce soir

Sprint B (0.5 journée) — Robustesse
│
├── 2A. RBAC intra-tenant + rate limit
└── 3D. Fix OnboardingHelpButton

Sprint C (0.5 journée) — Qualité IA + Clôture
│
├── 2B. RAG branché (conditionnel LightRAG)
├── 3A. Escalade automatique
├── 3B. Notification tenant post draft_ready
└── 3C. Page /aide/tickets
```

---

## 11. Décisions à prendre avant Sprint B

| # | Question | Options | Défaut suggéré |
|---|----------|---------|----------------|
| D1 | RBAC min ticket : quel rôle ? | `staff` / `manager` / `owner` | `manager` |
| D2 | Rate limit par tenant ? | 5/jour / 10/jour / illimité | 10/jour |
| D3 | Screenshot : URL externe ou upload ? | URL externe (actuel) / upload via StorageAdapter (provider agnostique) | URL externe (Phase 1), upload Phase 2 |
| D4 | RAG : query synchrone ou async ? | Sync (latence +1-2s) / Async (ticket analysé en 2 temps) | Sync (déjà async via EventBus) |
| D5 | `/aide/tickets` : route standalone ou drawer dans `/mon-espace` ? | Standalone / Dans mon-espace | Dans `mon-espace` (tab Aide) |

---

*Plan finalisé le 2026-08-07. Prochaine révision après Sprint A.*
