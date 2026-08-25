# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **2026-08-25 10:57 UTC** · commit `189f260a3`
> Source : `scripts/health-snapshot.sh` (Zero-Claim Policy)

---

## 1. 🔴 Readiness Production & Environnement

| Variable requise | Statut | Impact opérationnel |
|---|---|---|
| `FISCAL_SIGNING_SECRET` | 🔴 Bloquant absolu Absent | Scellement NF525 serveur impossible |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 🔴 Bloquant Absent | Auth admin, claims, signup inopérants |
| `STRIPE_SECRET_KEY` | 🟠 Optionnel Absent | Checkout et paiements Stripe KO |
| `STRIPE_WEBHOOK_SECRET` | 🟠 Optionnel Absent | Webhooks Stripe non vérifiés |
| `GEMINI_API_KEY` | 🟢 Non bloquant Absent | Vision IA et OCR dégradés |

---

## 2. 🛡️ Gates de Sécurité Structurelle

| Métrique | Valeur | Statut / Seuil |
|---|---|---|
| Sentrux gate vs baseline | ✅ | Bloquant au push |
| Score qualité | 3258 -> 3260 | |
| Couplage | 0.45 → 0.45 | |
| Cycles import (Sentrux) | 2 → 2 | max = 0 |
| Cycles import (Madge) | 0 cycle | Seuil ratchet = 0 ✅ |
| God files | 18 → 18 | max = 0 |
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
| **Total suite Vitest** | (voir CI) | 2 319 passés / 1 skipped |

---

## 4. 🌍 Couverture i18n & Locales

| Métrique | Mesure réelle |
|---|---|
| Fichiers `.tsx` avec `t()` | **33 / 902** (114 appels) |
| Clés `fr.ts` (référence) | 482 clés |
| Clés `en.ts` | 500 clés |
| Clés `es.ts` / `pt.ts` / `ja.ts` | 127 / 107 / 107 clés (squelettes partiels ~25%) |

---

## 5. 📉 Suivi de Dette Technique

| Indicateur | Mesure | Seuil / Objectif |
|---|---|---|
| Occurrences `*InCents` (code source) | **821** | Ratchet bloquant preflight ≤ 821 |
| Schémas Zod (`src/domain/schemas/`) | **0 InCents** | 100% microunits ✅ |
| Imports profonds (Barrel violations) | **45** | Voir `docs/BARREL-EXCEPTIONS.md` (39 légitimes) |
| Verticales universelles déployées | **12 / 12** | 100% conformes à `PLATFORM_VARIANTS` |

---

## 6. 💾 Synchronisation & Sauvegarde

- **Commits locaux en avance sur `origin/main`** : `64` commit(s).

---

## 📚 Références & Conventions

- Conventions & Règles : `CLAUDE.md`
- Lois des Agents : `AGENTS.md`
- Exceptions Barrel : `docs/BARREL-EXCEPTIONS.md`
- Plan Dette Technique : `docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md`
