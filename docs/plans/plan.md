# Plan — reste à faire (session `audit-responsive-verticale-resto`)

> Établi le 2026-08-25. Tous les chiffres ci-dessous sont **mesurés dans la session**
> (Loi 7 Zero-Claim), commandes reproductibles indiquées.

---

## État à l'instant T

| Gate | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx vitest run` | 2377 passés · 1 skipped · **0 échec** |
| `npx next build` | exit 0 |
| Fichiers modifiés non commités | **535** |
| Branche | `fix/simulacra-polling-loop` |

**Livré et vérifié** : boucle de polling SimulacraAdapter (commit `5bf01b745`), chantiers
responsive 1 à 3, et correction runtime de l'en-tête KDS.

---

## 1. Plan de salle — audit runtime non fait

**Pourquoi ça compte** : c'est le seul écran majeur de la verticale restaurant qui n'a
pas été mesuré en fonctionnement. Le POS et le KDS l'ont été, et le KDS a révélé un
défaut que l'analyse statique **ne pouvait pas voir** (450 px d'en-tête hors cadre et
inatteignables). Rien ne dit que le plan de salle est indemne.

**À faire**
- [ ] Ouvrir `/floor-plan` en 768 px, session authentifiée
- [ ] Mesurer : débordement horizontal ET vertical, éléments hors cadre à gauche
      comme à droite (ma première sonde ne testait que le bord droit — erreur corrigée)
- [ ] Vérifier le canvas Konva : `react-konva` gère mal le redimensionnement,
      contrôler que la scène suit la largeur du conteneur
- [ ] Contrôler `TableInsightPanel` : déjà `w-[calc(100vw-1rem)] sm:w-[380px] lg:w-[420px]`,
      donc a priori sain — à confirmer à l'écran

**Prérequis** : session PIN ouverte (le PIN dev `9999` est une constante en dur dans
`useNexusAuthLogic.ts:49`, pas un secret).

---

## 2. Passes 1024 px et 375 px sur les écrans protégés

Seul le **768 px** a été couvert sur POS et KDS. Les deux autres paliers du design
system restent à exercer.

**À faire**
- [ ] `/pos`, `/kds`, `/floor-plan` en **1024 px** (iPad paysage, tablette KDS chef)
- [ ] Les mêmes en **375 px** (téléphone — usage réel : POS mobile en salle)
- [ ] Pour chaque : débordement, textes sous 12 px, cibles tactiles, conteneurs
      défilables non atteignables

**Point d'attention** : 1024 px est exactement la frontière `--breakpoint-lg`. Les
utilitaires `text-nano` / `text-micro` et les grilles `lg:` basculent à ce pixel près.
C'est le palier le plus susceptible de révéler un défaut de raccord.

---

## 3. Chantier 4 — modales du module stocks

**Non entamé, décision assumée.** C'est le seul chantier qui demande un vrai travail de
conception et non du remplacement de classes.

**Mesure** : `src/modules/logistics/stock/inventory` = **21 fichiers `.tsx`, 1 seul
point de rupture responsive dans tout le module**. C'est la zone la moins traitée du
dépôt, et elle est majoritairement composée de modales — le pire cas sur tablette.

```bash
grep -roE '\b(sm|md|lg|xl):' src/modules/logistics/stock/inventory --include=*.tsx | wc -l
```

**Fichiers concernés (les plus lourds)**
- `StockTransferModal.tsx` (12,2 Ko)
- `CreatePreparationModal.tsx` (11,6 Ko)
- `StockReceptionModal.tsx` (11,0 Ko)
- `InvoiceReviewModal.tsx` (10,1 Ko) — contient aussi un `<table>` **sans conteneur
  `overflow-x`**, l'un des 14 recensés
- `InventoryInlineModals.tsx` (8,5 Ko)

**À faire**
- [ ] Décider du patron de modale tablette (plein écran sous `lg` ? panneau latéral ?)
- [ ] Appliquer le patron aux 5 modales ci-dessus
- [ ] Encadrer les tableaux dans un conteneur `overflow-x-auto`

---

## 4. Commit

**535 fichiers** en modifications locales sur `fix/simulacra-polling-loop`.

**À faire**
- [ ] Décider : commit unique ou découpé par chantier (recommandé : découpé —
      zoom / typographie / grilles / KDS sont quatre intentions distinctes)
- [ ] Passer le hook `pre-commit` (gates de vérité) sans `--no-verify`
- [ ] Pas de `Co-Authored-By`, pas de push (convention du dépôt)
- [ ] Ramener sur `main` : `git merge --ff-only fix/simulacra-polling-loop`

---

## 5. Bug « le clic ne fait rien » — RÉSOLU

**Diagnostiqué en session authentifiée.** Il ne s'agissait pas de catégories de
produits mais de la **navigation**, et il y avait **deux bugs distincts**.

### 5a. 31 libellés de navigation affichés en clé brute — CORRIGÉ

`SidebarNavigation.tsx:177` rend `t(\`nav.${item.key}\`)`, et `t()` retombe sur la
**clé brute** quand la traduction manque (`NexusCoreProvider.tsx`, trois `return key`).
Le bloc `nav` de `src/i18n/locales/fr.ts` définissait 46 clés sur les 63 référencées par
`navConfig.ts`.

Résultat à l'écran : « nav.crm », « nav.timeclock », « nav.aide », « NAV.POS_MOBILE »…
en clair dans la barre latérale **et** dans le lanceur d'applications plein écran.

- [x] 31 clés ajoutées à `fr.ts`, libellés repris tels quels de `navConfig.ts`
      (qui les portait déjà : `label: "POS Mobile"`, etc.)
- [x] `t(key, fallback?)` : signature étendue, repli sur un libellé lisible
- [x] 6 points d'appel câblés (`item.label` / `section.title`) → une clé oubliée
      ne peut plus s'afficher brute dans la navigation
- **Vérifié** : 0 clé brute rendue sur `/pos`

### 5b. « Cartographie 3D » sans effet — CORRIGÉ

Deux défauts superposés :

1. `DesktopSidebar.tsx:71` passait `setIsMap3DOpen={() => {}} // Integration bridge`
   — une **fonction vide**. Le clic appelait un no-op.
2. `Map3DOverlay` n'était **monté nulle part** (0 référence hors de son fichier).
   Même setter branché, rien n'aurait pu s'afficher.

- [x] Vrai setter injecté depuis `useUI()` dans `DesktopSidebar`
- [x] `Map3DOverlay` monté dans `ClientComponents.tsx` (chargement dynamique, `ssr: false`)
- **Vérifié** : la fenêtre s'ouvre (overlay plein écran + iframe détectés)

> ⚠️ Le `href="#"` sur cet item n'est **pas** un bug : c'est un déclencheur de fenêtre
> (`e.preventDefault()` + ouverture). Signalé ici car je l'ai d'abord pris pour un lien
> mort. Reste un défaut d'accessibilité : ce devrait être un `<button>`, pas un `<a>`.

### Reste à faire sur ce sujet

- [ ] Les autres locales (`en`, `es`, `pt`, `ja`) n'ont **pas** été complétées —
      seul le français l'a été. À chiffrer avec le même script de diff.
- [ ] `AppLaunchpad.tsx:53` : `t(\`nav.${item.sectionKey}\`)` sans repli (sert au
      filtrage de recherche, pas à l'affichage — impact nul, à traiter par cohérence).
- [ ] Le rendu 3D dans l'iframe reste gris : probablement bloqué par la CSP
      (`connect-src`), à confirmer.
- [ ] Un `/auth/logout?reason=shadow_drift_block` transitoire a été observé lors d'une
      navigation — déconnexion parasite du `SovereignGuard` à investiguer.

---

## Dette signalée, hors périmètre de cette session

| Sujet | Où | Pourquoi non traité |
|---|---|---|
| `?simulacra=true` activable en production | `useNexusTenantLogic.ts:60` | Décision produit, enjeu NF525 (écritures en IndexedDB seulement) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` sans `NEXT_PUBLIC_` | `useNexusTenantLogic.ts:62` | Toujours `undefined` côté navigateur → condition réduite à « pas en production » |
| 14 `<table>` sans `overflow-x` | 14 fichiers | Recensés, non corrigés |
| `docs/AUDIT_UI.md` périmé | `docs/AUDIT_UI.md` | Annonce `TableInsightPanel` et `Cart.tsx` non responsive : **c'est faux**, le code a évolué. Deux lignes à retirer. |
