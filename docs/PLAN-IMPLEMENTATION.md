# RESTAURANT-OS-CORE — Plan d'implémentation général (ultra-détaillé)

> **Statut** : plan de travail consolidé — branche `grade-x-vanguard`
> **Sources fusionnées** : les 5 cartographies + `gap-analysis` (29 manques) + `blind-spots` (9 angles morts) + `user-lens` (11 rôles RBAC + invité).
> **Méthode** : chaque état actuel a été **vérifié par grep sur `src/`** (voir la leçon [Piège git status D](#annexe-a--pièges-de-méthode-vérifiés)). Aucune absence n'est affirmée sans recherche du nom dans tout le code.
> **Convention** : `Gxx` = manque système · `Bx` = angle mort · `persona` = rôle RBAC servi.

---

## Sommaire

- [0. Invariants transverses — à respecter dans CHAQUE chantier](#0-invariants-transverses)
- [1. Principes de séquencement](#1-principes-de-séquencement)
- [2. Chemin critique](#2-chemin-critique)
- [Vague 0 — Socle & vérité](#vague-0--socle--vérité)
- [Vague 1 — Conformité fiscale & légale](#vague-1--conformité-fiscale--légale)
- [Vague 2 — Mobilité & parcours invité](#vague-2--mobilité--parcours-invité)
- [Vague 3 — Revenu & rétention](#vague-3--revenu--rétention)
- [Vague 4 — Pilotage & contrôle](#vague-4--pilotage--contrôle)
- [Vague 5 — Expérience & plateforme](#vague-5--expérience--plateforme)
- [Matrice de traçabilité](#matrice-de-traçabilité)
- [Annexes](#annexe-a--pièges-de-méthode-vérifiés)

---

## 0. Invariants transverses

> Ces cinq contraintes s'appliquent à **tous** les chantiers. Un chantier qui les viole est refusé en revue, quelle que soit sa valeur métier.

### 0.1 — Microunits obligatoire
- `1 µunit = 0,000 001 €` (1 000 000 µ = 1 €). Tout montant en `*InMicrounits`, **jamais** `*InCents` dans le nouveau code.
- Cast via `toMicrounits()` depuis `@/domain/schemas/primitives` — jamais `as Microunits`.
- Type branded `Microunits` : `MicrounitsSchema = z.number().int().min(0).brand<'Microunits'>()`.
- **Dette identifiée** : `CashDrawerModal` (`closingAmountInCents`, `cashCollectedInCents`) et `usePos` legacy sont encore en cents → chantier **C0.2**.

### 0.2 — NF525 : immuabilité fiscale
- `journalEntries`, `fiscalSeals`, `fiscalLedger` : **jamais delete, jamais update**.
- Toute vente POS passe par `FinancialNexusBridge.processOrder()` → `JournalEntry` + `FiscalSeal` chaîné (SHA-256 de `dataSnapshot + previousHash` via `CryptoService`).
- Le mode formation existe (`FiscalEngine.isTrainingMode`, `TRAINING_MODE_HASH`) : toute nouvelle écriture doit le propager pour ne pas polluer la chaîne réelle.
- **Corollaire RGPD** : aucun PII en clair dans un `dataSnapshot` scellé (cf. **C1.2**).

### 0.3 — Multi-tenancy Suzerain/Vassal
- Toute écriture Nexus : `tenants/{tenantId}/{collection}/{id}` via `Nexus.getTenantPath()`.
- `tenantId` = `activeTenantId` depuis `useTenant()` — **jamais hardcodé**.
- `SovereignGuard` = barrière cross-tenant : ne jamais la contourner ; ne pas ajouter de collection protégée sans autorisation.

### 0.4 — RBAC
- 11 rôles réels : `super_admin(100) · directeur(90) · manager(70) · comptable(60) · chef_rang(50) · chef_cuisinier(45) · serveur(40) · cuisinier(35) · barman(35) · hotesse(30) · plongeur(10)`.
- Permissions granulaires par page (`POSAction`, `FinanceAction`, `KitchenAction`…) dans `permissions.types.ts` ; niveaux dans `PERMISSION_ROLE_LEVELS`.
- Éditeur admin : `account-settings/page.tsx` + `AccessPolicyManager`.
- **Manque structurant** : couche de *politiques* (SoD, seuils, templates) → chantier **C0.4**.

### 0.5 — Rapatriement & ICM-lite
- Tout nouveau code d'un pilier va dans `src/modules/<pilier>/` (jamais `components/<pilier>/` ni `domain/<pilier>/`).
- Toute nouvelle route déclare son importance-map dans `TaskContext.ts` (`TASK_MAPS` + `resolveTaskContext()`), sinon elle ne charge aucun module.

---

## 1. Principes de séquencement

1. **La conformité d'abord.** Un manque légal (fiscal, RGPD, affichage, droit du travail) expose à une sanction immédiate → priorité sur tout levier de revenu.
2. **Le socle avant les leviers.** RBAC de contrôle, µunits, audit immuable et notifications conditionnent la moitié des chantiers.
3. **Un coup, plusieurs personas.** Le POS mobile débloque serveur + chef de rang + parcours invité d'un seul chantier.
4. **Coût croissant = urgence.** Le seul chantier dont le coût *augmente avec l'attente* (pseudonymisation NF525×RGPD, **C1.2**) passe en tête des décisions.

---

## 2. Chemin critique

```
C0.4 RBAC contrôle ─► C4.1 Achats 3-way + AP/SEPA ─► C4.5 Détection fraude
C1.2 Décision RGPD×NF525 ─► C3.1 Fidélité + cartes cadeaux ─► C3.1b Passif comptable
C2.1 POS handheld ─► C1.1 TVA mode conso ─► C2.2 Parcours invité
C0.3 Audit immuable ─► C4.5 Détection fraude
```

**Décision n°1, avant toute ligne de code** : trancher la stratégie de pseudonymisation (**C1.2**). Chaque jour d'historique scellé avec PII en clair rend l'effacement client ultérieur plus coûteux.

---

# Vague 0 — Socle & vérité
**Thème** : fondation transverse · **Durée** : ~3–4 semaines · **Personas** : tous.
**Pourquoi maintenant** : ces quatre chantiers conditionnent la moitié des vagues suivantes ; deux sont des gains rapides (VAPID, µunits partiel) à fort effet de levier.

---

### C0.1 — Activer les notifications (clés VAPID) `[WebPush / tous personas]` · effort **S**

- **Objectif** : rendre réelles les cascades de notifications déjà câblées mais inertes faute de config.
- **État actuel (vérifié)** : `src/lib/push/webPushService.ts` importe **réellement** `web-push`, expose `saveSubscription`, `sendToUser` (ciblage par rôle via `UserRecord.role`), lit `pushSubscriptions/{userId}`. `src/app/api/push/{send,subscribe}/route.ts` et `usePushSubscription.ts` présents. **Ce n'est plus un no-op.**
- **Manque précis** : les clés VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) ne sont pas configurées → `sendToUser` logge `VAPID keys not configured — skipping` et sort.
- **Spécification** :
  1. Générer une paire VAPID (`npx web-push generate-vapid-keys`).
  2. Injecter les clés en env (dev + prod), documenter dans `.env.example`.
  3. Vérifier le Service Worker d'abonnement côté client (`usePushSubscription`).
  4. Écrire un test d'intégration : abonnement fictif → `sendToUser` → assertion d'appel `web-push`.
  5. Auditer les 3 cascades émettrices : HACCP température hors seuil → chef ; planning publié → équipe ; plat prêt/audit → serveur.
- **RBAC** : le ciblage par rôle doit respecter `PERMISSION_ROLE_LEVELS` (ne pas notifier un plongeur d'un événement finance).
- **Invariants** : abonnements stockés en `tenants/{tenantId}/pushSubscriptions/{userId}` (vérifier le path multi-tenant).
- **Dépendances** : aucune amont. **Débloque** : toutes les alertes par persona des vagues 1–4.
- **DoD** : une notification test arrive sur un device abonné ; les 3 cascades déclenchent en environnement de recette ; `.env.example` à jour.
- **Risques** : permission navigateur refusée (dégrader silencieusement) ; iOS PWA (support Web Push limité — documenter).

---

### C0.2 — Discipline µunits : migrer le flux caisse `[B3 / G2]` · effort **M**

- **Objectif** : éliminer la fuite cents ↔ microunits, en commençant par le flux caisse.
- **État actuel (vérifié)** : `CashDrawerModal` (`modules/commerce/ui/pos/`) calcule `theoreticalCents = openingAmountInCents + cashCollectedInCents - changeGivenInCents` vs `actualCents`. `usePos` legacy est aussi en cents (bridge partiel via `toMicrounits`).
- **Manque précis** : les champs `*InCents` violent l'invariant 0.1 ; chaque frontière cents/µunits est un risque d'arrondi fiscal.
- **Spécification** :
  1. Introduire `*InMicrounits` sur le modèle de session caisse ; garder un adaptateur de lecture rétro-compatible pour l'historique.
  2. Convertir à la frontière UI uniquement (affichage €) via `formatMicrounits()`, pas dans la logique.
  3. Migration de données : script one-shot `cents * 10_000 → µunits` sur les sessions existantes (idempotent, tracé).
  4. Cartographier **tous** les `*InCents` restants (`rg "InCents" src`) et créer une checklist de sortie progressive.
- **RBAC** : inchangé.
- **Invariants** : µunits (0.1) ; les écritures de caisse qui alimentent `journalEntries` doivent être en µunits scellées (0.2).
- **Dépendances** : **débloque** C4.2 (caisse avancée) et fiabilise tout calcul fiscal.
- **DoD** : zéro `*InCents` dans le flux caisse ; tests de conversion aux bornes (arrondi, montant nul, gros montant) ; parité comptable avant/après migration.
- **Risques** : régression d'arrondi sur historique — geler la migration derrière un flag + réconciliation.

---

### C0.3 — Journal d'audit système immuable `[G28]` · effort **M**

- **Objectif** : tracer *qui a modifié quoi* de façon inaltérable, à l'échelle du système, + analyser les overrides.
- **État actuel (vérifié)** : `StaffAuditLog` (RH) et `ImmunityAuditLogger` (`lib/services/`) existent, mais l'audit est partiel (RH) et non-analysé.
- **Manque précis** : pas d'audit système-wide (toutes collections sensibles) ni d'analytique des overrides PIN.
- **Spécification** :
  1. Définir un schéma Zod `AuditEvent { actorId, actorRole, action, collection, entityId, before?, after?, tenantId, ts, sealed }` — append-only.
  2. Intercepter au niveau `NexusInterceptor` les écritures sur collections sensibles (finance, staff, settings, RBAC) → émission d'`AuditEvent`.
  3. Immuabilité type NF525 : chaînage de hash léger (réutiliser `CryptoService`).
  4. Vue d'exploitation : filtres par acteur/collection/période ; focus overrides (chaque PIN `PinModal` → `AuditEvent` typé `override`).
- **RBAC** : lecture réservée `manager+` (≥70) ; écriture système only (jamais UI directe).
- **Invariants** : `tenants/{tenantId}/auditLog/...` ; append-only (0.2 par analogie).
- **Dépendances** : **débloque** C4.5 (détection fraude) et l'analytique RBAC de C0.4.
- **DoD** : toute modif d'une collection sensible produit un `AuditEvent` scellé ; la vue overrides liste les PIN des 30 derniers jours ; impossible de supprimer un event.
- **Risques** : volume (prévoir rétention/rollup) ; ne pas logger de PII en clair (cf. C1.2).

---

### C0.4 — Plan de contrôle RBAC : SoD + seuils + templates `[G27]` · effort **L**

- **Objectif** : ajouter la couche de *politiques* au-dessus du RBAC granulaire existant.
- **État actuel (vérifié)** : `permissions.types.ts` (rôles, niveaux, actions par page), `AccessPolicyManager`, `account-settings/page.tsx` (éditeur rôle → catégories). Atomes présents ; politiques absentes.
- **Manque précis** :
  - **Séparation des tâches (SoD)** : le même utilisateur ne doit pas réceptionner *et* approuver la facture *et* payer.
  - **Seuils d'approbation** : commande &gt; X €, remise &gt; Y % → validation d'un rôle supérieur.
  - **Templates de rôles métier** : bundles prêts (Serveur, Chef, Manager) au lieu de cocher catégorie par catégorie.
- **Spécification** :
  1. Modèle `Policy { id, type: 'sod'|'threshold'|'template', rule, scope, tenantId }`.
  2. SoD : matrice de tâches incompatibles (reception ⊗ invoiceApproval ⊗ payment) évaluée à l'exécution d'une action.
  3. Seuils : hook `useActionPermission` étendu pour consulter les seuils (`amount`, `discountPct`) et exiger une élévation (PIN d'un rôle ≥ requis).
  4. Templates : `RoleTemplate` sérialisé → applique un set de catégories/actions en un clic dans `account-settings`.
  5. Toute décision de politique → `AuditEvent` (C0.3).
- **RBAC** : édition des politiques réservée `directeur+` (≥90).
- **Invariants** : multi-tenant (politiques par tenant) ; MCC peut pousser des templates de flotte (cf. C5.4).
- **Dépendances** : **débloque** C4.1 (achats SoD), C4.2 (comptage manager), C4.5 (fraude). S'appuie sur C0.3 (audit).
- **DoD** : une action au-dessus d'un seuil exige une élévation tracée ; une violation SoD est bloquée + auditée ; 3 templates métier applicables ; tests unitaires sur l'évaluateur de politiques.
- **Risques** : sur-blocage opérationnel (prévoir un mode « warn » avant « enforce ») ; complexité — livrer SoD achats d'abord, seuils ensuite.

---

# Vague 1 — Conformité fiscale & légale
**Thème** : le non-négociable · **Durée** : ~6 semaines · **Personas** : directeur, manager, comptable, RH, invité.
**Pourquoi maintenant** : chaque item est une exposition légale directe ; **C1.2** doit être tranché avant d'accumuler de l'historique.

---

### C1.1 — TVA selon le mode de consommation `[B1]` · effort **M**

- **Objectif** : appliquer le bon taux de TVA par ligne selon *sur place / à emporter* (règle fiscale française).
- **État actuel (vérifié)** : `TaxRateSchema = z.enum(['0.055','0.10','0.20'])` présent. **Aucun** champ `surPlace/emporter/consumptionMode` dans `orders.ts`, `pos.ts`, ni `modules/ops/engine/types.ts`.
- **Manque précis** : même produit → 10 % sur place / 5,5 % à emporter / 20 % sur l'alcool. Rien ne pilote le taux par mode.
- **Spécification** :
  1. Ajouter `consumptionMode: z.enum(['dine_in','takeaway'])` au niveau **commande** (défaut configurable par établissement) + override **par ligne**.
  2. Table de résolution `{ productCategory, consumptionMode } → TaxRate` (l'alcool reste 20 % quel que soit le mode).
  3. Recalcul `taxAmountInMicrounits` par ligne dans `OrderLineSchema` ; propager au `PosTicket` et à `FinancialNexusBridge.processOrder()`.
  4. UI POS : toggle sur place/emporter au niveau ticket, override ligne pour les cas mixtes.
  5. Ticket & JournalEntry : ventilation TVA multi-taux sur un même ticket.
- **RBAC** : `POSAction` — le serveur peut basculer le mode ; l'override de taux d'une ligne peut exiger `chef_rang+`.
- **Invariants** : µunits (recalcul en µunits) ; NF525 (le mode conso fait partie du `dataSnapshot` scellé) ; `taxAmountInMicrounits <= amountInMicrounits` (refine existant dans `finance.ts`).
- **Dépendances** : **débloque** C2.2 (parcours invité, tickets justes). Prérequis d'un ticket dématérialisé correct.
- **DoD** : un même ticket avec un plat (10 % dine-in) + un café à emporter (5,5 %) + un verre de vin (20 %) produit 3 lignes de TVA correctes, scellées ; export FEC cohérent.
- **Risques** : catégorisation produit incomplète → prévoir un taux par défaut + alerte de config.

---

### C1.2 — Décision RGPD × NF525 : pseudonymisation des PII `[G29]` · effort **M** (mais **décision urgente**)

- **Objectif** : résoudre la tension entre l'immuabilité NF525 et le droit à l'effacement RGPD.
- **État actuel (vérifié)** : pages légales (`/legal/rgpd`, `/legal/mentions`), anonymisation recrutement (`useRecruitment`, `IdentityGuardService`). **Pas** de workflow d'effacement client de bout en bout.
- **La tension** : on ne peut pas supprimer une écriture NF525 (chaîne de hash), mais le RGPD impose l'effacement des PII client. Un client ayant payé est à la fois dans une écriture inaltérable *et* un sujet de données effaçable.
- **Décision architecturale** : **pseudonymisation**. L'écriture fiscale reste scellée et chaînée ; les PII (nom, email, téléphone) sont **détachées derrière une clé** détruite à l'effacement. Le montant, la TVA et le hash survivent ; l'identité devient irrécupérable.
- **Spécification** :
  1. **Audit immédiat** : `rg` de toute PII sérialisée dans un `dataSnapshot` scellé (`FinancialNexusBridge`, `FiscalAdapter`). Objectif : **zéro PII en clair** dans le scellé.
  2. Introduire un `piiVault` : `tenants/{tenantId}/piiVault/{subjectId}` chiffré par clé par-sujet ; les écritures ne référencent que `subjectId` + champs non-PII.
  3. Workflow effacement : demande client → destruction de la clé du sujet → PII irrécupérables, écritures fiscales intactes.
  4. Propagation : CRM → commandes → marketing → tous les points où le `subjectId` apparaît.
- **RBAC** : déclenchement effacement réservé `directeur+` ou `comptable` (DPO) ; tracé en C0.3.
- **Invariants** : NF525 (0.2) intact ; multi-tenant (vault par tenant).
- **Dépendances** : **débloque** C3.1 (fidélité/cartes cadeaux = données client durables) et l'effacement CRM. **Prérequis de méthode** de tout nouveau stockage de PII.
- **DoD** : un effacement client rend les PII irrécupérables tout en préservant la chaîne fiscale vérifiable ; aucun nouveau `dataSnapshot` ne contient de PII en clair ; procédure DPO documentée.
- **Risques** : **coût croissant avec l'attente** — plus on scelle de PII en clair, plus la remédiation est lourde. À trancher **avant** les autres chantiers data.

---

### C1.3 — NF525 : clôtures périodiques + JET `[B7]` · effort **M**

- **Objectif** : compléter les obligations NF525 au-delà du Z journalier.
- **État actuel (vérifié)** : clôture **journalière** via `EndOfDayWizard` ; **mode formation** géré (`FiscalEngine.isTrainingMode`, `TRAINING_MODE_HASH`) ; scellés chaînés OK.
- **Manque précis (à confirmer puis combler)** : clôtures **mensuelle** et **annuelle** obligatoires + **Journal des Événements Techniques (JET)** formel (coupures, corrections, changements d'heure, restaurations).
- **Spécification** :
  1. Clôtures périodiques : agrégats scellés `PeriodClosure { period: 'M'|'A', grandTotalPerpetuel, cumuls, previousHash, tenantId }`, chaînés comme les seals.
  2. JET : journal append-only des événements techniques ; réutiliser/étendre `ImmunityAuditLogger` (C0.3) avec les types d'événements NF525.
  3. Grand total perpétuel : compteur cumulé inaltérable, vérifié à chaque clôture.
  4. Rapport de clôture exportable (archivage légal 6 ans).
- **RBAC** : clôture mensuelle/annuelle `directeur+` ou `comptable`.
- **Invariants** : NF525 (0.2), multi-tenant.
- **Dépendances** : s'appuie sur C0.3 (JET). Complète l'audit fiscal (`FiscalAuditView`).
- **DoD** : clôtures M/A scellées et chaînées ; JET liste les événements techniques ; grand total perpétuel cohérent ; export d'archivage.
- **Risques** : divergence de cumuls → réconciliation automatique + alerte.

---

### C1.4 — Résilience fiscale hors-ligne `[G1]` · effort **M**

- **Objectif** : maintenir le service ET la continuité NF525 quand Firestore est injoignable.
- **État actuel (vérifié)** : `OfflineMasteryEngine` bufferise les transactions et gère une file de sync ; cache local-first IndexedDB.
- **Manque précis** : garantir que la **chaîne de scellement** reste cohérente offline (hash chaîné local) puis se réconcilie sans trou ni collision de `receiptNumber`.
- **Spécification** :
  1. Sceller localement (le hash chaîné est calculable hors-ligne via `CryptoService`) avec une file d'attente ordonnée.
  2. Allocation de `receiptNumber` sûre hors-ligne (plage réservée par device/instance, cf. `instanceId` dans `FiscalEngine`).
  3. Réconciliation à la reconnexion : rejouer la file dans l'ordre, détecter/résoudre les conflits, vérifier l'intégrité de chaîne.
  4. Indicateur UI d'état (online/dégradé/resync).
- **RBAC** : inchangé.
- **Invariants** : NF525 (0.2) — pas de trou dans la chaîne ; µunits ; multi-tenant.
- **Dépendances** : indépendant ; complète C1.3.
- **DoD** : une vente encaissée hors-ligne est scellée localement puis réconciliée sans rupture de chaîne ; test de coupure réseau en plein service.
- **Risques** : collision de numéros entre devices → plages disjointes obligatoires.

---

### C1.5 — Affichages FR obligatoires + allergènes/nutri client `[B5, B6]` · effort **M**

- **Objectif** : couvrir les obligations d'affichage réglementaire français.
- **État actuel (vérifié)** : allergènes gérés **en interne** (recipe-editor, cuisine). **Aucun** doggy bag, fait maison, origine viandes, don alimentaire, ni affichage client allergènes/nutri-score.
- **Manque précis** : obligations légales — doggy bag (loi AGEC), logo fait maison, origine des viandes, INCO (allergènes + nutri-score/calories au-delà d'un seuil de sites).
- **Spécification** :
  1. Champs produit : `faitMaison: boolean`, `meatOrigin?: string`, `allergens: Allergen[]` (déjà interne → exposer), `nutrition?: { kcal, ... }`.
  2. Affichage client : sur le menu QR (C2.2) — filtre allergènes, badge fait maison, origine viandes, nutri-score.
  3. Doggy bag : option à l'encaissement + traçabilité anti-gaspillage ; don alimentaire (partenaire) journalisé.
  4. Rattacher au pilier Registres/Compliance pour la preuve.
- **RBAC** : configuration `manager+` ; affichage public (invité).
- **Invariants** : multi-tenant ; rattachement Registres.
- **Dépendances** : l'affichage client dépend de C2.2 (menu QR). Indépendant côté données.
- **DoD** : menu client affiche allergènes filtrables + fait maison + origine viandes ; doggy bag proposable ; conformité INCO vérifiée.
- **Risques** : données nutritionnelles à saisir (charge cuisine) → import/estimation assistée.

---

### C1.6 — Conformité RH : repos, DPAE, registre, certifs, licences `[G15, G17, G23, G24]` · effort **L**

- **Objectif** : couvrir la conformité sociale et documentaire de l'exploitation.
- **État actuel (vérifié)** : planning (`PlanningWeekView`), pointage (`shiftEntries`), congés, recrutement, `BadgeControl`. Onboarding via `welcome-staff`.
- **Manque précis** :
  - **G15** — moteur de conformité planning : 11 h de repos, 6 j max, amplitude, coupures.
  - **G17** — DPAE, registre unique du personnel, visites médicales, certifications (permis d'exploitation, HACCP) avec échéances.
  - **G23** — calendrier de conformité unifié (agrège toutes les échéances).
  - **G24** — licences (débit de boissons IV, SACEM, terrasse).
- **Spécification** :
  1. Moteur de règles planning évalué à la publication (`useSchedulePublish`) → warnings bloquants/non-bloquants.
  2. Modèles `EmployeeDocument { type, issuedAt, expiresAt, ... }` + `License { type, expiresAt, ... }` ; alertes d'expiration (via C0.1 notifications).
  3. Registre unique du personnel généré depuis `staff`.
  4. Vue calendrier de conformité agrégeant documents RH + licences + révisions DUERP + certifs.
- **RBAC** : `manager+` pour la conformité planning ; `directeur+`/`comptable` pour les licences.
- **Invariants** : multi-tenant ; rattachement Registres.
- **Dépendances** : alertes via C0.1. Alimente C4.3 (labor) et C5.2 (Mon espace).
- **DoD** : un planning non conforme (repos < 11 h) lève un warning à la publication ; une certif à &lt; 30 j déclenche une alerte ; le registre unique s'exporte ; le calendrier liste toutes les échéances.
- **Risques** : paramétrage des règles par convention collective (HCR) → table de règles configurable.

---

### C1.7 — Procédure de retrait-rappel (food recall) `[G13]` · effort **M**

- **Objectif** : sur alerte sanitaire, remonter des lots vers les plats servis et les clients concernés.
- **État actuel (vérifié)** : traçabilité des lots **en entrée** (réception, `ReceptionWizard`, `Preparation.ingredients`, DLC). La traçabilité *entre* mais ne *ressort* pas.
- **Manque précis** : chemin inverse lot → préparations → plats vendus → clients (via commandes).
- **Spécification** :
  1. Index inverse `lotId → preparations → orderLines → orders → subjectId`.
  2. Écran de rappel : saisir un lot/ingrédient incriminé → liste des plats et des couverts impactés.
  3. Notification ciblée (C0.1) au chef + éventuellement information client (via `subjectId`, dans le respect de C1.2).
  4. Journalisation Registres/Compliance de la procédure.
- **RBAC** : déclenchement `chef_cuisinier+`/`manager+`.
- **Invariants** : multi-tenant ; RGPD (accès clients via vault C1.2).
- **Dépendances** : s'appuie sur la traçabilité existante ; clients via C1.2.
- **DoD** : à partir d'un lot, le système liste préparations, plats et couverts impactés en une action ; procédure tracée.
- **Risques** : granularité de traçabilité insuffisante sur certaines préparations → combler côté `Preparation`.

---

# Vague 2 — Mobilité & parcours invité
**Thème** : le canal manquant · **Durée** : ~7 semaines · **Personas** : serveur, chef de rang, invité.
**Pourquoi maintenant** : plus fort effet de levier humain ; le handheld sert d'infrastructure au parcours invité.

---

### C2.1 — POS mobile / handheld `[persona serveur, chef_rang]` · effort **L**

- **Objectif** : prise de commande à la table sur terminal mobile relié au KDS.
- **État actuel (vérifié)** : **zéro** occurrence handheld/mobile-pos. Le POS est lié à une borne (`pos/page.tsx`).
- **Manque précis** : le serveur note sur papier puis ressaisit ou fait l'aller-retour à la borne.
- **Spécification** :
  1. Vue POS responsive/mobile (réutiliser `ProductGrid`, `Cart`, `ModifierModal` de `modules/commerce/ui/pos/`) optimisée tactile.
  2. Session serveur mobile authentifiée (PIN, `PinModal`) ; addition attachée au serveur (ownership → prépare C3.5 tronc et C5.3 handoff).
  3. Envoi direct au KDS (`orders`) sans passer par la borne.
  4. Alerte allergène au moment de la saisie (données C1.5).
  5. Statut « où en est mon plat » depuis le KDS, poussé sur le device (C0.1).
- **RBAC** : `POSAction` par rôle ; le serveur ne voit que ses tables (scoping).
- **Invariants** : µunits ; multi-tenant ; passage obligatoire par `FinancialNexusBridge` à l'encaissement (0.2) ; ICM route `/pos` (déjà mappée).
- **Dépendances** : **débloque** C2.2 (parcours invité), et sert C3.5 (pourboires) + C5.3 (handoff).
- **DoD** : un serveur prend une commande complète depuis un mobile, elle apparaît au KDS, l'allergène s'affiche à la saisie, le statut plat remonte ; encaissement scellé identique à la borne.
- **Risques** : réseau salle (prévoir mode dégradé C1.4) ; sécurité device partagé (session courte + PIN).

---

### C2.2 — Parcours invité : menu QR + commande + paiement à table `[persona invité, B1]` · effort **L**

- **Objectif** : offrir au client un parcours complet à table.
- **État actuel (vérifié)** : widget de réservation + `setup-intent` Stripe. Rien à table.
- **Manque précis** : menu QR, filtre allergènes, commande, paiement à table (split), ticket dématérialisé.
- **Spécification** :
  1. Menu QR par table (deep-link `tenantId` + `tableId`) affichant catalogue + allergènes/nutri (C1.5) + disponibilité (`availability`, cf. C3.3).
  2. Commande client → file de validation serveur (anti-abus) → KDS.
  3. Paiement à table Stripe (split par convive/part) ; TVA multi-taux (C1.1).
  4. Ticket dématérialisé NF525 (le reçu numérique doit référencer le `JournalEntry`/`FiscalSeal`).
  5. Wallet/feedback en sortie (relie C3.1 fidélité + feedback post-visite).
- **RBAC** : accès public restreint au périmètre table ; validation serveur `serveur+`.
- **Invariants** : NF525 (ticket scellé, 0.2) ; µunits ; multi-tenant ; **jamais** de PII en clair dans le scellé (C1.2).
- **Dépendances** : dépend de C2.1 (infra), C1.1 (TVA conso), C1.2 (PII), C1.5 (affichage).
- **DoD** : un client scanne, commande, paie et reçoit un ticket dématérialisé valide ; la commande est validée puis produite ; TVA correcte.
- **Risques** : fraude commande (validation serveur obligatoire) ; conformité paiement (PCI géré par Stripe, ne jamais manipuler la CB côté app).

---

### C2.3 — Protection no-show (empreinte / acompte) `[G5]` · effort **S**

- **Objectif** : protéger le revenu du couvert contre les no-show.
- **État actuel (vérifié)** : statut `no_show` présent dans `ops.ts` ; `setup-intent` Stripe existant sur le widget. **Pas** de capture financière.
- **Spécification** :
  1. Étendre `setup-intent` : empreinte CB / acompte à la réservation selon politique établissement.
  2. Politique d'annulation configurable (délai, montant) ; capture automatique sur `no_show` confirmé.
  3. Comptabilisation de l'acompte (TVA sur encaissement, compte d'avances) via `FinancialNexusBridge`.
- **RBAC** : configuration politique `manager+` ; capture manuelle possible `manager+`.
- **Invariants** : NF525 (acompte → écriture scellée) ; µunits ; PCI (Stripe).
- **Dépendances** : réutilise l'infra widget ; compta acompte proche de C3.1.
- **DoD** : une réservation à risque prend une empreinte ; un no-show déclenche la capture + l'écriture ; politique paramétrable.
- **Risques** : litige client → traçabilité de la politique acceptée à la résa.

---

# Vague 3 — Revenu & rétention
**Thème** : les leviers de marge · **Durée** : ~6 semaines · **Personas** : invité, serveur, cuisine.
**Pourquoi maintenant** : socle comptable pseudonymisable (V1) + canal invité (V2) en place ; les cartes cadeaux/fidélité portent une dette comptable.

---

### C3.1 — Fidélité + cartes cadeaux + passif comptable `[G6, G7, G22]` · effort **L**

- **Objectif** : rétention client + nouveau canal, correctement comptabilisés.
- **État actuel (vérifié)** : **zéro** loyalty/giftcard. RFM segmente mais ne récompense pas. Comptes PCG présents (`4191` avances clients, `708500` pourboires).
- **Manque précis** : mécanique de points/récompenses, émission/redemption de cartes cadeaux, et surtout le **passif comptable** (produit constaté d'avance).
- **Spécification** :
  1. **Fidélité** : moteur de points `LoyaltyAccount { subjectId, points, tier }` alimenté par les commandes (via RFM) ; redemption au POS.
  2. **Cartes cadeaux** : `GiftCard { code, balanceInMicrounits, status }` ; vente (encaissement → passif) + redemption (solde du passif).
  3. **Passif comptable (C3.1b)** : à l'émission → produit constaté d'avance (compte `4191`/dédié) ; à l'utilisation → transfert en produit. Provision fidélité pour les points.
  4. Redemption POS : nouveau moyen de paiement partiel ; interaction NF525.
- **RBAC** : émission carte cadeau `serveur+` ; paramétrage programme `manager+`.
- **Invariants** : NF525 ; µunits ; **PII fidélité derrière le vault (C1.2)** ; multi-tenant.
- **Dépendances** : **dépend de C1.2** (données client durables) ; relie C2.2 (wallet).
- **DoD** : un client cumule et dépense des points ; une carte cadeau se vend et se dépense ; le bilan reflète le passif puis son solde ; effacement RGPD compatible.
- **Risques** : reconnaissance de revenu prématurée → contrôle comptable strict ; fraude carte cadeau (codes signés).

---

### C3.2 — Ardoise / compte client (paiement différé) `[B4]` · effort **M**

- **Objectif** : permettre le paiement sur compte (habitués, entreprises).
- **État actuel (vérifié)** : modes de paiement = cash/carte/chèque/ticket-resto/virement (`PaymentSplitSchema`). **Pas** de mode « on account ».
- **Spécification** :
  1. Nouveau mode `on_account` dans `PaymentSplitSchema` ; `CustomerAccount { subjectId, creditLimit, balanceInMicrounits }`.
  2. À l'encaissement sur compte : créance client (compte 411) + relevé mensuel ; rapprochement au règlement.
  3. Plafond de crédit + blocage au-delà (RBAC override `manager+`).
- **RBAC** : ouverture de compte `manager+` ; encaissement sur compte selon seuil (C0.4).
- **Invariants** : NF525 (l'encaissement sur compte reste une vente scellée) ; µunits ; multi-tenant ; PII (C1.2).
- **Dépendances** : relie C4.1 (AP/recouvrement) ; `CollectionService` existant côté recouvrement.
- **DoD** : une addition se règle « sur compte » ; le relevé mensuel s'édite ; un règlement solde la créance ; plafond respecté.
- **Risques** : impayés → rattacher au `CollectionService`.

---

### C3.3 — 86-ing automatique (stock épuisé → POS) `[G4]` · effort **S**

- **Objectif** : retirer automatiquement du POS un produit en rupture.
- **État actuel (vérifié)** : champ `availability: 'in_stock'|'out_of_stock'|'seasonal'` présent dans `settings/catalog.ts` → 86 **manuel** possible.
- **Manque précis** : propagation **automatique temps réel** depuis l'épuisement de stock.
- **Spécification** :
  1. Abonnement stock (`InventorySync`) → sur passage sous seuil critique d'un ingrédient bloquant, basculer `availability = out_of_stock` des produits dépendants (via recettes).
  2. Propagation temps réel à `ProductGrid` (POS + menu QR) ; réactivation au réappro.
  3. Journalisation des 86 (qui/quand/pourquoi) → C0.3.
- **RBAC** : override manuel `chef_cuisinier+`.
- **Invariants** : multi-tenant ; ICM (`stocks` chargé sur `/pos` si nécessaire).
- **Dépendances** : `StockEngine`/recettes ; sert C2.2 (menu QR à jour).
- **DoD** : épuiser un ingrédient bloquant retire les plats concernés du POS et du menu QR en temps réel ; le réappro les réactive.
- **Risques** : faux positifs (ingrédient non bloquant) → matrice de criticité par ingrédient.

---

### C3.4 — Boucle food-cost : câbler NexusYieldEngine `[G11]` · effort **S**

- **Objectif** : alerter sur l'érosion de marge quand un prix fournisseur bouge.
- **État actuel (vérifié)** : `NexusYieldEngine` (`domain/services/`) et `modules/commerce/domain/marketing/YieldEngine.ts` **existent** (déplacés, pas supprimés ; test présent).
- **Manque précis** : câbler l'entrée « variation de prix fournisseur » → recalcul food-cost % → alerte marge.
- **Spécification** :
  1. Écouteur sur mise à jour de prix fournisseur/ingrédient → recompute du coût des recettes impactées.
  2. Alerte marge (seuil food-cost %) au chef (C0.1) + surfaçage dans `menu-matrix` (analytics).
  3. Suggestion de reprix (le moteur yield existe) — proposition, non automatique.
- **RBAC** : décision de reprix `chef_cuisinier+`/`manager+`.
- **Invariants** : µunits ; multi-tenant.
- **Dépendances** : prix via C4.1 (procurement) ; analytics `menu-matrix`.
- **DoD** : une hausse de prix ingrédient déclenche le recalcul + une alerte marge ; la matrice reflète le nouveau food-cost.
- **Risques** : bruit d'alertes → seuils + agrégation.

---

### C3.5 — Distribution du tronc (pourboires) `[G16, persona serveur]` · effort **M**

- **Objectif** : répartir et déclarer les pourboires, et les rendre visibles au serveur.
- **État actuel (vérifié)** : compte `708500 Pourboires collectés` présent ; `TipPanel` collecte. **Pas** de distribution tip → employé → bulletin.
- **Spécification** :
  1. Règles de répartition (par heures pointées, par rang, pool global) configurables.
  2. Attribution basée sur l'ownership addition (C2.1) et le pointage (`shiftEntries`).
  3. Restitution « mes pourboires » côté serveur (C5.2) ; intégration au bulletin (`paySlipGenerator`/`PrepaieBuilder`).
  4. Comptabilisation (708500) + traitement social.
- **RBAC** : configuration `manager+` ; consultation perso (serveur).
- **Invariants** : µunits ; multi-tenant ; NF525 (encaissement du pourboire scellé).
- **Dépendances** : pointage + paie ; ownership de C2.1.
- **DoD** : un pool de pourboires se répartit selon la règle, apparaît sur le bulletin et dans « mes pourboires ».
- **Risques** : équité contestée → transparence de la règle appliquée.

---

# Vague 4 — Pilotage & contrôle
**Thème** : excellence opérationnelle · **Durée** : ~6 semaines · **Personas** : manager, directeur, comptable.
**Pourquoi maintenant** : socle de contrôle (V0) et données propres en place ; on outille voir/décider/détecter.

---

### C4.1 — Achats : 3-way match + cycle AP + génération SEPA `[G10, G20]` · effort **L**

- **Objectif** : contrôle anti-fraude achats + cycle fournisseur complet.
- **État actuel (vérifié)** : `ProcurementService`, `ProcurementBridge`, `supplier-invoice.schemas`, `InvoiceReview` (IA). Banque via Powens/Tink/GoCardless ; `AccountingMatchingService`.
- **Manque précis** : rapprochement à 3 (commande vs BL vs facture), seuils d'approbation, échéancier AP, génération de fichier SEPA, rapprochement paiement.
- **Spécification** :
  1. **3-way match** : lier PO ↔ réception (`ReceptionWizard`) ↔ facture (`InvoiceReview`) ; écarts bloquants.
  2. **Seuils** (C0.4) : commande/facture au-dessus d'un montant → approbation d'un rôle supérieur, tracée (C0.3).
  3. **AP aging** : échéancier fournisseurs ; **génération SEPA** (fichier de virement) ; rapprochement au relevé bancaire.
  4. **SoD** (C0.4) : réception ≠ approbation ≠ paiement.
- **RBAC** : approbation selon seuil ; paiement `comptable`/`directeur`.
- **Invariants** : µunits ; NF525 (écritures achats) ; multi-tenant ; SoD (0.4).
- **Dépendances** : **dépend de C0.4** (SoD/seuils) ; banque existante ; alimente C3.4 (prix).
- **DoD** : une facture sans BL correspondant est bloquée ; un achat au-dessus du seuil exige une approbation tracée ; un fichier SEPA se génère et se rapproche.
- **Risques** : intégration formats SEPA (pain.001) → tests bancaires ; ne jamais saisir d'identifiants bancaires côté app.

---

### C4.2 — Caisse avancée : dénominations, skims, comptage aveugle `[G2]` · effort **S**

- **Objectif** : compléter la réconciliation caisse existante.
- **État actuel (vérifié)** : `CashDrawerModal` fait théorique vs réel (après C0.2, en µunits).
- **Manque précis** : comptage par dénominations, skims/drops en cours de service, comptage aveugle, coffre.
- **Spécification** : saisie par coupures ; skim/drop tracés ; option comptage aveugle (masquer le théorique) ; écritures de mouvement caisse ; rattachement clôture Z (`EndOfDayWizard`).
- **RBAC** : comptage/validation `manager+` (élévation C0.4).
- **Invariants** : µunits (0.1, post-C0.2) ; NF525 ; audit (C0.3).
- **Dépendances** : **dépend de C0.2** (µunits) et C0.3 (audit).
- **DoD** : comptage par coupures, skims tracés, écart calculé en aveugle, tout audité.
- **Risques** : friction opérationnelle → UX rapide.

---

### C4.3 — Masse salariale vs CA + prévision de prep `[G14, G12]` · effort **M**

- **Objectif** : le ratio de pilotage du métier + réduction du waste.
- **État actuel (vérifié)** : planning + pointage ; Oracle réappro. Pas de confrontation labor/CA ni de prep-forecast.
- **Spécification** :
  1. **Labor vs CA** : coût planning (heures × taux) confronté au CA prévu (forecast Oracle) → ratio temps réel + alerte staffing.
  2. **Prep-forecast** : croiser réservations + ventes prévues → quantités à préparer par recette.
- **RBAC** : `manager+`.
- **Invariants** : µunits ; multi-tenant.
- **Dépendances** : forecast Oracle ; pointage/paie ; recettes.
- **DoD** : le labor % s'affiche contre le CA prévu ; une liste de prep quantifiée se génère pour le lendemain.
- **Risques** : qualité du forecast → afficher l'intervalle de confiance.

---

### C4.4 — Flash report quotidien consolidé `[G18, persona directeur]` · effort **M**

- **Objectif** : le « café du matin » transverse en une vue.
- **État actuel (vérifié)** : `EmpireCockpit` existe ; à formaliser comme rapport agrégé.
- **Spécification** : agrégat couverts, addition moyenne, food %, labor %, top sellers, écart caisse, incidents ; poussé mobile (C0.1) au directeur ; historique multi-jours.
- **RBAC** : `manager+`/`directeur+`.
- **Invariants** : multi-tenant ; agrège plusieurs piliers.
- **Dépendances** : **dépend de C4.2 (écart caisse) et C4.3 (labor)** ; food-cost (C3.4).
- **DoD** : le directeur reçoit chaque matin un flash mobile complet et fiable ; navigation multi-jours.
- **Risques** : données manquantes un jour → dégrader proprement.

---

### C4.5 — Détection d'anomalies / fraude `[G25]` · effort **M**

- **Objectif** : détecter voids/comps/remises/écarts caisse anormaux.
- **État actuel (vérifié)** : RAG (Hermes/LightRAG) ingère les événements ; pas d'usage défensif.
- **Spécification** : modèles de détection sur les événements d'audit (C0.3) + écarts caisse (C4.2) ; alertes manager ; tableau des overrides suspects.
- **RBAC** : consultation `manager+`/`directeur+`.
- **Invariants** : multi-tenant ; audit immuable comme source de vérité.
- **Dépendances** : **dépend de C0.3 (audit) et C4.2 (caisse)** ; peut exploiter Hermes.
- **DoD** : un pic anormal de voids/remises sur un opérateur lève une alerte tracée.
- **Risques** : faux positifs → seuils calibrés + revue humaine.

---

### C4.6 — Compta analytique + budget vs réalisé + attribution `[G21, G19]` · effort **M**

- **Objectif** : rentabilité par flux + décisions marketing chiffrées.
- **État actuel (vérifié)** : `JournalEntries`, `ProfitLoss`, `menu-matrix` ; pas de centres de coût ni de budget/attribution.
- **Spécification** :
  1. **Analytique** : ventilation food/beverage/événementiel (axe analytique sur les écritures).
  2. **Budget** : budget annuel confronté au réalisé.
  3. **Attribution** : campagne → réservation → couvert (ROI bouclé) via RFM + réservations.
- **RBAC** : `directeur+`/`comptable`.
- **Invariants** : NF525 (analytique n'altère pas l'écriture) ; µunits ; multi-tenant.
- **Dépendances** : réservations, RFM, journal.
- **DoD** : P&L par flux ; budget vs réalisé ; ROI d'une campagne mesurable.
- **Risques** : axe analytique rétroactif → appliquer aux nouvelles écritures + règles de reclassement.

---

# Vague 5 — Expérience & plateforme
**Thème** : transverse · **Durée** : en parallèle des autres vagues · **Personas** : tous, hôtesse, plongeur, super_admin.
**Pourquoi maintenant** : chantiers de fond parallélisables ; augmentent l'adoption. L'i18n reste différé sauf décision d'expansion.

---

### C5.1 — Accessibilité progressive (a11y) `[B2]` · effort **L** (continu)

- **Objectif** : rendre l'app accessible (lecteurs d'écran, navigation clavier).
- **État actuel (vérifié)** : **0 fichier sur 448 `.tsx`** ne contient d'attribut `aria-`.
- **Spécification** : par lots de composants — rôles ARIA, labels, focus visibles, navigation clavier, contrastes ; checklist RGAA ; tests axe-core en CI.
- **RBAC** : sans objet.
- **Invariants** : sans objet (transverse UI).
- **Dépendances** : aucune ; parallélisable.
- **DoD** : les parcours critiques (POS, KDS, réservations) passent un audit a11y ; focus et labels présents ; CI a11y verte.
- **Risques** : dette large → prioriser les écrans à fort usage (serveur, cuisine).

---

### C5.2 — « Mon espace » salarié + consultation du bulletin `[persona espace salarié, serveur]` · effort **M**

- **Objectif** : donner à l'employé une destination unique pour ses données perso.
- **État actuel (vérifié)** : `/staff` **est déjà scopé** (`rh-3`) : l'employé voit son planning, ses pointages perso, ses congés (solde + demande). **Mais** l'onglet Paie est `réservé aux managers` (estimation, pas bulletin individuel) ; le `homeRoute` envoie le serveur sur `/pos`.
- **Manque précis** : (1) un point d'entrée « Mon espace » ; (2) la **consultation de son propre bulletin** ; (3) ses pourboires (C3.5).
- **Spécification** :
  1. Route/onglet « Mon espace » agrégeant planning, pointage, congés, pourboires, bulletin, formations.
  2. Exposer le bulletin individuel de l'employé (au-delà de l'estimation manager) — vérifier le chemin depuis `paySlipGenerator` vers une vue salarié en lecture seule.
  3. Lien depuis le `homeRoute` / la navigation.
- **RBAC** : chaque employé ne voit **que** ses données (scoping renforcé) ; bulletin en lecture seule.
- **Invariants** : multi-tenant ; RGPD (données perso).
- **Dépendances** : réutilise le scoping existant ; pourboires via C3.5.
- **DoD** : un employé accède à « Mon espace » et consulte son bulletin, ses horaires, congés et pourboires ; aucune donnée d'un collègue visible.
- **Risques** : exposer un bulletin « estimé » comme officiel → distinguer estimation vs bulletin scellé.

---

### C5.3 — Handoff table + waitlist + reconnaissance client `[G3, G8, persona hôtesse]` · effort **M**

- **Objectif** : outiller l'accueil et fluidifier les changements de service.
- **État actuel (vérifié)** : `walkin` n'est qu'un **canal** de réservation, pas une file. Pas de handoff d'addition. `CustomerFeedback`, CRM disponibles.
- **Spécification** :
  1. **Waitlist** : file d'attente (temps estimé, SMS de rappel via C0.1, placement) — distincte des réservations.
  2. **Handoff** : transfert de propriété d'une addition entre serveurs (impacte tronc C3.5) — tracé (C0.3).
  3. **Reconnaissance client** : à l'arrivée, remonter VIP/allergies/dernière visite depuis le CRM à l'écran d'accueil (RGPD C1.2).
- **RBAC** : handoff `serveur+` ; waitlist `hotesse+`.
- **Invariants** : multi-tenant ; RGPD (données client à l'accueil).
- **Dépendances** : ownership de C2.1 ; notifications C0.1 ; CRM.
- **DoD** : une file d'attente gère les walk-ins avec temps estimé ; une addition se transfère proprement ; l'hôtesse voit le profil d'un habitué à l'arrivée.
- **Risques** : RGPD sur l'affichage des données client → périmètre minimal nécessaire.

---

### C5.4 — Flotte : benchmarking + rollout multi-sites `[persona super_admin, G19]` · effort **M**

- **Objectif** : piloter N restaurants (comparer, déployer).
- **État actuel (vérifié)** : `FleetCommander`, `FleetTelemetry`, MDM, `CronosBillingEngine`.
- **Spécification** :
  1. **Benchmarking** : comparer un tenant à la médiane de la flotte (KPI food%, labor%, ticket moyen) — respect `SovereignGuard` (agrégats, pas de fuite cross-tenant).
  2. **Rollout** : pousser un menu/config/template de rôle (C0.4) à N tenants sélectionnés.
- **RBAC** : `super_admin` uniquement.
- **Invariants** : **SovereignGuard** (0.3) — benchmarking par agrégats anonymisés ; multi-tenant strict.
- **Dépendances** : télémétrie existante ; templates de C0.4.
- **DoD** : un tenant se compare à ses pairs ; un menu se déploie sur plusieurs sites en une action.
- **Risques** : fuite cross-tenant → agrégation stricte, jamais de détail nominatif.

---

### C5.5 — Marketplaces (Uber/Deliveroo) + maintenance prédictive `[G9, G26]` · effort **L**

- **Objectif** : canal de vente délégué comptabilisé + anticipation des pannes froid.
- **État actuel (vérifié)** : settings livraison propre (`DeliveryZone`, `ClickCollectSettings`) présents ; pas d'injection agrégateur. Relevés température HACCP disponibles.
- **Spécification** :
  1. **Marketplaces** : connecteurs (commandes plateformes → KDS), sync catalogue, écritures de commission ; réconciliation des versements.
  2. **Maintenance prédictive** : tendance des températures HACCP par équipement → alerte de dérive avant panne (C0.1).
- **RBAC** : configuration `manager+`.
- **Invariants** : NF525 (ventes plateformes scellées) ; µunits ; multi-tenant.
- **Dépendances** : catalogue (86-ing C3.3) ; HACCP.
- **DoD** : une commande Uber/Deliveroo arrive au KDS et se comptabilise commission incluse ; une dérive frigo lève une alerte avant la panne.
- **Risques** : dépendance API tierces (gérer les indisponibilités).

---

### C5.6 — Résilience IA : dégradation gracieuse `[B9]` · effort **M**

- **Objectif** : garder les écrans dépendants de l'IA utilisables quand Gemini/LightRAG sont indisponibles.
- **État actuel (vérifié)** : `LightRAGClient` a du retry intégré ; `PulseSanitizer`, `LightRAGConfig` présents.
- **Manque précis** : circuit-breaker + fallback UI explicite (Oracle réappro, analytics) ; message d'état plutôt qu'écran cassé.
- **Spécification** : circuit-breaker sur les appels IA ; fallback déterministe (dernier résultat connu / calcul non-IA) ; bannière d'état « IA indisponible » ; file de re-tentative.
- **RBAC** : sans objet.
- **Invariants** : multi-tenant.
- **Dépendances** : RAG existant.
- **DoD** : couper Gemini/LightRAG laisse les écrans utilisables en mode dégradé, avec message clair.
- **Risques** : masquer une panne durable → télémétrie + alerte ops.

---

### C5.7 — i18n / multi-devise (SI expansion) `[B8]` · effort **L** · **différé**

- **Objectif** : lever le plafond géographique — **uniquement sur décision stratégique**.
- **État actuel (vérifié)** : **0 composant** n'utilise l'i18n ; app monolingue FR en dur ; devise EUR de fait. Squelette `i18n/` conservé.
- **Contrainte projet** : CLAUDE.md interdit de câbler l'i18n dans de nouveaux composants **sans décision explicite**. **Ne pas démarrer sans arbitrage.**
- **Spécification (si décidé)** : câblage progressif `useTranslation` ; externalisation des chaînes ; multi-devise (taux, formats) ; TVA par pays.
- **DoD** : à définir au moment de la décision.
- **Risques** : chantier massif — ne l'ouvrir que si l'expansion hors France est actée.

---

## Matrice de traçabilité

> Vérifie que **chaque** manque (G), angle mort (B) et manque persona est porté par au moins un chantier.

| Réf | Intitulé | Chantier |
|-----|----------|----------|
| G1 | Résilience fiscale hors-ligne | C1.4 |
| G2 | Caisse (µunits + comptage) | C0.2 + C4.2 |
| G3 | Handoff table | C5.3 |
| G4 | 86-ing automatique | C3.3 |
| G5 | Protection no-show | C2.3 |
| G6 | Fidélité | C3.1 |
| G7 | Cartes cadeaux | C3.1 |
| G8 | Waitlist | C5.3 |
| G9 | Marketplaces | C5.5 |
| G10 | Achats 3-way + SoD | C4.1 |
| G11 | Boucle food-cost | C3.4 |
| G12 | Prévision prep | C4.3 |
| G13 | Retrait-rappel | C1.7 |
| G14 | Labor vs CA | C4.3 |
| G15 | Temps de repos | C1.6 |
| G16 | Distribution tronc | C3.5 |
| G17 | DPAE/registre/certifs | C1.6 |
| G18 | Flash report | C4.4 |
| G19 | Budget/attribution | C4.6 + C5.4 |
| G20 | Cycle AP + SEPA | C4.1 |
| G21 | Compta analytique | C4.6 |
| G22 | Passif cartes/fidélité | C3.1 |
| G23 | Calendrier conformité | C1.6 |
| G24 | Licences | C1.6 |
| G25 | Détection fraude | C4.5 |
| G26 | Maintenance prédictive | C5.5 |
| G27 | Plan de contrôle RBAC | C0.4 |
| G28 | Audit immuable | C0.3 |
| G29 | RGPD × NF525 | C1.2 |
| B1 | TVA mode conso | C1.1 |
| B2 | Accessibilité | C5.1 |
| B3 | Fuite µunits | C0.2 |
| B4 | Ardoise/compte client | C3.2 |
| B5 | Affichages FR | C1.5 |
| B6 | Allergènes/nutri client | C1.5 |
| B7 | Clôtures NF525 + JET | C1.3 |
| B8 | i18n/multi-devise | C5.7 |
| B9 | Résilience IA | C5.6 |
| Persona serveur | handheld, pourboires, mon espace | C2.1, C3.5, C5.2 |
| Persona chef_rang | vue section, coursing, handheld | C2.1, C5.3 |
| Persona hôtesse | waitlist, reconnaissance | C5.3 |
| Persona plongeur | tâches HACCP simplifiées | *(sous C1.6/C5.1 — interface minimale de check)* |
| Persona comptable | portail lecture seule, période | C4.1, C4.6 |
| Persona invité | QR/pay/ticket, fidélité | C2.2, C3.1 |
| Persona directeur | flash mobile | C4.4 |
| Persona super_admin | benchmarking/rollout | C5.4 |
| WebPush | activation VAPID | C0.1 |

---

## Annexe A — Pièges de méthode (vérifiés)

1. **`git status` D ≠ suppression.** Sur ce repo en rapatriement actif (`components/`·`domain/` → `modules/`), la moitié des `D` sont des *déplacements*. Toujours `rg -l "Nom" src` avant de conclure à une absence. Faux positifs corrigés : `YieldEngine` (déplacé), `CashDrawerModal` (déplacé, fait la réconciliation), modals POS (déplacés).
2. **Vérifier avant d'affirmer une absence.** L'espace salarié `/staff` scopé existait alors que je l'avais déclaré absent ; WebPush est implémenté alors qu'une note le disait mort. Grep systématique.
3. **Charset local.** Le serveur `python -m http.server` sans charset mojibake les accents ; la plateforme d'artifacts sert bien en UTF-8. Ne pas conclure à un bug d'encodage depuis le preview local.

## Annexe B — Confirmé présent (ne pas reconstruire)

Mode formation NF525 (`FiscalEngine.isTrainingMode`) · Formules & suppléments (`MenuFormule`, `Supplement`) · Modals POS (`modules/commerce/ui/pos/*`) · Observabilité Sentry (`lib/sentry.ts`) · TPE & imprimantes (`PaymentTerminalSettings`, `PrinterSettings`, `usePrintReceipt`) · Champ `availability` catalogue · `CA3Declaration` (déclaration TVA) · Espace salarié scopé (`/staff` `rh-3`) · Banque Powens/Tink/GoCardless · Retry LightRAG.

---

*Fin du plan. 31 chantiers sur 6 vagues, couvrant G1–G29, B1–B9 et les personas. Chaque chantier respecte les invariants §0.*
