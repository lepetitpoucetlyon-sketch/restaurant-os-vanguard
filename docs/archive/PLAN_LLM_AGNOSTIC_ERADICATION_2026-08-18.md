# 🧠 PLAN ÉRADICATION LLM-AGNOSTIC — RESTAURANT-OS-CORE

> **Date de rédaction** : 2026-08-18
> **Auteur** : session `llm-agnostic-eradication`
> **Objectif** : éradiquer les 4 fuites LLM-agnostic identifiées par audit graphify + audit code, rendre 100% des call sites LLM conformes à l'abstraction `AIProviderRouter`/`LLMManager`/`ILLMProvider`
> **Base d'audit** : rapport graphify `graphify-out/GRAPH_REPORT.md` + audit code (grep) + mémoire projet `project_llm_agnostic.md`
> **Non-objectif** : refonte de l'abstraction elle-même (déjà mature — 5 providers + fallback cascade + model aliases)
> **Précondition** : plan cycles Vagues A-E terminées ✅ (commit `baf493fbd`)

---

## Table des matières

- [0. Préambule opérationnel](#0-préambule-opérationnel)
- [1. État des lieux et découvertes graphify](#1-état-des-lieux-et-découvertes-graphify)
- [2. Prérequis](#2-prérequis)
- [Vague Α — Fondations & instrumentation](#vague-α--fondations--instrumentation-05-j)
- [Vague Β — Refactor AgentEngine + HermesEngine](#vague-β--refactor-agentengine--hermesengine-p0-2-3-j)
- [Vague Γ — Refactor routes API hardcodées](#vague-γ--refactor-routes-api-hardcodées-p0-1-2-j)
- [Vague Δ — Consolidation & doublons](#vague-δ--consolidation--doublons-p1-1-j)
- [Vague Ε — Tests, gates & prévention](#vague-ε--tests-gates--prévention-p1-1-j)
- [Vague Ζ — Migration Firebase claims (optionnelle)](#vague-ζ--migration-firebase-claims-optionnelle-p2-4-h)
- [Matrice des dépendances](#matrice-des-dépendances)
- [Métriques de sortie](#métriques-de-sortie)
- [Anticipation risques & régressions](#anticipation-risques--régressions)
- [Stratégie de rollback](#stratégie-de-rollback)
- [Journal d'exécution — template](#journal-dexécution--template)
- [Annexes](#annexes)

---

## 0. Préambule opérationnel

### 0.1 Contexte

Le projet a **une abstraction LLM mature** dans `src/modules/intelligence/ia/ai/` :
- 5 providers concrets (`AnthropicProvider`, `OpenAIProvider`, `GeminiProvider`, `MistralProvider`, `SovereignProvider`)
- Interface `ILLMProvider` unique
- Factory `LLMProviderFactory` avec detection auto par env vars
- Router `AIProviderRouter` avec fallback cascade
- Model aliases sémantiques (`fast`/`reasoning`/`vision-fast`/`vision-pro`)
- Test `llm-provider-agnostic.test.ts` déjà présent

**Le principe LLM-agnostic est enregistré en mémoire projet** ([project_llm_agnostic.md](/Users/mohammed-aliboudjaadar/.claude/projects/-Users-mohammed-aliboudjaadar-RESTAURANT-OS-CORE/memory/project_llm_agnostic.md)) : 3 modes tenant (solo cloud / solo souverain / mix intelligent).

**Mais 4 zones du code court-circuitent cette abstraction** en hardcodant Gemini via `fetch('https://generativelanguage.googleapis.com/...')`. Ces zones sont identifiées par graphify (communities 354 et 1949 isolées de la community 392 = vraie abstraction).

### 0.2 Périmètre exact

Fichiers concernés (audit graphify + grep) :

| Fichier | Fuite | Priorité | Cluster graphify |
|---|---|:-:|:-:|
| `src/modules/intelligence/ia/ai/AgentEngine.ts` | `executeGeminiRequest()` hardcodé, format Gemini-only (`contents/parts/text`) | 🔴 P0 | 354 |
| `src/modules/intelligence/ia/ai/HermesEngine.ts` | Délègue à `AgentEngine.query()` avec `endpoint: 'https://generativelanguage.googleapis.com'`, `modelId: 'gemini-1.5-pro'` | 🔴 P0 | 354 |
| `src/app/api/admin/fleet/support-ai/diagnose/route.ts` | `GEMINI_BASE_URL` constant + fetch direct | 🔴 P0 | 1949 |
| `src/app/api/ai/review-response/route.ts` | Idem | 🔴 P0 | 1949 |
| `src/lib/adapters/ZeusAdapter.ts` | Utilise `AgentEngine` avec endpoint Gemini | 🟠 P1 | via 354 |
| `src/modules/intelligence/ia/ai/GeminiProvider.ts` **vs** `src/modules/intelligence/ia/GeminiProvider.ts` | Doublon détecté (2 emplacements distincts dans le graph) | 🟠 P1 | 392 vs 236 |

### 0.3 Fichiers **hors périmètre** (déjà conformes)

Ces fichiers utilisent déjà l'abstraction correctement — ne PAS toucher :
- `src/app/api/tenant/onboarding/ocr/route.ts` — utilise `LLMManager` ✅
- `src/app/api/oracle/route.ts` ✅
- `src/app/api/admin/intelligence/vision/route.ts` ✅
- `src/app/api/admin/intelligence/strategy-oracle/route.ts` ✅
- `src/modules/intelligence/services/VisionService.ts` ✅
- `src/modules/intelligence/services/MacroBrain.ts` ✅
- `src/modules/logistics/services/InvoiceExtractionService.ts` ✅
- `src/verticals/_shared/sector-study/llmFromManager.ts` ✅
- Les 12 verticales (0 couplage direct — validé par graphify shortest-path)

### 0.4 Convention effort & priorité

| Symbole | Charge |
|:-:|---|
| **XS** | < 1 h |
| **S** | < 1 jour |
| **M** | 1-3 jours |
| **L** | 3-7 jours |

- 🔴 **P0** = fuite active en prod, bloque promesse LLM-agnostic
- 🟠 **P1** = dette structurelle, à traiter dans le sprint
- 🟡 **P2** = cosmétique / prévention

### 0.5 Convention session

Une seule session : `llm-agnostic-eradication`.
Périmètre exclusif : uniquement les fichiers listés section 0.2, plus `.sentrux/rules.toml`, `scripts/preflight.sh`, `docs/adrs/`.

---

## 1. État des lieux et découvertes graphify

### 1.1 Topologie détectée

Le graphify (23 MB) a détecté **3 clusters distincts** autour du LLM :

**Community 392** — Abstraction canonique ✅
```
ILLMProvider ← types.ts ← {AnthropicProvider, OpenAIProvider, GeminiProvider,
                            MistralProvider, SovereignProvider} ← LLMProviderFactory
                                                                 ← AIProviderRouter
                                                                 ← llm-provider-agnostic.test.ts
```

**Community 354** — Zone contaminée (bypass Gemini) 🚨
```
AgentEngine ← HermesEngine ← useExpert (domain hook)
             ← ZeusAdapter (via import indirect)
```

**Community 1949** — Routes API isolées 🚨
```
{support-ai/diagnose, review-response} → fetch('generativelanguage.googleapis.com')
```

### 1.2 Preuves topologiques du bypass

Shortest-path calculé par graphify :

| Source | Cible | Hops | Chemin |
|---|---|:-:|---|
| `AgentEngine` | `ILLMProvider` | **3** | via `ZeusAdapter → index.ts → ILLMProvider` (barrel re-export, PAS d'edge direct) |
| `HermesEngine` | `AIProviderRouter` | **2** | via barrel `index.ts` uniquement (PAS d'import direct) |

**Interprétation** : AgentEngine.ts et HermesEngine.ts n'importent **jamais** l'abstraction. Ils la côtoient dans les barrels mais ne l'utilisent pas.

### 1.3 Preuve des routes API hardcodées

Grep direct confirme :
```
src/app/api/admin/fleet/support-ai/diagnose/route.ts:7
  const GEMINI_BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

src/app/api/ai/review-response/route.ts:13
  process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

src/lib/adapters/ZeusAdapter.ts:166
  endpoint: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com',

src/modules/intelligence/ia/ai/HermesEngine.ts:154
  endpoint: 'https://generativelanguage.googleapis.com', // Base URL
```

### 1.4 Doublon GeminiProvider

Graph détecte 2 emplacements du même symbole :
- `src/modules/intelligence/ia/GeminiProvider.ts` (community 236, ancien emplacement)
- `src/modules/intelligence/ia/ai/GeminiProvider.ts` (community 392, canonique)

Le `LLMProviderFactory.ts:17` importe déjà depuis `../GeminiProvider` (ancien) — inconsistant avec les 4 autres providers importés depuis `./AnthropicProvider` etc.

---

## 2. Prérequis

### [PREREQ-1] TSC 0 + tests verts en baseline

```bash
npx tsc --noEmit && npx vitest run
```

Doit passer avant de démarrer. Si non → fixer d'abord (rbac-desambiguation-final probablement).

### [PREREQ-2] Working tree propre

```bash
git status --short
```

Doit être vide OU explicitement commité. Actuellement `AgentEngine.ts` + `HermesEngine.ts` sont modifiés (working tree in-flight qui prépare probablement ce chantier).

**Décision préalable** : commit le working tree existant OU stash avant de démarrer, pour ne pas mélanger 2 refactors sur le même fichier.

### [PREREQ-3] Session enregistrée dans sessions.md

Nom : `llm-agnostic-eradication`
Périmètre exclusif (voir §0.2)
Date : 2026-08-18
Status : `active`

### [PREREQ-4] Rebuild graphify post baseline

Pour valider avant/après :

```bash
graphify . --update
```

Sauvegarder l'état avant (nombre de nodes community 354, 392, 1949) dans le journal.

### [PREREQ-5] Vérifier variables d'environnement disponibles

Le plan repose sur `AIProviderRouter` qui detecte les providers via env vars. Vérifier au moins un configuré :

```bash
env | grep -E "GEMINI_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY|MISTRAL_API_KEY|SOVEREIGN_SLM_URL"
```

Si aucun → le test d'intégration Ε-05 échouera. Configurer au moins Gemini (existing) + un secondaire pour tester le fallback.

---

## Vague Α — Fondations & instrumentation (0.5 j)

**Objectif** : préparer le terrain, instrumenter la détection future de fuites.
**Précondition** : PREREQ 1-5 verts.

### [Α-01] Ajouter règle sentrux : `no_direct_llm_url`

**Effort** : XS (30 min)
**Fichier** : `.sentrux/rules.toml`

**Actions** :
```toml
[[rules]]
name = "no_direct_llm_url"
description = "Interdit les fetch() vers les APIs LLM en dehors des Provider concrets"
pattern = "fetch\\((['\"])https://(api\\.openai\\.com|api\\.anthropic\\.com|generativelanguage\\.googleapis\\.com|api\\.mistral\\.ai)"
exclude = [
    "src/modules/intelligence/ia/ai/*Provider.ts",
    "src/modules/intelligence/ia/GeminiProvider.ts", # legacy, à supprimer en Δ-01
]
severity = "error"
```

**Test** : `sentrux check .` doit détecter les 4 fuites actuelles. Score baseline = 4 violations. Après chantier → 0.

### [Α-02] Ajouter gate preflight `[9/9] LLM abstraction compliance`

**Effort** : XS (15 min)
**Fichier** : `scripts/preflight.sh`

**Actions** — ajouter à la fin :
```bash
step "🧠 [9/9] LLM abstraction — pas de fetch direct hors providers"
LLM_LEAKS=$(grep -rn "fetch.*['\"]https://\(api\.openai\|api\.anthropic\|generativelanguage\|api\.mistral\)" src/ \
    --include="*.ts" --include="*.tsx" \
    | grep -v "src/modules/intelligence/ia/ai/.*Provider\.ts" \
    | grep -v "src/modules/intelligence/ia/GeminiProvider\.ts" \
    | grep -v "\.test\." || true)

if [ -n "$LLM_LEAKS" ]; then
    fail "Fetch direct vers API LLM détecté hors providers concrets :"
    echo "$LLM_LEAKS"
    echo "  Correction : passer par LLMManager.provider.generateText() ou aiRouter.generateText()"
    exit 1
fi
ok "Aucune fuite LLM détectée"
```

Après implémentation : gate 9 devient bloquante. Baseline = 4 violations, cible = 0.

### [Α-03] Instrumenter `AIProviderRouter` : télémétrie usage par provider

**Effort** : S (2-3 h)
**Fichier** : `src/modules/intelligence/ia/ai/AIProviderRouter.ts` (existant, étendre)

**Actions** :
- Ajouter dans `generateText()` un compteur par provider utilisé (success/fallback/failure)
- Émettre `NexusEventBus.emit('ai.provider_used', { provider, taskType, tenantId, success, fallback, latencyMs, tokens })`
- Persistance optionnelle dans Axiom (déjà là ✅)

**Bénéfice** : dashboard MCC "usage LLM par tenant" trivial à ajouter ensuite. Fournit la donnée pour la future feature settings tenant (chantier T-06 du PLAN_SCALING_SOLO).

### [Α-04] Documenter le principe LLM-agnostic dans CLAUDE.md

**Effort** : XS (15 min)
**Fichier** : `CLAUDE.md`

**Ajout à la section "Conventions critiques"** :
```markdown
### LLM-agnostic — 5 providers, jamais de hardcodage

Toute intégration LLM DOIT passer par :
1. `LLMManager.provider.generateText(...)` (usage simple)
2. `aiRouter.generateText(...)` (avec fallback multi-provider)
3. Extension d'un `Provider.ts` existant si nouveau provider

**Interdit** : `fetch('https://api.openai.com/...')` ou équivalent en dehors de `src/modules/intelligence/ia/ai/*Provider.ts`.

5 providers supportés (via `AIProviderName`) : `sovereign` (SLM local), `gemini`, `anthropic`, `openai`, `mistral`, `ollama` (alias sovereign).

Selection : `AI_PROVIDER=xxx` env var, ou detection auto par `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / etc.
```

### 📊 Sortie Vague Α

- ✅ Règle sentrux `no_direct_llm_url` en place
- ✅ Gate preflight #9 activée (baseline 4 violations)
- ✅ Télémétrie provider usage émise
- ✅ CLAUDE.md à jour

---

## Vague Β — Refactor AgentEngine + HermesEngine (P0, 2-3 j)

**Objectif** : éliminer la fuite Gemini historique la plus profonde du code intelligence.
**Précondition** : Vague Α terminée (gates en place).

### 🎯 État initial

`AgentEngine.query()` accepte `apiKey`, `endpoint`, `modelId` en paramètres, fait `fetch(url)` avec format Gemini-only :
```typescript
body: JSON.stringify({
  contents: [{ parts: [{ text: `${systemPrompt}\n\n${dataContext}\n\n${prompt}` }] }],
});
// Parse : data?.candidates?.[0]?.content?.parts?.[0]?.text
```

Fallback logic hardcodé : `gemini-pro → gemini-flash`.

`HermesEngine.delegate()` appelle `AgentEngine.query()` avec `endpoint: 'https://generativelanguage.googleapis.com'`.

### 🎯 État cible

`AgentEngine.query()` :
- Ne prend plus `apiKey`/`endpoint`/`modelId` (breaking API — mais uniquement 3 consumers internes)
- Utilise `LLMManager.provider.generateText()` ou `aiRouter.generateText()` selon le contexte
- Fallback géré par `AIProviderRouter` (cascade multi-provider)
- Format agnostique (via `LLMTextRequest`)

`HermesEngine.delegate()` : ne passe plus d'endpoint, laisse le router décider.

### 📦 Actions détaillées

#### [Β-01] Créer test de non-régression AgentEngine.query

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/intelligence/agent-engine-refactor.test.ts` (nouveau)

**Actions** — capturer le comportement AVANT refactor pour garantir output équivalent APRÈS :

```typescript
describe('AgentEngine.query — refactor safety net', () => {
  const mockProvider = {
    generateText: vi.fn(async () => ({ text: 'RESPONSE_MOCK' })),
    generateFromImage: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(LLMManager).provider = mockProvider as never;
  });

  it('returns an AgentResponse with insight + rawText', async () => {
    const res = await AgentEngine.query({
      domain: 'accounting',
      userRole: 'manager',
      userPrompt: 'Analyse mon P&L',
    });
    expect(res.rawText).toBe('RESPONSE_MOCK');
    expect(res.insight.domain).toBe('accounting');
    expect(res.insight.reasoning.length).toBeGreaterThanOrEqual(2);
  });

  it('injects system prompt + contextData in the request', async () => {
    await AgentEngine.query({
      domain: 'sales',
      userRole: 'admin',
      userPrompt: 'Meilleur produit ce mois',
      contextData: { topProducts: [{ name: 'Burger', revenue: 1500 }] },
    });
    const req = mockProvider.generateText.mock.calls[0][0];
    expect(req.userPrompt).toContain('CONTEXTE DATA ACTUEL');
    expect(req.userPrompt).toContain('Burger');
  });

  it('propagates errors from provider', async () => {
    mockProvider.generateText.mockRejectedValueOnce(new Error('quota exceeded'));
    await expect(AgentEngine.query({ domain: 'general', userRole: 'admin', userPrompt: 'test' }))
      .rejects.toThrow(/Échec du moteur/);
  });
});
```

**Impact** : filet de sécurité qui rougit si le refactor casse la sémantique d'API.

#### [Β-02] Refactor `AgentEngine.query` — passage à l'abstraction

**Effort** : M (1-2 j)
**Fichier** : `src/modules/intelligence/ia/ai/AgentEngine.ts`

**Nouvelle interface `AgentRequest`** (breaking) :
```typescript
export interface AgentRequest {
    domain: AgentDomain;
    userRole: AgentRole;
    userPrompt: string;
    contextData?: SovereignValue;
    dna?: { tenantId: string; businessLaws: BusinessLaws };

    // Nouveau : model alias sémantique au lieu de modelId concret
    modelAlias?: 'fast' | 'reasoning' | 'vision-fast' | 'vision-pro';

    // Nouveau : preferred provider optionnel (respecte tenant settings)
    preferredProvider?: AIProviderName;

    // apiKey / endpoint / modelId : SUPPRIMÉS
}
```

**Nouvelle implémentation** :
```typescript
import { LLMManager } from './LLMManager';
import { resolveModelId, type AIProviderName } from './LLMProviderFactory';
import type { LLMTextRequest } from './types';

export const AgentEngine = {
    async query(request: AgentRequest): Promise<AgentResponse> {
        const modelAlias = request.modelAlias ?? 'reasoning';
        const systemPrompt = generateSystemPrompt(request.domain, request.userRole);
        const dataContext = request.contextData
            ? `\nCONTEXTE DATA ACTUEL :\n${JSON.stringify(request.contextData, null, 2)}`
            : '';
        const tenantLabel = request.dna?.tenantId || 'GLOBAL';

        const reasoning: AgentReasoningStep[] = [
            { id: 'r1', timestamp: new Date().toISOString(),
              action: 'Initialisation',
              observation: `Audit: ${request.domain}, Modèle: ${modelAlias}`,
              thought: 'Application du blindage système et vérification des autorisations.' },
            { id: `r2_${Date.now()}`, timestamp: new Date().toISOString(),
              action: 'Analyse Profonde',
              observation: request.userPrompt,
              thought: `Utilisation du modèle ${modelAlias} pour croisement avec le contexte ${request.domain} fourni (${tenantLabel}).` },
        ];

        try {
            const provider = LLMManager.provider;
            const llmReq: LLMTextRequest = {
                model: resolveModelId(modelAlias),
                systemPrompt,
                userPrompt: `${dataContext}\n\nREQUÊTE UTILISATEUR :\n${request.userPrompt}`,
            };
            const res = await provider.generateText(llmReq);

            return {
                insight: {
                    id: `ins_${Date.now()}`,
                    domain: request.domain,
                    type: 'info',
                    title: `Diagnostic Expert : ${request.domain}`,
                    description: res.text || `Analyse exécutée via le moteur ${modelAlias}.`,
                    reasoning,
                },
                rawText: res.text || 'Analyse terminée.',
            };
        } catch (err) {
            throw new Error(`Échec du moteur de raisonnement expert: ${toError(err).message}`);
        }
    },
};
```

**Ce qui disparaît** :
- `buildFetchUrl()`
- `executeGeminiRequest()` (cc=13 → sentrux gate améliore)
- Toute logique `gemini-pro → gemini-flash` fallback (géré par `AIProviderRouter`)
- Import `generateSystemPrompt` reste

**Réduction attendue** : ~110 lignes → ~50 lignes.

**Régression possible** : les 3 consumers (`HermesEngine`, `useExpert`, `ZeusAdapter`) qui passent `apiKey`/`endpoint`/`modelId` vont casser TSC. C'est voulu — les 3 sont fixés dans les actions suivantes.

#### [Β-03] Refactor `HermesEngine.delegate()`

**Effort** : XS (30 min)
**Fichier** : `src/modules/intelligence/ia/ai/HermesEngine.ts`

**Avant** :
```typescript
return AgentEngine.query({
    domain: agent.domain,
    userRole: agent.role,
    userPrompt: prompt,
    contextData: context,
    apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || 'NEXUS_INTERNAL',
    endpoint: 'https://generativelanguage.googleapis.com',
    modelId: 'gemini-1.5-pro'
});
```

**Après** :
```typescript
return AgentEngine.query({
    domain: agent.domain,
    userRole: agent.role,
    userPrompt: prompt,
    contextData: context,
    modelAlias: 'reasoning', // Vanguard = analyse profonde
});
```

**Régression possible** : aucune — le comportement est identique (reasoning = pro sur Gemini, mais aussi Claude Sonnet / GPT-4o / Mistral Large selon provider actif).

#### [Β-04] Refactor `useExpert` hook

**Effort** : XS (15 min)
**Fichier** : `src/modules/intelligence/domain/agency/useExpert.ts`

Lire le fichier, identifier l'appel à `AgentEngine.query({...})`, retirer les paramètres obsolètes (`apiKey`, `endpoint`, `modelId`), ajouter `modelAlias: 'reasoning'` si nécessaire.

#### [Β-05] Refactor `ZeusAdapter.ts`

**Effort** : XS (30 min)
**Fichier** : `src/lib/adapters/ZeusAdapter.ts`

Identifier l'appel à `AgentEngine.query({ ..., endpoint: 'https://generativelanguage.googleapis.com' })`, remplacer par appel sans endpoint.

Si `ZeusAdapter` est un "adapter fictif" (nom générique, à vérifier dans le code), potentiellement à décommissionner en Vague Δ.

#### [Β-06] Vérifier bootstrap `LLMManager.provider = ...`

**Effort** : XS (15 min)
**Fichier** : à identifier via grep — probablement `src/lib/bootstrap*.ts` ou similaire

**Actions** :
```bash
grep -rln "LLMManager.provider" src/ --include="*.ts" | grep -v "\.test\."
```

S'assurer qu'au démarrage app, `LLMManager.provider = createLLMProvider()` est appelé une fois. Sinon `LLMManager.provider` throw au 1er accès (cf. code L11-14).

Ajouter si absent dans un fichier bootstrap (client + serveur si nécessaire).

#### [Β-07] Test intégration end-to-end

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/intelligence/agent-hermes-integration.test.ts` (nouveau)

**Scénarios** :
```typescript
describe('AgentEngine + HermesEngine integration', () => {
  it('HermesEngine.delegate uses LLMManager (not hardcoded fetch)', async () => {
    const providerSpy = vi.spyOn(LLMManager, 'provider', 'get');
    providerSpy.mockReturnValue({
      generateText: vi.fn(async () => ({ text: 'response' })),
      generateFromImage: vi.fn(),
    } as never);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await HermesEngine.delegate('accounting', 'Analyse P&L');

    expect(providerSpy).toHaveBeenCalled();
    // Le fetch éventuel ne doit PAS aller vers Google APIs
    for (const call of fetchSpy.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toContain('generativelanguage.googleapis.com');
    }
  });

  it('AgentEngine falls back cleanly if LLMManager.provider is unset', async () => {
    // reset LLMManager
    (LLMManager as unknown as { _provider: null })._provider = null;

    await expect(AgentEngine.query({
      domain: 'general', userRole: 'admin', userPrompt: 'test'
    })).rejects.toThrow(/LLMManager|provider/);
  });

  it('propagates modelAlias correctly to provider', async () => {
    const generateText = vi.fn(async () => ({ text: 'ok' }));
    (LLMManager as never as { _provider: unknown })._provider = { generateText, generateFromImage: vi.fn() };

    await AgentEngine.query({
      domain: 'sales', userRole: 'manager', userPrompt: 'test',
      modelAlias: 'fast',
    });
    expect(generateText.mock.calls[0][0].model).toBeDefined();
    expect(generateText.mock.calls[0][0].userPrompt).toContain('test');
  });
});
```

#### [Β-08] Vérification finale + commit atomique

**Effort** : XS

```bash
npx tsc --noEmit                          # 0 erreur attendu
npx vitest run src/__tests__/intelligence/ # tous verts
grep -n "executeGeminiRequest\|generativelanguage" src/modules/intelligence/ia/ai/*.ts
# → doit ne renvoyer QUE le legacy GeminiProvider.ts (traité en Δ-01)
```

**Commit** :
```
refactor(ai): AgentEngine + HermesEngine passent par LLMManager (LLM-agnostic)

- AgentEngine.query supprime apiKey/endpoint/modelId (breaking API)
- Utilise LLMManager.provider.generateText avec modelAlias sémantique
- HermesEngine.delegate ne hardcode plus Gemini endpoint
- ZeusAdapter + useExpert alignés
- Tests intégration : LLMManager utilisé, aucun fetch vers Google APIs
- ~110 LOC AgentEngine → ~50 LOC (cc=13 executeGeminiRequest disparu)
```

### 📊 Sortie Vague Β

- ✅ AgentEngine 100% agnostic (community 354 se fond dans 392 au prochain graphify)
- ✅ HermesEngine idem
- ✅ 3 consumers (`useExpert`, `ZeusAdapter`, `HermesEngine`) alignés
- ✅ Test intégration prouve zéro fetch Google API
- ✅ Score sentrux gate 9 : 4 → 2 violations
- ✅ Fonction complexe `executeGeminiRequest` (cc=13) supprimée

---

## Vague Γ — Refactor routes API hardcodées (P0, 1-2 j)

**Objectif** : 2 routes API restantes qui bypassent l'abstraction.
**Précondition** : Vague Β terminée.

### 📦 Actions détaillées

#### [Γ-01] Refactor `/api/admin/fleet/support-ai/diagnose/route.ts`

**Effort** : S (3-4 h)
**Fichier** : `src/app/api/admin/fleet/support-ai/diagnose/route.ts`

**Contexte** : cette route est l'IA de diagnostic support (mentionnée dans le cockpit MCC "SOS Caisse & Télé-diagnostic IA"). Utilisée en admin MCC.

**Actions** :
1. Retirer `const GEMINI_BASE_URL = ...`
2. Retirer les `fetch(url + query)` directs
3. Utiliser `aiRouter.generateText(prompt, tenantId, { taskType: 'complex-analysis', preferredProvider: 'anthropic' })` (ou similaire, selon logique métier)
4. Le prompt système reste identique (spécifique diagnostic support)
5. Vérifier RBAC : `requireMccLevel(req, 'mcc_super_admin')` (post rbac-desambiguation-final)

**Test** : `src/__tests__/api/support-ai-diagnose.test.ts` (nouveau)
```typescript
it('uses aiRouter, not direct Gemini fetch', async () => { ... });
it('requires mcc_super_admin', async () => { ... });
```

#### [Γ-02] Refactor `/api/ai/review-response/route.ts`

**Effort** : S (2-3 h)
**Fichier** : `src/app/api/ai/review-response/route.ts`

**Contexte** : génération de réponses aux avis clients (Google/TripAdvisor). Task type = `summarization` ou `code-gen` selon logique.

**Actions** identiques à Γ-01 : passage à `aiRouter.generateText(prompt, tenantId, { taskType: 'summarization' })`.

**Test** : `src/__tests__/api/review-response.test.ts` (nouveau)
- Vérifie pas de fetch direct Gemini
- Vérifie que le tenant policy est respectée

#### [Γ-03] Documenter le mapping route → taskType

**Effort** : XS (30 min)
**Fichier** : `docs/AI_ROUTING_POLICY.md` (nouveau)

**Contenu** :
```markdown
# Politique de routing IA — Restaurant OS Core

Chaque route API qui utilise l'IA doit déclarer son `taskType` pour permettre au
`AIProviderRouter` de sélectionner le provider optimal selon la politique tenant.

| Route | taskType | Rationale |
|---|---|---|
| /api/admin/fleet/support-ai/diagnose | complex-analysis | Diagnostic technique — préfère Claude/GPT reasoning |
| /api/ai/review-response | summarization | Génération réponse polie — Gemini rapide + peu cher |
| /api/tenant/onboarding/ocr | vision-fast | OCR ticket — vision multimodale |
| /api/oracle | reasoning | Question métier ouverte — best model |
| /api/admin/intelligence/vision | vision-pro | Analyse visuelle poussée |
| /api/admin/intelligence/strategy-oracle | reasoning | Stratégie fleet MCC |
| (HermesEngine.delegate) | reasoning | Agents Vanguard = analyse profonde |
| (AgentEngine.query) | reasoning (défaut) | Configurable via modelAlias |
```

### 📊 Sortie Vague Γ

- ✅ 2 routes API alignées sur abstraction
- ✅ Community 1949 (RBAC + LLM leaks) se dissout au prochain graphify
- ✅ Score sentrux gate 9 : 2 → 0 violations
- ✅ Doc `AI_ROUTING_POLICY.md` publiée

---

## Vague Δ — Consolidation & doublons (P1, 1 j)

**Objectif** : nettoyer les artefacts (doublon GeminiProvider, isolation LLMManager).

### 📦 Actions détaillées

#### [Δ-01] Fusionner les 2 emplacements `GeminiProvider`

**Effort** : S (2-3 h)
**Fichiers** :
- `src/modules/intelligence/ia/GeminiProvider.ts` (ancien, à supprimer)
- `src/modules/intelligence/ia/ai/GeminiProvider.ts` (canonique, à créer si absent)

**Diagnostic** :
```bash
diff /Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/intelligence/ia/GeminiProvider.ts \
     /Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/intelligence/ia/ai/GeminiProvider.ts \
     2>&1 | head -50
```

**Actions** :
1. Comparer les 2 fichiers (contenu, exports)
2. Si le "canonique" (dans `ai/`) manque → créer depuis l'ancien
3. Rewrite tous les imports : `from '../GeminiProvider'` → `from './GeminiProvider'` dans `LLMProviderFactory.ts:17`
4. Grep les autres consumers : `grep -rn "from '@/modules/intelligence/ia/GeminiProvider'" src/`
5. `git rm src/modules/intelligence/ia/GeminiProvider.ts`
6. Vérifier community 236 disparait au graphify --update

**Régression possible** : consumers cassés → TSC coupe.

#### [Δ-02] Résoudre isolation `LLMManager` (community 442)

**Effort** : XS (30 min)
**Fichier** : `src/modules/intelligence/ia/ai/LLMManager.ts` (existant)

**Analyse graphify** : `LLMManager` est dans community 442 (avec `pdfParser`, `imageParser`) au lieu de 392 (avec `LLMManagerClass`). Cela suggère que les consumers importent `LLMManager` via un barrel qui les isole du cluster core.

**Actions** :
1. Vérifier que `src/modules/intelligence/ia/ai/index.ts` re-export bien `LLMManager` (déjà OK probablement)
2. Vérifier que consumers `pdfParser`/`imageParser` importent depuis le bon chemin (canonique)
3. Optionnel : ajouter test d'assertion topologique (garphify --update + vérif que `LLMManager` community = `LLMManagerClass` community)

#### [Δ-03] Décommissionner ou aligner `ZeusAdapter`

**Effort** : S (2-3 h)
**Fichier** : `src/lib/adapters/ZeusAdapter.ts`

**Contexte** : `ZeusAdapter` a été fixé en Β-05 (retirer endpoint Gemini). Mais si c'est un adapter mort ou peu utilisé, mieux vaut le supprimer.

**Actions** :
```bash
grep -rln "ZeusAdapter" src/ --include="*.ts" | grep -v "\.test\."
```

- Si < 3 consumers → évaluer suppression
- Si consumers légitimes → garder aligné sur `LLMManager`

#### [Δ-04] Purger `LLM_BASE_URL` env var

**Effort** : XS (15 min)

Cette env var était le mécanisme de bypass. Elle n'a plus lieu d'exister post-refactor.

**Actions** :
```bash
grep -rn "LLM_BASE_URL" src/ .env* 2>&1
```

- Retirer toutes les références
- Si présente en `.env.example` → supprimer avec commentaire "@deprecated post 2026-08-18, use AI_PROVIDER + XXX_API_KEY"

### 📊 Sortie Vague Δ

- ✅ 1 seul `GeminiProvider` dans le repo (canonique dans `ai/`)
- ✅ `LLMManager` topologiquement rattaché au cluster 392
- ✅ `ZeusAdapter` aligné ou supprimé
- ✅ Env var `LLM_BASE_URL` purgée
- ✅ `LLMProviderFactory` imports uniformisés

---

## Vague Ε — Tests, gates & prévention (P1, 1 j)

**Objectif** : rendre la régression impossible dans le futur.

### 📦 Actions détaillées

#### [Ε-01] Test contract-based : chaque provider respecte `ILLMProvider`

**Effort** : S (3-4 h)
**Fichier** : `src/__tests__/intelligence/provider-contract.test.ts` (nouveau)

```typescript
import { AnthropicProvider, OpenAIProvider, GeminiProvider, MistralProvider, SovereignProvider } from '@/modules/intelligence';

describe.each([
  { name: 'anthropic', Provider: AnthropicProvider },
  { name: 'openai', Provider: OpenAIProvider },
  { name: 'gemini', Provider: GeminiProvider },
  { name: 'mistral', Provider: MistralProvider },
  { name: 'sovereign', Provider: SovereignProvider },
])('$name provider contract', ({ Provider }) => {
  it('implements generateText', () => {
    const p = new Provider();
    expect(typeof p.generateText).toBe('function');
  });
  it('implements generateFromImage', () => {
    const p = new Provider();
    expect(typeof p.generateFromImage).toBe('function');
  });
  // Les tests avec vrais appels réseau sont skip si pas d'API key
});
```

#### [Ε-02] Test topologique via graphify snapshot

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/topology/llm-agnostic-boundary.test.ts` (nouveau)

**Concept** : lit `graphify-out/graph.json` (si présent, sinon skip) et vérifie que :
- Aucun fichier hors `src/modules/intelligence/ia/ai/*Provider.ts` n'a un edge direct vers un provider concret
- `AgentEngine`, `HermesEngine` ont un edge vers `LLMManager` ou `ILLMProvider`
- `Community` des fichiers refactorés = community de `AIProviderRouter`

**Approche pragmatique si graphify non installé en CI** :
```typescript
it('AgentEngine imports LLMManager (not GeminiProvider directly)', async () => {
  const src = readFileSync('src/modules/intelligence/ia/ai/AgentEngine.ts', 'utf8');
  expect(src).toContain('LLMManager');
  expect(src).not.toContain('generativelanguage');
  expect(src).not.toContain('executeGeminiRequest');
});
```

#### [Ε-03] Test fallback cascade `AIProviderRouter`

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/intelligence/router-fallback.test.ts` (nouveau)

```typescript
it('falls back to next provider if primary throws', async () => {
  vi.stubEnv('SOVEREIGN_SLM_URL', 'http://sovereign');
  vi.stubEnv('ANTHROPIC_API_KEY', 'test');

  const mockSovereign = vi.fn().mockRejectedValue(new Error('timeout'));
  const mockAnthropic = vi.fn().mockResolvedValue({ text: 'ok from anthropic' });

  vi.mock('./SovereignProvider', () => ({ SovereignProvider: class { generateText = mockSovereign; }}));
  vi.mock('./AnthropicProvider', () => ({ AnthropicProvider: class { generateText = mockAnthropic; }}));

  const res = await aiRouter.generateText('test', 'tenant1');
  expect(res.provider).toBe('anthropic');
  expect(res.fallback).toBe(true);
});
```

#### [Ε-04] Test HMAC / auth des routes IA refactorées

**Effort** : XS (1 h)

Les 2 routes API (Γ-01, Γ-02) doivent avoir des tests RBAC/auth. Ajouter dans leurs test files respectifs (créés en Γ) :
- Sans auth → 401/404
- Rôle insuffisant → 403 ou 404
- Rôle correct → 200 + réponse LLM mockée

#### [Ε-05] Test d'intégration multi-provider (skippable si pas d'API keys)

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/intelligence/multi-provider-integration.test.ts` (nouveau)

```typescript
describe.each([
  { name: 'anthropic', envKey: 'ANTHROPIC_API_KEY' },
  { name: 'openai', envKey: 'OPENAI_API_KEY' },
  { name: 'gemini', envKey: 'GEMINI_API_KEY' },
])('$name real integration', ({ name, envKey }) => {
  const apiKey = process.env[envKey];
  const testFn = apiKey ? it : it.skip;

  testFn('generates text with a real API call', async () => {
    vi.stubEnv('AI_PROVIDER', name);
    const provider = createLLMProvider();
    const res = await provider.generateText({
      model: resolveModelId('fast', name as never),
      userPrompt: 'Réponds juste "TEST" et rien d\'autre.',
    });
    expect(res.text.toUpperCase()).toContain('TEST');
  });
});
```

**Note** : ces tests sont skip par défaut en CI (pas d'API keys). Mais toi tu peux les run localement avec les keys → validation réelle.

#### [Ε-06] Rebuild graphify final + snapshot avant/après

**Effort** : XS (10 min actif + wait graphify)

```bash
graphify . --update
# Devrait montrer :
# - Community 354 vidée ou fondue dans 392
# - Community 1949 vidée ou fondue
# - Community 236 (doublon Gemini) disparue
```

Sauvegarder `graphify-out/GRAPH_REPORT.md` pré et post dans `docs/graphify-snapshots/` pour référence future.

#### [Ε-07] ADR-006 : LLM-agnostic architecture

**Effort** : XS (30 min)
**Fichier** : `docs/adrs/ADR-006-llm-agnostic-architecture.md`

**Contenu** :
```markdown
# ADR-006 : Architecture LLM-agnostique via AIProviderRouter

## Statut
Accepté — 2026-08-18

## Contexte
Le projet doit préserver le choix du provider LLM pour chaque tenant (Claude / GPT /
Gemini / Mistral / SLM souverain). 3 modes cibles : solo cloud, solo souverain,
mix intelligent.

## Décision
- Une seule abstraction `src/modules/intelligence/ia/ai/`
- Interface `ILLMProvider` : `generateText`, `generateFromImage`
- Factory `LLMProviderFactory` avec detection auto par env vars
- Router `AIProviderRouter` avec fallback cascade
- Model aliases sémantiques (`fast`/`reasoning`/`vision-fast`/`vision-pro`)
- Chaque call site DOIT passer par `LLMManager.provider` ou `aiRouter`
- Sentrux `no_direct_llm_url` + preflight gate 9 empêchent la régression

## Conséquences
+ Tenant peut switcher provider sans redéploiement
+ Data residency respectée (mode souverain SLM local)
+ Fallback automatique si un provider down
+ Testable via mock unique

- Refactor des consumers historiques (AgentEngine, routes API) nécessaire

## Alternatives rejetées
- Coupler à un provider unique (Claude) : perd la souveraineté
- Wrapper minimal par site d'appel : duplique la logique fallback
```

### 📊 Sortie Vague Ε

- ✅ Test contract-based sur 5 providers
- ✅ Test topologique (grep-based ou graphify-based)
- ✅ Test fallback cascade
- ✅ Tests intégration RBAC des routes refactorées
- ✅ Tests multi-provider (skippable sans keys)
- ✅ Snapshot graphify avant/après archivé
- ✅ ADR-006 publié

---

## Vague Ζ — Migration Firebase claims (optionnelle) (P2, 4 h)

**Objectif** : migrer les tokens Firebase legacy `role: 'super_admin'` vers `role: 'mcc_super_admin'` (post rbac-desambiguation-final).

**Note** : cette vague concerne le RBAC, pas le LLM-agnostic. Optionnelle ici — elle sera plus naturellement dans un plan RBAC dédié. Documentée ici car impacte le déploiement production si activée.

### 📦 Actions détaillées

#### [Ζ-01] Script de migration `scripts/migrate-mcc-role.ts`

**Effort** : S (2-3 h)

```typescript
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';

async function main() {
  initFirebaseAdmin();
  const auth = getAuth();
  let migrated = 0;

  let nextPageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const user of page.users) {
      const claims = user.customClaims ?? {};
      if (claims.role === 'super_admin') {
        await auth.setCustomUserClaims(user.uid, { ...claims, role: 'mcc_super_admin' });
        console.log(`Migrated ${user.email} : super_admin → mcc_super_admin`);
        migrated++;
      }
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  console.log(`Total migrated: ${migrated}`);
}
main().catch(console.error);
```

#### [Ζ-02] Run + validation

**Effort** : S (1 h)

1. Backup Firestore users collection (idempotent snapshot)
2. Run le script en dev/staging d'abord
3. Vérifier logs — chaque user impacté doit se déconnecter et se reconnecter (nouveaux claims)
4. Run en prod hors heures ouvrées
5. Après 7 jours de stabilité → retirer l'alias legacy dans `normalizeMccRole` (`adminAuthGuard.ts:53`)

#### [Ζ-03] Retirer alias legacy

**Effort** : XS (15 min)

Post migration confirmée :
```typescript
// AVANT
function normalizeMccRole(role: string): MccRole | null {
    if (role === 'mcc_super_admin' || role === 'super_admin') return 'mcc_super_admin';
    ...
}
// APRÈS
function normalizeMccRole(role: string): MccRole | null {
    if (role === 'mcc_super_admin') return 'mcc_super_admin';
    ...
}
```

Retirer aussi `'super_admin'` de `FLEET_ROLES`.

---

## Matrice des dépendances

```
PREREQ-1..5 (TSC + tests + tree propre + graphify update + env vars)
   │
   ▼
Vague Α — Fondations (0.5 j) — parallèle à tout le reste
   ├── Α-01 sentrux règle
   ├── Α-02 preflight gate 9
   ├── Α-03 télémétrie router (peut être en //)
   └── Α-04 doc CLAUDE.md
   │
   ▼
Vague Β — Refactor AgentEngine + HermesEngine (2-3 j)
   ├── Β-01 test non-régression AVANT touche
   │   └── Β-02 refactor AgentEngine.query
   │       ├── Β-03 refactor HermesEngine.delegate
   │       ├── Β-04 refactor useExpert
   │       ├── Β-05 refactor ZeusAdapter
   │       └── Β-06 bootstrap LLMManager.provider
   ├── Β-07 tests intégration
   └── Β-08 commit atomique
   │
   ▼
Vague Γ — Routes API (1-2 j) — indépendante de Β
   ├── Γ-01 support-ai/diagnose refactor
   ├── Γ-02 review-response refactor
   └── Γ-03 doc AI_ROUTING_POLICY
   │
   ▼
Vague Δ — Consolidation (1 j)
   ├── Δ-01 fusion doublon GeminiProvider
   ├── Δ-02 isolation LLMManager
   ├── Δ-03 ZeusAdapter décommission ou aligne
   └── Δ-04 purge LLM_BASE_URL
   │
   ▼
Vague Ε — Tests & prévention (1 j) — après B, Γ, Δ
   ├── Ε-01 test contract 5 providers
   ├── Ε-02 test topologique
   ├── Ε-03 test fallback cascade
   ├── Ε-04 test RBAC routes
   ├── Ε-05 test intégration multi-provider (skip sans keys)
   ├── Ε-06 rebuild graphify snapshot
   └── Ε-07 ADR-006
   │
   ▼
Vague Ζ (optionnelle, +4 h) — migration Firebase claims
```

**Chemin critique** : PREREQ → Α-02 (gate) → Β-01 → Β-02 → Β-07 → Ε-06 (snapshot final)

**Charge totale** : **5-8 j solo** (parallélisme possible : Β et Γ indépendants → réduction à 3-5 j si focus).

---

## Métriques de sortie

| Métrique | Avant | Après Α | Après Β | Après Γ | Après Δ | Après Ε |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Sentrux gate 9 (`no_direct_llm_url`)** | 4 | 4 (activé) | 2 | 0 | 0 | **0** ✅ |
| **Communities LLM distinctes** | 3 (392+354+1949) | 3 | 2 (fusion 354→392) | 1 (fusion 1949) | 1 | **1** ✅ |
| **Fichiers hardcodés Gemini** | 5 | 5 | 3 | 1 (legacy GeminiProvider) | 0 | 0 |
| **Providers implémentant `ILLMProvider`** | 5 | 5 | 5 | 5 | 5 | **5 testés contract-based** |
| **Fonctions cc>12 dans zone IA** | 3 (executeGeminiRequest, buildFetchUrl…) | 3 | 1 | 0 | 0 | 0 |
| **Test coverage zone IA** | ~30% | ~30% | ~55% | ~70% | ~75% | **~90%** |
| **ADRs LLM** | 0 | 0 | 0 | 0 | 0 | 1 (ADR-006) |
| **Env vars deprecated** (`LLM_BASE_URL`) | 1 actif | 1 | 1 | 1 | 0 | 0 |
| **Doublons providers** | 1 (Gemini) | 1 | 1 | 1 | 0 | 0 |

---

## Anticipation risques & régressions

### 🔴 Risques P0

| Risque | Mitigation |
|---|---|
| **Β-02 casse HermesEngine en prod** (breaking API change) | Β-01 = test non-régression AVANT refactor. Rollback = revert commit atomique. |
| **`LLMManager.provider` unset au démarrage** → tout crash | Β-06 vérifie bootstrap. Test Β-07 assert que provider throw explicite. |
| **Fallback cascade masque une erreur configuration** (tenant se croit sur SLM mais fallback vers Claude en silence) | Télémétrie Α-03 émet event `ai.provider_used` avec `fallback: true` → dashboard MCC visible + alerte si fallback > 20%. |
| **Ζ-01 migration Firebase claims** casse comptes MCC actifs | Backup préalable + test staging + hors heures ouvrées + alias legacy conservé 7j. |

### 🟠 Risques P1

| Risque | Mitigation |
|---|---|
| **Γ-01/02 routes IA sortent des résultats différents** (Gemini → Claude switch) | Prompt système inchangé, mais qualité peut varier. Test manuel post-deploy sur 5 cas réels. |
| **Doublon GeminiProvider Δ-01** : un consumer oublié importe l'ancien path → TSC coupe | TSC gate en local + preflight. Grep exhaustif avant `git rm`. |
| **Env var `LLM_BASE_URL` (Δ-04)** utilisée dans un docker-compose ou CI | Grep incluant `.github/`, `.gitlab/`, `docker-compose*.yml`, `Dockerfile*` |

### 🟡 Risques P2

| Risque | Mitigation |
|---|---|
| **Sentrux gate 9 (Α-02) devient bloquante et ralentit dev** | Baseline ratchet 4 → 0 progressive, jamais activée bloquante avant Ε |
| **Tests intégration multi-provider (Ε-05) consomment quota API** | `it.skip` si pas d'API key. Local uniquement, jamais CI. |
| **ADR-006 rédigé sans review externe** | Passer par sanity check + éventuel PR sur main pour trace |

### ⚠️ Impacts collatéraux attendus

- **Bundle client -5 à -10 KB** post Δ-01 (doublon Gemini supprimé)
- **TSC compilation -3 à -5%** (moins de fichiers à parser)
- **Sentrux quality score +50 à +100 pts** (fonctions complexes supprimées + community fusion)
- **Preflight temps** +2-3s (gate 9 ajoute un grep)
- **Cycles madge** : inchangé (0 avant, 0 après — le chantier n'introduit pas de cycles)

---

## Stratégie de rollback

### Rollback Vague Α

Purement additif (règles sentrux, gate preflight, télémétrie, doc). Revert commit = zéro impact runtime.

### Rollback Vague Β

**Risque le plus élevé** — refactor breaking d'`AgentEngine.query`. Rollback = revert du commit Β-08.

**Backup pré-Β** : `git tag pre-llm-agnostic-eradication` avant démarrage. Retour arrière = `git reset --hard pre-llm-agnostic-eradication`.

Feature flag possible : garder AgentEngine legacy 30 jours en `AgentEngineLegacy.ts` déprécié, avec toggle env `USE_LEGACY_AGENT_ENGINE=true` pour un rollback rapide en cas d'incident.

### Rollback Vague Γ

Par route indépendante. Revert d'un des 2 commits = restauration du fetch direct.

Alternative : garder `GEMINI_BASE_URL` constant mais utiliser via `aiRouter` — hybride safe.

### Rollback Vague Δ

- Δ-01 doublon : garder GeminiProvider legacy en `@deprecated` 30 jours avant `git rm`
- Δ-04 env var : garder `LLM_BASE_URL` reconnue par les Provider concrets pendant 30 jours

### Rollback Vague Ε

Tests + docs + ADR = zéro impact runtime. Aucun rollback nécessaire.

### Rollback Vague Ζ

**Critique** : migration Firebase claims est semi-irréversible.

Rollback :
1. Script inverse `mcc_super_admin` → `super_admin` (les tokens legacy restaient acceptés grâce à alias)
2. Backup Firestore users pré-migration = source de vérité pour restauration

**Reco** : ne pas lancer Ζ avant que Vagues Β/Γ/Δ/Ε soient stables 2 semaines en prod.

---

## Journal d'exécution — template

À tenir dans `.claude/sessions.md` sous la session `llm-agnostic-eradication`.

```markdown
### Journal Chantier LLM-Agnostic Eradication

| ID | Action | Statut | Commit | Notes |
|----|--------|:------:|--------|-------|
| PREREQ-1 | TSC + tests verts | ⬜ | — | — |
| PREREQ-2 | Working tree propre | ⬜ | — | — |
| PREREQ-3 | Session sessions.md | ⬜ | — | — |
| PREREQ-4 | Graphify update pré | ⬜ | — | Snapshot dans docs/graphify-snapshots/ |
| PREREQ-5 | Env vars vérifiées | ⬜ | — | Providers dispo : ___ |
| Α-01 | Règle sentrux | ⬜ | — | Baseline: 4 violations |
| Α-02 | Preflight gate 9 | ⬜ | — | — |
| Α-03 | Télémétrie router | ⬜ | — | Event `ai.provider_used` émis |
| Α-04 | Doc CLAUDE.md | ⬜ | — | — |
| Β-01 | Test non-régression | ⬜ | — | — |
| Β-02 | Refactor AgentEngine.query | ⬜ | — | Breaking API : ok |
| Β-03 | Refactor HermesEngine | ⬜ | — | — |
| Β-04 | Refactor useExpert | ⬜ | — | — |
| Β-05 | Refactor ZeusAdapter | ⬜ | — | — |
| Β-06 | Bootstrap LLMManager | ⬜ | — | Vérifié client + serveur |
| Β-07 | Tests intégration | ⬜ | — | — |
| Β-08 | Commit atomique | ⬜ | — | — |
| Γ-01 | support-ai/diagnose | ⬜ | — | taskType: complex-analysis |
| Γ-02 | review-response | ⬜ | — | taskType: summarization |
| Γ-03 | Doc AI_ROUTING_POLICY | ⬜ | — | — |
| Δ-01 | Fusion GeminiProvider | ⬜ | — | Community 236 → 0 |
| Δ-02 | Isolation LLMManager | ⬜ | — | Community 442 → 392 |
| Δ-03 | ZeusAdapter décision | ⬜ | — | keep/remove |
| Δ-04 | Purge LLM_BASE_URL | ⬜ | — | 0 usages restants |
| Ε-01 | Test contract 5 providers | ⬜ | — | — |
| Ε-02 | Test topologique | ⬜ | — | grep-based OR graphify |
| Ε-03 | Test fallback cascade | ⬜ | — | — |
| Ε-04 | Tests RBAC routes | ⬜ | — | — |
| Ε-05 | Test intégration multi | ⬜ | — | skip sans keys |
| Ε-06 | Graphify snapshot post | ⬜ | — | Comparer avec pré |
| Ε-07 | ADR-006 | ⬜ | — | — |
| Ζ-01 | Script migration claims | ⬜ | — | Optionnel |
| Ζ-02 | Run + validation | ⬜ | — | — |
| Ζ-03 | Retirer alias legacy | ⬜ | — | Post 7j stabilité |
```

**Légende** : ⬜ à faire · 🟨 en cours · ✅ fait · ❌ bloqué · ↩️ reverted

---

## Annexes

### A. Correspondance graphify communities → fichiers

| Community | Rôle | Fichiers principaux | Statut post-plan |
|---|---|---|:-:|
| **392** | Abstraction LLM canonique | AIProviderRouter, LLMProviderFactory, 5 Providers, types, tests | ✅ Grow (fusion 354 + 1949 leaks) |
| **354** | Zone contaminée AgentEngine | AgentEngine, HermesEngine, useExpert, ZeusAdapter | ✅ Absorbée dans 392 |
| **1949** | Zone contaminée routes API | support-ai/diagnose, review-response | ✅ Absorbée dans 392 |
| **236** | Doublon GeminiProvider legacy | ancien src/modules/intelligence/ia/GeminiProvider.ts | ✅ Supprimée |
| **442** | LLMManager isolé | LLMManager (avec pdfParser, imageParser) | ✅ Fusionnée dans 392 |
| 165 | InvoiceExtractionService (déjà propre) | — | ✅ Inchangée |
| 89 | SupportTicketAnalysisHandler (déjà propre) | — | ✅ Inchangée |

### B. Commandes fréquentes du plan

```bash
# Vérifier les fuites restantes
grep -rn "generativelanguage\|api\.openai\|api\.anthropic\|api\.mistral" src/ \
    --include="*.ts" --include="*.tsx" \
    | grep -v "src/modules/intelligence/ia/ai/.*Provider\.ts" \
    | grep -v "src/modules/intelligence/ia/GeminiProvider\.ts" \
    | grep -v "\.test\."

# Vérifier consumers de l'abstraction
grep -rln "LLMManager\|createLLMProvider\|aiRouter" src/ --include="*.ts"

# Refresh graphify (post refactor)
graphify . --update

# Preflight complet
npm run preflight

# Sentrux baseline update (si nécessaire)
./scripts/sentrux-baseline.sh
```

### C. Consumers actuels d'`AgentEngine.query`

À grep avant démarrage Β-02 pour valider le périmètre :
```bash
grep -rn "AgentEngine\.query\|AgentEngine\.query(" src/ --include="*.ts" | grep -v "\.test\."
```

Attendu (à date audit) :
- `src/modules/intelligence/ia/ai/HermesEngine.ts:148`
- `src/modules/intelligence/domain/agency/useExpert.ts` (à confirmer)
- `src/lib/adapters/ZeusAdapter.ts` (à confirmer)

**Si un 4ème consumer apparait** : l'ajouter au périmètre Β-04/05 avant commit atomique Β-08.

### D. Providers imports (`LLMProviderFactory`)

État actuel (à uniformiser en Δ-01) :
```typescript
import { GeminiProvider } from '../GeminiProvider';      // ⚠️ chemin legacy
import { AnthropicProvider } from './AnthropicProvider'; // ✅ canonique
import { OpenAIProvider } from './OpenAIProvider';       // ✅
import { SovereignProvider } from './SovereignProvider'; // ✅
import { MistralProvider } from './MistralProvider';     // ✅
```

Cible :
```typescript
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';       // ← déplacé
import { MistralProvider } from './MistralProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { SovereignProvider } from './SovereignProvider';
```

### E. Hors périmètre de ce plan

- **Refonte de l'abstraction elle-même** : `ILLMProvider` est stable, ne pas y toucher
- **Ajout d'un 6ème provider** : projet séparé (ex: `LlamaProvider` self-hosted)
- **Support tool-use / function calling** : requiert extension `ILLMProvider` — chantier futur
- **UI settings tenant "choix provider"** : couvert par PLAN_SCALING_SOLO chantier T-06
- **Fine-tuning SLM avancé** : couvert par PLAN_SCALING_SOLO chantier T-08

### F. Liens connexes

- Mémoire projet : [project_llm_agnostic.md](/Users/mohammed-aliboudjaadar/.claude/projects/-Users-mohammed-aliboudjaadar-RESTAURANT-OS-CORE/memory/project_llm_agnostic.md)
- Plan cycles : [PLAN_CYCLES_MADGE.md](PLAN_CYCLES_MADGE.md)
- Plan correction : [PLAN_CORRECTION_2026-08-18.md](PLAN_CORRECTION_2026-08-18.md)
- Plan consolidation : [PLAN_CONSOLIDATION_2026-08-18.md](PLAN_CONSOLIDATION_2026-08-18.md)
- Plan scaling : [PLAN_SCALING_SOLO_2026-08-18.md](PLAN_SCALING_SOLO_2026-08-18.md)
- Graphify report : [graphify-out/GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md)

---

**Fin du plan.**

**Prochaine action** : PREREQ 1-5 (30 min) → si vert, démarrer Vague Α en parallèle du refactor working tree AgentEngine déjà en cours.
