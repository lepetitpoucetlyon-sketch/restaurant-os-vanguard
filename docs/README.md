# 📚 Documentation — RESTAURANT-OS-CORE

> Rangée le **2026-08-12** (HEAD `759aba211`). Point d'entrée de toute la doc du projet.
> Le code fait foi ; ces documents sont le **contexte** (plans, specs, audits, historique).
> Les dates ci-dessous = **dernier commit** touchant le fichier (chronologie de fraîcheur).

## 🧭 Par où commencer

| Je veux… | Aller à |
|---|---|
| Comprendre l'archi (piliers, Nexus, NF525) | [`../ARCHITECTURE.md`](../ARCHITECTURE.md) · [`../CLAUDE.md`](../CLAUDE.md) |
| Le **plan maître** en cours | [`plans/PLAN_COMPLET.md`](plans/PLAN_COMPLET.md) *(v4.4, 2026-08-12)* |
| Ce qui **reste à faire** | [`plans/PLAN_RESTE_A_FAIRE.md`](plans/PLAN_RESTE_A_FAIRE.md) (cohérence/sécu) · [`plans/RESTE_BUS_EMETTEURS.md`](plans/RESTE_BUS_EMETTEURS.md) (bus R1-R13) · [`plans/PLAN_INFRA_PROD.md`](plans/PLAN_INFRA_PROD.md) (infra prod) |
| Contribuer / conventions | [`guides/CONTRIBUTING.md`](guides/CONTRIBUTING.md) · [`guides/CODING_STANDARDS.md`](guides/CODING_STANDARDS.md) |
| L'historique versionné | [`../CHANGELOG.md`](../CHANGELOG.md) |
| La coordination multi-sessions | [`../.claude/sessions.md`](../.claude/sessions.md) |

## 🗂️ Organisation

```
docs/
├── README.md          ← ce sommaire
├── architecture/      Structure technique de référence
├── plans/             Plans actifs  ├── archive/  Plans soldés / versions antérieures
├── specs/             Spécifications (verticales, ServiceTicket, migrations, profils UX)
├── audits/            Rapports d'audit (archi, sécu, typage, promesses, RGPD/NF525)
├── atlas/             Cartographie module par module (finance, ops, HR, HACCP…)
├── handoffs/          Passations de session & journaux (éphémère)
├── guides/            Guides pratiques (standards, composants, runbooks, tutoriels)
├── reference/         Lexiques, tickets, checklists
├── BIBLE_TECHNIQUE.html   Bible technique complète (HTML)
└── nexus-events.html      Catalogue d'événements NexusEventBus (HTML)
```

---

## 📅 Inventaire daté

### `plans/` — plans actifs *(du + récent au + ancien)*
| Date | Document |
|------|----------|
| 2026-08-12 | [PLAN_COMPLET.md](plans/PLAN_COMPLET.md) — **plan maître (v4.4)** |
| 2026-08-12 | [PLAN_RAPATRIEMENT_SHARED.md](plans/PLAN_RAPATRIEMENT_SHARED.md) · [PLAN_RAPATRIEMENT_SHARED_ETAPE8.md](plans/PLAN_RAPATRIEMENT_SHARED_ETAPE8.md) |
| 2026-08-11 | [PLAN_MAITRE_CORRIGE.md](plans/PLAN_MAITRE_CORRIGE.md) · [PLAN_INFRA_PROD.md](plans/PLAN_INFRA_PROD.md) *(ex-`afaire.md`)* |
| 2026-08-10 | [PLAN_RESTE_A_FAIRE.md](plans/PLAN_RESTE_A_FAIRE.md) *(cohérence/sécu)* · [PLAN_REMEDIATION_AUDIT_2026-08-10.md](plans/PLAN_REMEDIATION_AUDIT_2026-08-10.md) |
| 2026-08-09 | [RESTE_BUS_EMETTEURS.md](plans/RESTE_BUS_EMETTEURS.md) *(ex-racine `PLAN_RESTE_A_FAIRE`, bus R1-R13)* · [PLAN_BUS_EVENEMENTIEL.md](plans/PLAN_BUS_EVENEMENTIEL.md) · [PLAN_IMPLEMENTATION_UI.md](plans/PLAN_IMPLEMENTATION_UI.md) |
| 2026-08-08 | [PLAN_QUALITY_DEBT.md](plans/PLAN_QUALITY_DEBT.md) |
| 2026-08-07 | [DESIGN_SYSTEM_PLAN.md](plans/DESIGN_SYSTEM_PLAN.md) · [VERTICAL_UI_FLEXIBILITY_PLAN.md](plans/VERTICAL_UI_FLEXIBILITY_PLAN.md) · [PLAN_CUSTOMER_SERVICE.md](plans/PLAN_CUSTOMER_SERVICE.md) · [PLAN_DETTE_TECHNIQUE.md](plans/PLAN_DETTE_TECHNIQUE.md) · [PLAN_TYPAGE_UNKNOWN.md](plans/PLAN_TYPAGE_UNKNOWN.md) · [PLAN_VERTICAL_RESTAURANT_FIXES.md](plans/PLAN_VERTICAL_RESTAURANT_FIXES.md) · [versionbase.md](plans/versionbase.md) |
| 2026-08-06 | [PLAN_AUDIT_FIXES.md](plans/PLAN_AUDIT_FIXES.md) · [PLAN_CLEANUP_FINAL.md](plans/PLAN_CLEANUP_FINAL.md) · [PLAN_ONBOARDING_B2B.md](plans/PLAN_ONBOARDING_B2B.md) |
| 2026-08-04 | [ROADMAP.md](plans/ROADMAP.md) |
| 2026-08-02 | [BUILD_PLAN.md](plans/BUILD_PLAN.md) · [VALIDATION_PLAN.md](plans/VALIDATION_PLAN.md) |
| 2026-08-01 | [PLAN_PRIORITES.md](plans/PLAN_PRIORITES.md) |
| 2026-07-30 | [SAGA_PLAN.md](plans/SAGA_PLAN.md) |
| 2026-07-28 | [CONNECTORS_PLAN.md](plans/CONNECTORS_PLAN.md) |
| 2026-07-23 | [PLAN-IMPLEMENTATION.md](plans/PLAN-IMPLEMENTATION.md) |

