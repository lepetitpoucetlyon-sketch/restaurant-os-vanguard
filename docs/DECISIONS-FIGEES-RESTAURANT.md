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
