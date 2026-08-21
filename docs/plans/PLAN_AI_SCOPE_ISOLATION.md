# 🧠 Plan Master — Isolation IA MCC ↔ Tenant + Multi-Vertical Universel

> **Objectif** : séparer strictement les modèles IA du MCC des modèles IA des tenants, avec une architecture qui garantit l'extensibilité universelle à toutes les verticales présentes et futures, sans jamais toucher au kernel IA.
>
> **Date** : 2026-08-20
> **Horizon** : 4 jours de travail effectif
> **Auteur** : session Claude Code + décisions patron
> **Statut** : plan directeur — chaque phase clôturée met à jour ce fichier + `MEMORY.md` + `CHANGELOG.md`
> **Blocage business** : toute vente enterprise ou HDS est bloquée tant que la séparation MCC/tenant n'est pas prouvée par test.

---

## ⚖️ RÈGLES D'ANTI-GRAVITÉ (Non négociables)

Ces règles s'appliquent à chaque commit, chaque fichier, chaque PR. Elles sont **enforçables au CI** (tests bloquants) et **auditables** (grep automatique). **Aucun shortcut n'est accepté** — pas même "temporaire", pas même "on fixera plus tard".

### R1 — Interdiction de contournement scope

**Règle** : un fichier du MCC ne peut PAS importer un module tenant, et inversement.

```yaml
kernel/ai/mcc/*   → ne peut importer QUE : kernel/ai/core/*, lib/logger, shared/nexus/*
kernel/ai/tenant/*→ ne peut importer QUE : kernel/ai/core/*, verticals/*/blueprint, modules/system
```

**Enforcement CI** :
```bash
# Ce grep doit retourner 0 hit :
rg "from '@/modules/" src/kernel/ai/mcc/
rg "from '@/app/api/admin/fleet" src/modules/
rg "from '@/kernel/ai/mcc" src/modules/
```

**Sanction si violé** : CI red, commit reverté automatiquement.

### R2 — Interdiction hardcode vertical dans le kernel IA

**Règle** : aucun fichier de `src/kernel/ai/**` ne peut contenir un nom de vertical en dur (`restaurant`, `bakery`, `salon`, `garage`, `hotel`, `clinic`, `retail`, `gym`, `coworking`, `veterinary`, `florist`).

