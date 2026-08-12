# Plan de Remboursement de la Dette Technique

> Vérification faite sur le code réel — chaque chiffre est issu d'un scan du repo.
> Priorité décroissante : P1 → P4.
> Règle : `npx tsc --noEmit` vert avant/après chaque lot.

---

## P1 — `String(exErr)` résiduel (1 site) — 10 min

**Statut** : L1 est quasi-complet. Un seul site résiduel confirmé.

**Fichier** : `src/shared/components/settings/PayrollIntegrationPanel.tsx:149`

```ts
// ❌ Avant
showToast(String(exErr), 'error');

// ✅ Après
import { toError } from "@/lib/toError";
showToast(toError(exErr).message, 'error');
```

> `toError` est déjà importé en ligne 10 du fichier — c'est un oubli dans le bloc
> `catch` interne du listener `onMessage`. Correction mécanique, zéro risque.

---

## P2 — `app/(public)/demo/` — Suppression (15 min)

**Statut** : La route est un stub de 10 lignes qui fait `redirect('/landing')`.
Le vrai système de démo passe par `DemoSeeder` (`src/infrastructure/services/demo/DemoSeeder.ts`)
et les tenants `_demo_*` bootstrappés.

**Références à la route `/demo`** : 2 (commentaires uniquement — aucun lien actif)

### Actions

1. Supprimer `src/app/(public)/demo/page.tsx`
2. Supprimer le dossier `src/app/(public)/demo/`
3. Vérifier qu'aucun lien `href="/demo"` n'existe en prod :
   ```bash
   grep -rn 'href.*"/demo"' src/ --include="*.tsx" --include="*.ts"
   ```
4. `tsc --noEmit` vert ✓

> **Ne pas toucher** `DemoSeeder.ts` — c'est le vrai système, il reste.

---

## P3 — i18n — Décision obligatoire

**Statut** : Infrastructure dormante. Le fichier `translations.ts` lui-même le documente :
> « STATUT : DORMANT — 0 composant UI n'utilise t() en dehors de NexusCoreProvider. »

**Ce qui existe** :
```
src/i18n/
├── translations.ts        (assembleur + lazy loader)
└── locales/
    ├── fr.ts              (~5 000 lignes)
    ├── en.ts
    ├── es.ts
    ├── pt.ts
    └── ja.ts
```

**0 composant UI** n'importe `useTranslation` ou `t()` en dehors de `i18n/`.
Le projet est monolingue français en dur.

### Option A — Supprimer (recommandée si horizon < 12 mois)

```bash
rm -rf src/i18n/
```

