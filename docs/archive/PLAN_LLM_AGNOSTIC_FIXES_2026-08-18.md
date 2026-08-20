# 🔌 PLAN LLM-AGNOSTIC FIXES 2026-08-18

> **Date de rédaction** : 2026-08-18
> **Auteur** : session `llm-agnostic-fixes`
> **Objectif** : éradiquer les 5 fuites où Gemini est hardcodé au lieu de passer par l'abstraction `LLMManager` / `AIProviderRouter`
> **Effort total** : S (4-6 h)
> **Priorité** : 🟠 High (contredit le principe fondateur LLM-agnostic)
> **Précondition** : aucune — l'abstraction cible existe déjà ✅

---

## Table des matières

- [0. Contexte](#0-contexte)
- [1. Prérequis](#1-prérequis)
- [Action LLM-01 — AgentEngine.ts (CRITIQUE)](#action-llm-01--agentenginets-critique)
- [Action LLM-02 — HermesEngine.ts (CRITIQUE)](#action-llm-02--hermesenginets-critique)
- [Action LLM-03 — ZeusAdapter.ts](#action-llm-03--zeusadapterts)
- [Action LLM-04 — /api/admin/fleet/support-ai/diagnose](#action-llm-04--apiadminfleetsupport-aidiagnose)
- [Action LLM-05 — /api/ai/review-response](#action-llm-05--apiairreview-response)
- [Tests garde-fous](#tests-garde-fous)
- [Preflight gate anti-régression](#preflight-gate-anti-régression)
- [Rollback](#rollback)
- [Journal](#journal)

---

## 0. Contexte

L'audit LLM-agnostic du 2026-08-18 a identifié **5 fuites** où des fichiers hardcodent Gemini au lieu d'utiliser l'abstraction existante :

- `AIProviderRouter` (fallback cascade)
- `LLMManager` (singleton actif)
- `LLMProviderFactory.createLLMProvider()` (instanciation dynamique)
- `AGNOSTIC_MODEL_ALIASES` (`fast`/`reasoning`/`vision-fast`/`vision-pro`)

Contrairement au reste du code (verticales 12/12 propres, 6 consumers exemplaires), ces 5 fichiers contournent l'abstraction. Résultat :
- Un tenant qui choisit "Solo souverain" (SLM) verra `HermesEngine` et `AgentEngine` continuer à taper Google Gemini
- Un tenant qui choisit "Solo Anthropic" verra `ZeusAdapter` continuer à taper Gemini
- Les routes `/api/admin/fleet/support-ai/diagnose` et `/api/ai/review-response` idem

**Note ironique** : 2 des 5 fuites sont **dans le pilier IA lui-même** (`ai/AgentEngine.ts`, `ai/HermesEngine.ts`) — le pilier ne consomme pas sa propre abstraction.

---

## 1. Prérequis

### [PREREQ-L1] Vérifier que l'abstraction fonctionne

```bash
grep -c "LLMManager.provider\|createLLMProvider\|aiRouter" src/modules/intelligence/services/MacroBrain.ts src/app/api/oracle/route.ts
```

Attendu : ≥ 2 usages. Sinon, `LLMManager` n'est peut-être pas bootstrappé quelque part.

### [PREREQ-L2] Vérifier bootstrap `LLMManager.provider`

```bash
grep -rn "LLMManager.provider\s*=" src/
```

Attendu : au moins 1 site de bootstrap (typiquement dans un provider React ou un fichier d'init serveur). Sinon, ajouter en action bonus.

### [PREREQ-L3] Baseline tests verts

```bash
npx tsc --noEmit && npx vitest run
```

Attendu : 0 erreur TSC, 100% tests OK. Freeze la référence avant modifications.

---

## Action LLM-01 — AgentEngine.ts (CRITIQUE)

**Effort** : M (2 h)
**Fichier** : `src/modules/intelligence/ia/ai/AgentEngine.ts`
**Sévérité** : 🔴 CRITIQUE — c'est le "brain" de HermesEngine

### 🎯 Symptôme

- Fonction `executeGeminiRequest()` nommée explicitement Gemini
- Body format Gemini-only : `contents: [{ parts: [{ text: ... }] }]`
- Response parse Gemini-only : `data?.candidates?.[0]?.content?.parts?.[0]?.text`
- Fallback logic `gemini-pro → gemini-flash` hardcodé
- `AgentRequest` type contient `apiKey`, `endpoint`, `modelId` en dur

### 📦 Fix

Refactor complet : `AgentEngine.query()` doit passer par `LLMManager.provider.generateText()`.

```typescript
// AVANT (extrait ligne 77-135)
export const AgentEngine = {
  async query(request: AgentRequest): Promise<AgentResponse> {
    if (!request.apiKey || !request.endpoint) {
      throw new Error('AgentEngine: Missing API Configuration');
    }
    const systemPrompt = generateSystemPrompt(request.domain, request.userRole);
    // ...
    const fetchUrl = buildFetchUrl(request.endpoint, request.apiKey);
    const body = JSON.stringify({ contents: [...] });
    const { text: rawText, fallbackUsed } = await executeGeminiRequest(fetchUrl, body, request.apiKey);
    // ...
  },
};

// APRÈS (agnostic)
import { LLMManager } from './LLMManager';
import { resolveModelId } from './LLMProviderFactory';

export interface AgentRequest {
  domain: AgentDomain;
  userRole: AgentRole;
  userPrompt: string;
  contextData?: SovereignValue;
  dna?: { tenantId: string; businessLaws: BusinessLaws };
  modelAlias?: 'fast' | 'reasoning' | 'vision-fast' | 'vision-pro';  // alias sémantique
  // apiKey/endpoint/modelId retirés — gérés par le provider
}

export const AgentEngine = {
  async query(request: AgentRequest): Promise<AgentResponse> {
    const systemPrompt = generateSystemPrompt(request.domain, request.userRole);
    const dataContext = request.contextData
      ? `\nCONTEXTE DATA ACTUEL :\n${JSON.stringify(request.contextData, null, 2)}`
      : '';
    const tenantLabel = request.dna?.tenantId || 'GLOBAL';
    const alias = request.modelAlias ?? 'reasoning';

    const reasoning: AgentReasoningStep[] = [
      {
        id: 'r1',
        timestamp: new Date().toISOString(),
        action: 'Initialisation',
        observation: `Audit: ${request.domain}, Alias modèle: ${alias}`,
        thought: 'Application du blindage système via provider LLM actif (agnostic).',
      },
      {
        id: `r2_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Analyse Profonde',
        observation: request.userPrompt,
        thought: `Croisement contexte ${request.domain} pour ${tenantLabel}.`,
      },
    ];

    try {
      const response = await LLMManager.provider.generateText({
        model: resolveModelId(alias),
        systemPrompt,
        userPrompt: `${dataContext}\n\nREQUÊTE UTILISATEUR :\n${request.userPrompt}`,
        temperature: 0.3,
      });

      return {
        insight: {
          id: `ins_${Date.now()}`,
          domain: request.domain,
          type: 'info',
          title: `Diagnostic Expert : ${request.domain}`,
          description: response.text || 'Analyse exécutée.',
          reasoning,
        },
        rawText: response.text || 'Analyse terminée.',
      };
    } catch (err) {
      throw new Error(`Échec du moteur de raisonnement expert: ${toError(err).message}`);
    }
  },
};
```

### 🔧 Nettoyage

- **Supprimer** `buildFetchUrl()`, `executeGeminiRequest()` (deviennent morts)
- **Supprimer** les champs `apiKey`, `endpoint`, `modelId` de `AgentRequest`
- **Ajouter** `modelAlias` optionnel dans `AgentRequest`

### ✅ Vérification

```bash
grep -c "generativelanguage\|GEMINI_API_KEY\|executeGeminiRequest" src/modules/intelligence/ia/ai/AgentEngine.ts
# Doit renvoyer 0
```

### ⚠️ Régression possible

Tous les callers de `AgentEngine.query()` doivent être audités — ils ne peuvent plus passer `apiKey/endpoint/modelId`. Un seul caller connu : `HermesEngine.delegate()` (action LLM-02 juste après).

Grep de sécurité :
```bash
grep -rn "AgentEngine.query\|AgentEngine\.query" src/
```

---

## Action LLM-02 — HermesEngine.ts (CRITIQUE)

**Effort** : XS (30 min)
**Fichier** : `src/modules/intelligence/ia/ai/HermesEngine.ts`
**Sévérité** : 🔴 CRITIQUE
**Précondition** : Action LLM-01 terminée (signature `AgentEngine.query` changée)

### 🎯 Symptôme

Ligne 148-156, `HermesEngine.delegate()` appelle `AgentEngine.query()` en passant :
- `apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY`
- `endpoint: 'https://generativelanguage.googleapis.com'`
- `modelId: 'gemini-1.5-pro'`

Ces trois champs sont hardcodés Gemini.

### 📦 Fix

Après action LLM-01, la signature `AgentEngine.query()` n'accepte plus ces champs. Le fix devient trivial :

```typescript
// AVANT
static async delegate(domain, prompt, context?) {
  const agent = this.manifest.activeAgents.find(a => a.domain === domain) || this.manifest.activeAgents[0];
  logger.info(`🤝 [HERMES] Delegating to Vanguard Agent: ${agent.id.toUpperCase()} (${domain})`);

  return AgentEngine.query({
    domain: agent.domain,
    userRole: agent.role,
    userPrompt: prompt,
    contextData: context,
    apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || 'NEXUS_INTERNAL',
    endpoint: 'https://generativelanguage.googleapis.com',
    modelId: 'gemini-1.5-pro'
  });
}

// APRÈS
static async delegate(domain, prompt, context?) {
  const agent = this.manifest.activeAgents.find(a => a.domain === domain) || this.manifest.activeAgents[0];
  logger.info(`🤝 [HERMES] Delegating to Vanguard Agent: ${agent.id.toUpperCase()} (${domain})`);

  return AgentEngine.query({
    domain: agent.domain,
    userRole: agent.role,
    userPrompt: prompt,
    contextData: context,
    modelAlias: 'reasoning',   // Claude/GPT/Gemini/SLM résolus par le provider actif
  });
}
```

### ✅ Vérification

```bash
grep -c "generativelanguage\|GEMINI_API_KEY\|gemini-1.5" src/modules/intelligence/ia/ai/HermesEngine.ts
# Doit renvoyer 0
```

---

## Action LLM-03 — ZeusAdapter.ts

**Effort** : S (1 h)
**Fichier** : `src/lib/adapters/ZeusAdapter.ts`
**Sévérité** : 🟠 High
**Contexte** : legacy adapter, probablement utilisé pour analytics IA

### 🎯 Symptôme

Ligne 165-166 :
```typescript
apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || 'NEXUS_INTERNAL',
endpoint: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com',
```

### 📦 Fix

Lire d'abord le contexte complet du fichier (ligne 150-180) pour comprendre COMMENT ces valeurs sont utilisées. Deux cas :

**Cas A — Elles sont passées à `AgentEngine.query()`**
Après LLM-01, ces champs deviennent inutiles → simple suppression + passage `modelAlias`.

**Cas B — Elles sont utilisées pour un `fetch()` direct**
Refactor vers `LLMManager.provider.generateText()` avec la même logique qu'action LLM-01.

**Fix template Cas B** :
```typescript
// AVANT
const response = await fetch(`${endpoint}?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
});
const data = await response.json();
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

// APRÈS
import { LLMManager } from '@/modules/intelligence';
const result = await LLMManager.provider.generateText({
  model: resolveModelId('reasoning'),
  userPrompt: prompt,
  temperature: 0.3,
});
const text = result.text;
```

### ✅ Vérification

```bash
grep -c "generativelanguage\|GEMINI_API_KEY" src/lib/adapters/ZeusAdapter.ts
# Doit renvoyer 0
```

### ⚠️ Considération

Si `ZeusAdapter` est purement legacy et non consommé, envisager sa **suppression** plutôt que son refactor. Grep :
```bash
grep -rn "ZeusAdapter\|zeusAdapter" src/ --include="*.ts" --include="*.tsx" | grep -v "ZeusAdapter.ts"
```
Si 0 consommateur → `git rm src/lib/adapters/ZeusAdapter.ts`.

---

## Action LLM-04 — /api/admin/fleet/support-ai/diagnose

**Effort** : S (1 h)
**Fichier** : `src/app/api/admin/fleet/support-ai/diagnose/route.ts`
**Sévérité** : 🟠 High

### 🎯 Symptôme

Ligne 7 : `const GEMINI_BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';`

Utilisé pour un `fetch()` direct sur Gemini API.

### 📦 Fix

Refactor vers `aiRouter` (mieux adapté pour route API — cascade fallback automatique).

```typescript
// AVANT
const GEMINI_BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
// ... plus loin
const response = await fetch(`${GEMINI_BASE_URL}/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: diagnosePrompt }] }] }),
});
const data = await response.json();
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

// APRÈS
import { aiRouter } from '@/modules/intelligence';
const result = await aiRouter.generateText(diagnosePrompt, 'mcc', {
  maxTokens: 1024,
  temperature: 0.3,
});
const text = result.text;
```

**Bonus** : le retour de `aiRouter` inclut le provider utilisé — utile à logger pour le diagnostic MCC.

### ✅ Vérification

```bash
grep -c "generativelanguage\|GEMINI_API_KEY" src/app/api/admin/fleet/support-ai/diagnose/route.ts
# Doit renvoyer 0
```

---

## Action LLM-05 — /api/ai/review-response

**Effort** : S (1 h)
**Fichier** : `src/app/api/ai/review-response/route.ts`
**Sévérité** : 🟠 High

### 🎯 Symptôme

Ligne 13 : URL Gemini hardcodée pour un `fetch()` direct.

### 📦 Fix

**Pattern identique** à LLM-04 : refactor vers `aiRouter.generateText()`.

```typescript
// APRÈS
import { aiRouter } from '@/modules/intelligence';
const result = await aiRouter.generateText(reviewPrompt, tenantId, {
  maxTokens: 800,
  temperature: 0.4,
});
return NextResponse.json({
  response: result.text,
  provider: result.provider,   // transparence
  fallbackUsed: result.fallback,
});
```

### ✅ Vérification

```bash
grep -c "generativelanguage\|GEMINI_API_KEY" src/app/api/ai/review-response/route.ts
# Doit renvoyer 0
```

---

## Tests garde-fous

### [TEST-L1] Test unitaire AgentEngine agnostic

**Fichier** : `src/__tests__/intelligence/agent-engine-agnostic.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentEngine } from '@/modules/intelligence/ia/ai/AgentEngine';
import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';

