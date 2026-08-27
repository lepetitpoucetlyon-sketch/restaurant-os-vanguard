# Boutons inertes — plan de résorption

> **Ce qu'est ce document.** L'inventaire exhaustif des contrôles de l'interface qui
> ne répondent pas au clic, et la marche à suivre pour chacun.
> Rapport interactif : https://claude.ai/code/artifact/2ca203e1-3fa5-45c1-834a-03947dbb7c79
>
> **Zero-Claim.** Tous les chiffres ci-dessous ont été **mesurés** le 2026-08-27, pas estimés.
> Méthode reproductible en §1. Ne pas modifier un chiffre sans relancer la mesure.

---

## 1. Méthode de mesure

### 1.1 Ce qui a été cherché

Balayage de **909 fichiers `.tsx`** (hors `__tests__`), cinq motifs :

| Code | Motif | Pourquoi c'est un défaut |
|---|---|---|
| **A** | `<button>` sans `onClick`, sans `type="submit"`, sans `form=`, sans gestionnaire pointeur, sans `{...spread}` | Le clic ne déclenche rien |
| **B** | `onClick={() => {}}` | No-op explicite |
| **C** | `href="#"` | Lien mort |
| **D** | `onClick={() => console.log(...)}` | Trace de développement laissée en place |
| **F** | Propriété `onX` passée à `() => {}` | Le composant enfant croit avoir un gestionnaire |

Scanner : `scan-dead-buttons.mjs` (scratchpad de session, jetable).
Équilibrage des accolades obligatoire — un `>` peut apparaître dans une expression JSX (`=>`),
un `indexOf('>')` naïf coupe la balise au mauvais endroit.

### 1.2 Le piège d'atteignabilité (important)

La mesure `orphans` du dépôt (`npm run measure`) marque un composant « consommé »
dès qu'un **autre fichier l'importe** — même si ce fichier n'est lui-même monté nulle part.
Les **chaînes mortes transitives** passent donc au travers.

Correctif appliqué : fermeture transitive du graphe d'imports depuis les
**310 points d'entrée** de l'App Router (`page.tsx`, `layout.tsx`, `error.tsx`, `route.ts`).
Résultat : **2 385 / 3 387** fichiers réellement atteignables.

Sans ce calcul, on câble des boutons que personne ne verra jamais.

### 1.3 Ce que la mesure ne voit PAS

Trois angles morts assumés, à traiter séparément :

1. **Le bouton branché sur un gestionnaire qui échoue en silence.**
   `npm run measure` compte **200 erreurs potentiellement avalées**. Un `catch {}` vide
   produit exactement la même sensation qu'un bouton mort.
2. **Le bouton hors cadre à un format donné.** **107 risques responsive** mesurés.
   Un contrôle poussé hors écran est inatteignable sans être inerte.
3. **Le bouton dont le clic remonte au parent.** Un `<button>` sans `onClick` dans un
   conteneur cliquable **fonctionne** par propagation — parfois correctement
   (`StaffList:52`), parfois en déclenchant la mauvaise action (`StaffList:78/81`,
   qui ouvraient la fiche au lieu d'écrire ou d'appeler).
4. **Le bouton dans une branche d'état jamais atteinte.** Le fichier est monté, la
   branche est morte. Cas rencontré : « Connecter » dans `GoogleProfileCard`, placé
   sous `if (!profile)` alors qu'un repli garantit que `profile` n'est jamais nul
   (voir Lot 6). Un scanner statique ne peut pas le voir — seule la lecture du flux
   d'état le révèle. **Corollaire** : un repli qui invente des données masque l'état
   vide *et* les chiffres réels.

Ces trois classes exigent une sonde au clic dans un navigateur réel, pas une lecture du source.

---

## 2. Résultat mesuré

| Catégorie | Nombre |
|---|---|
| Anomalies brutes détectées | 84 |
| — dans la console MCC (hors périmètre gérant) | 6 |
| — dans des fichiers de test | 2 |
| — **faux positifs** (voir §5) | 6 |
| — dans des composants jamais montés | 11 |
| — dans des **chaînes mortes transitives** | 2 |
| **Boutons morts réellement affichés** | **59** |
| dont classés **critiques** | 12 |

---

## 3. FAIT — 21 contrôles traités

`npx tsc --noEmit` : **0 erreur** après chaque lot.

### 3.1 Impasses levées (les plus graves)

| Contrôle | Fichier | Ce qui a été fait |
|---|---|---|
| Régulariser l'abonnement | `shared/components/layout/SovereignLock.tsx:39` | **Route `POST /api/billing/portal` créée** + branchement |
| Contact Support Nexus | `shared/components/layout/SovereignLockout.tsx:64` | `mailto:` pré-rempli motif + Signal ID |
| Télécharger le Rapport Z | `ops/workflow/engine/components/dashboard/EndOfDayWizard.tsx:65` | Rapport conservé en état + ticket Z formaté |

