# 🗺️ Carte d'architecture — RESTAURANT-OS-CORE

> **FICHIER GÉNÉRÉ** par `scripts/generate-architecture-map.mjs` — ne pas éditer à la main.
> Régénère : `node scripts/generate-architecture-map.mjs`. Version machine : `docs/architecture-map.json`.
> Une carte n'aide que si elle est **vraie** → elle est dérivée du code, pas écrite à la main.

## Totaux
- Fichiers `.ts/.tsx` : **3587** · LOC : **332 500**
- Pages : **84** · Routes API : **210**

## Couches
| Couche | Fichiers |
|---|---:|
| `src/modules/` | 1594 |
| `src/shared/` | 702 |
| `src/app/` | 443 |
| `src/verticals/` | 245 |
| `src/lib/` | 234 |
| `src/infrastructure/` | 46 |
| `src/kernel/` | 25 |
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
| `shared/eventBus/` | 225 |
| `shared/components/` | 185 |
| `shared/nexus/` | 128 |
| `shared/hooks/` | 49 |
| `shared/providers/` | 28 |
| `shared/seeds/` | 15 |
| `shared/connector-manifest/` | 12 |
| `shared/contexts/` | 10 |
| `shared/plugins/` | 9 |
| `shared/schemas/` | 7 |
| `shared/utils/` | 7 |
| `shared/widgets/` | 4 |
| `shared/custom-fields/` | 3 |
| `shared/layout-builder/` | 3 |
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
| `commerce` | 355 | ✅ |
| `ops` | 311 | ✅ |
| `finance` | 222 | ✅ |
| `compliance` | 183 | ✅ |
| `intelligence` | 161 | ✅ |
| `logistics` | 147 | ✅ |
| `human` | 135 | ✅ |
| `facility` | 73 | ✅ |
| `system` ⚠️ | 6 | ✅ |

> ⚠️ **Hors taxonomie des 8 piliers** : `system` — à formaliser ou rapatrier.

## Verticales (`src/verticals/`)
`_shared` · `bakery` · `clinic` · `coworking` · `custom` · `florist` · `garage` · `gym` · `hotel` · `restaurant` · `retail` · `salon` · `veterinary`

## Top 15 gros fichiers (candidats god-file)
| Fichier | LOC |
|---|---:|
| `src/__tests__/handlers/saga-handlers.test.ts` | 731 |
| `src/shared/components/ui/PageShell.tsx` | 729 |
| `src/__tests__/anglemorts/anglemorts-batch2.test.ts` | 668 |
| `src/__tests__/anglemorts/anglemorts-batch6.test.ts` | 648 |
| `src/shared/components/settings/BrandingPanel.tsx` | 615 |
| `src/__tests__/anglemorts/anglemorts-batch4.test.ts` | 612 |
| `src/__tests__/helpers/saga.ops2.test.ts` | 608 |
| `src/__tests__/anglemorts/anglemorts-batch3.test.ts` | 600 |
| `src/i18n/locales/en.ts` | 600 |
| `src/__tests__/helpers/saga.intelligence.test.ts` | 597 |
| `src/__tests__/anglemorts/anglemorts-batch5.test.ts` | 595 |
| `src/i18n/locales/fr.ts` | 581 |
| `src/__tests__/helpers/saga.finance2.test.ts` | 566 |
| `src/__tests__/anglemorts/anglemorts-batch7.test.ts` | 531 |
| `src/config/navConfig.ts` | 527 |