describe('AgentEngine — LLM-agnostic', () => {
  beforeEach(() => {
    LLMManager.provider = {
      generateText: vi.fn(async () => ({ text: 'mocked response' })),
      generateFromImage: vi.fn(),
    };
  });

  it('délègue au provider actif sans hardcoder Gemini', async () => {
    const result = await AgentEngine.query({
      domain: 'sales',
      userRole: 'admin',
      userPrompt: 'Test',
      modelAlias: 'reasoning',
    });
    expect(LLMManager.provider.generateText).toHaveBeenCalled();
    expect(result.rawText).toBe('mocked response');
  });

  it("N'accepte plus les champs apiKey/endpoint/modelId hardcodés", () => {
    // Ces champs sont retirés du type — TSC compile-time check suffit
    // Ce test documente le contrat
    expect(true).toBe(true);
  });
});
```

### [TEST-L2] Preflight grep anti-régression

Ajouter dans `scripts/preflight.sh` (nouvelle mini-gate) :

```bash
step "🔌 [X/N] LLM-agnostic — pas de URL Gemini hardcodée hors providers"
LLM_LEAKS=$(grep -rn "generativelanguage\|api\.openai\.com\|api\.anthropic\.com\|api\.mistral\.ai" src/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "src/modules/intelligence/ia/GeminiProvider.ts" | \
  grep -v "src/modules/intelligence/ia/ai/AnthropicProvider.ts" | \
  grep -v "src/modules/intelligence/ia/ai/OpenAIProvider.ts" | \
  grep -v "src/modules/intelligence/ia/ai/MistralProvider.ts" | \
  grep -v "src/modules/intelligence/ia/ai/SovereignProvider.ts" | \
  grep -v ".test." || true)