**Le fond du problème sur l'abonnement.** Le moteur de dunning
(`/api/billing/dunning`) fait passer un tenant en `licenceStatus: 'LOCKED'` à J+14,
ce qui monte `SovereignLock` par-dessus toute l'application. **Aucune route ne permettait
d'en sortir** : la seule route portail existante
(`/api/admin/fleet/billing/portal-session`) exige `mcc_super_admin`, inaccessible au
gérant — alors que sa propre documentation annonce « ou admin/manager du tenant »
(divergence doc/code, non corrigée, hors périmètre).
La nouvelle route utilise `requireTenantAdmin` et **valide l'URL de retour**
contre `NEXT_PUBLIC_APP_URL` (une `returnUrl` libre permettrait de rediriger
le gérant vers un domaine tiers après paiement).

**Sur le Rapport Z.** Il était généré, scellé… puis **jeté**. Il est désormais conservé
et téléchargeable en ticket formaté (ventilation par taux de TVA + empreinte de
scellement). L'erreur de clôture était avalée en « Erreur lors de la clôture
fiscale » ; elle remonte maintenant sa cause réelle — le plus souvent
`FISCAL_SIGNING_SECRET` absent, diagnostic impossible avec l'ancien message.

### 3.2 Hub fournisseurs — reconstruit

**Constat.** Ce n'était pas « un bouton mort » : les **5 onglets étaient des maquettes**.
Zéro accès aux données, trois fournisseurs codés en dur avec IBAN et noms de contacts
inventés, et un champ de recherche branché sur un état qui **ne filtrait rien**.
Une collection `suppliers` existait pourtant, alimentée par
`onboarding/migration/importers/suppliersImporter.ts` : rien de ce qui était importé
n'apparaissait à l'écran.

Livré :

- **Contrats** (`shared/nexus/contracts/logistics.ts`) : `SupplierDispute`,
  `SupplierPriceEntry`, `SupplierRebateScheme`, `SupplierRebateTier`
  (`SupplierOrder` existait déjà).
- **Collections** (`shared/nexus/constants/collections.ts`) : `supplierOrders`,
  `supplierDisputes`, `supplierPrices`, `supplierRebates`.
- **`modules/logistics/services/SupplierHubService.ts`** : litiges (cycle
  déclaré → réclamé → avoir reçu → déduit), import de mercuriale, comparateur par
  ingrédient, calcul de RFA par paliers, mise en forme du bon de commande.
- **Les 4 onglets** branchés dessus, avec états vides honnêtes.

Points d'implémentation notables :

- **Mercuriale** : import CSV réel — séparateur `;`/`,` détecté, guillemets respectés,
  montants `8,80 €` / `8.80` / `8 800,00` normalisés, alias de colonnes FR+EN.
  L'import **remplace** les lignes du fournisseur (un tarif est à date, pas cumulatif)
  et **annonce les lignes rejetées** — une mercuriale importée à moitié en silence
  fausserait toutes les comparaisons.
- **RFA** : barème par paliers, le taux du plus haut seuil franchi s'applique à
  l'intégralité des achats. Affiche le manque et le gain au palier suivant.
- **Litiges** : un avoir inférieur au montant réclamé reste valide (geste commercial
  partiel) — les deux montants sont conservés pour que l'écart reste vérifiable.

### 3.3 RH

| Contrôle | Fichier | Fait |
|---|---|---|
| Mail / Téléphone salarié | `human/…/staff/StaffList.tsx:78,81` | `mailto:` / `tel:` + `stopPropagation` ; masqués si contact absent |
| Consulter une demande de congé | `app/(client)/(ops)/leaves/page.tsx:201,263` | **`LeaveRequestDetailModal` créé** et monté |
| Scanner CV / Téléverser PDF | `human/…/recruitment-dashboard/AddCandidateModal.tsx:118,124` | Dépôt via `StorageManager` (agnostique), `capture="environment"` sur mobile, plafond 8 Mo |
| Menu carte candidat | `human/…/recruitment-dashboard/CandidateCard.tsx:29` | Menu (CV, écrire, appeler, écarter) + fermeture clic extérieur / Échap |

**Au passage** : la carte salarié affichait « Aujourd'hui, 12:45 » et « 4.9 » **en dur**
alors que `lastActive` et `performanceScore` existent dans `UserSchema`. Branchés sur
les vraies valeurs, avec un état « Non évalué » quand le score est absent.
Le schéma **ne déclare pas de téléphone** (`catchall` seulement) — le bouton d'appel
n'apparaît que si le champ libre est renseigné.

### 3.4 Carte (menu-builder)

