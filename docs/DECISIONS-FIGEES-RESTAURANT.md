# 🎚️ Décisions figées — Verticale restaurant

> Audit du **2026-08-25** · mesuré sur `main@0e93408d0`
> **Classe d'audit distincte des angles morts.** `anglemort-restaurant-mcc.md` recense ce qui
> *manque*. Ce document recense ce qui *existe mais a été décidé arbitrairement* — des
> réponses plausibles à des questions métier que seul un restaurateur peut trancher.

---

## Pourquoi ce document

Le code contient des dizaines de **réponses à des questions qu'on n'a jamais posées**.

Exemple : `KDSPacingEngine.ts:22` déclare la cuisine « en surchauffe » à partir de
**20 minutes** de retard moyen, et la bride alors à **5 commandes par tranche de 10 minutes**.

Ces trois nombres — 20, 5, 10 — sont des décisions d'exploitation majeures. Aucun
restaurateur ne les a validées. Un bistrot de 40 couverts et une brasserie de 200 n'ont
pas la même définition de « surchauffe ».

**Le risque n'est pas le bug.** Le code fonctionne. Le risque est de figer une politique
métier plausible, de construire dessus, puis de découvrir au premier service que la vraie
réponse était différente.

### Trois statuts

| Statut | Signification | Gravité |
|---|---|---|
| 🔴 **FIGÉ** | Valeur en dur dans le code — le restaurateur ne peut **pas** la changer | Haute |
| 🟠 **DÉFAUT NON VALIDÉ** | Configurable, mais le défaut livré n'a jamais été confronté au terrain | Moyenne |
| 🟡 **NON TRANCHÉ** | Le comportement en cas d'échec n'est pas décidé | Variable |

### Comment lire une fiche

Chaque décision porte un code `DF-<zone><n>` et répond à quatre questions :
**quelle question métier · quelle réponse le code a choisie · est-ce modifiable · qui peut trancher.**

---

# Zone A — POS & Encaissement

### DF-A1 — Durée du verrouillage d'une table 🟠

| | |
|---|---|
| **Question métier** | Un serveur ouvre une table sur sa tablette. Combien de temps la table lui est-elle réservée avant qu'un collègue puisse la reprendre ? |
| **Réponse du code** | **2 minutes**, renouvelées par heartbeat — `TableLockService.ts:27` |
| **Configurable** | Non (constante de module) |
| **Ce qui peut mal tourner** | Trop court : deux serveurs se marchent dessus en plein rush. Trop long : une tablette qui tombe en panne bloque la table 2 min, le client attend. |
| **Qui tranche** | Le maître d'hôtel — il connaît la fréquence des passages de main |

### DF-A2 — Absence de TPE configuré 🟡

| | |
|---|---|
| **Question métier** | Aucun terminal de paiement n'est configuré. Que fait la caisse ? |
| **Réponse du code** | Bascule **silencieusement** sur l'adapter « Manuel » — `PaymentTerminalService.ts:101-103` |
| **Configurable** | Non |
| **Ce qui peut mal tourner** | Le repli est **silencieux**. Un TPE mal configuré au démarrage passe inaperçu : l'équipe saisit les paiements à la main toute la soirée sans comprendre pourquoi. |
| **Qui tranche** | Le gérant — faut-il un avertissement visible au démarrage du service ? |

### DF-A3 — Seuil d'alerte sur perte d'alcool 🔴

| | |
|---|---|
| **Question métier** | À partir de quelle perte l'inventaire flash alerte-t-il ? |
| **Réponse du code** | **10 €** — `FlashAlcoholInventoryService.ts:82` (`> 10_000_000` µ) |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | 10 € de perte sur un bar à cocktails de 300 couverts, c'est du bruit quotidien. Sur un bistrot, c'est un signal fort. Le même seuil produira soit de l'alerte permanente, soit du silence. |
| **Qui tranche** | Le responsable bar |

### DF-A4 — Écart toléré au bec verseur 🔴

| | |
|---|---|
| **Question métier** | Quel écart entre dose théorique et dose servie déclenche une anomalie ? |
| **Réponse du code** | **10 cl** — `SmartSpoutTelemetryService.ts:51` |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | 10 cl, c'est énorme pour un spiritueux (dose = 4 cl) et négligeable pour une bière pression. Un seuil unique pour deux réalités. |
| **Qui tranche** | Le responsable bar |

