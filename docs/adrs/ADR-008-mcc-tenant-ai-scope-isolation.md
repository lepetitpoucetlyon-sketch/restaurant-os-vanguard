# ADR-008 : Isolation des scopes IA MCC ↔ Tenant

**Date** : 2026-08-20
**Statut** : Accepté
**Décideur** : Architecte principal + Patron

## Contexte

Restaurant OS utilise un singleton global `LLMManager` pour TOUS les appels LLM,
qu'ils proviennent du MCC (support, stratégie, workshop) ou des tenants (POS,
OCR, assistant). Cette architecture pose des problèmes critiques :

1. **Sécurité** : une fuite de clé API tenant compromet aussi les analyses MCC.
2. **Compliance** : impossible de prouver que les données d'un tenant HDS ne
   transitent pas par le même provider que les données MCC.
3. **Audit** : impossible de tracer le coût LLM par scope (MCC vs tenant).
4. **Scalabilité** : impossible de configurer des providers différents par scope
   ou par tenant.
5. **Vente enterprise** : tout deal enterprise/HDS est bloqué sans cette isolation.

## Décision

Séparer les appels IA en **deux registres isolés** :

- `MCCAIRegistry` — scope MCC, configuré via `MCC_LLM_*` env vars.
- `TenantAIRegistry.forTenant(id)` — scope tenant, configuré via
  `tenantConfig.aiSettings` par tenant.

Un `AIScopeGuard` enforçe la barrière d'import (R1).
Un `PromptComposer` compose les prompts sans hardcoder de vertical (R2).

## Alternatives rejetées

1. **Namespaced LLMManager** : `LLMManager.mcc.provider` / `LLMManager.tenant(id).provider`.
   Rejeté : trop fragile, le singleton reste unique et les scopes ne sont pas
   réellement isolés au niveau mémoire.

2. **Microservices séparés** : MCC AI et Tenant AI dans des services distincts.
   Rejeté : overhead opérationnel trop élevé pour la phase actuelle.

3. **Feature flags** : `if (scope === 'mcc') { ... }` dans le code existant.
   Rejeté : impossible à auditer, accumule la dette technique.

## Conséquences

### Positives
- Isolation cryptographique des clés API par scope.
- Télémétrie séparée MCC vs tenant.
- Configuration IA par tenant (mode cloud/souverain/mix).
- Ajout d'une vertical = 1 fichier blueprint, 0 modification kernel.
- CI bloque au premier commit qui viole R1-R10.

### Négatives
- Migration de ~23 fichiers callers (phased en B+C).
- Période de transition avec `LLMManager` legacy maintenu.
- Légère complexité supplémentaire pour les cas cross-scope (CrossScopeAuthority).

## Enforcement

10 règles (R1→R10) enforçables par CI :
- Tests d'isolation dans `src/__tests__/kernel/ai/`
- Script CI `scripts/verify-ai-isolation.sh`
- Grep automatiques dans le pipeline

Voir `implementation_plan.md` pour le détail de chaque règle.