**Enforcement CI** : test unitaire dans `__tests__/kernel/ai/no-vertical-hardcode.test.ts` :
```ts
for (const v of PLATFORM_VARIANTS) {
    if (v === 'custom') continue;
    for (const file of glob('src/kernel/ai/**/*.ts')) {
        expect(readFileSync(file)).not.toMatch(new RegExp(`['"\`]${v}['"\`]`));
    }
}
```

**Sanction si violé** : refactoring OBLIGATOIRE avant merge, le nom vertical doit passer par `TenantConfig.variant` ou `VerticalBlueprint`.

### R3 — Interdiction du "singleton facile" pour l'IA

**Règle** : aucun `LLMManager.provider = new XxxProvider()` global. Toute résolution de provider passe par :
- `MCCAIRegistry.provider` (scope MCC — configuré via `MCC_LLM_*` env)
- `TenantAIRegistry.forTenant(tenantId).provider` (scope tenant — lit `tenantConfig.aiSettings`)

**Enforcement CI** : grep interdit sur `LLMManager.provider =` dans tout `src/` sauf `src/kernel/ai/legacy/*` (période de migration seulement).

**Sanction si violé** : refactoring immédiat vers le registre correspondant.

### R4 — Interdiction du "bypass provider" avec import direct

**Règle** : aucun `import { GoogleGenAI } from '@google/genai'`, `import OpenAI from 'openai'`, `import Anthropic from '@anthropic-ai/sdk'` en dehors des providers eux-mêmes (`src/modules/intelligence/ia/ai/*Provider.ts`).

**Enforcement CI** : grep interdit sur ces imports en dehors du dossier `ia/ai/`.

**Sanction si violé** : le caller doit passer par `LLMManager.provider.generateText()` ou `AIProviderRouter`.

### R5 — Interdiction du secret en clair côté client

**Règle** : aucune clé API LLM ne peut apparaître dans un bundle client. Tous les appels IA passent par une route API serveur qui lit `process.env.*` côté Node.

**Enforcement CI** :
```bash
# Aucun NEXT_PUBLIC_LLM_* n'est autorisé :
rg "NEXT_PUBLIC_(LLM|GEMINI|OPENAI|ANTHROPIC|MISTRAL)" src/
```

**Sanction si violé** : suppression immédiate + rotation de la clé exposée + audit trail dans `docs/incidents/`.

### R6 — Interdiction du "test skip" sur les tests d'isolation

**Règle** : les 5 tests critiques d'isolation ne peuvent JAMAIS être `it.skip()`, `describe.skip()`, ou disabled.

- `AIScopeGuard.mcc-blocks-tenant.test.ts`
- `AIScopeGuard.tenant-blocks-mcc.test.ts`
- `TenantAIRegistry.multi-vertical.test.ts`
- `MCCAIRegistry.telemetry-isolation.test.ts`
- `PromptComposer.no-vertical-hardcode.test.ts`

**Enforcement CI** : script qui grep `\.skip\(` dans ces fichiers → CI red.

### R7 — Interdiction du "commit sans tests"

**Règle** : chaque phase (A→E) doit avoir ses tests écrits et verts AVANT le commit. Aucun stub non testé n'atteint main.

**Sanction** : PR bloquée par le reviewer (soi-même ou Claude Code).

### R8 — Interdiction du "fallback silencieux" pour l'IA MCC

**Règle** : si l'IA MCC échoue, l'incident est envoyé à `OpsAlertGateway` avec severity `critical`. Jamais de `.catch(() => null)` silencieux.

**Enforcement CI** : dans `src/kernel/ai/mcc/`, tout `catch` doit soit throw, soit appeler `OpsAlertGateway.send()`.

### R9 — Interdiction du "provider global partagé" MCC ↔ tenant

**Règle** : les env vars du MCC (`MCC_LLM_*`) et des tenants (`TENANT_LLM_*` ou par tenant) sont **strictement disjointes**. Aucune même clé ne peut servir les deux.

**Enforcement CI** :
```ts
// Test d'isolation démarrage
it('MCC env vars ≠ tenant env vars', () => {
    expect(process.env.MCC_LLM_API_KEY).not.toBe(process.env.TENANT_LLM_DEFAULT_API_KEY);
});
```

### R10 — Interdiction du "workaround post-scope"

**Règle** : si un caller a besoin d'accéder aux deux registres (cas exceptionnel — genre analyse cross-tenant pour StrategyOracle), il doit **explicitement demander une CrossScopeToken** via un service dédié `CrossScopeAuthority.grant({callerModule, reason, ttlSeconds})` qui log l'usage.

**Enforcement CI** : aucun fichier ne peut importer les deux `MCCAIRegistry` et `TenantAIRegistry` sauf `src/kernel/ai/authority/CrossScopeAuthority.ts`.

---

## 🏛️ ARCHITECTURE CIBLE

### Vue en couches

```
┌────────────────────────────────────────────────────────────────┐
│  LAYER 4 — TENANT CONFIG (par tenant, en base)                 │
│  └── tenants/{id}/tenantConfig.aiSettings                      │
│      { mode, providers, overrides? }                           │
├────────────────────────────────────────────────────────────────┤
│  LAYER 3 — VERTICAL BLUEPRINT (par vertical, en code)          │
│  └── verticals/{variant}/{variant}.blueprint.ts                │
│      { aiPrompts: { systemPersona, vocabulary, examples } }    │
├────────────────────────────────────────────────────────────────┤
│  LAYER 2 — REGISTRIES (2 scopes isolés)                        │
│  ├── MCCAIRegistry     (env MCC_LLM_*, callers MCC-only)      │
│  └── TenantAIRegistry.forTenant(id) (lit L4 + L3)              │
├────────────────────────────────────────────────────────────────┤
│  LAYER 1 — KERNEL AI (universel, 0 knowledge vertical)         │
│  ├── PromptComposer (compose L3 + L4 + kernel base)            │
│  ├── AIScopeGuard (barrière R1)                                │
│  ├── CrossScopeAuthority (règle R10)                           │
│  └── ProviderFactory (résolution provider par nom)             │
├────────────────────────────────────────────────────────────────┤
│  LAYER 0 — PROVIDERS (adapters bas niveau)                     │
│  ├── GeminiProvider · AnthropicProvider · OpenAIProvider       │
│  ├── MistralProvider · SovereignProvider (SLM local)           │
│  └── SEUL endroit autorisé à importer les SDK natifs           │
└────────────────────────────────────────────────────────────────┘
```

### Flux d'un appel MCC (support-ai/diagnose par exemple)

```
POST /api/admin/fleet/support-ai/diagnose
  │
  ├── requireMccLevel(req, 'mcc_support')       // RBAC
  │
  ├── const registry = MCCAIRegistry;           // R1 : scope enforced
  │   ├── AIScopeGuard.assertMCCScope(caller);
  │   └── config = MCCProviderChain.resolve()  // env MCC_LLM_*
  │
  ├── const prompt = PromptComposer.composeMCC({
  │     base: MCC_SYSTEM_PROMPTS.diagnose,     // MCC-specific
  │     context: { tenantId, ticketId, ... }
  │   });                                       // R2 : 0 vertical hardcode
  │
  ├── const response = await registry.provider.generateText(prompt);
  │   └── télémétrie → mcc/telemetry/llm_spend/{monthISO}
  │
  └── return NextResponse.json({ ... })
```

### Flux d'un appel Tenant (POS assistant par exemple)

```
POST /api/tenant/oracle/query
  │
  ├── requireTenantUser(req);                   // Auth tenant
  │
  ├── const registry = TenantAIRegistry.forTenant(tenantId);
  │   ├── AIScopeGuard.assertTenantScope(caller);
  │   ├── tenantConfig = await Nexus.get(`tenants/${id}/tenantConfig`);
  │   ├── verticalBP = VerticalBlueprintRegistry.get(tenantConfig.variant);
  │   └── provider = TenantProviderChain.resolve(tenantConfig.aiSettings);
  │
  ├── const prompt = PromptComposer.composeTenant({
  │     base: TENANT_SYSTEM_PROMPTS.assistant,
  │     verticalLayer: verticalBP.aiPrompts,    // ← multi-vertical automatique
  │     tenantContext: { user, section, ... }
  │   });                                        // R2 : compose sans hardcode
  │
  ├── const response = await registry.provider.generateText(prompt);
  │   └── télémétrie → tenants/{id}/telemetry/llm_spend/{monthISO}
  │
  └── return NextResponse.json({ ... })
```

---

## 📋 PHASE A — MCCAIRegistry isolé (½ jour)

### Objectif
Créer le registre MCC dédié, sans le brancher sur les callers existants. La migration des callers = phase B.

### Sous-tâches détaillées

#### A.1 — Créer `src/kernel/ai/` (nouveau dossier)
- [ ] `src/kernel/ai/core/PromptComposer.ts`
- [ ] `src/kernel/ai/core/AIScopeGuard.ts`
- [ ] `src/kernel/ai/core/CrossScopeAuthority.ts` (stub pour R10)
- [ ] `src/kernel/ai/core/types.ts` — `AIProviderName`, `AIProviderConfig`, `AICallContext`
- [ ] `src/kernel/ai/index.ts` — barrel export limité aux publics

#### A.2 — Créer `src/kernel/ai/mcc/`
- [ ] `src/kernel/ai/mcc/MCCAIRegistry.ts`
  - Singleton `MCCAIRegistry.provider`
  - Lecture env : `MCC_LLM_PRIMARY_PROVIDER`, `MCC_LLM_FALLBACK_CHAIN`, `MCC_LLM_*_API_KEY`, `MCC_LLM_*_MODEL`
  - Méthode `resolveProvider()` retourne l'instance provider selon la chaîne
- [ ] `src/kernel/ai/mcc/MCCProviderChain.ts`
  - Chaîne de fallback : `sovereign → anthropic → gemini` (paramétrable via env)
  - Aucun tenant fallback autorisé
- [ ] `src/kernel/ai/mcc/MCCLLMTelemetry.ts`
  - `record({ callerModule, model, inputTokens, outputTokens, latencyMs })`
  - Écrit dans `mcc/telemetry/llm_spend/{YYYY-MM}/{callerModule}`
- [ ] `src/kernel/ai/mcc/MCC_SYSTEM_PROMPTS.ts`
  - `diagnose`, `supportDraft`, `strategyOracle`, `workshopAssistant`
  - Chaque prompt structuré : `{ base: string, jsonSchema?: object }`

#### A.3 — Configuration env
- [ ] Éditer `.env.example` — ajouter section `# MCC AI (isolated from tenant AI)` :
  ```bash
  # ─── MCC AI (registre isolé, jamais mélangé avec tenant AI) ───
  MCC_LLM_PRIMARY_PROVIDER=sovereign      # sovereign | anthropic | gemini | openai
  MCC_LLM_FALLBACK_CHAIN=sovereign,anthropic   # order matters, jamais Gemini pour MCC
  MCC_LLM_SOVEREIGN_URL=http://mcc-slm.internal:8000
  MCC_LLM_SOVEREIGN_MODEL=llama-3.1-70b-instruct
  MCC_LLM_ANTHROPIC_API_KEY=sk-ant-mcc-...    # clé DÉDIÉE MCC (jamais partagée avec tenants)
  MCC_LLM_ANTHROPIC_MODEL=claude-sonnet-5
  MCC_LLM_TELEMETRY_ENABLED=true
  ```

#### A.4 — Tests d'isolation A
- [ ] `src/__tests__/kernel/ai/MCCAIRegistry.isolation.test.ts` :
  - `MCCAIRegistry` ne peut pas être importé depuis `src/modules/`
  - `MCCAIRegistry.provider` charge le bon provider selon env
  - `MCC_LLM_API_KEY` absent → throw fail-fast, jamais silencieux
  - Chaîne fallback respectée (mock un fail sovereign → utilise anthropic)
- [ ] `src/__tests__/kernel/ai/AIScopeGuard.test.ts` :
  - `assertMCCScope('modules/ops/pos/route.ts')` → throw
  - `assertMCCScope('app/api/admin/fleet/support-ai/route.ts')` → OK
  - `assertTenantScope('app/api/admin/fleet/xxx')` → throw

#### A.5 — Documentation
- [ ] `docs/adrs/ADR-008-mcc-tenant-ai-scope-isolation.md` — décision, alternatives rejetées, conséquences
- [ ] Update `CLAUDE.md` — ajouter la règle R1-R10 dans la section "Conventions critiques"
- [ ] Update `docs/audits/AUDIT_REFACTORING_2026-08-20.md` — noter la nouvelle architecture

### Definition of Done (Phase A)
- [ ] `import { MCCAIRegistry } from '@/kernel/ai/mcc'` fonctionne
- [ ] 5+ tests d'isolation MCC verts
- [ ] `rg "MCCAIRegistry" src/modules/` retourne 0 hit
- [ ] `npx tsc --noEmit` : 0 erreur
- [ ] `npx madge --circular src/kernel/ai` : 0 cycle
- [ ] Commit atomique : `feat(kernel/ai): MCCAIRegistry isolé (Phase A)`

### Files créés (Phase A)
```
src/kernel/ai/core/
  ├── PromptComposer.ts       (~80 L)
  ├── AIScopeGuard.ts         (~60 L)
  ├── CrossScopeAuthority.ts  (~40 L stub)
  ├── types.ts                (~40 L)
  └── index.ts                (~10 L)
src/kernel/ai/mcc/
  ├── MCCAIRegistry.ts        (~120 L)
  ├── MCCProviderChain.ts     (~60 L)
  ├── MCCLLMTelemetry.ts      (~50 L)
  ├── MCC_SYSTEM_PROMPTS.ts   (~80 L)
  └── index.ts                (~10 L)
src/__tests__/kernel/ai/
  ├── MCCAIRegistry.isolation.test.ts  (~150 L, 8+ tests)
  └── AIScopeGuard.test.ts             (~80 L, 6+ tests)
docs/adrs/
  └── ADR-008-mcc-tenant-ai-scope-isolation.md
```

---

## 📋 PHASE B — Migration des callers MCC (1 jour)

### Objectif
Migrer chaque appel LLM du code MCC actuel vers `MCCAIRegistry`. Aucun caller MCC ne doit conserver `import { LLMManager }`.

### Callers à migrer (audit exhaustif)

| Fichier | LLM usage actuel | Action |
|---------|------------------|--------|
| `src/app/api/admin/fleet/support-ai/diagnose/route.ts` | `LLMManager.provider.generateText` + fallback `AIProviderRouter` | Remplacer par `MCCAIRegistry.provider.generateText` |
| `src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts` | Idem | Idem |
| `src/app/(admin)/admin/mcc/components/StrategyOracle.tsx` | À auditer | Si LLM → MCCAIRegistry via route API dédiée |
| `src/app/(admin)/admin/mcc/components/AIWorkshop.tsx` | À auditer | Idem |
| `src/app/(admin)/admin/mcc/components/SupportAIPanel.tsx` | Uniquement label "Gemini Flash" en dur | Rendre dynamique via API `/api/admin/fleet/support-ai/provider-info` |

### Sous-tâches détaillées

#### B.1 — Grep exhaustif des callers MCC
```bash
rg "LLMManager|AIProviderRouter|GeminiProvider|generateText" \
   src/app/api/admin/fleet \
   src/app/\(admin\)/admin/mcc \
   src/shared/eventBus/handlers \
   > /tmp/mcc-llm-callers.txt
```
Chaque ligne = un TODO. Aucun caller ne peut rester non migré.

#### B.2 — Migration systematic
Pour chaque caller identifié :
- [ ] Retirer `import { LLMManager, AIProviderRouter }`
- [ ] Ajouter `import { MCCAIRegistry } from '@/kernel/ai/mcc'`
- [ ] Remplacer `LLMManager.provider.generateText(...)` par `MCCAIRegistry.provider.generateText(...)`
- [ ] Retirer les blocs `try { LLM } catch { router }` — le fallback est intégré au registre
- [ ] Ajouter appel `MCCLLMTelemetry.record({ callerModule: __filename, ... })`
- [ ] Ajouter `OpsAlertGateway.send({ severity: 'critical' })` dans le catch final (R8)

#### B.3 — Route API `provider-info` pour l'UI dynamique
- [ ] `src/app/api/admin/fleet/support-ai/provider-info/route.ts` :
  - GET → `{ activeProvider: 'sovereign', activeModel: 'llama-3.1-70b', mode: 'souverain' }`
  - RBAC : `mcc_junior_dev`
- [ ] `SupportAIPanel.tsx` :
  - Retirer "Gemini Flash" hardcodé
  - `useEffect` → fetch `/api/admin/fleet/support-ai/provider-info` → afficher dynamique

#### B.4 — Tests d'intégration
- [ ] `src/__tests__/api/mccSupportAi.test.ts` :
  - POST diagnose → utilise `MCCAIRegistry` (mock)
  - Vérifier télémétrie écrite dans `mcc/telemetry/llm_spend/*`
  - Vérifier RBAC
  - Vérifier alerte `OpsAlertGateway` si LLM fail
- [ ] Update `src/__tests__/handlers/SupportTicketAnalysisHandler.test.ts` :
  - Idem sur le handler événementiel

#### B.5 — Vérification post-migration
```bash
# Ces greps doivent retourner 0 hit après B :
rg "LLMManager|AIProviderRouter" src/app/api/admin/fleet
rg "LLMManager|AIProviderRouter" src/app/\(admin\)/admin/mcc
rg "'Gemini Flash'|\"Gemini Flash\"" src/app/\(admin\)/admin/mcc
```

### Definition of Done (Phase B)
- [ ] Tous les callers MCC utilisent `MCCAIRegistry`
- [ ] Grep de vérification tous à 0
- [ ] `SupportAIPanel` affiche dynamiquement le provider actif
- [ ] Télémétrie MCC visible dans `mcc/telemetry/llm_spend/`
- [ ] Full suite `npx vitest run` : 0 régression
- [ ] `npx tsc --noEmit` : 0 erreur
- [ ] Commit atomique : `feat(mcc): migration LLM callers vers MCCAIRegistry (Phase B)`

### Files modifiés (Phase B)
```
src/app/api/admin/fleet/support-ai/diagnose/route.ts       (modif)
src/app/api/admin/fleet/support-ai/provider-info/route.ts  (nouveau)
src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts (modif)
src/app/(admin)/admin/mcc/components/SupportAIPanel.tsx    (modif)
src/app/(admin)/admin/mcc/components/StrategyOracle.tsx    (potentielle modif)
src/app/(admin)/admin/mcc/components/AIWorkshop.tsx        (potentielle modif)
src/__tests__/api/mccSupportAi.test.ts                     (nouveau)
```

---

## 📋 PHASE C — TenantAIRegistry avec routing par tenant (1 jour)

### Objectif
Enrichir `TenantConfigSchema.ai` (existant, minimaliste) en `aiSettings` complet, permettant à chaque tenant d'avoir sa configuration IA propre (mode, providers, chaîne fallback).

### Sous-tâches détaillées

#### C.1 — Enrichir `TenantConfigSchema`
- [ ] Éditer `src/modules/system/domain/schemas/tenant.ts` :
  ```ts
  aiSettings: z.object({
      mode: z.enum(['cloud', 'souverain', 'mix']).default('cloud'),
      providers: z.object({
          reasoning: AIProviderConfigSchema,  // Claude/GPT/Gemini/SLM pour raisonnement
          fast:      AIProviderConfigSchema,  // Gemini Flash/GPT mini pour simple
          vision:    AIProviderConfigSchema,  // Gemini Vision/GPT-4V pour OCR
      }),
      fallbackChain: z.array(z.enum(['sovereign', 'gemini', 'anthropic', 'openai', 'mistral'])).default(['sovereign', 'gemini']),
      quotas: z.object({
          monthlyTokens: z.number().optional(),
          alertThreshold: z.number().optional(),
      }).optional(),
      overridePrompts: z.record(z.string(), z.string()).optional(),  // rare, enterprise
  }).optional()
  ```
- [ ] Backward compat : le champ existant `ai` est marqué `@deprecated`, mais lu en fallback si `aiSettings` absent

#### C.2 — Créer `TenantAIRegistry`
- [ ] `src/kernel/ai/tenant/TenantAIRegistry.ts` :
  ```ts
  export class TenantAIRegistry {
      static forTenant(tenantId: string): TenantAIRegistryInstance {
          // 1. AIScopeGuard.assertTenantScope(callerModule)
          // 2. Lit tenantConfig.aiSettings depuis Nexus
          // 3. Résout le provider selon config
          // 4. Retourne instance avec méthodes generateText/stream
      }
  }
  ```
- [ ] `src/kernel/ai/tenant/TenantProviderChain.ts` :
  - Charge la chaîne fallback du tenant
  - Refuse une chaîne "souverain" si mode='cloud' etc. (validation cohérence)
- [ ] `src/kernel/ai/tenant/TenantLLMTelemetry.ts` :
  - Écrit dans `tenants/{id}/telemetry/llm_spend/{YYYY-MM}/{callerModule}`
- [ ] `src/kernel/ai/tenant/TENANT_SYSTEM_PROMPTS.ts` :
  - Prompts base (universels) : `assistant`, `oracle`, `vision`, `agentEngine`

#### C.3 — Migration des callers tenant
Fichiers concernés (grep précédent) :
- `src/modules/intelligence/services/MacroBrain.ts`
- `src/modules/intelligence/services/VisionService.ts`
- `src/modules/logistics/services/InvoiceExtractionService.ts`
- `src/modules/intelligence/ia/agency/AgentEngine.ts`
- `src/modules/commerce/acquisition/onboarding/migration/parsers/imageParser.ts`
- `src/modules/commerce/acquisition/onboarding/migration/parsers/pdfParser.ts`
- `src/modules/commerce/acquisition/onboarding/migration/parsers/ocrPrompts.ts`

Pour chaque :
- [ ] Remplacer `LLMManager.provider` par `TenantAIRegistry.forTenant(tenantId).provider`
- [ ] Chaque appel doit maintenant recevoir un `tenantId` en paramètre (déjà le cas dans la majorité)
- [ ] Ajouter télémétrie par appel

#### C.4 — Panel MCC `TenantAIConfigPanel`
- [ ] `src/app/(admin)/admin/mcc/components/TenantAIConfigPanel.tsx` :
  - Formulaire édition `aiSettings` d'un tenant
  - Toggle mode : cloud / souverain / mix
  - Dropdown provider par contexte (reasoning/fast/vision)
  - Input clé API (masqué, écrit uniquement côté serveur)
  - Preview coût mensuel estimé
- [ ] Route API `POST /api/admin/fleet/tenant-ai-config` (RBAC `mcc_super_admin`)
  - Valide `AISettingsSchema`
  - Update `tenants/{id}/tenantConfig` en merge
  - ChangelogService.record

#### C.5 — Tests d'isolation C
- [ ] `src/__tests__/kernel/ai/TenantAIRegistry.test.ts` :
  - `forTenant('t1')` lit bien la config `t1`
  - Deux tenants avec des configs différentes → deux providers différents
  - Mode `souverain` → refuse tout provider cloud (throw)
  - Mode `cloud` avec provider `sovereign` en fallback → warn mais autorise
- [ ] `src/__tests__/kernel/ai/TenantAIRegistry.multi-vertical.test.ts` :
  - Pour CHAQUE `PLATFORM_VARIANTS` (12), instancier un tenant et vérifier que `forTenant()` fonctionne
  - Vérifier que le prompt composé contient le vocabulaire vertical
  - Test qui échoue si un jour on hardcode "restaurant" quelque part

### Definition of Done (Phase C)
- [ ] `TenantConfigSchema.aiSettings` déployé (backward compat OK)
- [ ] `TenantAIRegistry.forTenant()` fonctionnel
- [ ] Tous les callers tenant utilisent `TenantAIRegistry`
- [ ] `TenantAIConfigPanel` fonctionnel dans MCC (test manuel)
- [ ] Test 12 verticales vert (`multi-vertical.test.ts`)
- [ ] Commit atomique : `feat(kernel/ai): TenantAIRegistry + config par tenant (Phase C)`

### Files créés/modifiés (Phase C)
```
src/kernel/ai/tenant/
  ├── TenantAIRegistry.ts                (~150 L)
  ├── TenantProviderChain.ts             (~80 L)
  ├── TenantLLMTelemetry.ts              (~50 L)
  ├── TENANT_SYSTEM_PROMPTS.ts           (~120 L)
  └── index.ts                           (~10 L)
src/modules/system/domain/schemas/tenant.ts   (modif — ajout aiSettings)
src/modules/intelligence/services/MacroBrain.ts (modif)
src/modules/intelligence/services/VisionService.ts (modif)
src/modules/logistics/services/InvoiceExtractionService.ts (modif)
src/modules/intelligence/ia/agency/AgentEngine.ts (modif)
src/modules/commerce/acquisition/onboarding/migration/parsers/*.ts (modif)
src/app/(admin)/admin/mcc/components/TenantAIConfigPanel.tsx (nouveau)
src/app/api/admin/fleet/tenant-ai-config/route.ts (nouveau)
src/__tests__/kernel/ai/TenantAIRegistry.test.ts (nouveau, 12+ tests)
src/__tests__/kernel/ai/TenantAIRegistry.multi-vertical.test.ts (nouveau, 12+ tests)
```

---

## 📋 PHASE D — VerticalBlueprint.aiPrompts + PromptComposer universel (1 jour)

### Objectif
Chaque vertical déclare son bloc `aiPrompts` dans son blueprint. Le `PromptComposer` combine automatiquement kernel base + vertical layer + tenant context. Ajouter une nouvelle vertical = ajouter son blueprint, sans toucher au kernel AI.

### Sous-tâches détaillées

#### D.1 — Enrichir `VerticalBlueprint` type
- [ ] Éditer `src/verticals/_shared/blueprint/BlueprintSchema.ts` :
  ```ts
  aiPrompts: z.object({
      systemPersona: z.string(),                      // "Tu es assistant boulanger..."
      vocabulary: z.record(z.string(), z.string()),   // { produit: 'baguette|viennoiserie', ... }
      examples: z.array(z.object({
          user: z.string(),
          assistant: z.string(),
      })).optional(),                                  // few-shot examples
      forbiddenActions: z.array(z.string()).optional(),// actions interdites pour ce métier
      complianceContext: z.string().optional(),        // NF525, HACCP, RGPD-santé, etc.
  }).optional()
  ```

#### D.2 — Compléter les 12 blueprints existants
- [ ] `restaurant.blueprint.ts` — persona "assistant restaurateur", vocabulaire tables/couverts/tickets
- [ ] `bakery.blueprint.ts` — persona "assistant boulanger", vocab fournées/DLC/loi Garot
- [ ] `salon.blueprint.ts` — persona coiffure, vocab rdv/forfaits/praticien
- [ ] `garage.blueprint.ts` — persona mécano, vocab OR/pièces/Trackdéchets
- [ ] `hotel.blueprint.ts` — persona hôtelier, vocab chambres/rack/police CESEDA
- [ ] `clinic.blueprint.ts` — persona médical, vocab consultations/CCAM/HDS
- [ ] `retail.blueprint.ts` — persona magasin, vocab SKU/EAN/portants
- [ ] `gym.blueprint.ts` — persona salle sport, vocab séances/adhérents
- [ ] `coworking.blueprint.ts` — persona coworking, vocab espaces/entreprises
- [ ] `veterinary.blueprint.ts` — persona véto, vocab animaux/vaccins/ICAD
- [ ] `florist.blueprint.ts` — persona fleuriste, vocab compositions/livraisons
- [ ] `custom.blueprint.ts` — persona générique, vocab minimal

**Contrainte** : chaque bloc `aiPrompts` doit tenir en <100 lignes. Détails métier → dans le blueprint lui-même, pas dans le kernel.

#### D.3 — Créer `PromptComposer`
- [ ] `src/kernel/ai/core/PromptComposer.ts` :
  ```ts
  export class PromptComposer {
      // MCC : compose sans vertical (MCC ne connaît pas de vertical spécifique)
      static composeMCC(input: {
          base: string;                    // depuis MCC_SYSTEM_PROMPTS
          context?: Record<string, unknown>;
      }): string { ... }

      // Tenant : compose avec vertical layer
      static composeTenant(input: {
          base: string;                                    // depuis TENANT_SYSTEM_PROMPTS
          verticalLayer: VerticalBlueprint['aiPrompts'];   // depuis blueprint
          tenantContext?: Record<string, unknown>;
      }): string { ... }
  }
  ```
- [ ] Injection cohérente : `[kernel base] + [vertical persona] + [vocabulary hints] + [examples few-shot] + [tenant context] + [user prompt]`
- [ ] Compliance context ajouté automatiquement selon vertical (NF525 pour restaurant, HDS pour clinic, etc.)

#### D.4 — Câblage `TenantAIRegistry` → `PromptComposer`
- [ ] Dans `TenantAIRegistry.forTenant(id).generateText()`, appeler automatiquement `PromptComposer.composeTenant()` avec le blueprint résolu
- [ ] Cache la résolution blueprint (le variant d'un tenant change rarement)

#### D.5 — Tests d'extensibilité D
- [ ] `src/__tests__/kernel/ai/PromptComposer.test.ts` :
  - Compose MCC ne contient AUCUN nom de vertical
  - Compose Tenant('bakery') contient "boulanger" et vocab boulanger
  - Compose Tenant('salon') contient vocab coiffure, PAS boulanger
  - Ajout d'une vertical fake `pharmacy` avec blueprint → compose fonctionne sans modif kernel
- [ ] `src/__tests__/kernel/ai/no-vertical-hardcode.test.ts` :
  - Scanne tous les fichiers `src/kernel/ai/**/*.ts`
  - Pour chaque PLATFORM_VARIANTS (sauf 'custom'), vérifie qu'il n'apparaît pas en littéral
  - **Test bloquant CI** (règle R2)

### Definition of Done (Phase D)
- [ ] 12 blueprints ont un bloc `aiPrompts` non-trivial
- [ ] `PromptComposer` compose correctement pour les 12 verticales
- [ ] Test `no-vertical-hardcode.test.ts` vert
- [ ] Test d'extensibilité (fake 13e vertical) vert
- [ ] `npx tsc --noEmit` : 0 erreur
- [ ] Commit atomique : `feat(verticals): aiPrompts par vertical + PromptComposer universel (Phase D)`

### Files créés/modifiés (Phase D)
```
src/verticals/_shared/blueprint/BlueprintSchema.ts (modif — ajout aiPrompts)
src/verticals/restaurant/restaurant.blueprint.ts   (modif — ajout aiPrompts)
src/verticals/bakery/bakery.blueprint.ts           (modif — ajout aiPrompts)
[... 10 autres blueprints]
src/kernel/ai/core/PromptComposer.ts               (modif — composition tenant)
src/__tests__/kernel/ai/PromptComposer.test.ts     (nouveau, 15+ tests)
src/__tests__/kernel/ai/no-vertical-hardcode.test.ts (nouveau, 12+ tests bloquants)
```

---

## 📋 PHASE E — Tests d'isolation cross-scope + garde CI (½ jour)

### Objectif
Tests d'isolation qui bloquent le CI si un futur commit viole une règle R1-R10. La sécurité repose sur ces tests, pas sur la discipline manuelle.

### Sous-tâches détaillées

#### E.1 — Tests bloquants R1 à R10
- [ ] `src/__tests__/kernel/ai/isolation-scope.test.ts` :
  - **R1** : `MCCAIRegistry` ne peut PAS être importé depuis un fichier de `src/modules/` (parse AST)
  - **R1** : `TenantAIRegistry` ne peut PAS être importé depuis `src/app/api/admin/fleet/`
  - **R2** : Aucun fichier `src/kernel/ai/**/*.ts` ne contient un nom de vertical hardcodé
  - **R3** : `LLMManager.provider = ` est absent partout sauf `src/kernel/ai/legacy/*` (transition)
  - **R4** : Imports natifs SDK (Gemini/OpenAI/Anthropic) uniquement dans `src/modules/intelligence/ia/ai/*Provider.ts`
  - **R5** : `NEXT_PUBLIC_(LLM|GEMINI|OPENAI|ANTHROPIC|MISTRAL)` absent du code
  - **R6** : Les 5 tests critiques ne sont jamais `.skip()`
  - **R9** : `MCC_LLM_*` et `TENANT_LLM_*` env vars disjointes

#### E.2 — Test cross-scope authority
- [ ] `src/__tests__/kernel/ai/CrossScopeAuthority.test.ts` :
  - Grant valide → allowed pendant TTL
  - Grant expiré → refusé
  - Grant loggué avec `callerModule`, `reason`
  - Aucun fichier n'importe les deux registres sauf `CrossScopeAuthority.ts`

#### E.3 — Test end-to-end multi-tenant + multi-vertical
- [ ] `src/__tests__/integration/ai-scope-e2e.test.ts` :
  - Setup : tenant `bakery-t1` (mode cloud, Gemini) + tenant `clinic-t2` (mode souverain, SLM local) + MCC (mode souverain, Anthropic)
  - Simuler un appel POS assistant sur bakery-t1 → vérifie que le fetch part vers Gemini
  - Simuler un appel POS assistant sur clinic-t2 → vérifie que le fetch part vers SLM local, JAMAIS vers Gemini
  - Simuler un appel diagnose MCC → vérifie que le fetch part vers Anthropic, JAMAIS vers Gemini ou vers un SLM tenant
  - Vérifier télémétrie MCC dans `mcc/telemetry/llm_spend/*`
  - Vérifier télémétrie tenants dans `tenants/*/telemetry/llm_spend/*`
  - Vérifier qu'aucune télémétrie MCC n'est écrite dans un tenant, et inversement

#### E.4 — CI guards
- [ ] Script `scripts/verify-ai-isolation.sh` :
  ```bash
  #!/bin/bash
  set -e
  echo "=== R1 : Aucun import MCC depuis modules/ ==="
  rg "from '@/kernel/ai/mcc" src/modules/ && exit 1 || true
  echo "=== R2 : Aucun vertical hardcodé dans kernel/ai ==="
  for v in restaurant bakery salon garage hotel clinic retail gym coworking veterinary florist; do
      rg "['\"]$v['\"]" src/kernel/ai/ && exit 1 || true
  done
  echo "=== R3 : LLMManager.provider = interdit hors legacy ==="
  rg "LLMManager\.provider\s*=" src/ --glob '!src/kernel/ai/legacy/**' && exit 1 || true
  echo "=== R5 : Pas de NEXT_PUBLIC_LLM_* ==="
  rg "NEXT_PUBLIC_(LLM|GEMINI|OPENAI|ANTHROPIC|MISTRAL)" src/ && exit 1 || true
  echo "✅ Toutes les règles d'isolation IA respectées"
  ```
- [ ] Ajouter le script dans `.gitlab-ci.yml` stage `lint`

#### E.5 — Métriques observables
- [ ] Dashboard MCC : nouveau panel `AIScopeAuditPanel.tsx` qui affiche :
  - Nombre d'appels MCC LLM dernières 24h
  - Nombre d'appels tenant LLM par tenant
  - Détection d'anomalie (un caller inattendu utilise un registre)
  - Coût mensuel MCC vs coût mensuel refacturable (par tenant)

### Definition of Done (Phase E)
- [ ] Script CI `verify-ai-isolation.sh` fonctionne, ajouté à `.gitlab-ci.yml`
- [ ] 10+ tests d'isolation R1-R10 verts
- [ ] Test E2E multi-tenant + multi-vertical vert
- [ ] `AIScopeAuditPanel` visible dans MCC
- [ ] `docs/adrs/ADR-008-mcc-tenant-ai-scope-isolation.md` mis à jour avec section "Enforcement"
- [ ] Commit atomique : `feat(kernel/ai): tests d'isolation + CI guards (Phase E)`

### Files créés (Phase E)
```
src/__tests__/kernel/ai/isolation-scope.test.ts        (nouveau, 10+ tests bloquants)
src/__tests__/kernel/ai/CrossScopeAuthority.test.ts    (nouveau, 6+ tests)
src/__tests__/integration/ai-scope-e2e.test.ts         (nouveau, 8+ tests)
scripts/verify-ai-isolation.sh                          (nouveau, exécutable)
.gitlab-ci.yml                                          (modif — stage lint)
src/app/(admin)/admin/mcc/components/AIScopeAuditPanel.tsx (nouveau)
```

---

## 📊 MÉTRIQUES DE SUCCÈS GLOBALES

| Métrique | Baseline (aujourd'hui) | Cible après E |
|----------|------------------------|---------------|
| Registres IA isolés | 0 (1 seul LLMManager global) | 2 (MCC + Tenant) |
| Verticales avec `aiPrompts` | 0 | 12 |
| Tests d'isolation R1-R10 | 0 | 10+ bloquants CI |
| Grep `LLMManager` dans MCC | 4 fichiers | 0 |
| Grep vertical hardcodé dans kernel AI | 0 | 0 (test qui bloque) |
| Panel MCC AI config par tenant | ❌ | ✅ `TenantAIConfigPanel` |
| Télémétrie MCC séparée | ❌ | `mcc/telemetry/llm_spend/*` |
| Télémétrie tenant séparée | ❌ | `tenants/{id}/telemetry/llm_spend/*` |
| Script CI `verify-ai-isolation.sh` | ❌ | ✅ dans `.gitlab-ci.yml` |
| Total nouveaux tests | 0 | 60+ |
| Extension nouvelle vertical (effort) | Impossible sans toucher LLM | 1 fichier blueprint |

---

## ⏳ TIMELINE RÉCAPITULATIF

| Jour | Phase | Livrable |
|------|-------|----------|
| **J1 matin** | Phase A | MCCAIRegistry créé + tests d'isolation |
| **J1 après-midi** | Phase A (fin) + Phase B (début) | ADR-008, commit A · migration diagnose route |
| **J2** | Phase B | Migration complète 4-5 callers MCC · provider-info route · SupportAIPanel dynamique |
| **J3** | Phase C | TenantAIRegistry + config aiSettings + migration callers tenant + TenantAIConfigPanel |
| **J4 matin** | Phase D | Enrichir 12 blueprints avec aiPrompts + PromptComposer |
| **J4 après-midi** | Phase E | Tests isolation R1-R10 + CI guards + AIScopeAuditPanel |

**Total effort : 4 jours calendaires** (avec buffer imprévus : 5 jours).

---

## 🚫 CE QU'IL EST INTERDIT DE FAIRE (Anti-patterns)

### Interdit #1 — "Un seul LLMManager suffit pour tout"
❌ NON. Chaque scope a son registre. Un même provider peut être partagé physiquement (ex: Anthropic pour MCC ET pour un tenant), mais via DEUX clés API DIFFÉRENTES.

### Interdit #2 — "Fallback silencieux vers un provider tenant si MCC fail"
❌ NON. Si MCCAIRegistry échoue → alerte critique. Jamais de bascule vers un provider tenant (fuite scope).

### Interdit #3 — "Hardcoder le vocabulaire boulanger dans le prompt kernel"
❌ NON. Le kernel ne connaît AUCUN métier. Toute spécificité vertical passe par le blueprint.

### Interdit #4 — "Ajouter une nouvelle vertical = modifier le kernel AI"
❌ NON. Ajouter une vertical = créer `verticals/xxx/xxx.blueprint.ts` + ligne dans `PLATFORM_VARIANTS`. Zéro touche au kernel.

### Interdit #5 — "Exposer une clé LLM côté client"
❌ NON. Toute clé LLM reste côté serveur. Le client appelle une route API server qui appelle le registre.

### Interdit #6 — "Skip un test d'isolation parce que ça bloque le déploiement"
❌ NON. Si un test d'isolation échoue, on FIXE le bug, on ne skip pas le test.

### Interdit #7 — "Utiliser directement le SDK Anthropic dans un composant React"
❌ NON. Les SDK LLM natifs sont réservés à `src/modules/intelligence/ia/ai/*Provider.ts`.

### Interdit #8 — "Ajouter un flag env public pour l'IA"
❌ NON. Pas de `NEXT_PUBLIC_GEMINI_KEY`. Serveur uniquement.

### Interdit #9 — "Migrer les callers tenant en même temps que MCC (big bang)"
❌ NON. Phase A/B (MCC seul) doivent être livrés avant Phase C (tenant). Le rollback doit être atomique par phase.

### Interdit #10 — "Réutiliser la même clé API pour MCC et pour un tenant"
❌ NON. Deux clés distinctes minimum. Une clé leak ne compromet qu'un scope, jamais les deux.

---

## 🎯 GARANTIES POUR L'AVENIR

Une fois les 5 phases livrées, les garanties suivantes sont **techniquement enforcées** (pas juste documentées) :

1. **Ajouter une 13e vertical (ex: pharmacie)** = 1 fichier blueprint. Le kernel AI ne bouge pas.
2. **Changer le provider MCC** (Anthropic → SLM local) = update env var. Zéro code modifié.
3. **Onboarder un tenant hospital HDS** = créer `aiSettings.mode='souverain'` dans son tenantConfig. Zéro code modifié.
4. **Un incident de fuite de clé tenant** = ne compromet pas les analyses MCC (isolation stricte).
5. **Un audit RGPD demande** "où vont les données du tenant X ?" = réponse traçable par télémétrie et config.
6. **La CI casse au premier commit** qui violerait une règle R1-R10.
7. **Le refactoring futur du kernel AI** (par exemple support d'un nouveau provider comme DeepSeek) = 1 fichier `DeepSeekProvider.ts` + entrée dans `LLMProviderFactory`. Aucun impact business.

---

## 🔄 SUIVI

- Statut par phase : mettre à jour la case en tête de ce fichier après chaque phase clôturée
- Décisions structurantes : documenter dans `docs/adrs/ADR-008-*.md`
- Bumper `MEMORY.md` avec un item `project_ai_scope_isolation` après Phase E
- Bumper `CHANGELOG.md` avec chaque commit de phase

---

**Prochaine action** : validation de ce plan par le patron, puis lancement de Phase A (½ journée, 0 risque, gros gain d'isolation).

*Rédigé le 2026-08-20 · Enforceable au CI · Aucun shortcut accepté.*