### DF-A5 — Coefficient de perte hydrostatique sur fût 🟠

| | |
|---|---|
| **Question métier** | Quelle perte est normale sur un fût (mousse, tirage, purge) ? |
| **Réponse du code** | Accepte **0 à 30 %** — `KegHydrostaticLossService.ts:26` |
| **Configurable** | Borne validée, valeur d'usage à confirmer |
| **Qui tranche** | Le brasseur / responsable bar — 30 % est un plafond très large |

### DF-A6 — Dilution des cocktails 🔴

| | |
|---|---|
| **Question métier** | À quelle vitesse un cocktail se dilue-t-il selon la glace utilisée ? |
| **Réponse du code** | `0,8 %/seconde` de base · glace claire × 0,45 · autres × 0,7 et × 0,3 — `CocktailDilutionIndexService.ts:32-43` |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | Ces coefficients viennent d'une modélisation, pas du bar du client. Ils pilotent des calculs de coût matière. |
| **Qui tranche** | Le chef barman — ou à défaut, les documenter comme approximation assumée |

---

# Zone B — KDS & Cuisine

### DF-B1 — Définition de la « surchauffe cuisine » 🔴 **le plus impactant**

| | |
|---|---|
| **Question métier** | À partir de quand la cuisine est-elle débordée ? |
| **Réponse du code** | **20 minutes** de retard moyen — `KDSPacingEngine.ts:22` |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | 20 min de retard moyen est **normal** dans une brasserie un samedi soir, et **catastrophique** dans un service rapide. Ce seuil déclenche le bridage automatique des commandes — donc il **modifie le service en temps réel**. |
| **Qui tranche** | Le chef de cuisine, par type de service (midi/soir, semaine/week-end) |

### DF-B2 — Politique de bridage 🔴

| | |
|---|---|
| **Question métier** | Une fois la cuisine déclarée en surchauffe, comment ralentit-on ? |
| **Réponse du code** | **5 commandes par fenêtre**, pendant **600 secondes** — `KDSPacingEngine.ts:40` |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | Trois décisions empilées : le débit (5), la fenêtre, et la durée (10 min). Aucune n'est ajustable. Un bridage mal calibré crée une file d'attente en salle que personne ne comprend. |
| **Qui tranche** | Le chef — et il voudra probablement pouvoir **débrider manuellement** |
| **Manque** | Aucun moyen documenté de désactiver le bridage en urgence |

### DF-B3 — Signalétique sonore KDS 🟠

| | |
|---|---|
| **Question métier** | Quels sons, à quel volume, en cuisine ? |
| **Réponse du code** | Volume **0,15** · fréquences fixes (880 → 1046 Hz, 587 → 659 Hz, triple note 1174/1318/1567 Hz) — `KDSAudioHardwareService.ts:55-108` |
| **Configurable** | Volume probablement, fréquences non |
| **Ce qui peut mal tourner** | Une cuisine est **bruyante** : hotte, plonge, friteuse. Volume 0,15 est très bas. Les fréquences aiguës passent mieux dans le bruit — à valider sur place, pas au bureau. |
| **Qui tranche** | Test réel en cuisine pendant un service |

### DF-B4 — Débit maximal par créneau 🟠

Réponse du code : `maxOrdersPerSlot: 5` — `settings.defaults.ts:260`. Configurable, défaut non validé.

---

# Zone C — Réservations

### DF-C1 — Délai de no-show 🟠

| | |
|---|---|
| **Question métier** | Après combien de minutes de retard une réservation est-elle perdue ? |
| **Réponse du code** | **20 minutes** — `noShowDelayMinutes` |
| **Configurable** | Oui |
| **Ce qui peut mal tourner** | 20 min est agressif pour un restaurant gastronomique, laxiste pour un service à deux rotations. Impacte directement le chiffre d'affaires. |
| **Qui tranche** | Le gérant — probablement différent midi et soir |

### DF-C2 — Cadencement des arrivées 🟠

`maxCoversPerPacingSlot: 8` par tranche de `pacingSlotMinutes: 15`.
→ **32 couverts/heure maximum**, quelle que soit la taille de la cuisine.
Configurable, mais le défaut suppose un établissement moyen.

### DF-C3 — Fenêtre de réservation 🟠

`minAdvanceHours: 2` · `maxAdvanceDays: 30`.
Un restaurant étoilé prend des réservations à 3 mois ; un bistrot accepte 30 min avant.
Le défaut ne convient ni à l'un ni à l'autre.

