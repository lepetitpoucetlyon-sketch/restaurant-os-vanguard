# 🗺️ Carte d'architecture — RESTAURANT-OS-CORE

> **FICHIER GÉNÉRÉ** par `scripts/generate-architecture-map.mjs` — ne pas éditer à la main.
> Régénère : `node scripts/generate-architecture-map.mjs`. Version machine : `docs/architecture-map.json`.
> Une carte n'aide que si elle est **vraie** → elle est dérivée du code, pas écrite à la main.

## Totaux
- Fichiers `.ts/.tsx` : **3773** · LOC : **368 578**
- Pages : **87** · Routes API : **221**

## Couches
| Couche | Fichiers |
|---|---:|
| `src/modules/` | 1625 |
| `src/shared/` | 744 |
| `src/app/` | 469 |
| `src/verticals/` | 253 |
| `src/lib/` | 230 |
| `src/infrastructure/` | 42 |
| `src/kernel/` | 40 |
| `src/store/` | 24 |
| `src/config/` | 9 |
| `src/i18n/` | 6 |
| `src/instances/` | 5 |
| `src/domain/` | 2 |

## ⚠️ Chevauchement des cœurs (kernel / lib / shared)
> Un même concept hébergé dans **plusieurs** couches = « où va X ? » indécidable = fuites d'imports garanties.
| Concept | Présent dans |
|---|---|
| `contracts` | `kernel` + `shared` |
| `hooks` | `kernel` + `lib` + `shared` |
| `nexus` | `lib` + `shared` |

## `src/shared/` — détail (couche à trancher)
| Sous-dossier | Fichiers |
|---|---:|
| `shared/eventBus/` | 228 |
| `shared/components/` | 206 |
| `shared/nexus/` | 140 |
| `shared/hooks/` | 52 |
| `shared/providers/` | 31 |
| `shared/seeds/` | 15 |
| `shared/connector-manifest/` | 12 |
| `shared/contexts/` | 9 |
| `shared/plugins/` | 9 |
| `shared/schemas/` | 7 |
| `shared/utils/` | 7 |
| `shared/widgets/` | 4 |
| `shared/custom-fields/` | 3 |
| `shared/layout-builder/` | 3 |
| `shared/services/` | 3 |
| `shared/types/` | 3 |
| `shared/atoms/` | 2 |
| `shared/domain/` | 2 |
| `shared/security/` | 2 |
| `shared/store/` | 2 |
| `shared/constants/` | 1 |
| `shared/validation/` | 1 |

## Piliers métier (`src/modules/`)
| Pilier | Fichiers | Barrel `index.ts` |
|---|---:|:---:|
| `commerce` | 352 | ✅ |
| `ops` | 297 | ✅ |
| `finance` | 247 | ✅ |
| `compliance` | 184 | ✅ |
| `intelligence` | 172 | ✅ |
| `logistics` | 150 | ✅ |
| `human` | 142 | ✅ |
| `facility` | 74 | ✅ |
| `system` ⚠️ | 6 | ✅ |

> ⚠️ **Hors taxonomie des 8 piliers** : `system` — à formaliser ou rapatrier.

## Verticales (`src/verticals/`)
`_shared` · `bakery` · `clinic` · `coworking` · `custom` · `florist` · `garage` · `gym` · `hotel` · `restaurant` · `retail` · `salon` · `veterinary`

## Top 15 gros fichiers (candidats god-file)
| Fichier | LOC |
|---|---:|
| `src/i18n/locales/en.ts` | 955 |
| `src/i18n/locales/es.ts` | 955 |
| `src/i18n/locales/fr.ts` | 955 |
| `src/i18n/locales/ja.ts` | 955 |
| `src/i18n/locales/pt.ts` | 955 |
| `src/shared/components/ui/PageShell.tsx` | 734 |
| `src/__tests__/handlers/saga-handlers.test.ts` | 675 |
| `src/__tests__/architecture/invariants.test.ts` | 631 |
| `src/shared/components/settings/BrandingPanel.tsx` | 617 |
| `src/__tests__/helpers/saga.intelligence.test.ts` | 607 |
| `src/__tests__/helpers/saga.ops2.test.ts` | 586 |
| `src/shared/eventBus/events/ops.events.ts` | 574 |
| `src/__tests__/helpers/saga.finance2.test.ts` | 571 |
| `src/config/navConfig.ts` | 539 |
| `src/app/(admin)/admin/mcc/components/TenantChangelogPanel.tsx` | 503 |