`CategorySidebar:21` et `ProductCardGrid:38` créent réellement. `saveProduct` distingue
création et édition (`update` sur un chemin inexistant échouerait). L'enregistrement
d'un plat **échouait en silence** (`console.error` seul) : le gérant refermait
l'éditeur en croyant son plat enregistré — un retour d'erreur visible a été ajouté.

### 3.5 Refusé — et pourquoi

**Accès biométrique** (`shared/nexus/guards/PinLogin.tsx:204`) — **bouton retiré**.

Il n'existe **aucune route d'authentification WebAuthn** côté serveur
(`src/app/api` ne contient ni `auth/`, ni `mfa/`, ni `webauthn/`).
`MfaChannelsService` ne gère que *quels canaux sont activés*, pas l'enrôlement ni la
vérification de credentials. Brancher ce bouton sur `navigator.credentials.get()`
afficherait le capteur **sans rien authentifier** — théâtre de sécurité sur un socle NF525.

À noter : `PasskeyStepUpModal` fait déjà exactement cela (pas d'`allowCredentials`,
aucune vérification serveur de l'assertion). C'est un **défaut de sécurité existant**,
pas une régression, mais il doit être corrigé.

Chantier ouvert séparément : enrôlement (attestation), vérification (assertion +
compteur anti-rejeu), isolation par tenant, et **arbitrage** sur la connexion initiale
par passkey — décision de sécurité qui ne se tranche pas seul.

---

## 4. RESTE À FAIRE — 38 contrôles

Effort : **S** ≤ 30 min · **M** ≈ 1–3 h · **L** ≈ ½–2 j · **XL** > 2 j.

### Lot 1 — Plan de salle · 5 contrôles · `facility/spaces/settings/TablesToolbar.tsx`

Les **5 boutons de la barre d'outils** sont morts. C'est l'écran où le défaut a été signalé.

| # | Ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 1.1 | 45 | Sélecteur d'étage | Le composant reçoit déjà `floors: Floor[]` mais n'affiche que `floors[0]`. Ajouter `activeFloorId` + `onSelectFloor` (remontés au parent), menu déroulant. **Le sous-titre « 8 UNITÉS • 30 PAX » est codé en dur** — calculer depuis les tables de l'étage. | M |
| 1.2 | 105 | Vue optimisée | Décider ce que « optimisé » signifie (agencement auto ? filtre densité ?). Si indécidable → **retirer**. | M / S |
| 1.3 | 111 | Bascule 2D | Affichée comme active sans piloter d'état. Introduire `viewMode: '2d' \| '3d'`. | S |
| 1.4 | 112 | Bascule 3D | Un `Map3DOverlay` existe dans le dépôt — vérifier s'il est exploitable, sinon retirer le bouton. | M |
| 1.5 | 124 | Grille magnétique | Aimantage à la grille lors du déplacement d'une table. | M |

> Prérequis 1.1 : vérifier que le parent porte bien la liste d'étages et l'état courant.

### Lot 2 — Réception & stocks · 2 contrôles **critiques**

`logistics/approvisionnement/reception/components/InventoryReceptionDashboard.tsx`

| # | Ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 2.1 | 248 | Valider une ligne de réception | La ligne n'est jamais validée. Brancher sur la mise à jour du mouvement de stock (`InventoryMovement`, type `reception`). **Vérifier l'impact HACCP** : une réception validée doit tracer température et DLC. | M |
| 2.2 | 245 | Forcer le scan | Basculer `item.forceScan` et le persister. | S |

> ⚠️ Ces deux boutons touchent la traçabilité alimentaire. Contrôler ce que
> `ReceptionMarchandises.tsx` (module HACCP) attend déjà comme données.

### Lot 3 — Cuisine & recettes · 6 contrôles

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 3.1 | `kitchen/components/tabs/IngredientsTab.tsx:86` | Éditer un ingrédient | Modal d'édition → écriture Nexus. Source : `useInventory()` (`providers/hooks/catalogHooks`) — **identifier la collection exacte avant d'écrire**. Attention : coût lu via 4 champs de repli (`unitCostInMicrounits ?? costInMicrounits ?? unitCostInCents*10⁴ …`) — **écrire en microunits** (CLAUDE.md). | M |
| 3.2 | `…/IngredientsTab.tsx:89` | Supprimer un ingrédient | Suppression + **confirmation**. Vérifier les recettes qui le référencent avant de supprimer. | M |
| 3.3 | `…/tabs/MarginsTab.tsx:108` | Tri « marge décroissante » | État de tri local + `useMemo`. | S |
| 3.4 | `…/RecipeTechnicalSheet.tsx:108` | Télécharger la fiche PDF | Pas de générateur PDF identifié dans le dépôt. Deux voies : impression navigateur (`window.print()` + CSS `@media print`) — **rapide et honnête** ; ou vraie génération PDF (dépendance à ajouter). | M / L |
| 3.5 | `…/recipe-detail/RecipeSidebarHero.tsx:49` | Mettre en favori | Nécessite un champ de persistance (par recette, ou par utilisateur). Sans modèle → retirer. | S / M |
| 3.6 | `…/RecipeSidebarHero.tsx:52` | Partager la recette | `navigator.share` avec repli copie de lien. | S |

### Lot 4 — Registre & conformité · 3 contrôles

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 4.1 | `facility/maintenance/registre/InterventionLogSection.tsx:91` | Exporter le journal | Export CSV (même approche que le ticket Z : `Blob` + `URL.createObjectURL`). | S |
| 4.2 | `…/InterventionLogSection.tsx:94` | Fiche d'intervention | Ouvrir le détail, ou imprimer. | M |
| 4.3 | `…/SanitaryComplianceSection.tsx:118` | Voir le document | Ouvrir le justificatif. **Vérifier d'abord qu'une URL de document existe** dans le modèle — sinon c'est un champ à ajouter, pas un bouton à brancher. | S / M |

### Lot 5 — Réservations · 2 contrôles

`commerce/relation/reservations/components/ReservationSidebar.tsx`

| # | Ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 5.1 | 75 | Trier | Menu de tri (heure, couverts, statut) + tri appliqué. | S |
| 5.2 | 148 | Action de ligne | **Identifier l'intention** avant de coder (l'icône seule ne la donne pas). | S |