### DF-C4 — Rappel client 🟠

`emailReminderHours: 24`. Question non posée : **SMS ou e-mail ?** Un rappel SMS à J-1
réduit le no-show bien plus qu'un e-mail — mais coûte de l'argent.

### DF-C5 — Modèle de rotation de table 🔴

| | |
|---|---|
| **Question métier** | Combien de temps une table reste-t-elle occupée ? |
| **Réponse du code** | Durée de base × `(1 + 0,06 × (convives − 2))` — soit **+6 % par convive au-delà de 2** — `TurnoverPredictionService.ts:55` |
| **Configurable** | **Non** |
| **Ce qui peut mal tourner** | Ce coefficient pilote la disponibilité affichée aux clients. S'il est faux, on sur-réserve ou on sous-remplit. **D'où vient ce 6 % ?** |
| **Qui tranche** | Mesure réelle sur 2 semaines de service — c'est le seul moyen |

### DF-C6 — Impact du retard cuisine sur la rotation 🔴

`1 + min(0,5 ; retardKDS / 60)` — `TurnoverPredictionService.ts:56`
Le retard cuisine allonge la rotation, **plafonné à +50 %**. Pourquoi 50 % ? Non configurable.

---

# Zone D — Impression & Matériel

> **Correction d'un audit précédent :** `AUDIT-23-AXES` affirmait qu'il n'existait aucune
> gestion d'échec d'impression. **C'est faux** — `PrinterFailoverManager.ts` (49 l) existe
> et bascule vers une imprimante de secours. Ce qui suit est ce qui reste non tranché.

### DF-D1 — Critère de bascule imprimante 🟠

| | |
|---|---|
| **Réponse du code** | Bascule si `!isOnline \|\| !hasPaper`, vers la première imprimante valide trouvée — `PrinterFailoverManager.ts:32-43` |
| **Non tranché** | « La plus proche » est annoncée en commentaire mais le code prend **la première de la liste**. Une commande cuisine peut sortir au bar. |
| **Qui tranche** | Le gérant — définir des groupes de secours (cuisine → cuisine, bar → bar) |

### DF-D2 — Aucune imprimante disponible 🟡

Repli sur `window.print()` du navigateur — `PrintingService.ts:119-123`.
**Non tranché :** sur une tablette en cuisine, un dialogue d'impression navigateur est
inutilisable. Que doit-il se passer réellement ?

### DF-D3 — Ticket scellé mais jamais imprimé 🟡 **question ouverte**

La vente est scellée NF525 (irréversible). L'impression échoue sur toutes les imprimantes.

**Quatre questions sans réponse dans le code :**
- Le client repart-il sans justificatif ?
- Peut-on réimprimer plus tard, et pendant combien de temps ?
- L'échec est-il tracé dans le journal fiscal ?
- Le service continue-t-il ou se bloque-t-il ?

**Qui tranche :** le gérant, avec un avis comptable. C'est la question la plus importante
de cette zone.

---

# Zone E — HACCP & Hygiène

### DF-E1 — Incohérence de seuil de température 🔴 **anomalie réelle**

Deux endroits du code évaluent la même chose avec des règles différentes :

| Emplacement | Règle |
|---|---|
| `iot/IoTSensorService.ts:134-135` | Compare à `sensor.alertMinTemp` / `alertMaxTemp` — **configurables par capteur** ✅ |
| `hooks/useComplianceMapper.ts:14` | `if (currentData.temperature > 5)` — **5 °C en dur** ❌ |

**Conséquence :** un tenant qui configure ses capteurs à 8 °C verra malgré tout des alertes
de dérive au-delà de 5 °C par l'autre chemin. Deux vérités sur une donnée sanitaire.

**À corriger indépendamment de toute validation métier** — ce n'est pas une décision figée,
c'est une divergence.

### DF-E2 — Cadence et escalade des contrôles 🟠

`tempCheckFrequencyHours: 4` · `tempAlertDelay: 30` · `tempCriticalDelay: 60` ·
`escalationDelay: 120` — `settings.defaults.ts:218-234`

**Questions non posées :** un contrôle toutes les 4 h couvre-t-il un service continu ?
Après 120 min sans réaction, **on escalade vers qui** — le chef, le gérant, personne ?

### DF-E3 — Durée d'utilisation après décongélation 🟠