### `plans/archive/` — soldés / versions antérieures
| Date | Document |
|------|----------|
| 2026-08-10 | [PLAN_RESTE_A_FAIRE_V2.md](plans/archive/PLAN_RESTE_A_FAIRE_V2.md) · [PLAN_RESTE_A_FAIRE_V3.md](plans/archive/PLAN_RESTE_A_FAIRE_V3.md) |
| 2026-07-31 | [plan-audit-restant.md](plans/archive/plan-audit-restant.md) · [plan-partielles.md](plans/archive/plan-partielles.md) · [plan-rompues.md](plans/archive/plan-rompues.md) |

### `specs/` — spécifications
| Date | Document |
|------|----------|
| 2026-08-12 | [VERTICAL_GARAGE.md](specs/VERTICAL_GARAGE.md) |
| 2026-08-11 | [MAPPING_BASE_VERTICALES.md](specs/MAPPING_BASE_VERTICALES.md) · [MAPPING_EVENEMENTS_VERTICALES.md](specs/MAPPING_EVENEMENTS_VERTICALES.md) · [SPEC_SERVICE_TICKET.md](specs/SPEC_SERVICE_TICKET.md) |
| 2026-08-10 | [SPECS_PROFILS_UX.md](specs/SPECS_PROFILS_UX.md) *(ex-`A_FAIRE.md`)* |
| 2026-07-18 | [mapping.md](specs/mapping.md) |
| 2026-07-02 | [MIGRATION-microunits.md](specs/MIGRATION-microunits.md) |

### `architecture/` — référence technique
| Date | Document |
|------|----------|
| 2026-07-30 | [NEXUS_EVENT_BUS_BIBLE.md](architecture/NEXUS_EVENT_BUS_BIBLE.md) |
| 2026-04-30 | [PROJECT_MAP.md](architecture/PROJECT_MAP.md) |
| 2026-04-20 | [ARCHITECTURE_FEATURES.md](architecture/ARCHITECTURE_FEATURES.md) · [ARCHITECTURE_TOOLING.md](architecture/ARCHITECTURE_TOOLING.md) |

### `audits/` — rapports d'audit
| Date | Document |
|------|----------|
| 2026-08-08 | [AUDIT_TYPAGE_COMPLET.md](audits/AUDIT_TYPAGE_COMPLET.md) |
| 2026-08-07 | [AUDIT_UI.md](audits/AUDIT_UI.md) · [AUDIT_VERTICAL_RESTAURANT.md](audits/AUDIT_VERTICAL_RESTAURANT.md) · [audit-structure.md](audits/audit-structure.md) |
| 2026-08-01 | [AUDIT_PROMESSES_RESTAURANT_OS_MCC.md](audits/AUDIT_PROMESSES_RESTAURANT_OS_MCC.md) |
| 2026-07-31 | [AUDIT_GLOBAL_PROMESSE_OS.md](audits/AUDIT_GLOBAL_PROMESSE_OS.md) · [audit_promesse_plateforme.md](audits/audit_promesse_plateforme.md) |
| 2026-07-26 | [AUDIT_360_GRADE_X.md](audits/AUDIT_360_GRADE_X.md) |
| 2026-07-23 | [dette-munits.md](audits/dette-munits.md) · [rgpd-nf525-audit.md](audits/rgpd-nf525-audit.md) |
| 2026-04-22 | [industrial-titan-2026-04-22.md](audits/industrial-titan-2026-04-22.md) |

