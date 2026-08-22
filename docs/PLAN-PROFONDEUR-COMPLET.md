# 🏁 Plan complet — Finir la PROFONDEUR (RESTAURANT-OS-CORE)

*Synthèse de l'audit 2026-08-22. Objectif : combler le dernier kilomètre — la surface est large et fonctionnelle, mais l'audit a montré un écart récurrent : **fini en apparence, incomplet en profondeur** (coverage-theater). Ce plan boucle chaque chaîne.*

## Règle d'or (non négociable — cf. `AGENTS.md`)
> Chaque phase se termine par un **`npm run preflight` vert en sortie brute**. Jamais `--no-verify`, jamais desserrer une gate (exemption eslint, ratchet+, `@ts-ignore`, skip test, éditer un tableau au vert). On corrige le CODE. Le ratchet ne fait que descendre.

Le **système de vérité est armé** (hooks `.githooks`, CI `.github`+`.gitlab`, `verify-gate-integrity.mjs`, `AGENTS.md`) → il *empêchera* de refaire du théâtre. Chaque phase ci-dessous shippe **vraiment** verte.

---

## Phase 0 — Assainissement structurel *(EN COURS — Antigravity)*
| Item | État live | Cible |
|---|---|---|
| Barrels app-pages | 43 restantes | 0 (`Barrel Contract`=0 sans exemption) |
| Cycles | ~32 (était 378) | ≤ ratchet (80, puis descendre) |
| inter-module `lib/` | 175 | → voir **Phase 3** (décision archi) |

**DoD** : preflight passe l'étape 3 (barrel) + étape 5 (cycles). **Effort** : ~1-3 h (en cours).

---

## Phase 1 — Profondeur MCC (boucler le coverage-theater)
*Preuve : 11 events `fleet.*`/`mcc.*` orphelins (emit=11, on=0). Les services calculent → émettent dans le vide → rien n'est persisté.*