`maxHoldTimePostThawHours: 48` — `ThawingProtocolGuard.ts:66`
48 h est une valeur courante, mais elle dépend du produit (viande hachée ≠ poisson entier).
Le guard applique une durée unique.

### DF-E4 — Rétention des relevés de température 🟠

`tempLogRetentionDays: 365`.
**À vérifier juridiquement** : la durée de conservation exigée par la DDPP correspond-elle
à un an ? Une valeur trop courte détruit une preuve de conformité.

---

# Zone F — Stocks

### DF-F1 — Seuil de stock bas 🟠

`lowStockThreshold: 1000` — `settings.defaults.ts:58`.
**Unité non explicite** : grammes ? unités ? microunits ? Un seuil global à 1000 n'a pas
de sens sur des articles hétérogènes (une truffe et un sachet de sel).

### DF-F2 — Définition d'un article de valeur 🔴

`valMu > 500_000_000_000` — soit environ **500 €/unité** — `inventory-service.ts:42`.
En dur. Détermine quels articles reçoivent un traitement renforcé.

### DF-F3 — Mise en 86 automatique ✅

`Auto86Service.ts:49` utilise `item.minQuantity` — **configurable par article**.
C'est le bon modèle : à généraliser aux autres seuils de cette zone.

---

# Zone G — Sessions & Sécurité

### DF-G1 — Une seule session simultanée 🔴 **à challenger d'urgence**

| | |
|---|---|
| **Réponse du code** | `maxConcurrentSessions: 1` — `settings.defaults.ts:275` |
| **Question métier** | Un serveur peut-il être connecté sur **deux tablettes** en même temps ? |
| **Réalité du terrain** | En service, un serveur prend une commande en salle sur une tablette, puis encaisse au comptoir sur une autre. Avec cette valeur, la seconde connexion **le déconnecte de la première**. |
| **Qui tranche** | Le maître d'hôtel — c'est probablement le défaut le plus contestable de tout ce document |

### DF-G2 — Déconnexion automatique 🟠

`autoLogoutMinutes: 60`. En plein service, une tablette posée 60 min sans action, c'est
plausible. En terrasse l'après-midi, la déconnexion arrivera au mauvais moment.

### DF-G3 — Rétention des journaux 🟠

`logRetentionDays: 90`. À croiser avec les obligations RGPD **et** fiscales (6 ans pour
les données comptables — cf. `CHECKLIST-ADMIN.md` §B.2). Un journal d'accès à 90 jours
peut être insuffisant en cas de litige.

### DF-G4 — Validité du code MFA 🟢

`codeValiditySeconds: 180` — `MfaChannelsService.ts:45`. Valeur standard, sans enjeu.

---

# Zone H — RH & Planning

`maxHoursPerWeek: 35` puis `48` · `maxOvertimePerWeek: 10` · `minRestBetweenShiftsHours: 11` ·
`maxHoursPerDay: 10` — `settings.defaults.ts:68-86`

Ces valeurs correspondent au **Code du travail** et à la convention HCR. Elles ne sont pas
arbitraires — mais elles doivent être **vérifiées par un expert-paie**, pas par le code.

🟠 **Point d'attention :** deux valeurs de `maxHoursPerWeek` cohabitent (35 et 48).
La distinction — durée légale vs plafond absolu — mérite d'être explicitée dans le code.

---

# Synthèse

| Zone | 🔴 Figé | 🟠 Défaut non validé | 🟡 Non tranché | Total |
|---|---|---|---|---|
| A — POS & bar | 3 | 2 | 1 | 6 |
| B — KDS | 2 | 2 | 0 | 4 |
| C — Réservations | 2 | 4 | 0 | 6 |
| D — Impression | 0 | 1 | 2 | 3 |
| E — HACCP | 1 | 3 | 0 | 4 |
| F — Stocks | 1 | 1 | 0 | 2 |
| G — Sessions | 1 | 2 | 0 | 3 |
| H — RH | 0 | 1 | 0 | 1 |
| **Total** | **10** | **16** | **3** | **29** |

---

# ⚡ Mise à jour du 2026-08-25 — la réponse systémique