### Lot 6 — Marketing & référencement · 5 contrôles

#### 6.A — Google Business Profile : plan de construction

> **Correction du diagnostic initial.** Le bouton « Connecter » de
> `GoogleProfileCard.tsx:30` n'est pas seulement inerte : **il ne s'affiche jamais**.
> Il vit dans la branche `if (!profile)`, or `seoProfileAtom` n'est jamais nul —
> `marketing.sync.ts:99` le remplit systématiquement avec un objet de repli quand la
> collection `seoProfiles` est vide.
>
> **Et ce repli invente des chiffres :**
> ```
> isVerified: true            ← affiché « Vérifié » alors que rien ne l'est
> rating: 4.8                 ← note inventée
> analytics.connected: true   ← affiché connecté alors que rien ne l'est
> impressions: 1240, clicks: 342, ctr: 27.5, avgPosition: 3.2
> ```
> Conséquence : sans aucun profil Google lié, l'écran SEO affiche « Vérifié », une note
> de **4,8**, **1 240 impressions** et **342 clics**. Le gérant lit comme siennes des
> statistiques de référencement fabriquées. Le seul champ honnête du repli
> (`integrations.googleBusinessProfile.linked: false`) n'est lu par personne.
>
> **Le vrai correctif n'est donc pas « brancher Connecter »** — c'est faire dire la
> vérité à l'écran, ce qui rend le bouton atteignable au passage.

**Décision produit actée** : on **conserve les trois éléments affichés** de la carte
(Établissement · Note moyenne · Dernière sync). Ils ne sont pas supprimés — ils sont
alimentés par de vraies données, et affichent un état d'absence explicite tant qu'aucune
source ne les renseigne.

---

##### Étape 1 — Assainir le repli · **bloquant** · S

`modules/commerce/acquisition/marketing/marketing.sync.ts` (~L88–99)

Le repli doit décrire un profil **non connecté**, pas un profil fictif :

| Champ | Avant | Après |
|---|---|---|
| `isVerified` | `true` | `false` |
| `rating` | `4.8` | *absent* |
| `reviewCount` | — | *absent* |
| `analytics.connected` | `true` | `false` |
| `analytics.impressions/clicks/ctr/avgPosition` | `1240 / 342 / 27.5 / 3.2` | `0` |
| `analytics.provider` | `'nexus'` | *absent* |
| `integrations.googleBusinessProfile.linked` | `false` | `false` *(inchangé — déjà juste)* |

Conserver en revanche ce qui vient réellement de la configuration du tenant
(`identityDefaults.name`, `site.*`, `organization.*`, `restaurant.*`) : ce sont des
réglages, pas des mesures inventées.

> **Risque : faible.** `OverviewTab.tsx:22` et `AnalyticsTab.tsx:14` gèrent **déjà**
> l'absence avec un repli à zéro (commenté « reality check »). Ils afficheront donc 0
> — comportement correct — sans modification.

##### Étape 2 — Rendre l'état « non connecté » atteignable · S

`components/seo/GoogleProfileCard.tsx`

Remplacer la condition d'affichage : ce n'est pas l'absence de profil qui doit
déclencher l'état vide, mais l'absence de **liaison Google**.

```
const isLinked = profile?.integrations?.googleBusinessProfile?.linked === true;
if (!profile || !isLinked) → bloc « Profil non connecté » + bouton « Connecter »
```