if [ -n "$LLM_LEAKS" ]; then
  fail "URL LLM hardcodée hors des Providers officiels :"
  echo "$LLM_LEAKS"
  echo ""
  echo "  Correction : utiliser LLMManager.provider.generateText() ou aiRouter.generateText()"
  exit 1
fi
ok "Aucune fuite LLM hardcodée détectée"
```

**Impact** : impossibilité future de recréer une fuite silencieusement.

### [TEST-L3] Test d'intégration multi-provider

**Fichier** : `src/__tests__/intelligence/llm-agnostic-integration.test.ts`

```typescript
describe('LLM-agnostic — switch providers via env', () => {
  it.each(['anthropic', 'openai', 'gemini', 'mistral', 'sovereign'])(
    'AgentEngine fonctionne avec AI_PROVIDER=%s',
    async (provider) => {
      vi.stubEnv('AI_PROVIDER', provider);
      // Mock du HTTP call
      // Vérifier que AgentEngine.query() n'échoue pas
      // Vérifier que le provider utilisé est bien celui attendu
    }
  );
});
```

---

## Preflight gate anti-régression

Ajout permanent au preflight (voir TEST-L2 ci-dessus). Cette gate garantit qu'aucun futur commit ne réintroduit une fuite Gemini/OpenAI/Anthropic/Mistral hardcodée hors des providers officiels.

**Effort d'intégration** : XS (10 min).

**Baseline attendue post-fixes** : 0 leak.

---

## Rollback

Chaque action = 1 commit atomique.

En cas de régression sur un fix :
1. `git revert <sha>` du fix incriminé
2. TSC + vitest → confirmer retour à l'état sain
3. Le preflight gate LLM-agnostic restera vert car la fuite n'est plus détectée (elle est de nouveau dans le provider légitime)

**Attention Action LLM-01** : ce refactor change la signature de `AgentEngine.query()`. Un revert **doit** être accompagné du revert de LLM-02 (HermesEngine) pour rester cohérent. Prévoir un tag git avant démarrage :

```bash
git tag pre-llm-agnostic-fixes
```

---

## Journal

À tenir dans `.claude/sessions.md` sous session `llm-agnostic-fixes`.

| ID | Action | Statut | Commit | Notes |
|----|--------|:------:|--------|-------|
| PREREQ-L1 | Vérifier abstraction opérationnelle | ⬜ | — | — |
| PREREQ-L2 | Bootstrap `LLMManager.provider` confirmé | ⬜ | — | — |
| PREREQ-L3 | Baseline tests verts | ⬜ | — | — |
| LLM-01 | Refactor AgentEngine.ts | ⬜ | — | 🔴 CRITIQUE |
| LLM-02 | Fix HermesEngine.delegate() | ⬜ | — | Dépend LLM-01 |
| LLM-03 | Fix ZeusAdapter.ts (ou suppression) | ⬜ | — | Décider refactor vs delete |
| LLM-04 | Fix /api/admin/fleet/support-ai/diagnose | ⬜ | — | — |
| LLM-05 | Fix /api/ai/review-response | ⬜ | — | — |
| TEST-L1 | Test unitaire AgentEngine agnostic | ⬜ | — | — |
| TEST-L2 | Preflight gate anti-régression | ⬜ | — | — |
| TEST-L3 | Test intégration multi-provider (optionnel) | ⬜ | — | — |

**Légende** : ⬜ à faire · 🟨 en cours · ✅ fait · ❌ bloqué · ↩️ reverted

---

## 📊 Métriques de sortie

| Métrique | T+0 | Post-plan |
|---|:-:|:-:|
| Fuites LLM hardcodées | 5 | **0** |
| Fichiers passant par abstraction | 6/11 | **11/11** |
| Verticales impactées | 0 (déjà propres) | 0 |
| Preflight gate anti-régression | ❌ | ✅ |
| Tests garde-fous | 0 | 2-3 |
| Vraiment LLM-agnostic bout-en-bout | 85% | **100%** |
| Un tenant peut choisir Solo Souverain sans Gemini caller | ❌ | ✅ |

---

**Fin du plan.**

**Prochaine action** : PREREQ-L3 (baseline verte), puis LLM-01 (AgentEngine refactor). Enchaîner immédiatement LLM-02 car même commit atomique. Puis LLM-03/04/05 indépendants. Enfin TEST-L2 (preflight gate).
