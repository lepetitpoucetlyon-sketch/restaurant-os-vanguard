# 🗺️ Carte d'architecture — RESTAURANT-OS-CORE

> **FICHIER GÉNÉRÉ** par `scripts/generate-architecture-map.mjs` — ne pas éditer à la main.
> Régénère : `node scripts/generate-architecture-map.mjs`. Version machine : `docs/architecture-map.json`.
> Une carte n'aide que si elle est **vraie** → elle est dérivée du code, pas écrite à la main.

## Totaux
- Fichiers `.ts/.tsx` : **3399** · LOC : **306 606**
- Pages : **77** · Routes API : **208**

## Couches
| Couche | Fichiers |
|---|---:|
| `src/modules/` | 1582 |
| `src/shared/` | 659 |
| `src/app/` | 419 |
| `src/lib/` | 223 |
| `src/verticals/` | 186 |
| `src/infrastructure/` | 46 |
| `src/store/` | 24 |
| `src/kernel/` | 20 |
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
| `shared/eventBus/` | 224 |
| `shared/components/` | 163 |
| `shared/nexus/` | 127 |
| `shared/hooks/` | 44 |
| `shared/providers/` | 28 |
| `shared/seeds/` | 14 |
| `shared/connector-manifest/` | 11 |
| `shared/contexts/` | 10 |
| `shared/plugins/` | 7 |
| `shared/schemas/` | 7 |
| `shared/utils/` | 7 |
| `shared/services/` | 3 |
| `shared/types/` | 3 |
| `shared/atoms/` | 2 |
| `shared/store/` | 2 |
| `shared/constants/` | 1 |
| `shared/domain/` | 1 |
| `shared/security/` | 1 |
| `shared/validation/` | 1 |

## Piliers métier (`src/modules/`)
| Pilier | Fichiers | Barrel `index.ts` |
|---|---:|:---:|
| `commerce` | 352 | ✅ |
| `ops` | 292 | ✅ |
| `finance` | 223 | ✅ |
| `compliance` | 179 | ✅ |
| `intelligence` | 161 | ✅ |
| `logistics` | 134 | ✅ |
| `human` | 132 | ✅ |
| `facility` | 71 | ✅ |
| `stock` ⚠️ | 13 | ❌ MANQUANT |
| `production` ⚠️ | 12 | ❌ MANQUANT |
| `fleet` ⚠️ | 6 | ✅ |
| `system` ⚠️ | 6 | ✅ |

> ⚠️ **Hors taxonomie des 8 piliers** : `fleet`, `production`, `stock`, `system` — à formaliser ou rapatrier.

## Verticales (`src/verticals/`)
`_shared` · `bakery` · `clinic` · `coworking` · `custom` · `florist` · `garage` · `gym` · `hotel` · `restaurant` · `retail` · `salon` · `veterinary`

## Top 15 gros fichiers (candidats god-file)
| Fichier | LOC |
|---|---:|
| `src/__tests__/handlers/saga-handlers.test.ts` | 731 |
| `src/__tests__/anglemorts/anglemorts-batch2.test.ts` | 668 |
| `src/__tests__/anglemorts/anglemorts-batch6.test.ts` | 648 |
| `src/__tests__/anglemorts/anglemorts-batch4.test.ts` | 612 |
| `src/__tests__/helpers/saga.ops2.test.ts` | 608 |
| `src/__tests__/anglemorts/anglemorts-batch3.test.ts` | 600 |
| `src/__tests__/helpers/saga.intelligence.test.ts` | 597 |
| `src/__tests__/anglemorts/anglemorts-batch5.test.ts` | 595 |
| `src/__tests__/helpers/saga.finance2.test.ts` | 566 |
| `src/i18n/locales/en.ts` | 566 |
| `src/i18n/locales/fr.ts` | 545 |
| `src/__tests__/anglemorts/anglemorts-batch7.test.ts` | 493 |
| `src/shared/eventBus/events/ops.events.ts` | 488 |
| `src/modules/commerce/acquisition/onboarding/wizard/OnboardingWizard.tsx` | 477 |
| `src/__tests__/commerce/anglemorts-m101-m110.test.ts` | 465 |