Le bouton devient visible. Il reste inerte jusqu'à l'étape 3 : le **désactiver
explicitement** avec la mention « Intégration en cours de déploiement » plutôt que de
le laisser cliquable sans effet. Un bouton désactivé et expliqué est honnête ; un
bouton actif qui ne fait rien ne l'est pas.

##### Étape 3 — Les trois éléments, véridiques · S

Toujours dans `GoogleProfileCard.tsx`, état connecté :

| Élément | Règle d'affichage |
|---|---|
| **Établissement** | `profile.name` — déjà réel, vient de l'identité du tenant |
| **Note moyenne** | Affichée **uniquement** si `rating` est défini. Sinon : « Non disponible », sans étoile |
| **Dernière sync** | Affichée si `lastSync` existe. Sinon : « Jamais synchronisé » |

Le badge « Vérifié / En attente » suit `isVerified`, qui ne vaut plus `true` par défaut.

##### Étape 4 — Intégration OAuth · **XL** · chantier séparé

Prérequis externes : projet Google Cloud, écran de consentement, scope
`https://www.googleapis.com/auth/business.manage`, établissement revendiqué côté Google.

1. **`POST /api/integrations/google/connect`** — démarre le flux. Génère un `state`
   anti-CSRF lié au tenant, renvoie l'URL d'autorisation. Auth : `requireTenantAdmin`.
2. **`GET /api/integrations/google/callback`** — vérifie le `state`, échange le code
   contre les jetons. **Les jetons ne transitent jamais par le client** et sont stockés
   chiffrés sous `tenants/{tenantId}/…` (respect de `SovereignGuard`).
3. **Rafraîchissement** du jeton d'accès avant expiration, avec gestion du refus
   (consentement révoqué côté Google → repasser `linked: false`, l'écran retombe
   naturellement sur l'état de l'étape 2).
4. À la liaison réussie : écrire `integrations.googleBusinessProfile.linked: true` et
   l'identifiant d'établissement dans `seoProfiles`.

> Suivre le modèle de la route `POST /api/billing/portal` livrée en §3.1 :
> `requireTenantAdmin`, validation de l'URL de retour contre `NEXT_PUBLIC_APP_URL`,
> message d'erreur exploitable par le gérant.

##### Étape 5 — Synchronisation · M · dépend de l'étape 4

`GoogleProfileCard.tsx:79` — bouton « Synchroniser maintenant ».

1. **`POST /api/integrations/google/sync`** — lit note, nombre d'avis et statistiques
   de visibilité via l'API Google, écrit dans `seoProfiles`, horodate `lastSync`.
2. Brancher le bouton : état de chargement, **erreur affichée** en cas d'échec
   (jamais de `catch` muet — cf. §10.3), rafraîchissement de la carte au retour.
3. Envisager une synchronisation planifiée (`lib/cron/`) — mais le déclenchement
   manuel doit rester possible.

##### Étape 6 — Vérifications

- [ ] Sans profil lié : aucune note, aucune statistique non nulle à l'écran
- [ ] Sans profil lié : l'état « Profil non connecté » s'affiche bien
- [ ] `OverviewTab` et `AnalyticsTab` affichent 0 sans planter
- [ ] Après liaison : les chiffres affichés proviennent de l'API, pas d'un repli
- [ ] Révocation côté Google → retour propre à l'état non connecté
- [ ] `npx tsc --noEmit` = 0 · `npx vitest run` vert
- [ ] `npm run measure` : la mesure « Métriques chiffrées codées en dur » doit **baisser**

##### Ordre et découpage

**Étapes 1 → 3 : à faire maintenant** (≈ 1 h cumulée). Elles arrêtent l'affichage de
fausses données et rendent le bouton atteignable — sans dépendre d'aucune brique externe.
**Étapes 4 → 5 : chantier séparé**, à planifier avec les accès Google Cloud.

---