> Ce document proposait d'interroger un restaurateur pour obtenir les bonnes valeurs.
> **C'est insuffisant : le restaurateur suivant aura d'autres réponses.**
>
> La vraie réponse est de **rendre chaque décision paramétrable, sous contrôle RBAC** —
> chaque métier règle ce qui le concerne. Le chef ses seuils cuisine, le maître d'hôtel
> ses règles de salle, le responsable bar ses tolérances de dose.
>
> **Vérifié : l'infrastructure existe déjà.** `PageSettingConfig`
> (`permissions.types.ts:147`) porte un champ `roles: PermissionRole[]`, et
> `config-registry.ts` contient **156 réglages** déjà déclarés sur ce modèle.
>
> Deux manques empêchent le modèle de tenir :
> 1. Les réglages de page sont persistés en **localStorage**, pas dans Nexus — chaque
>    tablette a donc sa propre configuration.
> 2. Les **services non-React** (`KDSPacingEngine`, `TableLockService`…) n'ont aucun
>    moyen de lire un réglage.
>
> 👉 **Plan d'exécution complet : `docs/plans/PLAN-PARAMETRAGE-RBAC-2026-08-25.md`** (6 sessions).
>
> Les étapes ci-dessous restent valides pour ce qui ne se paramètre pas : l'anomalie
> DF-E1, et l'entretien restaurateur — désormais utile pour choisir les **bons défauts
> et les bornes**, plus pour graver 29 nombres.

---

# Plan d'action

## Étape 1 — Corriger ce qui est une anomalie, pas une décision *(0,5 session)*

- **DF-E1** — le seuil 5 °C en dur de `useComplianceMapper.ts:14` doit lire la configuration
  du capteur comme `IoTSensorService`. Deux vérités sur une donnée sanitaire, ce n'est pas
  un arbitrage : c'est un défaut.

## Étape 2 — Rendre configurable ce qui pilote le service *(1-2 sessions)*

Priorité aux 🔴 qui **modifient le service en temps réel** :

| Ordre | Décision | Pourquoi en premier |
|---|---|---|
| 1 | **DF-B1 + DF-B2** — seuil et politique de bridage KDS | Modifie le service en direct, sans levier manuel |
| 2 | **DF-G1** — sessions simultanées | Bloque un usage quotidien évident |
| 3 | **DF-C5 + DF-C6** — modèle de rotation | Pilote la disponibilité vendue aux clients |
| 4 | **DF-A3 + DF-A4** — seuils bar | Génèrent soit du bruit permanent, soit du silence |

## Étape 3 — Préparer l'entretien restaurateur *(0,5 session)*

Transformer les 29 fiches en **questionnaire d'une page**, groupé par métier :

```
Au chef de cuisine   → DF-B1 · DF-B2 · DF-B3
Au maître d'hôtel    → DF-A1 · DF-C1 · DF-G1 · DF-G2
Au responsable bar   → DF-A3 · DF-A4 · DF-A5 · DF-A6
Au gérant            → DF-D1 · DF-D2 · DF-D3 · DF-C2 · DF-C3 · DF-C4
Au chef + DDPP       → DF-E2 · DF-E3 · DF-E4
À l'expert-paie      → Zone H
```

**Un restaurateur répond à tout ça en une heure.** Sans lui, chaque valeur est un pari.

## Étape 4 — Mesurer plutôt que deviner *(pendant le pilote)*

Trois décisions ne se tranchent pas en entretien — elles se **mesurent** :

- **DF-C5** (rotation +6 %/convive) → chronométrer 2 semaines d'occupation réelle
- **DF-B1** (surchauffe à 20 min) → relever les retards KDS réels par service
- **DF-B3** (volume audio) → tester en cuisine, pendant un service, pas au bureau

---

# Ce que ce document n'est pas

- Ce n'est **pas** une liste de bugs. Le code fonctionne.
- Ce n'est **pas** un reproche de conception. Il **fallait** choisir des valeurs pour livrer.
- C'est l'inventaire de la **dette d'hypothèses** : les endroits où le produit a supposé
  au lieu de savoir.

**Chaque ligne de ce document est une question qu'un restaurateur réglera en trente secondes
et que personne n'a encore posée.**

---

*Mesuré le 2026-08-25 sur `main@0e93408d0`. Chaque référence `fichier:ligne` est vérifiable.*

---

# ⚡ EXTENSION 2026-08-25 — 6 zones supplémentaires (+19 décisions)

> Second balayage sur les piliers non couverts par la première passe :
> finance/trésorerie, approvisionnement, fidélité, marketing, livraison, comptabilité.
> **Total du document : 29 → 48 décisions.**

---

## Zone I — Finance & Trésorerie