### `handoffs/` — passations & journaux
| Date | Document |
|------|----------|
| 2026-08-12 | [HANDOFF_2026-08-12.md](handoffs/HANDOFF_2026-08-12.md) · [HANDOFF_2026-08-11_NUIT.md](handoffs/HANDOFF_2026-08-11_NUIT.md) · [HANDOFF_2026-08-11_SOIR.md](handoffs/HANDOFF_2026-08-11_SOIR.md) · [HANDOFF_SESSION_2026-08-11.md](handoffs/HANDOFF_SESSION_2026-08-11.md) · [JOURNAL_AGENT.md](handoffs/JOURNAL_AGENT.md) |
| 2026-08-10 | [PLAN_PROGRESS.md](handoffs/PLAN_PROGRESS.md) |
| 2026-07-23 | [HANDOFF.md](handoffs/HANDOFF.md) |
| 2026-06-03 | [HANDOVER.md](handoffs/HANDOVER.md) |

### `guides/` — guides pratiques
| Date | Document |
|------|----------|
| 2026-08-07 | [landingpage.md](guides/landingpage.md) |
| 2026-07-31 | [tutoriel-livraison.md](guides/tutoriel-livraison.md) |
| 2026-07-30 | [WALKTHROUGH.md](guides/WALKTHROUGH.md) |
| 2026-05-05 | [branding-provider-api.md](guides/branding-provider-api.md) |
| 2026-04-20 | [CODING_STANDARDS.md](guides/CODING_STANDARDS.md) · [CONTRIBUTING.md](guides/CONTRIBUTING.md) · [COMPONENTS.md](guides/COMPONENTS.md) · [COMPONENT_LIBRARY.md](guides/COMPONENT_LIBRARY.md) · [HOOKS_AND_UTILITIES.md](guides/HOOKS_AND_UTILITIES.md) · [CLIENT_INSTANCE_RUNBOOK.md](guides/CLIENT_INSTANCE_RUNBOOK.md) · [MULTI_INSTANCE_MAINTENANCE.md](guides/MULTI_INSTANCE_MAINTENANCE.md) · [WHITE_LABEL_SETUP.md](guides/WHITE_LABEL_SETUP.md) |

### `reference/` — lexiques, tickets, checklists
| Date | Document |
|------|----------|
| 2026-08-01 | [testpreflight.md](reference/testpreflight.md) |
| 2026-07-28 | [MCC_VALIDATION_CHECKLIST.md](reference/MCC_VALIDATION_CHECKLIST.md) |
| 2026-07-27 | [LEXICON.md](reference/LEXICON.md) |
| 2026-07-23 | [TICKETS.md](reference/TICKETS.md) |
| 2026-05-08 | [lexique.md](reference/lexique.md) |

### `atlas/` — cartographie module par module
| Date | Document |
|------|----------|
| 2026-05-02 | [ACYCLIC_BARREL_REPORT.md](atlas/ACYCLIC_BARREL_REPORT.md) |
| 2026-04-25 | [CORE_ENGINE](atlas/CORE_ENGINE.md) · [FINANCE_MODULE](atlas/FINANCE_MODULE.md) · [OPS_MODULE](atlas/OPS_MODULE.md) · [HR_MODULE](atlas/HR_MODULE.md) · [HACCP_MODULE](atlas/HACCP_MODULE.md) · [ATOMIC_MAP](atlas/ATOMIC_MAP.md) · [SECURITY_GUARD](atlas/SECURITY_GUARD.md) · [SYNC_PROTOCOL](atlas/SYNC_PROTOCOL.md) · [TENANT_REGISTRY](atlas/TENANT_REGISTRY.md) · [INSTANCE_CONFIG_PATTERN](atlas/INSTANCE_CONFIG_PATTERN.md) · [GLOSSARY](atlas/GLOSSARY.md) · [MD_DIRECTORY](atlas/MD_DIRECTORY.md) · [ROADMAP_RECONSTRUCTION](atlas/ROADMAP_RECONSTRUCTION.md) · [SENIOR_ARCHITECT_REPORT](atlas/SENIOR_ARCHITECT_REPORT.md) |

---

> **Note rangement (2026-08-12)** : 42 `.md` déplacés de la racine du repo vers `docs/` (via `git mv`, historique préservé). Racine réduite à 6 canoniques (`README`, `LICENSE`, `CLAUDE`, `AGENTS`, `ARCHITECTURE`, `CHANGELOG`). Doublons supprimés : `docs/ARCHITECTURE.md` (stub obsolète) et `docs/CHANGELOG.md` (historique janvier fusionné dans le [CHANGELOG racine](../CHANGELOG.md)). Renommages de désambiguïsation : `PLAN_RESTE_A_FAIRE.md`(racine)→`plans/RESTE_BUS_EMETTEURS.md`, `A_FAIRE.md`→`specs/SPECS_PROFILS_UX.md`, `afaire.md`→`plans/PLAN_INFRA_PROD.md`.
