# AGENTTICKET — Plan d'Implémentation Agent IA Support + CodeGraph

> **Version** : 1.0 — 2026-08-13
> **Auteur** : Claude Code (session `agentticket-plan`)
> **Statut** : PLAN — aucun code touché
> **Prérequis lecture** : `CLAUDE.md`, `ARCHITECTURE.md`, `PLAN_COMPLET.md`

---

## Table des matières

- [§0 — Résumé exécutif](#0--résumé-exécutif)
- [§1 — État des lieux existant](#1--état-des-lieux-existant)
- [§2 — Architecture cible](#2--architecture-cible)
- [§3 — CodeGraph : intégration & déploiement](#3--codegraph--intégration--déploiement)
- [§4 — Pipeline Agent IA (ticket → PR)](#4--pipeline-agent-ia-ticket--pr)
- [§5 — Messagerie bidirectionnelle tenant ↔ MCC](#5--messagerie-bidirectionnelle-tenant--mcc)
- [§6 — RBAC & SovereignGuard](#6--rbac--sovereignguard)
- [§7 — Schémas & contrats (Zod)](#7--schémas--contrats-zod)
- [§8 — Events & bus](#8--events--bus)
- [§9 — API routes](#9--api-routes)
- [§10 — UI (tenant + MCC)](#10--ui-tenant--mcc)
- [§11 — Modèle monorepo + plugins tenant](#11--modèle-monorepo--plugins-tenant)
- [§12 — Blindspots & risques](#12--blindspots--risques)
- [§13 — Consolidation MaintenanceAgent (legacy)](#13--consolidation-maintenanceagent-legacy)
- [§14 — Plan d'exécution phasé](#14--plan-dexécution-phasé)
- [§15 — Métriques & ROI attendu](#15--métriques--roi-attendu)

---

## §0 — Résumé exécutif

### Quoi
Un **agent IA autonome** qui, entre la soumission d'un ticket par un client tenant et l'ouverture du ticket par le super admin MCC, a **déjà** :
1. Diagnostiqué le problème via CodeGraph (intelligence de code locale)
2. Écrit le code correctif ou la feature custom demandée
3. Créé une branche PR-ready avec diff, tests, et analyse d'impact

### Pourquoi
- **Temps de résolution** : de heures/jours → minutes (pré-traitement automatique)
- **Qualité** : l'agent a le contexte complet du code (pas un LLM "aveugle"), il connaît les dépendances, les callers, le blast radius
- **Scalabilité** : chaque tenant a son index CodeGraph — l'agent comprend les extensions custom du tenant

### Comment (en 3 phrases)
CodeGraph indexe le codebase dans un knowledge graph SQLite local (AST tree-sitter, 30+ langages). Quand un ticket arrive, un **orchestrateur serveur** appelle l'agent IA en lui donnant le contexte CodeGraph (`codegraph_explore`) au lieu de le laisser grep/read. L'agent produit un `AgentDraft` structuré (diagnostic + diff + branch) validé par le human-in-the-loop gate existant (`support-gate`).

### Delta vs existant
| Composant | Aujourd'hui | Cible |
|-----------|------------|-------|
| Analyse ticket | Gemini LLM avec contexte tenant config | Gemini + CodeGraph (contexte code complet) |
| Output | `SupportDraft` (brief textuel) | `AgentDraft` (diagnostic + git diff + branche) |
| MaintenanceAgent | Système parallèle séparé | Fusionné dans le pipeline unique |
| Communication tenant-MCC | Ticket unidirectionnel | Messagerie bidirectionnelle temps réel |
| Code intelligence | Aucune | CodeGraph par tenant (core + extensions) |

---

## §1 — État des lieux existant

### 1.1 Système de tickets support (actif)

**Flux actuel** :
```
Tenant (SupportHelpWidget) 
  → POST /api/tenant/support/tickets
    → Firestore mcc/supportTickets/{ticketId}
      → emit support.ticket_submitted
        → SupportTicketAnalysisHandler (Gemini)
          → SupportDraft (kind: config_patch | code_fix | evolution_proposal)
            → MCC SupportDraftsPanel (approve/reject)
              → support-gate (human-in-the-loop)
```

**Fichiers clés** :
| Fichier | Rôle |
|---------|------|
| `src/kernel/nexus/contracts/supportTicket.ts` | Schémas Zod : SupportTicket, SupportDraft, SupportDiagnostic |
| `src/orchestration/handlers/SupportTicketAnalysisHandler.ts` | Handler IA (Gemini → SupportDraft) |
| `src/orchestration/events/support.events.ts` | Events : `ticket_submitted`, `ticket_escalated` |
| `src/app/api/tenant/support/tickets/route.ts` | API tenant (POST create, GET list) |
| `src/app/api/admin/fleet/support-ai/diagnose/route.ts` | API MCC diagnostic direct |
| `src/app/api/admin/fleet/support-ai/drafts/route.ts` | API MCC gestion drafts |
| `src/app/api/admin/fleet/support-gate/route.ts` | Gate human-in-the-loop (POST/PATCH/GET) |
| `src/design/support/SupportHelpWidget.tsx` | Widget flottant tenant |
| `src/design/support/useSupportTickets.ts` | Hook client (polling 15s) |
| `src/app/(admin)/admin/mcc/components/SupportAIPanel.tsx` | Panel MCC diagnostic |
| `src/app/(admin)/admin/mcc/components/SupportDraftsPanel.tsx` | Panel MCC drafts |

**Contexte vertical** : `src/orchestration/handlers/support/verticalSupportContexts.ts` — 8 verticales avec productName, businessDescription, keyTerms, featuredModules.

### 1.2 MaintenanceAgent (legacy, parallèle)

**Flux** :
```
SOS interne → MaintenanceAgent.submitSOS()
  → Firestore maintenanceTickets/{ticketId}
    → analyzeWithAI() (Gemini + DNAInjector)
      → MaintenanceAIAnalysis (summary, affectedFiles, proposedFix)
        → status: pr_ready (mais pas de vraie PR)
```

**Fichiers** :
| Fichier | Rôle |
|---------|------|
| `src/lib/MaintenanceAgent.ts` | Orchestrateur autonome (steps 1-8) |
| `src/kernel/nexus/contracts/maintenance.types.ts` | Types : MaintenanceTicket, MaintenanceAIAnalysis |

**Problèmes** :
- Deux systèmes parallèles pour le même besoin
- MaintenanceAgent promet un "PR" mais ne produit qu'un texte
- Pas de validation Zod sur la sortie IA
- DNAInjector enrichit le contexte mais pas le code (pas de CodeGraph)
- Collection `maintenanceTickets/` séparée de `mcc/supportTickets/`

### 1.3 Notification (existant, réutilisable)

- **WebPush** : `src/lib/push/webPushService.ts` — `sendToUser()`, `sendToRole()`
- **NotificationGateway** : `src/lib/adapters/NotificationGateway.ts` — Email (Resend), SMS (Twilio)
- **MCC notify-critical** : `src/app/api/admin/mcc/notify-critical/route.ts`
- **NexusEventBus** : `support.ticket_submitted`, `support.ticket_escalated`

### 1.4 Pas de messagerie temps réel

Aucun chat/conversation bidirectionnel tenant ↔ MCC. Communication = ticket unidirectionnel + statut polling.

---

## §2 — Architecture cible

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TENANT APP                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ SupportWidget │  │ TicketMessaging  │  │ TicketStatusTracker  │  │
│  │ (enrichi)     │  │ (NOUVEAU)        │  │ (NOUVEAU)            │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼───────────────────────┼───────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER (Next.js)                           │
│  POST /api/tenant/support/tickets      (enrichi : attachments)     │
│  GET  /api/tenant/support/tickets/[id]/messages  (NOUVEAU)         │
│  POST /api/tenant/support/tickets/[id]/messages  (NOUVEAU)         │
│  GET  /api/tenant/support/tickets/[id]/status     (SSE stream)     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                              │
│                                                                     │
│  ┌────────────────────┐    ┌──────────────────────────────────────┐ │
│  │ NexusEventBus      │    │ AgentOrchestrator (NOUVEAU)         │ │
│  │ support.ticket_*   │───▶│                                      │ │
│  └────────────────────┘    │  Phase 1: Triage (classification)   │ │
│                            │  Phase 2: Context (CodeGraph query) │ │
│                            │  Phase 3: Diagnosis (LLM reasoning) │ │
│                            │  Phase 4: Solution (code generation)│ │
│                            │  Phase 5: Validation (lint/type/test)│ │
│                            │  Phase 6: Packaging (branch + diff) │ │
│                            └──────────┬───────────────────────────┘ │
│                                       │                             │
│                            ┌──────────▼───────────────────────────┐ │
│                            │ CodeGraphBridge (NOUVEAU)            │ │
│                            │ - searchNodes(query)                 │ │
│                            │ - getImpactRadius(symbol)            │ │
│                            │ - buildContext(symbols[])            │ │
│                            │ - getCallers/getCallees              │ │
│                            └──────────┬───────────────────────────┘ │
│                                       │                             │
│                            ┌──────────▼───────────────────────────┐ │
│                            │ CodeGraph Daemon (per-tenant)        │ │
│                            │ SQLite KG + file watcher             │ │
│                            │ MCP server (codegraph_explore)       │ │
│                            └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          MCC ADMIN                                  │
│  ┌────────────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │ AgentTicketPanel   │  │ AgentDiffView │  │ SupportGate       │  │
│  │ (NOUVEAU)          │  │ (NOUVEAU)     │  │ (existant, enrichi│  │
│  └────────────────────┘  └───────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Principes directeurs

1. **Pipeline unique** : fusionner SupportTicket + MaintenanceAgent → un seul flux `AgentTicket`
2. **CodeGraph = cerveau** : l'agent ne grep pas, il query le knowledge graph
3. **Human-in-the-loop** : le gate existant (`support-gate`) valide tout code avant application
4. **Progressivité** : le tenant voit le statut évoluer en temps réel (SSE)
5. **Isolation** : chaque tenant a son propre index CodeGraph (core + overlays)
6. **Audit trail** : chaque action de l'agent est loguée dans ChangelogService

---

## §3 — CodeGraph : intégration & déploiement

### 3.1 Qu'est-ce que CodeGraph

**Repo** : `@colbymchenry/codegraph` v1.5.0 (MIT)
**Nature** : Knowledge graph SQLite construit par parsing AST (tree-sitter, 30+ langages). Index sub-milliseconde. File watcher pour sync live (~1s lag).

**API Library** :
```typescript
import { CodeGraph } from '@colbymchenry/codegraph';

// Initialisation (crée .codegraph/ dans le projet)
await CodeGraph.init('/path/to/project');

// Ouverture (read-only, rapide)
const cg = await CodeGraph.open('/path/to/project');

// Recherche de symboles
const nodes = await cg.searchNodes('SupportTicket');

// Callers/callees (call graph)
const callers = await cg.getCallers('processOrder');
const callees = await cg.getCallees('processOrder');

// Impact radius (blast radius d'un changement)
const impact = await cg.getImpactRadius('SupportDraftSchema');

// Build context (source + call path + blast radius en une requête)
const ctx = await cg.buildContext(['SupportTicket', 'NexusEventBus']);

// File watcher (sync live)
cg.watch();  // démarre le watcher
cg.unwatch(); // arrête
```

**MCP Tool** : `codegraph_explore` — un seul outil qui combine search + source + call path + blast radius. Remplace les boucles grep/read.

**Benchmarks** (sur repos comparables en taille à Restaurant OS) :
- 88% moins de tool calls
- 62% moins de tokens
- 44% moins cher

### 3.2 Modèle de déploiement

**Contrainte critique** : CodeGraph nécessite un daemon persistent (SQLite + file watcher). Incompatible avec les Cloud Functions serverless.

**Architecture recommandée** :

```
┌──────────────────────────────────────────────────────────┐
│  VPS / Cloud Run (always-on)                             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ CodeGraph Service                                  │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │  │
│  │  │ HTTP API     │  │ Instance Manager         │   │  │
│  │  │ /explore     │  │ - lazyInit(tenantId)     │   │  │
│  │  │ /impact      │  │ - evict LRU             │   │  │
│  │  │ /context     │  │ - healthCheck()         │   │  │
│  │  └──────┬───────┘  └──────────┬───────────────┘   │  │
│  │         │                     │                    │  │
│  │  ┌──────▼─────────────────────▼───────────────┐   │  │
│  │  │ Tenant Index Pool                          │   │  │
│  │  │                                            │   │  │
│  │  │  tenant_abc/ ─── .codegraph/ (SQLite)      │   │  │
│  │  │  tenant_xyz/ ─── .codegraph/ (SQLite)      │   │  │
│  │  │  _core/      ─── .codegraph/ (SQLite)      │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Git Service                                        │  │
│  │ - clone/pull core repo                             │  │
│  │ - apply tenant overlays                            │  │
│  │ - create branches                                  │  │
│  │ - generate diffs                                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Options d'hébergement (ordre de préférence)** :

| Option | Coût/mois | Avantage | Inconvénient |
|--------|-----------|----------|--------------|
| **Cloud Run (min-instances=1)** | ~15-40€ | Intégré GCP, auto-scale | Cold start si min=0 |
| **Fly.io Machine** | ~10-30€ | Simple, persistent volume | Hors écosystème GCP |
| **VPS dédié (Hetzner/OVH)** | ~5-15€ | Contrôle total, pas de cold start | Ops manuels |
| **Compute Engine (GCP)** | ~20-50€ | Intégré GCP | Surpayé pour ce besoin |

**Recommandation** : **Cloud Run avec `min-instances: 1`** — reste dans l'écosystème GCP (Firebase), scale automatique, persistent volume pour les index SQLite. Le `min-instances: 1` élimine le cold start.

### 3.3 Indexation : modèle core + overlay

```
/codegraph-data/
├── _core/                          # Index du monorepo RESTAURANT-OS-CORE
│   ├── repo/                       # Clone Git du core
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   └── .codegraph/                 # Index SQLite (tout le core)
│
├── tenant_abc/                     # Tenant ABC
│   ├── repo/                       # Clone core + extensions tenant
│   │   ├── src/                    # Symlink ou copie du core
│   │   └── tenants/abc/extensions/ # Code custom du tenant
│   └── .codegraph/                 # Index (core + extensions)
│
└── tenant_xyz/                     # Tenant XYZ
    ├── repo/
    │   ├── src/
    │   └── tenants/xyz/extensions/
    └── .codegraph/
```

**Stratégie d'indexation** :

1. **Core index** : réindexé à chaque push sur `main`. Partagé en lecture par tous les tenants.
2. **Tenant overlay** : créé au provisioning (`TenantProvisioningService`), réindexé quand le tenant déploie une extension.
3. **Lazy init** : l'index tenant n'est créé qu'au premier ticket — pas de coût pour les tenants sans extensions.
4. **LRU eviction** : les index inactifs depuis >7 jours sont fermés (le SQLite reste sur disque, pas de perte).

### 3.4 CodeGraphBridge — interface applicative

**Emplacement** : `src/lib/codegraph/CodeGraphBridge.ts`

```typescript
// Contrat (pas encore implémenté)
interface ICodeGraphBridge {
  // Requête contextuelle (remplace grep + read)
  explore(query: string, tenantId?: string): Promise<ExploreResult>;
  
  // Impact d'un changement (blast radius)
  getImpactRadius(symbolName: string, tenantId?: string): Promise<ImpactResult>;
  
  // Construction de contexte pour le LLM
  buildAgentContext(ticket: AgentTicket): Promise<AgentContext>;
  
  // Santé du service
  healthCheck(): Promise<{ coreIndexed: boolean; tenantCount: number; lastSync: string }>;
}

interface ExploreResult {
  symbols: Array<{
    name: string;
    file: string;
    line: number;
    kind: 'function' | 'class' | 'interface' | 'type' | 'variable';
    source: string;  // Source verbatim avec numéros de ligne
  }>;
  callPaths: Array<{ from: string; to: string; kind: string }>;
  blastRadius: Array<{ file: string; symbol: string; relationship: string }>;
}

interface AgentContext {
  relevantFiles: Array<{ path: string; source: string; relevance: string }>;
  callGraph: string;  // Résumé textuel du call graph
  impactSummary: string;  // Résumé du blast radius
  tenantOverlays: string[];  // Extensions spécifiques du tenant
  verticalContext: VerticalSupportContext;  // Contexte métier
}
```

### 3.5 Communication Next.js ↔ CodeGraph Service

Le service CodeGraph tourne séparément. Communication via **HTTP interne** (pas WebSocket — les requêtes sont request/response) :

```
Next.js API Route
  → CodeGraphBridge.explore(query, tenantId)
    → HTTP POST http://codegraph-service:9630/explore
      → CodeGraph.open(tenantIndexPath).buildContext(...)
    ← ExploreResult
```

**Sécurisation** :
- Token interne (`CODEGRAPH_SERVICE_TOKEN` en env)
- Réseau privé (VPC / Docker network)
- Rate limit par tenant (10 req/min par défaut, configurable)

---

## §4 — Pipeline Agent IA (ticket → PR)

### 4.1 AgentOrchestrator — le cerveau

**Emplacement** : `src/modules/intelligence/ia/agent/AgentOrchestrator.ts`

L'orchestrateur gère le pipeline en **6 phases**. Chaque phase est idempotente et persiste son état — si l'agent crash, il reprend à la dernière phase complétée.

```
Phase 1: TRIAGE        → Classification + priorité + SLA
Phase 2: CONTEXT        → CodeGraph query + tenant config + vertical context
Phase 3: DIAGNOSIS      → LLM reasoning (cause racine, impact, risques)
Phase 4: SOLUTION       → Code generation (diff, nouveaux fichiers)
Phase 5: VALIDATION     → Lint + type-check + tests unitaires
Phase 6: PACKAGING      → Branche Git + PR metadata + changelog
```

### 4.2 Phase 1 : Triage

**Input** : `AgentTicket` brut (description + screenshots + tenant context)
**Output** : `TriageResult` (catégorie, priorité, SLA, routing)

```typescript
interface TriageResult {
  category: 'bug' | 'config' | 'feature' | 'question' | 'data_issue' | 'perf';
  subCategory: string;  // ex: 'pos_crash', 'stock_mismatch', 'custom_field'
  priority: 'critical' | 'high' | 'medium' | 'low';
  slaMinutes: number;  // SLA cible selon tier
  routing: {
    pillar: string;       // ex: 'ops', 'finance', 'logistics'
    domain: string;       // ex: 'service', 'comptabilite', 'stock'
    suggestedModule: string;  // ex: 'pos', 'haccp', 'inventory'
  };
  requiresCodeChange: boolean;
  requiresHumanEscalation: boolean;
  escalationReason?: string;
}
```

**Logique de triage** :
1. **Analyse NLP** (Gemini Flash) : extraction d'entités (module, erreur, action)
2. **Mapping vertical** : `VERTICAL_SUPPORT_CONTEXTS[variant]` → termes métier
3. **Scoring priorité** :
   - `critical` : mots-clés "caisse bloquée", "NF525", "perte données", tenant tier PREMIUM
   - `high` : "erreur", "bug", "ne fonctionne plus", tenant tier STANDARD
   - `medium` : "lent", "amélioration", demande de config
   - `low` : question, "comment faire"
4. **SLA par tier** :

| Tier | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| PREMIUM | 15min | 1h | 4h | 24h |
| STANDARD | 1h | 4h | 12h | 48h |
| FREE | N/A | N/A | N/A | N/A (pas de support IA) |

5. **Escalation automatique** :
   - Tout ce qui touche NF525 / fiscal → `requiresHumanEscalation: true`
   - Toute modification de `IMMUTABLE_COLLECTIONS` → escalation
   - Confidence LLM < 0.4 → escalation
   - 3 tickets consécutifs du même tenant sur le même module → pattern détecté, escalation

### 4.3 Phase 2 : Context Building

**Input** : `TriageResult`
**Output** : `AgentContext` (context complet pour le LLM)

```typescript
async function buildContext(ticket: AgentTicket, triage: TriageResult): Promise<AgentContext> {
  // 1. CodeGraph : chercher les symboles pertinents
  const codeContext = await CodeGraphBridge.explore(
    `${triage.routing.suggestedModule} ${ticket.description}`,
    ticket.tenantId
  );
  
  // 2. Si c'est un bug, chercher l'impact radius du module touché
  const impact = triage.category === 'bug' 
    ? await CodeGraphBridge.getImpactRadius(triage.routing.suggestedModule, ticket.tenantId)
    : null;
  
  // 3. Tenant config (existant)
  const tenantConfig = await Nexus.adapter.get(`tenants/${ticket.tenantId}/tenantConfig`);
  
  // 4. Vertical context (existant)
  const verticalCtx = VERTICAL_SUPPORT_CONTEXTS[tenantConfig.variant];
  
  // 5. Tenant overrides RBAC (existant)
  const rbacOverrides = await Nexus.adapter.get(`tenants/${ticket.tenantId}/config/rbac`);
  
  // 6. Historique tickets similaires (NOUVEAU — pattern detection)
  const history = await Nexus.adapter.query('mcc/supportTickets', {
    where: { tenantId: ticket.tenantId },
    orderBy: 'createdAt',
    limit: 10
  });
  
  // 7. Extensions tenant (si existent)
  const tenantExtensions = await CodeGraphBridge.explore(
    `tenants/${ticket.tenantId}/extensions`,
    ticket.tenantId
  );
  
  return {
    relevantFiles: codeContext.symbols.map(s => ({
      path: s.file, source: s.source, relevance: 'direct_match'
    })),
    callGraph: formatCallGraph(codeContext.callPaths),
    impactSummary: impact ? formatImpact(impact) : 'N/A',
    tenantOverlays: tenantExtensions?.symbols.map(s => s.file) ?? [],
    verticalContext: verticalCtx,
    tenantConfig: sanitizeConfig(tenantConfig),  // sans secrets
    ticketHistory: history.filter(h => h.status === 'applied').slice(0, 5),
    rbacOverrides,
  };
}
```

**Pourquoi CodeGraph change tout ici** :
- **Sans CodeGraph** : le handler actuel (`SupportTicketAnalysisHandler`) n'a que le `tenantConfig` comme contexte. Il ne sait pas quel code est impliqué.
- **Avec CodeGraph** : une seule requête `explore("stock déduction POS")` retourne les fichiers source exacts, les callers, les callees, et le blast radius. L'agent sait précisément quoi toucher.

### 4.4 Phase 3 : Diagnosis

**Input** : `AgentContext`
**Output** : `AgentDiagnosis`

```typescript
interface AgentDiagnosis {
  rootCause: string;
  explanation: string;
  affectedComponents: Array<{
    file: string;
    symbol: string;
    issue: string;
    severity: 'breaking' | 'degraded' | 'cosmetic';
  }>;
  relatedTickets: string[];  // IDs de tickets similaires résolus
  confidence: number;  // 0-1
  approach: 'patch' | 'refactor' | 'config_change' | 'new_feature' | 'no_code_needed';
  risks: Array<{
    description: string;
    mitigation: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}
```

**System prompt diagnostic** (injecté au LLM) :
```
Tu es un SRE Senior pour {verticalContext.productName}. Tu as accès au code source
complet via CodeGraph. Tu diagnostiques un problème signalé par un opérateur.

RÈGLES INVIOLABLES :
1. Tu ne MODIFIES jamais les collections NF525 (journalEntries, fiscalSeals, fiscalLedger)
2. Tu ne CONTOURNES jamais SovereignGuard (tenantId doit être vérifié)
3. Tu ne TOUCHES jamais aux collections signedWrite sans HMAC
4. Toute modification monétaire utilise Microunits (jamais de cents, jamais de float)
5. Si tu n'es pas sûr, tu escalades — confidence < 0.5 = escalation automatique

CONTEXTE CODE (via CodeGraph) :
{agentContext.relevantFiles}

CALL GRAPH :
{agentContext.callGraph}

BLAST RADIUS :
{agentContext.impactSummary}
```

### 4.5 Phase 4 : Solution Generation

**Input** : `AgentDiagnosis` + `AgentContext`
**Output** : `AgentSolution`

```typescript
interface AgentSolution {
  kind: 'config_patch' | 'code_fix' | 'evolution' | 'no_action';
  
  // Pour config_patch : delta à merger dans tenantConfig.overrides
  configPatch?: Record<string, unknown>;
  
  // Pour code_fix / evolution : fichiers modifiés
  fileDiffs?: Array<{
    path: string;
    operation: 'modify' | 'create' | 'delete';
    diff: string;  // Format unified diff
    beforeSnippet?: string;  // Contexte pour review
    afterSnippet?: string;
  }>;
  
  // Tests à ajouter/modifier
  testDiffs?: Array<{
    path: string;
    diff: string;
  }>;
  
  // Brief human-readable
  summary: string;
  
  // Risques identifiés
  breakingChanges: string[];
  
  // Modules impactés (pour notification)
  impactedModules: string[];
}
```

**Guardrails code generation** :
1. **Interdictions absolues** :
   - Modifier `src/kernel/nexus/guards/SovereignGuard.ts`
   - Modifier les collections `IMMUTABLE_COLLECTIONS`
   - Écrire du code avec `as Microunits` (forcer `toMicrounits()`)
   - Ajouter des imports directs `@/modules/<pilier>/<domaine>/...` (barrel only)
   - Toucher `src/kernel/` (sauf si le diagnostic prouve un bug kernel — escalation obligatoire)
2. **Validations automatiques** :
   - Chaque diff est parsé et validé syntaxiquement
   - Imports vérifiés contre les barrels existants
   - Microunits vérifié par regex sur les nouveaux fichiers
3. **Limites de scope** :
   - Max 5 fichiers modifiés par ticket (au-delà → escalation)
   - Max 200 lignes de diff total (au-delà → escalation)
   - Jamais de modification de migration ou de schéma DB

### 4.6 Phase 5 : Validation

**Input** : `AgentSolution`
**Output** : `ValidationResult`

```typescript
interface ValidationResult {
  typeCheck: { passed: boolean; errors: string[] };
  lintCheck: { passed: boolean; errors: string[] };
  testRun: { passed: boolean; failures: string[]; newTests: number };
  blastRadiusCheck: { safe: boolean; unexpectedImpacts: string[] };
  securityCheck: { 
    passed: boolean; 
    issues: string[];  // XSS, injection, IDOR, etc.
  };
  sentruxCheck: { passed: boolean; violations: string[] };
  overallVerdict: 'green' | 'yellow' | 'red';
}
```

**Pipeline de validation** :
1. Appliquer les diffs dans un workspace temporaire (worktree Git)
2. `npx tsc --noEmit` → erreurs de type
3. `npx eslint --fix` → lint
4. `npx vitest run --related` → tests impactés uniquement
5. `sentrux check .` → cycles, god files, couches
6. CodeGraph re-index + `getImpactRadius()` → vérifier que le blast radius est attendu
7. Security scan (regex patterns : `eval()`, SQL raw, `innerHTML`, `dangerouslySetInnerHTML`, credentials hardcodées)

**Verdicts** :
- `green` : tout passe → auto-applicable si `confidence > 0.8` ET `riskLevel === 'low'`
- `yellow` : warnings non-bloquants → review humaine recommandée
- `red` : erreurs → l'agent retente (max 2 itérations) ou escalade

### 4.7 Phase 6 : Packaging

**Input** : `AgentSolution` validée + `ValidationResult`
**Output** : `AgentDraft` (le livrable final)

```typescript
interface AgentDraft {
  // Identité
  ticketId: string;
  tenantId: string;
  branchName: string;  // ex: 'agent/ticket-abc123-fix-stock-deduction'
  
  // Diagnostic
  diagnosis: AgentDiagnosis;
  
  // Solution
  solution: AgentSolution;
  
  // Validation
  validation: ValidationResult;
  
  // Metadata
  kind: 'config_patch' | 'code_fix' | 'evolution' | 'no_action';
  title: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  autoApplicable: boolean;  // true si green + confidence > 0.8 + low risk
  
  // PR metadata
  prTitle: string;
  prBody: string;
  diffStat: { files: number; insertions: number; deletions: number };
  
  // Audit trail
  pipelineDuration: number;  // ms
  llmTokensUsed: number;
  codegraphQueries: number;
  phases: Array<{ name: string; duration: number; status: string }>;
}
```

---

## §5 — Messagerie bidirectionnelle tenant ↔ MCC

### 5.1 Pourquoi

Aujourd'hui, un ticket est un formulaire → réponse. Pas de suivi, pas de conversation. Le tenant soumet et attend. Le MCC répond via le statut du ticket.

**Besoin** : un thread de messages attaché à chaque ticket, visible des deux côtés.

### 5.2 Architecture messages

**Collection Firestore** : `mcc/supportTickets/{ticketId}/messages/{messageId}`

```typescript
const TicketMessageSchema = z.object({
  id: UUIDSchema,
  ticketId: z.string().min(1),
  sender: z.object({
    type: z.enum(['tenant_user', 'mcc_operator', 'ai_agent']),
    id: z.string().min(1),
    displayName: sanitized(1, 100),
  }),
  content: sanitized(1, 4000),
  attachments: z.array(z.object({
    type: z.enum(['screenshot', 'log', 'file']),
    url: z.string().url(),
    name: sanitized(1, 255),
    sizeBytes: z.number().int().positive(),
  })).max(5).default([]),
  metadata: z.object({
    agentPhase: z.string().optional(),  // ex: 'triage', 'diagnosis'
    isSystemMessage: z.boolean().default(false),
    referencedDraftId: z.string().optional(),
  }).default({}),
  createdAt: TimestampSchema,
  readBy: z.record(z.string(), TimestampSchema).default({}),
});
```

### 5.3 Temps réel : Firestore onSnapshot (pas de WebSocket custom)

**Raison** : l'app est déjà Firebase-first avec un cache IndexedDB local. Ajouter un WebSocket server serait de la dette. Firestore `onSnapshot` donne le temps réel natif.

**Côté tenant** :
```typescript
// Hook : useSupportMessages(ticketId)
onSnapshot(
  collection(db, `mcc/supportTickets/${ticketId}/messages`),
  { orderBy: 'createdAt' },
  (snapshot) => setMessages(snapshot.docs.map(...))
);
```

**Côté MCC** :
```typescript
// Hook : useMccTicketMessages(ticketId)
// Même mécanique, mais accès via SovereignGuard scope MCC
```

**Remarque SovereignGuard** : les messages vivent sous `mcc/supportTickets/` (scope MCC, pas tenant). Le tenant y accède via une API route qui vérifie `requireTenantUser` + `ticket.tenantId === callerTenantId`. Pas d'accès Firestore direct côté tenant pour cette collection.

### 5.4 Messages automatiques de l'agent

L'agent poste des messages système à chaque transition de phase :

```
[🤖 Agent IA] Ticket reçu — analyse en cours...
[🤖 Agent IA] Classification : bug (module POS) — priorité haute
[🤖 Agent IA] Diagnostic terminé — cause identifiée : hook usePos L.142 ne recalcule pas le total après remise
[🤖 Agent IA] Solution proposée — 1 fichier modifié, 12 lignes. En attente de validation.
[🤖 Agent IA] ✅ Validation réussie (types OK, tests OK). Branche agent/ticket-abc123 prête.
[🤖 Agent IA] En attente de review par l'équipe support.
```

Le tenant voit la progression en temps réel. Ça remplace le polling 15s actuel.

---

## §6 — RBAC & SovereignGuard

### 6.1 Matrice d'accès tickets

| Action | Tenant user | Tenant admin (directeur+) | MCC support | Fleet admin | Super admin |
|--------|-------------|--------------------------|-------------|-------------|-------------|
| Créer ticket | ✅ (level ≥ 30) | ✅ | ✅ (manuel) | ✅ | ✅ |
| Voir ses propres tickets | ✅ | ✅ | — | — | — |
| Voir tous tickets du tenant | ❌ | ✅ (level ≥ 70) | — | — | — |
| Envoyer message (tenant side) | ✅ (auteur du ticket) | ✅ (tous tickets tenant) | — | — | — |
| Voir tickets d'un tenant | — | — | ✅ | ✅ | ✅ |
| Envoyer message (MCC side) | — | — | ✅ | ✅ | ✅ |
| Voir AgentDraft (diagnostic + diff) | — | — | ✅ | ✅ | ✅ |
| Approuver draft (gate) | — | — | ❌ | ✅ | ✅ |
| Rejeter draft (gate) | — | — | ✅ | ✅ | ✅ |
| Appliquer le code (merge) | — | — | ❌ | ❌ | ✅ |
| Configurer l'agent (modèle, seuils) | — | — | ❌ | ❌ | ✅ |

### 6.2 Nouvelle page ACTION_MAP

```typescript
// Ajout dans actionPermissionMap.ts
support: {
  view_own_tickets: { minLevel: 30 },      // hotesse+
  view_all_tickets: { minLevel: 70 },      // manager+
  create_ticket: { minLevel: 30 },          // hotesse+
  send_message: { minLevel: 30 },           // hotesse+ (propres tickets)
  view_agent_draft: { minLevel: 90 },       // directeur+ (informationnel)
  approve_agent_draft: { minLevel: 100 },   // super_admin only
},
```

### 6.3 SovereignGuard — isolation tickets

**Règle** : un tenant ne peut JAMAIS voir un ticket d'un autre tenant, même si la collection est sous `mcc/`.

**Implémentation** :
- Les routes API tenant (`/api/tenant/support/*`) vérifient `requireTenantUser` + filtrage `tenantId`
- Les routes MCC (`/api/admin/fleet/support-*`) vérifient `requireMccLevel`
- Aucun accès Firestore direct côté client pour `mcc/supportTickets/` — tout passe par les API routes
- Le `tenantId` dans le ticket est vérifié à chaque lecture

### 6.4 Agent IA et SovereignGuard

**L'agent IA a accès cross-tenant par nature** — il lit le code de tous les tenants via CodeGraph. C'est intentionnel et nécessaire.

**Mais** :
1. L'agent ne lit JAMAIS les données métier du tenant (commandes, clients, factures) — seulement le code et la config
2. L'agent écrit UNIQUEMENT dans `mcc/supportTickets/{ticketId}` (scope MCC)
3. Le code généré par l'agent ne contient jamais de données tenant (vérifié en Phase 5)
4. Chaque action de l'agent est loguée dans ChangelogService avec `appliedBy: 'ai-agent:codegraph'`

### 6.5 Protection NF525

L'agent IA ne peut JAMAIS :
- Modifier `journalEntries`, `fiscalSeals`, `fiscalLedger` (IMMUTABLE_COLLECTIONS)
- Proposer un diff qui touche `FiscalSealer.ts`, `SovereignGuard.ts`, ou `NexusInterceptor.ts`
- Générer du code qui écrit dans les collections signées sans HMAC

Ces interdictions sont **hardcodées** dans l'AgentOrchestrator (pas configurables, pas overridables) et vérifiées en Phase 5 (validation).

---

## §7 — Schémas & contrats (Zod)

### 7.1 Évolution de SupportTicket → AgentTicket

Le schéma existant `SupportTicketSchema` est **conservé et étendu** — pas de breaking change.

```typescript
// src/kernel/nexus/contracts/agentTicket.ts (NOUVEAU)

import { SupportTicketSchema, SupportDraftSchema } from './supportTicket';

// Extension du draft existant
export const AgentDraftSchema = SupportDraftSchema.extend({
  // Nouveaux champs agent
  branchName: z.string().optional(),
  diagnosis: AgentDiagnosisSchema.optional(),
  fileDiffs: z.array(FileDiffSchema).optional(),
  testDiffs: z.array(FileDiffSchema).optional(),
  validation: ValidationResultSchema.optional(),
  prTitle: z.string().optional(),
  prBody: z.string().optional(),
  diffStat: z.object({
    files: z.number().int().nonneg(),
    insertions: z.number().int().nonneg(),
    deletions: z.number().int().nonneg(),
  }).optional(),
  pipelineDuration: z.number().int().nonneg().optional(),
  llmTokensUsed: z.number().int().nonneg().optional(),
  codegraphQueries: z.number().int().nonneg().optional(),
});

// Extension du ticket existant
export const AgentTicketSchema = SupportTicketSchema.extend({
  // Phase tracking
  currentPhase: z.enum([
    'submitted', 'triaging', 'building_context', 'diagnosing',
    'generating_solution', 'validating', 'packaging', 'draft_ready',
    'approved', 'rejected', 'applied', 'escalated', 'failed'
  ]).default('submitted'),
  
  // Triage result
  triage: TriageResultSchema.optional(),
  
  // Agent draft (remplace le SupportDraft simple)
  agentDraft: AgentDraftSchema.optional(),
  
  // Métriques agent
  agentMetrics: z.object({
    startedAt: TimestampSchema.optional(),
    completedAt: TimestampSchema.optional(),
    retryCount: z.number().int().nonneg().default(0),
    escalatedAt: TimestampSchema.optional(),
    escalationReason: z.string().optional(),
  }).default({}),
  
  // Attachments (NOUVEAU — le widget actuel n'a qu'un screenshotUrl)
  attachments: z.array(z.object({
    type: z.enum(['screenshot', 'log', 'video', 'file']),
    url: z.string().url(),
    name: sanitized(1, 255),
    sizeBytes: z.number().int().positive(),
  })).max(10).default([]),
});
```

### 7.2 Rétrocompatibilité

- `SupportTicketSchema` reste inchangé — les tickets existants restent valides
- `AgentTicketSchema` est un **superset** : `SupportTicketSchema.extend(...)`
- Les drafts existants (`SupportDraft`) sont compatibles avec `AgentDraft` (tous les nouveaux champs sont optionnels)
- La migration est transparente : un ticket sans `currentPhase` est traité comme `submitted`

---

## §8 — Events & bus

### 8.1 Nouveaux events

```typescript
// Extension de SUPPORTEvents dans support.events.ts

export interface SUPPORTEvents {
  // Existants (inchangés)
  'support.ticket_submitted': { /* ... */ };
  'support.ticket_escalated': { /* ... */ };
  
  // NOUVEAUX
  'support.agent_phase_changed': {
    v: 1;
    ticketId: string;
    tenantId: string;
    fromPhase: string;
    toPhase: string;
    metadata?: Record<string, unknown>;
  };
  
  'support.agent_draft_ready': {
    v: 1;
    ticketId: string;
    tenantId: string;
    draftKind: 'config_patch' | 'code_fix' | 'evolution' | 'no_action';
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    autoApplicable: boolean;
    filesChanged: number;
  };
  
  'support.agent_draft_applied': {
    v: 1;
    ticketId: string;
    tenantId: string;
    branchName: string;
    appliedBy: string;
    diffStat: { files: number; insertions: number; deletions: number };
  };
  
  'support.message_sent': {
    v: 1;
    ticketId: string;
    tenantId: string;
    senderType: 'tenant_user' | 'mcc_operator' | 'ai_agent';
    senderId: string;
  };
}
```

### 8.2 Handlers associés

| Event | Handler | Priorité | Action |
|-------|---------|----------|--------|
| `support.ticket_submitted` | `AgentOrchestratorHandler` | HIGH | Lance le pipeline agent (remplace `SupportTicketAnalysisHandler`) |
| `support.agent_phase_changed` | `AgentProgressHandler` | BACKGROUND | Poste un message système dans le thread + WebPush au tenant |
| `support.agent_draft_ready` | `AgentDraftNotificationHandler` | HIGH | WebPush au fleet_admin + email si confidence < 0.5 |
| `support.agent_draft_applied` | `AgentAppliedHandler` | HIGH | ChangelogService + notification tenant + update ticket status |
| `support.ticket_escalated` | `SupportEscalationHandler` | CRITICAL | Existant — inchangé |
| `support.message_sent` | `TicketMessageHandler` | BACKGROUND | WebPush au destinataire (tenant ou MCC selon sender) |

### 8.3 Guardrail bus

Les nouveaux events doivent être ajoutés à la whitelist du guardrail (`NexusEventBus.isExpectedUnconsumed`). Mais contrairement aux events verticaux, les events `support.*` sont **toujours consommés** (pas de whitelist — orphelin = bug).

---

## §9 — API routes

### 9.1 Routes tenant (enrichies)

```
# Existantes (modifiées)
POST   /api/tenant/support/tickets              → Créer un ticket (+ attachments)
GET    /api/tenant/support/tickets              → Lister ses tickets

# NOUVELLES
GET    /api/tenant/support/tickets/[id]         → Détail ticket + AgentDraft (vue tenant)
GET    /api/tenant/support/tickets/[id]/messages → Messages du thread
POST   /api/tenant/support/tickets/[id]/messages → Envoyer un message
GET    /api/tenant/support/tickets/[id]/status   → SSE stream (phases agent en temps réel)
```

### 9.2 Routes MCC (enrichies)

```
# Existantes (modifiées)
GET    /api/admin/fleet/support-ai/drafts       → Lister les AgentDrafts (enrichi)
PATCH  /api/admin/fleet/support-ai/drafts/[id]  → Approve/reject/edit draft

# NOUVELLES
GET    /api/admin/fleet/agent-tickets            → Lister tous les tickets avec statut agent
GET    /api/admin/fleet/agent-tickets/[id]       → Détail complet (draft + diff + validation)
GET    /api/admin/fleet/agent-tickets/[id]/diff  → Diff formaté (pour le DiffView)
POST   /api/admin/fleet/agent-tickets/[id]/apply → Appliquer le code (merge branche)
POST   /api/admin/fleet/agent-tickets/[id]/retry → Relancer l'agent (si failed)
GET    /api/admin/fleet/agent-tickets/[id]/messages → Messages thread
POST   /api/admin/fleet/agent-tickets/[id]/messages → Répondre au tenant

# CodeGraph management
GET    /api/admin/codegraph/health               → Santé du service CodeGraph
POST   /api/admin/codegraph/reindex/[tenantId]   → Forcer réindexation
GET    /api/admin/codegraph/stats                 → Statistiques (tenants indexés, taille, etc.)
```

### 9.3 Route SSE (temps réel sans WebSocket)

```typescript
// src/app/api/tenant/support/tickets/[id]/status/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = onSnapshot(
        doc(db, `mcc/supportTickets/${params.id}`),
        (snapshot) => {
          const data = snapshot.data();
          if (data?.tenantId !== caller.tenantId) return;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ 
              status: data.status, 
              currentPhase: data.currentPhase,
              agentDraft: data.agentDraft ? { title: data.agentDraft.title, confidence: data.agentDraft.confidence } : null
            })}\n\n`
          ));
        }
      );
      req.signal.addEventListener('abort', () => { unsubscribe(); controller.close(); });
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

---

## §10 — UI (tenant + MCC)

### 10.1 Côté tenant : SupportHelpWidget enrichi

**Modifications** :
1. **Tab "Messagerie"** : conversation thread avec l'agent et le support MCC
2. **Progression visuelle** : barre de phases (triage → diagnostic → solution → validation → prêt)
3. **Attachments** : upload screenshot/vidéo (pas juste URL)
4. **Statut temps réel** : SSE au lieu de polling 15s

**Composants** :
```
src/design/support/
├── SupportHelpWidget.tsx          (existant, enrichi)
├── useSupportTickets.ts           (existant, enrichi)
├── TicketMessageThread.tsx        (NOUVEAU)
├── TicketPhaseTracker.tsx         (NOUVEAU)
├── TicketAttachmentUploader.tsx   (NOUVEAU)
└── useTicketSSE.ts                (NOUVEAU)
```

### 10.2 Côté MCC : AgentTicketPanel

**Nouveau panel MCC** (tab dans la page MCC existante) :

```
src/app/(admin)/admin/mcc/components/
├── AgentTicketPanel.tsx            (NOUVEAU — liste + filtres)
├── AgentTicketDetail.tsx           (NOUVEAU — vue détaillée)
├── AgentDiffViewer.tsx             (NOUVEAU — diff coloré)
├── AgentValidationReport.tsx       (NOUVEAU — résultats lint/test/security)
├── AgentPipelineTimeline.tsx       (NOUVEAU — timeline des 6 phases)
├── CodeGraphHealthWidget.tsx       (NOUVEAU — santé du service CG)
└── AgentConfigPanel.tsx            (NOUVEAU — config agent par tenant)
```

**Fonctionnalités clés du panel** :
1. **File d'attente** : tickets triés par priorité + SLA countdown
2. **Diff viewer** : diff coloré GitHub-like avec annotations de l'agent
3. **Timeline pipeline** : visualisation des 6 phases avec durées
4. **One-click approve** : bouton "Approuver & Appliquer" (avec confirmation)
5. **Feedback loop** : si le super admin rejette + commente, l'agent peut retenter avec le feedback

---

## §11 — Modèle monorepo + plugins tenant

### 11.1 Structure cible

```
RESTAURANT-OS-CORE/               # Monorepo principal
├── src/                           # Code core (partagé par tous)
│   ├── kernel/
│   ├── modules/
│   ├── orchestration/
│   └── ...
├── tenants/                       # Extensions par tenant
│   ├── {tenantId}/
│   │   ├── extensions/            # Code custom
│   │   │   ├── components/        # Composants UI custom
│   │   │   ├── hooks/             # Hooks custom
│   │   │   ├── services/          # Services custom
│   │   │   └── config/            # Config overrides (code-level)
│   │   ├── package.json           # Dépendances spécifiques
│   │   └── tsconfig.json          # Config TS (extends root)
│   └── _template/                 # Template vide pour nouveaux tenants
└── .codegraph/                    # Index core
```

### 11.2 Règles d'isolation

1. **Les extensions NE modifient PAS le core** — elles l'étendent via des points d'extension définis
2. **Les extensions importent le core via barrels** — `import { X } from '@core/modules/ops'`
3. **Le core ne connaît PAS les extensions** — pas d'import inverse
4. **Chaque extension est un module auto-contenu** avec son barrel `index.ts`

### 11.3 Points d'extension (plugin system)

Le système de plugins existant (`src/kernel/nexus/contracts/plugin.ts` si existant, sinon `src/lib/mcc/PluginCatalogManager.tsx`) est réutilisé.

**Catégories de plugins tenant** :
1. **UI Overrides** : composant custom via `withVerticalOverride()` (pattern existant)
2. **Business Rules** : hooks custom dans le workflow (ex: validation supplémentaire avant commande)
3. **Integrations** : connecteurs custom (via ConnectorHub existant)
4. **Reports** : rapports custom (templates + queries)
5. **Config** : overrides de config avancés (au-delà de `tenantConfig.overrides`)

### 11.4 CodeGraph et les extensions

Quand l'agent travaille sur un ticket d'un tenant avec extensions :
1. L'index CodeGraph du tenant inclut core + extensions
2. L'agent voit les overrides UI, les hooks custom, les services custom
3. Si le problème est dans une extension, l'agent ne touche QUE l'extension (jamais le core depuis un ticket tenant)
4. Si le problème est dans le core mais impacte l'extension, l'agent propose deux diffs : core fix + extension adaptation

---

## §12 — Blindspots & risques

### 12.1 Blindspots identifiés

| # | Blindspot | Impact | Mitigation |
|---|-----------|--------|------------|
| B1 | **L'agent peut halluciner des fichiers** | Diff invalide, merge impossible | Phase 5 vérifie que chaque fichier du diff existe dans le repo |
| B2 | **Race condition multi-tickets** | Deux tickets du même tenant en parallèle, diffs conflictuels | Queue FIFO par tenant (un seul ticket agent à la fois par tenant) |
| B3 | **CodeGraph stale index** | L'agent travaille sur du code obsolète | File watcher + vérification timestamp index vs dernière modification |
| B4 | **Coût LLM incontrôlé** | Un ticket complexe consomme trop de tokens | Budget max par ticket (configurable, défaut 100k tokens), circuit breaker |
| B5 | **L'agent modifie du code utilisé par le POS en production** | Casse en prod pendant un service restaurant | Aucun code n'est appliqué automatiquement en prod — toujours via gate + merge manuel |
| B6 | **Confidentialité du code entre tenants** | Le tenant A voit le code custom du tenant B | CodeGraph par tenant est isolé ; l'agent ne leak jamais du code entre tenants |
| B7 | **L'agent propose de supprimer du code NF525** | Violation fiscale | Hardcoded interdiction + Phase 5 security check |
| B8 | **Feedback loop infini** | L'agent retente indéfiniment après rejet | Max 2 retries par ticket, puis escalation humaine obligatoire |
| B9 | **Le tenant abuse du système** | Flood de tickets pour du compute gratuit | Rate limit : 5 tickets/jour pour STANDARD, 15 pour PREMIUM |
| B10 | **SSE connection leak** | Milliers de connexions ouvertes si pas de cleanup | Timeout SSE 5min + heartbeat, reconnect côté client |
| B11 | **Git branch proliferation** | Centaines de branches `agent/*` non nettoyées | Cron cleanup : branches merged > 7j supprimées, branches stale > 30j supprimées |
| B12 | **L'agent ne comprend pas le contexte métier** | Diagnostic incorrect pour un problème fonctionnel (pas technique) | Injection du `VerticalSupportContext` + tenant DNA + historique tickets |
| B13 | **Dual system pendant la migration** | Confusion MaintenanceAgent vs AgentTicket | Phase de migration explicite : deprecated flag + redirect |
| B14 | **Overrides tenant RBAC ignorés** | L'agent génère du code qui contourne un override RBAC tenant | Phase 2 charge les RBAC overrides ; Phase 5 vérifie la cohérence |
| B15 | **L'agent crée des imports cycliques** | Regression cycles (actuellement 2-3 baseline) | Sentrux check en Phase 5 |

### 12.2 Risques architecturaux

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| CodeGraph service down | Medium | Bloquant (pas de diagnostic code) | Fallback gracieux : diagnostic LLM-only (comme aujourd'hui) |
| Gemini API rate limit | High (en charge) | Lenteur | Queue + retry avec backoff exponentiel |
| Disk plein (indexes SQLite) | Low | Service down | Monitoring + LRU eviction + alertes |
| Git service down | Low | Pas de branche/diff | Queue les packagings, retry |
| Faux positif security check | Medium | Drafts bloqués à tort | Whitelist patterns connus + review humaine |

### 12.3 Risques légaux / conformité

| Risque | Mitigation |
|--------|------------|
| RGPD : l'agent lit des données personnelles | L'agent ne lit que le code et la config — jamais les données métier (commandes, clients, factures) |
| NF525 : l'agent modifie la chaîne de scellement | Interdiction hardcodée (§6.5) + Phase 5 vérifie |
| Responsabilité : l'agent casse la production | Gate human-in-the-loop obligatoire — le super admin valide et applique |
| IP : le code généré par l'IA est-il propriétaire ? | Le code est généré à partir du code existant du client — licence identique |

---

## §13 — Consolidation MaintenanceAgent (legacy)

### 13.1 Plan de fusion

Le `MaintenanceAgent` (`src/lib/MaintenanceAgent.ts`) est un système parallèle qui doit être absorbé.

**Étapes** :
1. Marquer `MaintenanceAgent` comme `@deprecated` avec redirect vers `AgentOrchestrator`
2. Migrer la collection `maintenanceTickets/{id}` vers `mcc/supportTickets/{id}` avec `source: 'legacy_maintenance'`
3. Réutiliser le `DNAInjector` de MaintenanceAgent dans Phase 2 (context building)
4. Supprimer `MaintenanceAgent.ts` et `maintenance.types.ts` une fois la migration validée

### 13.2 Mapping types

| MaintenanceTicket field | → AgentTicket field |
|------------------------|---------------------|
| `type` (CRITICAL_BUG, ...) | `triage.category` + `triage.subCategory` |
| `pageKey` | `triage.routing.suggestedModule` |
| `systemState` | `attachments` (log system state comme attachment JSON) |
| `logs` | `attachments` (type: 'log') |
| `aiAnalysis` | `agentDraft.diagnosis` |
| `priority` | `triage.priority` |

---

## §14 — Plan d'exécution phasé

### Phase 0 : Infrastructure CodeGraph (1-2 semaines)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 0.1 | Installer CodeGraph dans le monorepo | `package.json`, `.codegraph/` | — | 1h |
| 0.2 | Créer le CodeGraph Service (HTTP wrapper) | `services/codegraph-service/` (hors monorepo) | 0.1 | 2j |
| 0.3 | Implémenter `CodeGraphBridge` | `src/lib/codegraph/CodeGraphBridge.ts` | 0.2 | 1j |
| 0.4 | Déployer le service (Cloud Run / Fly.io) | Docker + deploy config | 0.2 | 1j |
| 0.5 | Tests d'intégration CodeGraph ↔ Restaurant OS | `src/__tests__/codegraph/` | 0.3, 0.4 | 1j |

### Phase 1 : Schémas & contrats (2-3 jours)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 1.1 | Créer `AgentTicketSchema`, `AgentDraftSchema` | `src/kernel/nexus/contracts/agentTicket.ts` | — | 4h |
| 1.2 | Créer `TicketMessageSchema` | `src/kernel/nexus/contracts/ticketMessage.ts` | — | 2h |
| 1.3 | Nouveaux events `support.agent_*` | `src/orchestration/events/support.events.ts` | — | 2h |
| 1.4 | Ajouter `support` dans ACTION_MAP | `src/kernel/nexus/guards/rbac/actionPermissionMap.ts` | — | 1h |

### Phase 2 : Pipeline Agent (1-2 semaines)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 2.1 | `AgentOrchestrator` (6 phases) | `src/modules/intelligence/ia/agent/AgentOrchestrator.ts` | 0.3, 1.1 | 3j |
| 2.2 | Phase 1 : Triage | `src/modules/intelligence/ia/agent/phases/triage.ts` | 2.1 | 1j |
| 2.3 | Phase 2 : Context | `src/modules/intelligence/ia/agent/phases/context.ts` | 2.1, 0.3 | 1j |
| 2.4 | Phase 3 : Diagnosis | `src/modules/intelligence/ia/agent/phases/diagnosis.ts` | 2.1 | 1j |
| 2.5 | Phase 4 : Solution | `src/modules/intelligence/ia/agent/phases/solution.ts` | 2.1 | 2j |
| 2.6 | Phase 5 : Validation | `src/modules/intelligence/ia/agent/phases/validation.ts` | 2.1 | 1j |
| 2.7 | Phase 6 : Packaging | `src/modules/intelligence/ia/agent/phases/packaging.ts` | 2.1 | 1j |
| 2.8 | Handler bus `AgentOrchestratorHandler` | `src/orchestration/handlers/AgentOrchestratorHandler.ts` | 2.1, 1.3 | 4h |

### Phase 3 : Messagerie (3-5 jours)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 3.1 | API messages tenant | `src/app/api/tenant/support/tickets/[id]/messages/route.ts` | 1.2 | 1j |
| 3.2 | API messages MCC | `src/app/api/admin/fleet/agent-tickets/[id]/messages/route.ts` | 1.2 | 1j |
| 3.3 | SSE status stream | `src/app/api/tenant/support/tickets/[id]/status/route.ts` | 1.1 | 4h |
| 3.4 | Hook `useTicketSSE` | `src/design/support/useTicketSSE.ts` | 3.3 | 4h |
| 3.5 | Composant `TicketMessageThread` | `src/design/support/TicketMessageThread.tsx` | 3.1, 3.4 | 1j |

### Phase 4 : UI (1 semaine)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 4.1 | Enrichir `SupportHelpWidget` | `src/design/support/SupportHelpWidget.tsx` | 3.5 | 1j |
| 4.2 | `TicketPhaseTracker` (progression) | `src/design/support/TicketPhaseTracker.tsx` | 3.4 | 4h |
| 4.3 | `AgentTicketPanel` (MCC) | `src/app/(admin)/admin/mcc/components/AgentTicketPanel.tsx` | 2.8 | 1j |
| 4.4 | `AgentDiffViewer` (MCC) | `src/app/(admin)/admin/mcc/components/AgentDiffViewer.tsx` | — | 1j |
| 4.5 | `AgentValidationReport` (MCC) | `src/app/(admin)/admin/mcc/components/AgentValidationReport.tsx` | — | 4h |
| 4.6 | `AgentPipelineTimeline` (MCC) | `src/app/(admin)/admin/mcc/components/AgentPipelineTimeline.tsx` | — | 4h |
| 4.7 | `CodeGraphHealthWidget` (MCC) | `src/app/(admin)/admin/mcc/components/CodeGraphHealthWidget.tsx` | 0.3 | 4h |
| 4.8 | Wiring MCC page.tsx (nouveau tab) | `src/app/(admin)/admin/mcc/page.tsx` | 4.3-4.7 | 2h |

### Phase 5 : Consolidation & cleanup (3-5 jours)

| # | Tâche | Fichiers | Prérequis | Effort |
|---|-------|----------|-----------|--------|
| 5.1 | Fusionner MaintenanceAgent → AgentTicket | `src/lib/MaintenanceAgent.ts` (deprecated) | 2.8 | 1j |
| 5.2 | Migration collection Firestore | Script one-shot | 5.1 | 4h |
| 5.3 | Tests E2E pipeline complet | `src/__tests__/agent/` | All | 2j |
| 5.4 | Rate limiting + circuit breakers | Config + middleware | 2.1 | 4h |
| 5.5 | Monitoring + alertes | CloudWatch / GCP Monitoring | 0.4 | 4h |
| 5.6 | Documentation | `docs/specs/AGENT_TICKET.md` | All | 4h |

### Résumé effort total

| Phase | Effort estimé |
|-------|---------------|
| Phase 0 : Infrastructure CodeGraph | 5-6 jours |
| Phase 1 : Schémas & contrats | 2-3 jours |
| Phase 2 : Pipeline Agent | 8-10 jours |
| Phase 3 : Messagerie | 3-5 jours |
| Phase 4 : UI | 5-6 jours |
| Phase 5 : Consolidation | 4-6 jours |
| **TOTAL** | **27-36 jours** |

### Dépendances critiques

```
Phase 0 (CodeGraph) ────┐
                        ├── Phase 2 (Pipeline Agent) ── Phase 5 (Consolidation)
Phase 1 (Schémas) ──────┤
                        ├── Phase 3 (Messagerie) ────── Phase 4 (UI)
                        └── Phase 4 (UI)
```

Phase 0 et Phase 1 sont parallélisables. Phase 2 et Phase 3 sont partiellement parallélisables.

---

## §15 — Métriques & ROI attendu

### 15.1 Métriques de succès

| Métrique | Baseline (actuel) | Cible (avec agent) |
|----------|-------------------|--------------------|
| Temps moyen de premier diagnostic | ~30min (humain) | < 2min (agent) |
| Tickets avec code fix proposé | 0% (texte seulement) | > 60% |
| Tickets auto-résolvables (config_patch) | ~20% | > 40% |
| Tokens LLM par ticket | ~5k (prompt simple) | ~50-100k (pipeline complet) |
| Taux de re-ouverture | Inconnu | < 10% (meilleur diagnostic) |
| Satisfaction tenant (temps de réponse perçu) | Minutes → heures | Secondes (SSE feedback) |

### 15.2 ROI CodeGraph

D'après l'analyse de la console token (143.8M tokens, 9496 read+grep) :

| Métrique | Sans CodeGraph | Avec CodeGraph |
|----------|----------------|----------------|
| Tool calls par session agent | ~40-60 (grep + read) | ~5-10 (codegraph_explore) |
| Tokens context par ticket | ~20-30k | ~8-12k |
| Coût LLM par ticket | ~0.10-0.15€ | ~0.04-0.06€ |
| Temps de Phase 2 (context building) | 30-60s | 5-10s |

### 15.3 Coûts infrastructure

| Composant | Coût mensuel estimé |
|-----------|-------------------|
| CodeGraph Service (Cloud Run min=1) | 15-40€ |
| Stockage index SQLite (10 tenants) | < 5€ |
| Gemini API (100 tickets/mois) | 10-30€ |
| Git service (branches temporaires) | 0€ (inclus dans le plan) |
| **TOTAL** | **25-75€/mois** |

---

## Annexe A — Fichiers à créer/modifier

### Fichiers NOUVEAUX

```
src/kernel/nexus/contracts/agentTicket.ts
src/kernel/nexus/contracts/ticketMessage.ts
src/lib/codegraph/CodeGraphBridge.ts
src/modules/intelligence/ia/agent/AgentOrchestrator.ts
src/modules/intelligence/ia/agent/phases/triage.ts
src/modules/intelligence/ia/agent/phases/context.ts
src/modules/intelligence/ia/agent/phases/diagnosis.ts
src/modules/intelligence/ia/agent/phases/solution.ts
src/modules/intelligence/ia/agent/phases/validation.ts
src/modules/intelligence/ia/agent/phases/packaging.ts
src/orchestration/handlers/AgentOrchestratorHandler.ts
src/orchestration/handlers/AgentProgressHandler.ts
src/orchestration/handlers/AgentDraftNotificationHandler.ts
src/orchestration/handlers/AgentAppliedHandler.ts
src/orchestration/handlers/TicketMessageHandler.ts
src/app/api/tenant/support/tickets/[id]/route.ts
src/app/api/tenant/support/tickets/[id]/messages/route.ts
src/app/api/tenant/support/tickets/[id]/status/route.ts
src/app/api/admin/fleet/agent-tickets/route.ts
src/app/api/admin/fleet/agent-tickets/[id]/route.ts
src/app/api/admin/fleet/agent-tickets/[id]/diff/route.ts
src/app/api/admin/fleet/agent-tickets/[id]/apply/route.ts
src/app/api/admin/fleet/agent-tickets/[id]/retry/route.ts
src/app/api/admin/fleet/agent-tickets/[id]/messages/route.ts
src/app/api/admin/codegraph/health/route.ts
src/app/api/admin/codegraph/reindex/[tenantId]/route.ts
src/app/api/admin/codegraph/stats/route.ts
src/design/support/TicketMessageThread.tsx
src/design/support/TicketPhaseTracker.tsx
src/design/support/TicketAttachmentUploader.tsx
src/design/support/useTicketSSE.ts
src/app/(admin)/admin/mcc/components/AgentTicketPanel.tsx
src/app/(admin)/admin/mcc/components/AgentTicketDetail.tsx
src/app/(admin)/admin/mcc/components/AgentDiffViewer.tsx
src/app/(admin)/admin/mcc/components/AgentValidationReport.tsx
src/app/(admin)/admin/mcc/components/AgentPipelineTimeline.tsx
src/app/(admin)/admin/mcc/components/CodeGraphHealthWidget.tsx
src/app/(admin)/admin/mcc/components/AgentConfigPanel.tsx
```

### Fichiers MODIFIÉS

```
src/orchestration/events/support.events.ts               (nouveaux events)
src/kernel/nexus/guards/rbac/actionPermissionMap.ts       (page 'support')
src/design/support/SupportHelpWidget.tsx                  (enrichi)
src/design/support/useSupportTickets.ts                   (enrichi)
src/app/(admin)/admin/mcc/page.tsx                        (nouveau tab Agent)
src/lib/MaintenanceAgent.ts                               (deprecated → redirect)
src/kernel/nexus/contracts/maintenance.types.ts            (deprecated)
```

---

## Annexe B — Décisions architecturales (ADR)

### ADR-1 : Pipeline serveur (pas client)
**Décision** : L'agent tourne sur le serveur (API route ou service dédié), pas dans le navigateur.
**Raison** : CodeGraph nécessite un accès filesystem (SQLite), git nécessite un accès CLI, et le LLM appel nécessite une clé API côté serveur.

### ADR-2 : Firestore onSnapshot (pas WebSocket custom)
**Décision** : Utiliser Firestore `onSnapshot` pour le temps réel des messages, pas un WebSocket.
**Raison** : L'app est Firebase-first avec cache IndexedDB. Ajouter un WS server serait une nouvelle infra à maintenir. `onSnapshot` donne le même résultat.

### ADR-3 : SSE pour le status (pas polling)
**Décision** : Server-Sent Events pour la progression du pipeline agent.
**Raison** : Le polling 15s actuel est trop lent pour montrer les phases de l'agent (~30s par phase). SSE donne le temps réel sans la complexité WS.

### ADR-4 : CodeGraph service séparé (pas embedded)
**Décision** : CodeGraph tourne dans un service dédié (Cloud Run), pas embarqué dans Next.js.
**Raison** : Next.js est serverless (Vercel / Cloud Functions). CodeGraph nécessite un daemon persistent (SQLite + file watcher). Incompatible.

### ADR-5 : Extension de SupportTicket (pas remplacement)
**Décision** : `AgentTicketSchema = SupportTicketSchema.extend(...)`, pas un nouveau schéma.
**Raison** : Rétrocompatibilité avec les tickets existants, migration transparente.

### ADR-6 : Queue FIFO par tenant (pas parallèle)
**Décision** : Un seul ticket agent à la fois par tenant.
**Raison** : Deux diffs parallèles sur le même codebase risquent de conflire. La sérialisation élimine le risque.

### ADR-7 : Human-in-the-loop obligatoire pour le code
**Décision** : Aucun code n'est appliqué sans validation humaine (gate existant).
**Raison** : Responsabilité légale, sécurité NF525, confiance. Les config_patch low-risk + high-confidence pourraient être auto-appliqués dans une v2.

---

*Fin du plan. Prêt pour review et exécution phasée.*