### DF-I1 — Seuil d'approbation MCC d'un virement 🔴
`SovereignPayout.ts:12` — `MCC_APPROVAL_THRESHOLD_CENTS = 50000` (**500 €**), en dur.
*Question :* au-delà de quel montant un virement exige-t-il une validation éditeur ?
*Qui tranche :* toi (MCC), pas le restaurateur. Mais ça devrait dépendre du volume du tenant.

### DF-I2 — Délai de relance impayé 🔴
`EscalationEngine.ts:26` — `diffDays >= 30`, en dur.
*Question :* après combien de jours relance-t-on une facture impayée ?
*Qui tranche :* le gérant, ou l'expert-comptable.

### DF-I3 — Routage carte par taux d'interchange 🟠
`SmartCardRoutingService.ts:7` — barème en points de base (20 bps CB, 380 bps Amex US).
*À vérifier :* ces taux évoluent avec les accords acquéreurs. Figés = obsolètes à terme.

---

## Zone J — Approvisionnement

### DF-J1 — Fenêtre d'urgence avant cutoff fournisseur 🔴
`SupplierOrderCutoffScheduler.ts:33` — urgent si `diffMinutes <= 60`.
*Question :* combien de temps avant la clôture faut-il alerter le chef ?

### DF-J2 — Flambée de cours « critique » 🔴
`CommodityPriceSurgeWatcherService.ts:13` — `> 15 %`.
*Question :* à partir de quelle hausse alerte-t-on sur une matière première ?

### DF-J3 — Poids du food cost dans l'ajustement de prix 🔴
`CommodityPriceSurgeWatcherService.ts:48` — `surgePct * 0.3` (**30 % de poids food cost**).
*Question :* si le cours monte de 20 %, de combien remonter le prix menu ?
Ce coefficient **pilote une recommandation de prix de vente**.

### DF-J4 — Seuil de confiance OCR facture 🔴
`DoublePassOcrService.ts:31` — `avgConfidence >= 90`.
*Question :* en dessous, la facture part en validation manuelle. 90 est-il le bon curseur ?

### DF-J5 — Ajustement météo des approvisionnements 🔴
`PredictiveProcurementEngine.ts:29` — **+15 % si température > 25 °C** (produits frais/salades).
*Question :* deux nombres arbitraires — le seuil (25 °C) et l'ajustement (15 %).

---

## Zone K — Fidélité & CRM

### DF-K1 — Barème de points de fidélité 🔴
`LoyaltyEngine.ts:19` — `POINTS_PER_EURO = 1`, en dur.
*Question :* combien de points par euro dépensé ? C'est **le cœur économique du programme
de fidélité** — et il n'est pas réglable.

### DF-K2 — Seuils VIP ⚠️ **cas d'école du Manque 3**
`CRMVipHandler.ts:40` — `VIP_SPENT_THRESHOLD = 500_000_000` (500 €) et `VIP_VISITS_THRESHOLD`, en dur.

**Or le registre déclare déjà les deux réglages :**
```typescript
{ key: "vip_threshold_visits", label: "Seuil visites VIP", min: 1,   max: 50,    roles: ["admin","directeur"] }
{ key: "vip_threshold_spend",  label: "Seuil dépenses VIP (€)", min: 100, max: 10000, roles: ["admin","directeur"] }
```
Le gérant voit deux curseurs dans l'interface, les règle — **et le code continue d'utiliser
500 €**. Illustration parfaite des 142 réglages inertes.

### DF-K3 — Score de base d'un devis 🟠
`quotes-service.ts:41` — `let score = 70`.

---

## Zone L — Marketing & Avis

### DF-L1 — Détection de review bombing 🔴
`ReviewBombingDetectorService.ts:55` — `lowRated.length >= BURST_THRESHOLD && noTextRatio >= 0.5`.
*Question :* deux seuils qui décident si une salve d'avis est une attaque ou une mauvaise
semaine. Un faux positif fait signaler à tort des clients mécontents légitimes.

### DF-L2 — Paliers du score de visibilité 🟠
`marketing-engine.ts:69-72` — `95 / 80 / 60 / 40` → « Elite / Excellente / Bonne / Moyenne ».
Barème d'affichage, faible enjeu, mais arbitraire.

---

## Zone M — Livraison

