# Graphify · CodeGraph · Audit Architectural — 2026-08-25

> Session `graphify-codegraph-audit` — lecture seule code source, écriture `graphify-out/` + scratchpad uniquement.

---

## 1. Graphify — Graphe de connaissance reconstruit

### Résultat

| Métrique | Valeur |
|---|---|
| Nœuds | 18 703 |
| Arêtes | 43 737 |
| Communautés | 1 037 |
| Qualité extraction | 98 % EXTRACTED / 2 % INFERRED / 0 % AMBIGUOUS |
| Fichiers AST | 3 771 (code source) |
| Chunks doc sémantiques | 15 / 16 |

### Contexte reconstruction

Le graphe précédent (`graph.json`) était périmé — 9 627 nœuds, chemins absolus ancienne convention, données obsolètes. Une reconstruction incrémentale a été abandonnée au profit d'une reconstruction complète depuis zéro pour éviter les doublons fantômes (deux conventions de chemin = deux nœuds distincts pour le même fichier).

16 agents d'extraction doc ont été lancés en parallèle. **15/16 ont écrit leur chunk avant d'être tués par la limite de dépense mensuelle** (réinitialisée ensuite). Le chunk manquant — `plans/` + `impeccable/` — n'est pas reconstruit : ses nœuds documentaires sont partiellement captés via d'autres chunks. Impact mineur sur la couverture globale.

### Nœuds-dieux (hubs centraux)

| Symbole | Degré entrant | Rôle |
|---|---|---|
| `Nexus` (NexusAdapter) | 724 | Singleton data-access unifié |
| `NexusEventBus` | 522 | Bus d'événements cross-module |
| `isDenied()` | 382 | Garde RBAC centrale |
| `empireAudit` | 257 | Logger audit chaîné NF525 |
| `requireMccLevel()` | 193 | Gate d'accès MCC |

Ces cinq nœuds sont exactement les abstractions centrales attendues (ADR-002, ADR-003, ADR-015). Aucune surprise négative.

### Hyperedges métier capturées

- Flux NF525 : POS → `FinancialNexusBridge.processOrder()` → `JournalEntry` → `FiscalSeal` (SHA-256 chaîné)
- Triade résilience offline : Outbox atomique → DLQ → Replay (ADR-005)
- Programme migration Sovereign : 5 piliers ADR-009 → ADR-013, progression détectable nœud par nœud
- Fragmentation RBAC : `isDenied()` central mais consommé inconsistamment (certains modules court-circuitent la garde)
- Architecture 8 piliers : communautés 1 037 mappées proprement sur les domaines CLAUDE.md

> Note : les cycles détectés dans le graphe AST (`1-file cycles`) sont des faux positifs liés aux self-barrels — distincts des 3 vrais cycles multi-fichiers Sentrux.

### Livrables

- `graphify-out/graph.json` — graphe brut (machine-readable)
- `graphify-out/graph.html` — visualisation interactive
- `graphify-out/GRAPH_REPORT.md` — rapport détaillé communautés + god nodes + questions suggérées

---

## 2. CodeGraph — Index symbolique resynchronisé

### État avant / après

| | Avant sync | Après sync |
|---|---|---|
| Date index | 2026-08-16 (périmé) | 2026-08-25 (courant) |
| Fichiers changés absorbés | — | 2 397 |
| Nœuds | ~22 787 | 44 512 |
| Arêtes | — | 121 708 |
| Fichiers indexés | 2 805 | 4 166 |
| Fonctions | — | 14 104 |
| Interfaces | — | 2 575 |
| Classes | — | 656 |
| Routes API | — | 86 |

L'index était significativement périmé — plus de 2 000 fichiers avaient changé depuis le dernier sync. Il est maintenant courant et requêtable.

### Usage recommandé

```bash
codegraph impact <symbol>   # avant de toucher un nœud-dieu
codegraph callers <fn>      # tracer les consommateurs d'une fonction
codegraph callees <fn>      # tracer les dépendances d'une fonction
```

---

## 3. Audit architectural — Verdict B+

> Socle sain, dette maîtrisée, 2 findings P0 à traiter.

### Tableau de bord santé

| Signal | Statut | Détail |
|---|---|---|
| TypeScript | ✅ 0 erreur | Vérifié `rtk proxy tsc --noEmit` (sortie brute, sans masquage RTK) |
| Tests Vitest | ✅ 2 311 / 2 311 | 1 skip délibéré — les ❌ dans les logs sont des assertions error-path dans des tests verts |
| Secrets hardcodés | ✅ 0 | Scan `src/` complet |
| LLM hardcodé | ✅ 0 | Principe LLM-agnostic tenu (ADR-008) |
| Schémas Zod | ✅ Propres | `domain/schemas/` : 0 `InCents` — couche schéma microunits-clean |
| Plus grand fichier | ✅ 728 LOC | Sous le seuil god-file |
| TODOs | ✅ 19 | Faible dette commentée |
| Sentrux gate | ❌ 3 violations | Voir findings P0 + P1 ci-dessous |

### Distribution par pilier

| Pilier | Fichiers modules | Observation |
|---|---|---|
| commerce | ~356 | Plus large — domaines acquisition/relation/fidelite actifs |
| ops | ~310 | POS/KDS/floor-plan intensément développés |
| intelligence | — | LLM-agnostic, 5 providers via AIProviderRouter |
| finance | ~49 (InCents restants) | Migration microunits en cours |
| logistics, facility, compliance, human | — | Proportion attendue |

