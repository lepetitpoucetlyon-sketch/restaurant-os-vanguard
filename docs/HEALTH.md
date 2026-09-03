# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **2026-09-03 00:04 UTC** · commit `ff7ab3267`
> Source : `scripts/health-snapshot.sh` (Zero-Claim Policy)

---

## 1. 🔴 Readiness Production & Environnement

| Variable requise | Statut | Impact opérationnel |
|---|---|---|
| `FISCAL_SIGNING_SECRET` | ✅ Configuré | Scellement NF525 serveur impossible |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 🔴 Bloquant Absent | Auth admin, claims, signup inopérants |
| `STRIPE_SECRET_KEY` | 🟠 Optionnel Absent | Checkout et paiements Stripe KO |
| `STRIPE_WEBHOOK_SECRET` | 🟠 Optionnel Absent | Webhooks Stripe non vérifiés |
| `GEMINI_API_KEY` | ✅ Configuré | Vision IA et OCR dégradés |

---

## 2. 🛡️ Gates de Sécurité Structurelle

| Métrique | Valeur | Statut / Seuil |
|---|---|---|
| Sentrux gate vs baseline | ❌ | Bloquant au push |
| Score qualité | 4071 -> 3570 | |
| Couplage | 0.45 → 0.45 | |
| Cycles import (Sentrux) | 0 → 1 | max = 0 |
| Cycles import (Madge, alias @/ résolus) | 0 | Seuil ratchet = 0 |
| God files | 0 → 2 | max = 0 |
| TypeScript erreurs | 0 | Bloquant au push (0 toléré) |

---

## 3. 🧪 Couverture des Tests & Piliers

| Pilier | Tests colocalisés | État |
|---|---|---|
| `ops` | 13 tests | |
| `finance` | 5 tests | |
| `logistics` | 14 tests | |
| `commerce` | 4 tests | |
| `compliance` | 6 tests | |
| `human` | 6 tests | |
| `intelligence` | 0 tests | *(tests centralisés dans `src/__tests__/`)* |
| `facility` | 0 tests | *(tests centralisés dans `src/__tests__/`)* |
| **Total suite Vitest** | (voir CI) | `npx vitest run` |

---

## 4. 🌍 Couverture i18n & Locales

| Métrique | Mesure réelle |
|---|---|
| Fichiers `.tsx` avec `t()` | **36 / 965** (158 appels) |
| Clés `fr.ts` (référence) | 617 clés |
| Clés `en.ts` | 617 clés |
| Clés `es.ts` / `pt.ts` / `ja.ts` | 617 / 617 / 617 clés (squelettes partiels ~25%) |

---

## 5. 📉 Suivi de Dette Technique

| Indicateur | Mesure | Seuil / Objectif |
|---|---|---|
| Occurrences `*InCents` (code source) | **813** | Ratchet preflight ≤ 818 |
| InCents dans `src/domain/` (schémas canoniques) | **0** | doit rester à 0 |
| Imports profonds (Barrel violations) | **33** | dont 8 documentés dans `docs/BARREL-EXCEPTIONS.md` |
| Verticales déployées | **12** | `PLATFORM_VARIANTS` en déclare 0
? (INV-8) |

---

## 6. 🚨 Exploitation & Sécurité

| Indicateur | Mesure | Seuil / Note |
|---|---|---|
| Routes API sans garde détectée | **40** / 221 | Certaines sont légitimement publiques — cf. `AUDIT-23-AXES` |
| Pages d'erreur (`error.tsx`, `not-found`, `global-error`) | **9** | 0 = écran blanc Next en cas d'exception |
| Attributs `aria-` | 526 sur 965 fichiers `.tsx` | Indicateur d'accessibilité |

---

## 7. 🔌 Construit mais non branché

> Pattern systémique du projet : des briques complètes, exportées par un barrel,
> que **aucun écran ne rend**. Mesuré ici pour éviter l'accumulation silencieuse.

| Brique | Consommateurs `.tsx` |
|---|---|
| `useLexicon()` (lexique par verticale) | 3 |
| `DashboardWidgetGrid` | 0 |
| `CustomFieldRenderer` | 0 |
| `DynamicLayoutRenderer` | 0 |
| `FiscalReceiptSealZone` | 1 |

**Règle :** une brique à 0 consommateur depuis plus d'un mois doit être branchée,
supprimée, ou documentée comme gelée.

---

## 8. 💾 Synchronisation & Sauvegarde

- **Commits locaux en avance sur `origin/main`** : `1` commit(s).

---

## 📚 Références & Conventions

- Conventions & Règles : `CLAUDE.md`
- Lois des Agents : `AGENTS.md`
- Exceptions Barrel : `docs/BARREL-EXCEPTIONS.md`
- Plan Dette Technique : `docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md`