#### 6.B — Autres contrôles du lot

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 6.3 | `…/seo/tabs/OverviewTab.tsx:73` | Modifier (vue d'ensemble) | `onEdit` vide → brancher sur l'éditeur SEO | S |
| 6.4 | `…/seo/tabs/PagesTab.tsx:29` | Modifier une page | Édition des métadonnées de page | M |
| 6.5 | `app/(client)/(ops)/marketing/seo/page.tsx:68` | Action d'en-tête | Intention à identifier | S |

### Lot 7 — Coque applicative & réglages · 6 contrôles

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 7.1 | `shared/components/layout/MobileHeader.tsx:73` | Recherche mobile | **Visible sur tous les écrans en format téléphone.** Ouvrir la recherche globale si elle existe, sinon retirer. | M |
| 7.2 | `shared/components/settings/GoalsSettings.tsx:245` | Interrupteur d'alerte | Un interrupteur qui ne bascule pas. Brancher sur `alert.status` + persistance. **Croiser avec les 177 « réglages déclarés non lus »**. | S |
| 7.3 | `shared/components/ui/NotificationPanel.tsx:304` | Action rapide | Intention à identifier. | S |
| 7.4 | `shared/nexus/components/mind-map/MindMapControls.tsx:13` | Plein écran | `requestFullscreen()`. | S |
| 7.5 | `…/MindMapControls.tsx:28` | Vue 3D | Probablement à retirer (pas de rendu 3D identifié). | S |
| 7.6 | `…/MindMapSidebar.tsx:56` | Dépendances profondes | Action principale de la colonne. Définir ou retirer. | M |

### Lot 8 — Ops divers · 4 contrôles

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 8.1 | `ops/workflow/engine/components/OperationsDashboard.tsx:221` | Flèche de renvoi | Router vers l'écran de détail. | S |
| 8.2 | `ops/service/pms/PmsPage.tsx:119` | Imputer une note | Imputation sur une chambre — **logique métier hôtelière**, modèle à vérifier. | L |
| 8.3 | `intelligence/analytique/analytics/components/ProfitabilityView.tsx:99` | Sélecteur de période | Filtrer réellement les données. | M |
| 8.4 | `human/…/staff/StaffRecentActivity.tsx:16` | Historique complet | Router vers l'historique, ou retirer. | S |

### Lot 9 — Pages publiques · 5 contrôles

| # | Fichier:ligne | Contrôle | À faire | Effort |
|---|---|---|---|---|
| 9.1 | `app/(client)/(public)/landing/components/LandingNavbar.tsx:68` | Demander une démonstration | **Appel à l'action principal — aucune conversion possible.** Formulaire, ou lien de prise de rendez-vous. | M |
| 9.2 | `app/(client)/(public)/showcase/page.tsx:103` | Déployer la Flotte | Intention à clarifier (vocabulaire MCC sur une page vitrine tenant — probablement une erreur de contenu). | M |
| 9.3 | `commerce/acquisition/onboarding/wizard/OCRUploadZone.tsx:101` | Parcourir | `<input type="file">` déclenché — même schéma que l'ajout de CV déjà livré (§3.3). | S |
| 9.4 | `app/(client)/(public)/groups/components/EventCard.tsx:65` | Ouvrir un événement | Router vers le détail. | S |
| 9.5 | `app/(client)/(public)/groups/page.tsx:87` | Action d'en-tête | Intention à identifier. | S |

---

## 5. Faux positifs — NE PAS « corriger »

| Emplacement | Pourquoi c'est légitime |
|---|---|
| `shared/components/settings/BrandingPanel.tsx:588,598` | **Aperçus de charte** (commentaire `Action Button Preview`) : ils montrent le rendu d'un réglage, ils ne l'appliquent pas |
| `shared/components/settings/brand-import/PreviewStep.tsx:69` | Même nature — aperçu d'import de charte |
| `app/(client)/(ops)/pos-mobile/page.tsx:18` | Occurrence dans un **commentaire**, pas un bouton |
| `human/…/RecruitmentBoard.tsx:304` | `<DragOverlay>` — **aperçu fantôme** du glisser-déposer, non interactif par nature. Commentaire ajouté |
| `human/…/staff/StaffList.tsx:52` | Chevron dans une carte cliquable : fonctionne **par propagation**. Sécurisé avec un `onClick` explicite + `aria-label` |

## 6. Chaînes mortes — à monter ou à supprimer, pas à câbler

| Emplacement | Situation |
|---|---|
| `commerce/…/new-reservation/CustomerSearchStep.tsx:57` | `NewReservationDialog` n'est monté **nulle part** (exporté par le barrel uniquement) — voir plan 6.A |
| `app/(client)/(public)/groups/components/GroupFilters.tsx:73` | Même situation |

### 6.A — Parcours « nouvelle réservation » : plan de décision

**Mesuré le 2026-08-27.** Il existe **deux parcours de création de réservation**, et
c'est le moins riche qui est en service :

| Parcours | Volume | État |
|---|---|---|
| `ReservationCreateDialog.tsx` + `reservation-create/` (`ResaStepCustomer`, `ResaStepDetails`, `ResaSummaryPanel`, `reservationHelpers`) | 202 l. + 4 fichiers | ✅ **En service** — monté dans `app/(client)/(ops)/reservations/page.tsx:139` |
| `NewReservationDialog.tsx` + `new-reservation/` (`ReservationHeader`, `CustomerSearchStep`, `ReservationDetailsStep`, `CustomerIntelligenceSidebar`) | 106 l. + 401 l. | ❌ **Jamais monté** — seulement ré-exporté par `components/index.ts:3` |

**Ce que le parcours mort a en plus** : `CustomerIntelligenceSidebar` — un panneau
d'intelligence client affiché pendant la prise de réservation, absent du parcours en service.

**Ce qui manque aux deux** : la **création d'une fiche client**. `ResaStepCustomer`
(en service) n'expose aucune action de création ; `CustomerSearchStep` (mort) en propose
une — mais inerte, et invisible. Autrement dit : **aujourd'hui, un client introuvable
bloque la prise de réservation dans les deux parcours.** C'est le vrai défaut,
et il survit à la décision ci-dessous.

#### Option A — Récupérer et supprimer *(recommandée)*

1. Porter `CustomerIntelligenceSidebar` dans `ReservationCreateDialog` (le parcours en service).
2. Ajouter la **création de fiche client** dans `ResaStepCustomer` : bouton actif →
   formulaire minimal (nom, téléphone, e-mail) → écriture dans `customers` →
   sélection automatique du client créé. C'est le correctif qui débloque réellement le parcours.
3. Supprimer `NewReservationDialog.tsx`, le dossier `new-reservation/` et la ligne
   d'export `components/index.ts:3` (**~507 lignes** retirées).
4. Vérifier qu'aucun test ne référence les chemins supprimés.

**Effort : M.** Gain : un seul parcours à maintenir, la dette morte disparaît, le blocage
client est levé.

#### Option B — Basculer sur le parcours riche

Monter `NewReservationDialog` à la place de `ReservationCreateDialog`, brancher son
bouton « Créer une Fiche », puis supprimer l'ancien parcours.

**Effort : L.** Plus risqué : le parcours mort n'a jamais tourné en production —
son intégration à la page (`onSave`, `customers`, `tables`, `terraceClosed`) est à
refaire et à retester intégralement.

> **Recommandation : option A.** Elle conserve le code éprouvé, récupère la seule
> vraie plus-value du parcours mort, et traite le blocage client. L'option B repart
> d'un code que personne n'a jamais exécuté.

#### Vérifications

- [ ] Un client introuvable peut être créé sans quitter la prise de réservation
- [ ] Le client créé est immédiatement sélectionnable
- [ ] `npm run measure` : « Composants sans consommateur » doit **baisser**
- [ ] `npx tsc --noEmit` = 0 · `npx vitest run` vert

## 7. Composants jamais montés contenant des boutons morts (11)

Invisibles : à supprimer ou à monter, décision produit.

- `commerce/…/marketing/ScheduledPostItem.tsx`
- `commerce/…/marketing/NewPostModal.tsx`
- `compliance/qualite/haccp/components/haccp/WasteManagementHACCP.tsx`
- `finance/components/accounting/views/SimpleDashboardView.tsx`
- `finance/components/accounting/views/PlaceholderViews.tsx` (4 boutons)

---

## 8. Chantiers de sécurité — plans de construction

### 8.A — WebAuthn : authentification par passkey

**Ce qui a été mesuré.** `src/app/api` ne contient **aucune** route d'authentification
(ni `auth/`, ni `mfa/`, ni `webauthn/`, ni `passkey/`).
`modules/compliance/securite/MfaChannelsService.ts` ne gère que *quels canaux sont
activés* (`sms | email | totp | webauthn | backup`), pas l'enrôlement ni la vérification
de credentials.

**Le défaut concret.** `shared/components/biometrics/PasskeyStepUpModal.tsx:52` appelle
`navigator.credentials.get()` **sans `allowCredentials`** et **sans vérification serveur
de l'assertion** : il déclenche le capteur, puis accepte le résultat localement
(`if (credential) → onSuccess()`).

Ce composant est monté dans `app/(client)/(ops)/mon-espace/page.tsx:276` et garde
**l'accès au coffre-fort RH** — export des bulletins de paie et contrats de travail
(`actionTitle: "Accès Sécurisé au Coffre-Fort RH"`).

> Conséquence : **n'importe quelle passkey présente sur l'appareil** — y compris
> enregistrée pour un tout autre site — fait passer le contrôle et ouvre les documents
> RH. Le repli PIN (`verifyPin`) est, lui, réellement vérifié ; c'est la voie biométrique
> qui ne l'est pas. Défaut **préexistant**, pas une régression.

#### Étape 1 — Enrôlement (attestation) · L

`POST /api/auth/webauthn/register/options` puis `.../register/verify`.

- Challenge **généré et stocké côté serveur**, à usage unique et daté.
- Vérifier l'attestation, extraire la clé publique et le `credentialId`.
- Stocker sous `tenants/{tenantId}/…` (respect de `SovereignGuard`) : `credentialId`,
  clé publique, `signCount`, `userId`, date, libellé d'appareil.
- Auth : session établie exigée — on n'enrôle que pour soi.

#### Étape 2 — Vérification (assertion) · L

`POST /api/auth/webauthn/authenticate/options` puis `.../verify`.

- `allowCredentials` **restreint aux credentials de l'utilisateur courant**.
- Challenge serveur à usage unique.
- Vérifier la signature contre la clé publique stockée.
- **Contrôle anti-rejeu** : `signCount` reçu > `signCount` stocké, puis incrémenter.
- Refuser tout credential appartenant à un autre tenant.

#### Étape 3 — Corriger `PasskeyStepUpModal` · M · **priorité**

Remplacer l'acceptation locale par l'appel à l'étape 2. Tant que ce n'est pas fait, le
step-up biométrique **n'apporte aucune garantie** : envisager de **masquer la voie
biométrique** et de ne laisser que le PIN, qui lui est vérifié.

#### Étape 4 — Connexion initiale par passkey · **arbitrage requis**

Faut-il offrir la passkey à la connexion (`PinLogin`), sur un modèle « appareil de
confiance » ? C'est une décision de sécurité sur un socle NF525 — **à trancher avec le
responsable, pas seul**. Si oui : restaurer le bouton retiré (§3.5) en le branchant sur
la vraie vérification.

#### Étape 5 — Tests

- [ ] Enrôlement puis vérification réussie
- [ ] **Rejeu refusé** (`signCount` non incrémenté)
- [ ] Credential d'un **autre tenant** refusé
- [ ] Credential d'un **autre utilisateur du même tenant** refusé
- [ ] Consentement retiré / capteur absent → repli PIN propre

### 8.B — Rappel des autres chantiers connexes

- **OAuth Google Business Profile** — Lot 6, étapes 4–5
- **200 erreurs potentiellement avalées** (`npm run measure`) — un `catch` vide donne
  la même sensation qu'un bouton mort (§1.3)
- **107 risques responsive** — un contrôle hors écran est inatteignable sans être inerte

## 9. Ordre d'exécution recommandé

1. **Lot 2** (réception) — critique, traçabilité alimentaire, effort faible
2. **Lot 1** (plan de salle) — l'écran d'où est parti le signalement
3. **Lot 3** (cuisine) — édition/suppression attendues au quotidien
4. **Lots 4, 5, 8** — gains rapides, majorité en S
5. **Lot 7** — 7.1 d'abord (visible sur tout mobile)
6. **Lot 9** — 9.1 en priorité (conversion commerciale)
7. **Lot 6** — **étapes 1→3 en priorité** (l'écran SEO affiche aujourd'hui une note et des statistiques inventées), puis 6.3/6.4/6.5 ; OAuth en chantier séparé
8. **§6 et §7** — décisions produit (monter ou supprimer)

**En parallèle, par ordre d'urgence :**

1. **§8.A étape 3** — corriger `PasskeyStepUpModal`. Le step-up biométrique qui garde
   les bulletins de paie n'authentifie rien aujourd'hui. À traiter en premier, avant
   même les lots de boutons.
2. **Lot 6 étapes 1→3** — l'écran SEO affiche une note et des statistiques inventées.
3. **§6.A** — trancher le doublon du parcours réservation (option A recommandée) et
   débloquer la création de fiche client.
4. **§8.A étapes 1–2 et 4–5** — WebAuthn de bout en bout (dont l'arbitrage sur la
   connexion initiale).
5. **Lot 6 étapes 4–5** — OAuth Google Business Profile.
6. **§1.3** — les 200 erreurs avalées et les 107 risques responsive, qui demandent une
   sonde au clic dans un navigateur réel.

## 10. Règles de travail

1. **Construire si faisable avec l'existant, sinon retirer.** Un bouton retiré vaut
   mieux qu'une promesse morte. Décision actée avec le propriétaire du produit.
2. **Jamais de stub déguisé.** Pas de `toast('Bientôt disponible')` ni de `return true`.
3. **Jamais d'échec silencieux.** Tout gestionnaire qui peut échouer affiche sa raison
   — c'est ce qui distingue un bouton mort d'un bouton cassé, et les deux se ressemblent
   à l'usage.
4. **Microunits obligatoires** pour tout montant (`1 € = 1 000 000 µ`).
5. **Multi-tenant** : écritures via `Nexus.getTenantPath()` ou les constantes de
   `COLLECTIONS`, jamais de chemin en dur.
6. **Cible tactile ≥ 44 px** : ces écrans se manipulent sur tablette en plein service.
7. **`aria-label` sur tout bouton à icône seule** — la majorité des cas de ce document.
8. Après chaque lot : `npx tsc --noEmit` (0 erreur) puis `npx vitest run`.

## 11. Reproduire la mesure

```bash
npm run measure          # mesures permanentes du dépôt
npx tsc --noEmit         # 0 erreur tolérée
npx vitest run
```

Le scanner de boutons et le calcul d'atteignabilité transitive vivent dans le
scratchpad de session (jetables). Pour en faire une mesure permanente, les porter
sous `scripts/measure/` en respectant la convention de nommage (`measure-` = pur et
rapide, `gate-` = décide et sort en erreur) — et **ne jamais relever un seuil**
(Loi 2, `verify-gate-integrity.mjs` le refuse).