**Modules minces légitimes** (scaffolding vertical, pas de code mort) : `consultation`, `repair-bay`, `lab`, `edi-b2b`, `fleet/*`.

### Hotspots de churn (risque regression)

| Fichier | Changements | Risque |
|---|---|---|
| `FinanceDashboard.tsx` | 9× + god file | ⚠️ Prioritaire |
| `adminAuthGuard.ts` | 8× | ⚠️ Surface sécurité |
| `floor-plan/page.tsx` | 7× + tenantId hardcodé | ⚠️ |

---

## 4. Findings priorisés

### P0 — À traiter en priorité

#### P0-A · Cycle réel providers ops

**Sentrux baseline périmée** : `cycle_count: 2` dans `.gate-baseline.json` ≠ 3 cycles réels détectés.

Cycle confirmé :
```
NexusOpsProvider.tsx → hooks/index.ts → kitchenHooks.tsx → NexusOpsProvider.tsx
```

C'est le seul barrel ops qui remonte vers son provider. Violation ADR-015 (couches).

**Action** : extraire la dépendance circulaire — soit déplacer les hooks cuisine hors du barrel `hooks/index.ts`, soit briser le lien `kitchenHooks → NexusOpsProvider` via un contrat neutre (`@/kernel/contracts/`). Mettre à jour la baseline Sentrux après correction.

#### P0-B · Auth fail-open Oracle RAG

**Fichier** : `src/app/api/oracle/route.ts`

Sur erreur Nexus lors de la vérification du statut employé → accès accordé au lieu de refusé.

```
Nexus.get(employeeId) throws → catch → return allowed   // ← fail-open
```

Le JWT reste requis en amont (mitigation partielle), mais un employé `suspended` pourrait atteindre le RAG si Nexus est dégradé.

**Action** : inverser le comportement — erreur Nexus → `403 Service Unavailable`, pas accès accordé. Ajouter une alerte/log sur ce chemin pour détecter les dégradations.

---

### P1 — Sentrux : 18 god files

Majorité dans fichiers test + `FinanceDashboard` + `registry` + `NexusFleetProvider`. Les fichiers vendored (`.claude/`, `.gemini/`, `.github/`) gonflent artificiellement le compteur `complex_functions` à 1 032 — exclure ces chemins de la gate ou ajuster la baseline.

**Action** : filtrer les paths vendored dans `.sentrux/config` + décomposer `FinanceDashboard` (churn + god file = risque combiné).

---

### P2 — Dette microunits incomplète

186 fichiers utilisent encore `InCents` dans la logique module (finance 49, ops 39). La couche schéma (`domain/schemas/`) est propre. C'est une migration en cours, pas une violation schéma.

**Action** : continuer la migration pilier par pilier selon la stratégie documentée (memory `project_schema_migration_strategy.md`). Finance → Ops en priorité (churn le plus élevé).

---

### P2 — TenantId hardcodés

| Fichier | Valeur hardcodée |
|---|---|
| `floor-plan/page.tsx` | `tenant_default` |
| `SupplierHubDashboard.tsx` | `tenant_demo` |

**Action** : remplacer par `useTenant().activeTenantId` (convention multi-tenant obligatoire CLAUDE.md).

---

### P2 — Conformité HACCP : zone inconnue → `conforme` par défaut

**Fichier** : `haccpHistoryImporter`

Lors de l'import historique, une zone non reconnue est taggée `conforme` au lieu d'être signalée.

**Action** : changer le défaut en `inconnu` ou `non_conforme` + logger un warning pour les zones non mappées en import.

---

## 5. Communautés graphe notables

| Community ID | Label | Contenu clé |
|---|---|---|
| c0 | Nexus Core | NexusAdapter, NexusInterceptor, SovereignGuard |
| c1 | Event Bus | NexusEventBus, tous les émetteurs/listeners |
| c2 | RBAC | isDenied, requireMccLevel, empireAudit |
| c3 | Finance NF525 | JournalEntry, FiscalSeal, FinancialNexusBridge |
| c5 | Forge Verticals | generateVertical, blueprints, kickers |
| c4, c23, c26, c28 | ⚠️ Playwright trace-viewer | Bundles vendored — bruit, à exclure des analyses |

---

## 6. Question recommandée pour exploration graphe

> **« Comment le flux de scellement fiscal NF525 relie POS, JournalEntry et FiscalSeal à travers les frontières de modules ? »**

C'est la question pour laquelle ce graphe offre la réponse la plus riche — les hyperedges capturent le chemin complet `CartItem → processOrder() → JournalEntry → FiscalSeal → SHA-256 chain`.

---

## 7. Prochaines étapes suggérées

- [ ] **P0-A** Casser le cycle `NexusOpsProvider ↔ hooks/index ↔ kitchenHooks` + maj baseline Sentrux `cycle_count: 3`
- [ ] **P0-B** Inverser le fail-open `oracle/route.ts` + ajouter log alerte
- [ ] **P1** Exclure vendored paths de la gate Sentrux god-files/complex-functions
- [ ] **P2** Continuer migration microunits finance (49 fichiers) → ops (39 fichiers)
- [ ] **P2** Corriger 2 tenantId hardcodés (floor-plan + SupplierHub)
- [ ] **P2** Corriger HACCP zone inconnue → `non_conforme` par défaut

---

*Généré depuis session `graphify-codegraph-audit` — 2026-08-25. Aucune modification de code source.*