### DF-M1 — Température de remise au chaud ✅ **LÉGAL, ne pas paramétrer**
`ColdMealDeliveryDisputeEvidenceService.ts:23` — `MIN_HOT_HANDOVER_TEMP_CELSIUS = 63.0`.
**63 °C est le minimum réglementaire** (arrêté du 21 décembre 2009). À documenter comme
plancher légal, jamais à exposer en réglage libre — même logique que la cascade HACCP.

### DF-M2 — Barème de scoring d'adresse 🟠
`DeliveryAddressScoringService.ts:24-33` — départ à `100`, `-25`, `-20` selon les critères.
*Question :* en dessous de quel score refuse-t-on une livraison ?

---

## Zone N — Comptabilité

### DF-N1 — Barème de rapprochement bancaire 🔴
`AccountingMatchingService.ts:19-21` — `THRESHOLD_HIGH = 90` · `THRESHOLD_MEDIUM = 70` ·
`AUTO_RECONCILE_SCORE = 98`, plus une dizaine de bonus (`+60`, `+55`, `+25`, `+15`, `+10`).

*Question :* à partir de quel score un rapprochement bancaire se fait **automatiquement**,
sans validation humaine ? `98` est le seuil actuel. C'est une décision **comptable**, pas
technique — et elle engage la fiabilité des écritures.

*Qui tranche :* l'expert-comptable du tenant.

### DF-N2 — Taux de no-show historique « préoccupant » 🟠
`NoShowAndWeatherForecaster.ts:62` — `historicalNoShowRate > 0.3` (**30 %**).

---

## Zone O — Anomalie : deux modèles de rotation de table 🔴

Même classe de problème que **DF-E1** : deux services répondent à la même question avec
des règles différentes.

| Service | Règle |
|---|---|
| `TurnoverPredictionService.ts:55` | `base × (1 + 0,06 × (convives − 2)) × facteurKDS` |
| `TableTurnoverOptimizationService.ts:26` | paliers : `≤ 2 → 75 min` · `≤ 4 → 90 min` · `6+ → 120 min` |

Pour une table de 4, le premier donne `base × 1,12`, le second impose `90 min`.
**Lequel fait foi ?** Selon l'écran consulté, le restaurateur verra deux disponibilités
différentes.

**Ce n'est pas un arbitrage à paramétrer — c'est une divergence à trancher**, comme DF-E1.

---

## Zone RH — précision importante ✅

Les valeurs relevées dans `human/` ne sont **pas** des décisions arbitraires :

| Valeur | Nature |
|---|---|
| `HCRPayrollCalculatorService.ts:52-54` — majorations `× 1,10 · 1,20 · 1,50` | **Taux légaux** HCR |
| `HcrLegalGuardService.MAX_WEEKLY_HOURS = 48` | **Plafond légal** |
| `HcrLegalGuardService.ts:162` — nuit = `hour >= 22 \|\| hour < 7` | **Définition légale** |

À documenter comme telles dans le code (référence à l'article/convention), **pas à exposer
en réglage**. Un curseur laisserait croire qu'on peut les modifier.

> ⚠️ **Contradiction à trancher :** le registre déclare pourtant déjà `max_hours_day`,
> `max_hours_week` et `min_rest_hours`. Quelqu'un a jugé qu'ils devaient être réglables.
> Position défendable **si** les bornes n'autorisent que du **plus protecteur** que la loi.
> À arbitrer avec un expert-paie.

---

## Synthèse de l'extension

| Zone | Nouvelles décisions | Dont 🔴 figées |
|---|---|---|
| I — Finance & Trésorerie | 3 | 2 |
| J — Approvisionnement | 5 | 5 |
| K — Fidélité & CRM | 3 | 2 |
| L — Marketing & Avis | 2 | 1 |
| M — Livraison | 2 | 0 (1 légale) |
| N — Comptabilité | 2 | 1 |
| O — Anomalie rotation | 1 | — (divergence) |
| RH — reclassement | 3 | 0 (légales) |
| **Total** | **+19** | **+11** |

**Document complet : 48 décisions** (29 initiales + 19).

### Les 3 plus impactantes de cette extension

1. **DF-N1** — le rapprochement bancaire s'automatise à partir d'un score de `98`. Décision
   comptable engageant la fiabilité des écritures, prise dans le code.
2. **DF-K1** — `POINTS_PER_EURO = 1`. Le cœur économique du programme de fidélité, non réglable.
3. **DF-J3** — un coefficient de `0,3` transforme une flambée de cours en **recommandation
   de prix de vente**. Personne ne l'a validé.
