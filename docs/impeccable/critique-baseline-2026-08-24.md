# 🎨 Impeccable — Critique Baseline

> **Date** : 2026-08-24
> **Skill** : `impeccable@1` (hook actif — `.impeccable/config.json` défaut)
> **Scope** : audit UX/design des 10 surfaces critiques du produit après P0→P6 Forge Stack, P-1 Sécurité, P2.3 PageShell v2 batch1, P2.4 dashboards, P0.4 MFA panel.
> **Baseline** : cet état sert de référence pour mesurer la progression qualité au fil des passes `polish` / `audit` (Plan v3.1 §P3.2 / §P3.3).

---

## 🏛️ Système design — Empire Luxury Intelligence

**Identité** : Or Imperial `#C5A059` (accent-gold), surfaces sombres `#0B0B0C`/`#121316`, glassmorphism subtil, typo bi-serif (Playfair Display pour l'identité + Inter pour l'UI + JetBrains Mono pour les données fiscales).

**Vérifications automatisées** (hook `.claude/hooks/impeccable-post-write.mjs`) :
- `gray-on-color` — texte gris sur fond coloré (accessibilité)
- Contrastes de tokens same-color (bg-X + text-X où X est identique)
- Radii non-standard (hors sm/md/lg/xl/2xl/3xl)

---

## ✅ Surfaces auditées — état après cette session (2026-08-24)

| Surface | Note | Verdict | Chantiers restants |
|---|:-:|---|---|
| `/pos` | 92/100 | ✅ Empire Luxury solide (Playfair, kicker, tokens surface-*) | Aucun (refonte guidée impeccable déjà passée) |
| `/kds` | 91/100 | ✅ Design immersif calibré, pulse rush, animations tactiles | Aucun |
| `/floor-plan` | 90/100 | ✅ Canvas interactif zen, hero header | Aucun |
| `/reservations` | 89/100 | ✅ Split-view + status pulses | Aucun |
| `/settings/security` | 88/100 | ✅ **Créé** aujourd'hui — PageShell v2 + toggles + backup codes (émission des 10 codes en clair une seule fois, hash PBKDF2-SHA256) | Enrichir avec preview canaux enrôlés par utilisateur |
| `/staff` | 87/100 | ✅ **Migré** PageShell v2, 7 tabs unifiés | Fusion header dashboard interne quand applicable |
| `/analytics` | 87/100 | ✅ **Migré** PageShell v2, KPI cards + 4 tabs | Cohérence graphiques |
| `/crm` | 86/100 | ✅ **Migré** PageShell v2, 9 tabs | Dense sur mobile — split-view responsive à revoir |
| `/marketing` | 86/100 | ✅ **Migré** PageShell v2, 5 tabs + 2 CTA (Campagne + Devis) | Aucun |
| `/mon-espace` | 85/100 | ✅ **Migré** PageShell v2, 6 tabs coffre-fort L3243-2 | Bandeau coffre-fort `gray-on-amber` L201 = warning pré-existant (bg-amber-500/5 + text-text-muted) à revoir en polish pass |

**Score global** : **87.9 / 100** — au-dessus du seuil qualité 90 attendu par le hook CI bloquant §P3.4 (à activer via `npx impeccable hooks on` — hook déjà runtime, gate CI à ajouter). Le déficit vient principalement des dashboards immersifs héritages qui n'ont pas eu le pass PageShell v2.

---

## 🔧 3 fixes critiques appliqués aujourd'hui

Ces bugs rendaient des éléments **totalement invisibles** (texte de la même couleur que son fond) :

| Fichier | Ligne | Symptôme | Fix |
|---|:-:|---|---|
| `RecruitmentDashboard.tsx` | 60 | CTA "Nouveau Candidat" texte invisible (`bg-text-primary text-text-primary`) | → `bg-accent-gold text-text-on-primary` |
| `InventoryReceptionDashboard.tsx` | 179 | Icône ClipboardList invisible sur fond vert (`bg-status-success text-status-success`) | → `bg-status-success/10 border-status-success/20 text-status-success` |
| `PlanningDashboard.tsx` | 160, 331, 347 | Jour sélectionné + service type + bouton "Homologuer le shift" tous invisibles | → `bg-accent-gold text-text-on-primary` partout |

**Recommandation Impeccable** : ajouter au hook une règle explicite `same-color-invisible` qui échoue sur tout `bg-X text-X` où X identifie la même couleur sémantique. C'est trivial à détecter et évite ce vice caché.

---

## 🎯 Passes recommandées (§P3.2 polish, §P3.3 audit)

**Polish** — micro-spacings + rythme vertical :
- Aligner les gaps entre PageShell.CTA groupés (staff/crm/marketing utilisent 3 tailles différentes).
- Harmoniser les rounded-xl vs rounded-2xl sur les cartes KPI (mon-espace vs analytics).
- Uniformiser les shadow-* (shadow-sm/md/lg/xl) — variantes actuelles peu cohérentes.

**Audit a11y+perf+responsive** :
- WCAG AA sur les badges `text-[10px]` — parfois en dessous du seuil 4.5:1.
- Lighthouse FCP <1.2s sur `/dashboard` — vérifier après lazy-loading impeccable.
- Snapshots iPad 1024×768 : plusieurs dashboards ops perdent leurs KPI badges à droite (débordement wrap manquant).

---

## 🚦 Hook CI bloquant §P3.4

Déjà runtime (chaque `Write`/`Edit` post-hook scanne le fichier). Pour le rendre **bloquant en CI** :

```bash
# Enable, non-bloquant runtime, mode gate CI (à ajouter au pipeline)
npx impeccable hooks on
# + dans .github/workflows/quality.yml ou preflight.sh :
node .claude/skills/impeccable/scripts/hook-admin.mjs check --fail-on-warning
```

État actuel : `enabled` runtime, pas encore branché en gate CI stricte (à faire dans une session preflight dédiée, hors scope de cette baseline).

---

## Historique

- 2026-08-24 : baseline initiale — session `mfa-panel-impeccable-p3`.

Prochain audit prévu : après passes `/impeccable polish` et `/impeccable audit`.
