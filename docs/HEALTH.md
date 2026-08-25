# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **2026-08-25 17:24 UTC** · commit `78f9f38e9`
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
| Sentrux gate vs baseline | ✅ | Bloquant au push |
| Score qualité | 3258 -> 3261 | |
| Couplage | 0.45 → 0.44 | |
| Cycles import (Sentrux) | 2 → 2 | max = 0 |
| Cycles import (Madge, alias @/ résolus) | 0 | Seuil ratchet = 0 |
| God files | 18 → 17 | max = 0 |
| TypeScript erreurs | 0 | Bloquant au push (0 toléré) |

---

## 3. 🧪 Couverture des Tests & Piliers

| Pilier | Tests colocalisés | État |
|---|---|---|
| `ops` | 14 tests | |
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
| Fichiers `.tsx` avec `t()` | **33 / 908** (114 appels) |
| Clés `fr.ts` (référence) | 482 clés |
| Clés `en.ts` | 500 clés |
| Clés `es.ts` / `pt.ts` / `ja.ts` | 127 / 107 / 107 clés (squelettes partiels ~25%) |

---

## 5. 📉 Suivi de Dette Technique

| Indicateur | Mesure | Seuil / Objectif |
|---|---|---|
| Occurrences `*InCents` (code source) | **818** | Ratchet preflight ≤ 818 |
| InCents dans `src/domain/` (schémas canoniques) | **0** | doit rester à 0 |
| Imports profonds (Barrel violations) | **45** | dont 8 documentés dans `docs/BARREL-EXCEPTIONS.md` |
| Verticales déployées | **12** | `PLATFORM_VARIANTS` en déclare 12 (INV-8) |

---

## 6. 🚨 Exploitation & Sécurité

| Indicateur | Mesure | Seuil / Note |
|---|---|---|
| Routes API sans garde détectée | **39** / 210 | Certaines sont légitimement publiques — cf. `AUDIT-23-AXES` |
| Pages d'erreur (`error.tsx`, `not-found`, `global-error`) | **5** | 0 = écran blanc Next en cas d'exception |
| Attributs `aria-` | 98 sur 908 fichiers `.tsx` | Indicateur d'accessibilité |

---

## 7. 🔌 Construit mais non branché

> Pattern systémique du projet : des briques complètes, exportées par un barrel,
> que **aucun écran ne rend**. Mesuré ici pour éviter l'accumulation silencieuse.

| Brique | Consommateurs `.tsx` |
|---|---|
| `useLexicon()` (lexique par verticale) | 0 |
| `DashboardWidgetGrid` | 0 |
| `CustomFieldRenderer` | 0 |
| `DynamicLayoutRenderer` | 0 |
| `FiscalReceiptSealZone` | 0 |

**Règle :** une brique à 0 consommateur depuis plus d'un mois doit être branchée,
supprimée, ou documentée comme gelée.

---

## 8. 💾 Synchronisation & Sauvegarde

- **Commits locaux en avance sur `origin/main`** : `85` commit(s).

---

## 📚 Références & Conventions

- Conventions & Règles : `CLAUDE.md`
- Lois des Agents : `AGENTS.md`
- Exceptions Barrel : `docs/BARREL-EXCEPTIONS.md`
- Plan Dette Technique : `docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md`