| # | Tâche | Fichiers |
|---|---|---|
| 1.1 | **Wire les 11 events orphelins** → handlers de persistance | nouveaux `src/shared/eventBus/handlers/` |
| | `fleet.saas_billing_invoiced` → persiste la facture (`tenants/{id}/saasInvoices/{id}`) | `SaaSInvoicePersistHandler.ts` |
| | `fleet.sla_breach_detected` → persiste + déclenche `GlobalAlertEscalationMatrixService` | `SlaBreachHandler.ts` |
| | `fleet.merchant_provisioned`, `fleet.benchmark_computed`, `mcc.*` ×4 → handler OU `EXPECTED_UNCONSUMED_EVENTS` **documenté** (pas d'orphelin silencieux) | catalog + handlers |
| 1.2 | **`SlaMonitoringFleetService`** : remplacer `uptimePct: 99.85/100` en dur par une **agrégation réelle** (fenêtre glissante de samples) | `modules/fleet/services/SlaMonitoringFleetService.ts:47` |
| 1.3 | **`MultiTenantBillingEngineService`** : **persister** la facture (`Nexus.adapter.set`) au lieu de seulement retourner | `modules/fleet/services/MultiTenantBillingEngineService.ts` |
| 1.4 | **Supprimer `MerchantProvisioningService`** (code mort, 0 appelant) OU le rendre thin-wrapper vers `TenantProvisioningService` | `modules/fleet/services/MerchantProvisioningService.ts` |
| 1.5 | **Audit trail** : passer la **vraie IP admin** (headers req), pas `127.0.0.1` en dur | tous les `AuditLogger.logAction` MCC |

**DoD** : `on('fleet.*')` + `on('mcc.*')` ≥ `emit` (0 orphelin non documenté) · facture & SLA réellement écrits en base · 0 métrique en dur. **Effort** : ~1 jour.

---

## Phase 2 — Profondeur des verticales *(le gros morceau)*
*Preuve : `gym`, `coworking`, `florist`, `veterinary` = **4 fichiers déclaratifs chacune** (Vertical + blueprint + index + `adapters/index.ts` **VIDE**) vs `restaurant` = **19 fichiers** (9 adapters concrets + UI + presentation). Les DNA & system-tenants existent pour les 12 ✅, mais la couche adapter/UI des nouvelles est **une coquille**.*

Pour **chacune** des 4 nouvelles verticales, atteindre la parité avec `restaurant` :

| # | Tâche | Modèle de référence |
|---|---|---|
| 2.1 | **Générer les 9 adapters** (Ops, Finance, Compliance, Logistics, Human, Facility, Commerce, Intelligence, Mcc) | `src/verticals/restaurant/adapters/Restaurant*Adapter.ts` |
| 2.2 | **UI skin** (`ui.ts`) + dashboards vertical-spécifiques (`presentation/`) | `restaurant/ui.ts`, `restaurant/presentation/` |
| 2.3 | **`domain/types.ts`** vertical-spécifique | `restaurant/domain/types.ts` |
| 2.4 | *(optionnel)* modules métier propres (`ops/`, `finance/nf525/`…) selon le secteur | `restaurant/ops/`, `finance/nf525/` |

**→ Utiliser le skill `vertical-forge`** (moteur de scaffolding + câblage + certification) plutôt que copier-coller à la main — c'est exactement son job.

### Câblage public (le trou trouvé)
| # | Tâche | Fichier |
|---|---|---|
| 2.5 | Ajouter `demo-gym`, `demo-coworking`, `demo-florist`, `demo-veterinary` dans `DEMO_SUBDOMAIN_MAP` | `src/lib/mcc/SystemTenantRegistry.ts:70` |
| 2.6 | **Typer la map** `Record<PlatformVariant, string>` (au lieu de `Record<string,string>`) → tsc bloquera tout futur oubli, comme la matrice | idem |
| 2.7 | Corriger le commentaire « 24 tenants système » → **36** | idem l.3, l.81 |

**DoD** : chaque nouvelle verticale a ≥9 adapters + UI + subdomain démo joignable + parité structurelle avec `restaurant`. **Effort** : ~2-4 jours (4 verticales × ~15 fichiers).

---

## Phase 3 — Recollage des couches (ADR-015)
*Voir `docs/adrs/ADR-015-loi-des-couches.md` + `PLAN-RECOLLAGE-2026-08-22.md`.*

| # | Tâche | Preuve / cible |
|---|---|---|
| 3.1 | Trancher `src/shared/` (643 f) : `shared/nexus`→`kernel/nexus`, `shared/eventBus`→`orchestration` (assumé), `shared/components`→`design` | move-map extraite de `agent/antigravity-exec` |
| 3.2 | Casser les **175 inter-module** des god-services `lib/` (`pillarSyncRegistry`, `TenantSeeder`, `ProvisioningEngine`, `BrandingService`…) : router via barrel OU restructurer (décision ADR-015 : `lib/` peut-il importer `modules/` ?) | `no-inter-module-imports`=0 |
| 3.3 | Dissoudre `common.events.ts` (1064 L) par pilier (`hr.events`, `compliance.events`…) | pattern déjà existant |

**DoD** : ratchets `inter-module`=0 · cycles descendus · `common.events.ts` supprimé. **Effort** : ~1-2 jours.

---

## Phase 4 — Réconciliation doc + verrouillage final
| # | Tâche |
|---|---|
| 4.1 | Rafraîchir `~/.nexuscoder/domain-facts.yml`, `CLAUDE.md`, `MEMORY` sur les chemins RÉELS (orchestration/kernel-nexus, singleton Nexus, taxonomie 12 piliers) |
| 4.2 | Régénérer `docs/ARCHITECTURE-MAP.md` (auto, via hook) |
| 4.3 | **Verrouiller** : ratchets à 0, `verify-gate-integrity --freeze` bas, retirer les dernières exemptions eslint tolérées |

**DoD** : aucun chemin mort cité dans la doc · `preflight` complet vert. **Effort** : ~½ jour.

---

## Séquencement & effort total

| Phase | Contenu | Effort | Bloquant ? |
|---|---|---|---|
| **0** | Barrels + cycles (Antigravity) | 1-3 h | oui (débloque le reste) |
| **1** | Profondeur MCC (11 events + métriques + code mort) | ~1 j | non |
| **2** | Profondeur 4 verticales (adapters + UI + subdomains) | **2-4 j** | non |
| **3** | Recollage couches (shared→kernel/lib, inter-module) | 1-2 j | non |
| **4** | Doc + verrouillage | ½ j | non |

**Total réaliste : ~1 à 2 semaines** de travail agent + review — mais **phasé** : chaque phase shippe **verte et indépendante**. Ordre conseillé : **0 → 1 → 2 → 3 → 4**, ou 1/2/3 en parallèle si plusieurs sessions (attention aux collisions : une session par périmètre, cf. `.claude/sessions.md`).

## Le principe à ne pas lâcher
> La valeur n'est pas dans le **nombre** de fonctionnalités/verticales, mais dans celles qui sont **vraiment branchées de bout en bout**. Ce plan transforme la largeur en profondeur — et le système de vérité garantit qu'on ne pourra plus mentir sur « c'est fini ».