- Supprimer l'import de `LanguageContext` dans `NexusCoreProvider` (si présent)
- Gain : ~5 000 lignes de dette passive en moins, clarté architecturale
- Perte : rien (aucun composant ne l'utilise)

### Option B — Documenter comme intentionnel

Si internationalisation est prévue :
1. Garder `src/i18n/` tel quel
2. Ajouter dans `CLAUDE.md` :
   ```
   **i18n** : Infrastructure prête (fr/en/es/pt/ja). Activation = câbler
   `LanguageContext` dans `NexusOpsProvider`. Ne pas câbler sans décision produit.
   ```
3. Ne pas toucher le code

> **Décision à prendre explicitement** — en l'état c'est de la dette passive qui grossit
> à chaque ajout de texte en dur.

---

## P4 — Rapatriement (chantier principal)

**Contexte** : La règle est posée dans `CLAUDE.md` depuis plusieurs sprints.
L'exécution est à ~60%. Voici l'état réel par zone.

### Vue d'ensemble des zones orphelines

| Zone | Fichiers | Priorité | Note |
|------|----------|----------|------|
| `src/domain/schemas/` | 31 | **Séquencé** | Voir contrainte ci-dessous |
| `src/infrastructure/` | 44 | Haute | Services métier hors modules |
| `src/verticals/` | 148 | Moyenne | Architecture intentionnelle à stabiliser |
| `src/store/` | 21 | Basse | Anti-cycles — voir `base.ts` |
| `src/domain/repositories/` | 2 | Haute | Interface orpheline |
| `src/domain/chaos/` + `plugins/` + `system/` | ~6 | Haute | À rapatrier ou supprimer |
| `src/config/` | 9 | Basse | Config globale — OK à la racine |
| `src/constants/` + `src/types/` | 5 | Basse | Peu de contenu, cross-cutting |

---

### P4.1 — `src/infrastructure/` → Rapatriement par cible

#### Cibles identifiées

| Fichier source | Cible | Pilier |
|---|---|---|
| `services/demo/DemoSeeder.ts` | `src/lib/services/DemoSeeder.ts` | lib (transversal) |
| `services/database/DataIntegrityService.ts` | `src/modules/compliance/securite/DataIntegrityService.ts` | compliance |
| `services/storage/` (5 fichiers) | `src/lib/adapters/storage/` | lib/adapters |
| `services/sovereign/lockdown.ts` | `src/shared/nexus/vault/lockdown.ts` | shared/nexus |
| `services/sovereign/firestoreHydrator.ts` | `src/lib/nexus/firestoreHydrator.ts` | lib/nexus |
| `services/SelfHealingEngine.ts` | `src/modules/intelligence/ia/resilience/` | intelligence |
| `components/index.ts` | `src/shared/components/` (barrel) | shared |
| `repositories/` | `src/modules/<pilier>/` selon contenu | par pilier |

#### Procédure pour chaque fichier
```bash
# 1. Identifier tous les imports vers le fichier
grep -rn "from.*infrastructure/services/storage" src/ --include="*.ts" --include="*.tsx"

# 2. Déplacer le fichier
mv src/infrastructure/services/storage/ src/lib/adapters/storage/

# 3. Mettre à jour les imports (sed ou IDE)
# 4. tsc --noEmit vert
# 5. Commit
```

---

### P4.2 — `src/domain/repositories/` + `domain/chaos/` + `domain/plugins/`

**Contrainte** : `domain/schemas/` reste en place jusqu'à la migration phase 4
(stratégie définie : finance → ops → logistics → ... pilier par pilier).
**Ne pas migrer `domain/schemas/` avant la phase 4.**

#### Ce qui peut partir maintenant

| Fichier | Cible |
|---|---|
| `domain/repositories/IFinanceRepository.ts` | `src/modules/finance/comptabilite/` |
| `domain/repositories/index.ts` | supprimer ou migrer avec le fichier |
| `domain/chaos/` | `src/modules/intelligence/ia/resilience/` ou `src/__tests__/` |
| `domain/plugins/` | `src/shared/plugins/` |
| `domain/system/` | `src/lib/` si transversal |
| `domain/services/index.ts` | barrel vide → supprimer |

---

### P4.3 — `src/verticals/` — Stabilisation (pas migration)

`src/verticals/` contient 148 fichiers avec une structure propre par vertical
(`domain/`, `finance/`, `ops/`, `presentation/`). Le path `@verticals/*` est
déclaré dans `tsconfig.json`.

**Ce n'est pas du code orphelin — c'est une zone intentionnelle.**

Les actions sont :
1. **Vérifier** que chaque vertical ne duplique pas du code déjà dans `src/modules/`
2. **Documenter** dans `CLAUDE.md` que `src/verticals/` est une zone légitime distincte de `src/modules/`
3. **Ajouter au barrel rule** : les modules de `src/modules/` n'importent jamais directement de `src/verticals/` — communication via `@verticals/*` uniquement

---

### P4.4 — `src/store/` — Ne pas toucher (anti-cycles)

`src/store/base.ts` est le module neutre (`NexusNode`, `updateNexusNode`).
Sa position à la racine est **intentionnelle** pour éviter les dépendances circulaires
Registry ↔ Atomes. Ne pas rapatrier.

Les autres fichiers de `src/store/` : vérifier au cas par cas.

---

## Séquence d'exécution recommandée

```
Semaine 1 :
  ├── P1 — String(exErr) → 10 min          ✓ commit
  ├── P2 — Suppression demo/              ✓ commit
  └── P3 — Décision i18n → documenter ou supprimer

Semaine 2-3 :
  └── P4.1 — infrastructure/storage/ → lib/adapters/    (le plus propre, moins de refs)
      P4.1 — infrastructure/sovereign/ → lib/nexus/
      P4.1 — DemoSeeder → lib/services/

Semaine 4-5 :
  └── P4.2 — domain/repositories/ + domain/plugins/

Sprint suivant (coordonner avec stratégie migration schemas) :
  └── P4.3 — verticals/ documentation
  └── Phase 4 domain/schemas/ → quand déclenchée
```

---

## Mesures de succès

| Métrique | Maintenant | Cible |
|---|---|---|
| `String(exErr)` prod | 1 | 0 |
| Routes fantômes | 1 (`/demo`) | 0 |
| i18n décidé | ❌ flottant | ✅ documenté ou supprimé |
| Fichiers dans `infrastructure/` | 44 | < 10 (ceux qui restent documentés) |
| Fichiers dans `domain/` hors schemas | ~20 | < 5 |
| `tsc --noEmit` | vert | vert (invariant) |
