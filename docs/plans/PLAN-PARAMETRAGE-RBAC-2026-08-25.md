# Plan — Paramétrage RBAC des décisions figées

> Rédigé le **2026-08-25** · **re-mesuré et rendu cohérent sur `main@11fe8d025`**
> Répond à : *« régler l'ensemble du problème c'est simple, il faut que chaque personne,
> dans le respect du RBAC, puisse paramétrer par défaut. »*
> Source : `docs/DECISIONS-FIGEES-RESTAURANT.md` — **48 décisions** (29 + extension de 19)

---

## L'idée est la bonne — et 80 % existe déjà

Le raisonnement est juste : **ne pas chercher la bonne valeur, donner le levier à la bonne
personne.** Un chef règle ses seuils cuisine, un maître d'hôtel ses règles de salle, un
responsable bar ses tolérances de dose. Le produit n'a plus à deviner.

**Bonne nouvelle mesurée :** l'infrastructure qui porte exactement ce modèle est déjà
construite et tourne.

### Ce qui existe

`src/shared/nexus/contracts/permissions.types.ts:147` — le schéma d'un réglage :

```typescript
export interface PageSettingConfig {
    key: string;
    label: string;
    description?: string;
    group: 'logic' | 'style';
    type: 'toggle' | 'select' | 'number' | 'text' | 'color' | 'action';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    roles: PermissionRole[];   // ← exactement ton idée, déjà dans le type
}
```

| Brique | Emplacement | État |
|---|---|---|
| Schéma d'un réglage avec `roles[]` | `permissions.types.ts:147` | ✅ |
| Registre des réglages | `settings/config-registry.ts` — **150 clés uniques** (156 déclarations, 6 doublons inter-pages) | ⚠️ voir Manque 3 |
| Lecture dans un composant | `usePageSetting(page, key, défaut)` | ✅ |
| Panneau de réglages contextuel | `settings/ContextualSettings.tsx` | ✅ |
| Filtrage par rôle | `canModifySetting(setting)` | ✅ |
| 24 rôles avec niveaux | `kernel/contracts/rbac.ts` (`admin` 100, `directeur` 90, …) | ✅ |

Exemple réel déjà en place :
```typescript
{ key: "ca_target", label: "Objectif CA journalier (€)", group: "logic",
  type: "number", min: 0, max: 100000, roles: ["admin", "directeur"] }
```

**Le travail n'est donc pas de construire un système. C'est de brancher 29 décisions
dans un système qui tourne déjà** — et de corriger **trois manques** qui l'empêchent de
tenir la promesse (le troisième, découvert en fin de journée, est le plus grave).

---

## ⚡ MAJ 2026-08-25 (fin de journée) — un troisième manque, plus grave

> Re-mesuré sur `main@d4283ad19`. Les deux manques ci-dessous sont **confirmés**
> (`savePageSettings` : 0 · chemin `pageSettings → Nexus` : 0 · `SettingsReader` : 0).
> Mais la mesure a révélé un problème que le plan initial ne voyait pas.

### Manque 3 — 142 réglages sur 150 ne sont lus par personne 🔴

**Mesure :** pour chacune des 150 clés uniques de `config-registry.ts`, recherche de sa
lecture dans `src/modules` et `src/app` :

```
Clés déclarées dans le registre  : 150
Clés réellement lues par le code :   8
```

Les 8 qui fonctionnent : `button_size` · `ca_target` · `columns` · `occupation_target` ·
`show_ca` · `show_images` · `split_bill_enabled` · `tickets_target`.

**Ce que ça signifie :** le panneau de réglages affiche 150 boutons dont **142 ne font rien**.
Un manager change « Délai no-show » → l'interface enregistre → **le comportement ne change pas**.

**Pourquoi :** deux systèmes de réglages coexistent sans se parler.

| Système | Contenu | RBAC | UI | Lu par le code |
|---|---|---|---|---|
| `config-registry.ts` | 150 réglages | ✅ | ✅ | ❌ (8/150) |
| `settings.defaults.ts` | les valeurs réelles | ❌ | ❌ | ✅ |

Exemple vérifié — le délai de no-show :
```
config-registry.ts  → { key: "noshow_delay", label: "Délai no-show (min)", roles: [...] }
                      lu par le code : 0 occurrence
settings.defaults.ts → noShowDelayMinutes: 20
                      lu par le code : 2 occurrences   ← c'est celui-ci qui décide
```

**Conséquence sur ce plan :** la Phase 3 s'allège nettement — **~14 des 29 décisions sont
déjà déclarées** dans le registre :

| Zone | Clés déjà présentes dans `config-registry.ts` |
|---|---|
| Réservations (DF-C1→C4) | `noshow_delay` · `min_advance` · `max_advance` · `reminder_hours_before` |
| KDS (DF-B3) | `alert_delay` · `sound_alert` · `sound_new_order` |
| Stocks (DF-F1) | `low_stock_threshold` · `critical_threshold` |
| HACCP (DF-E2, DF-E4) | `temperature_alerts` · `temp_check_frequency` · `alert_delay_minutes` · `retention_years` |
| RH (Zone H) | `max_hours_day` · `max_hours_week` · `min_rest_hours` |
| POS | `max_discount_no_pin` |

**Aucune n'est lue par le code.** La Phase 4 est donc **beaucoup plus lourde** que prévu :
il ne s'agit pas de brancher 29 constantes, mais de réconcilier deux systèmes entiers.

**Nouvelle phase 3 bis — Réconcilier les deux systèmes** *(2 sessions)*
1. Pour chaque clé du registre, identifier sa contrepartie dans `settings.defaults.ts`
2. Faire de `settings.defaults.ts` la **table des défauts** du registre (une seule source)
3. Brancher les lectures : le code lit le registre, qui retombe sur le défaut
4. Supprimer les clés du registre qui n'ont aucune contrepartie — ce sont des promesses vides

> ⚠️ **Ce manque touche déjà les utilisateurs**, indépendamment des 29 décisions figées.
> Une UI de réglages qui n'a aucun effet est pire qu'une absence de réglages : elle fait
> croire au restaurateur qu'il a la main.

---

## Les deux manques réels *(rédaction initiale)*

### Manque 1 — Les réglages de page ne quittent pas la tablette 🔴

**Mesuré :** deux systèmes de persistance coexistent, et ils ne font pas la même chose.

| Atome | Persistance | Portée |
|---|---|---|
| `globalSettingsAtom` | `SettingsManager.saveSettings()` → `Nexus.adapter.set('tenants/{id}/settings/global')` | ✅ **Tenant** |
| `pageSettingsAtom` | `atomWithStorage('nexus_page_settings', tenantScopedJSONStorage)` → **localStorage** | ❌ **Appareil** |

`src/store/settingsAtoms.ts:28` · `src/lib/storage/tenantScopedKey.ts:55`
Recherche d'un chemin `pageSettings → Nexus` : **aucun résultat**.

**Conséquence concrète :** le manager règle le seuil de no-show sur sa tablette. Le serveur,
sur la sienne, garde l'ancienne valeur. La caisse du comptoir aussi. **Chaque appareil a sa
propre configuration.**

Ce n'est pas un détail de mise en œuvre : c'est ce qui fait que le modèle proposé ne peut
pas fonctionner tel quel. Les 150 réglages RBAC existants souffrent déjà du problème.

### Manque 2 — Les services ne savent pas lire un réglage 🔴

`usePageSetting` est un **hook React**. Or les décisions les plus impactantes vivent dans des
services purs, sans React :

| Décision | Service | React ? |
|---|---|---|
| DF-B1 · DF-B2 (bridage KDS) | `KDSPacingEngine.ts` | ❌ |
| DF-A1 (verrou table) | `TableLockService.ts` | ❌ |
| DF-A3 · DF-A4 (seuils bar) | `FlashAlcoholInventoryService.ts` · `SmartSpoutTelemetryService.ts` | ❌ |
| DF-C5 · DF-C6 (rotation) | `TurnoverPredictionService.ts` | ❌ |
| DF-E3 (décongélation) | `ThawingProtocolGuard.ts` | ❌ |

Recherche d'un lecteur non-React (`getPageSetting`, `settingsService`…) : **aucun résultat**.

---

## Le plan — 6 phases

### PHASE 1 — Persister les réglages au niveau tenant *(1,5 session)* 🔴 **prérequis**

Sans elle, tout le reste est cosmétique.

**1.1 — Étendre `SettingsManager`**
```typescript
static async savePageSettings(page: string, settings: SovereignData): Promise<Date>
// → Nexus.adapter.set(`${Nexus.getTenantPath('settings')}/pages/${page}`)

static async loadPageSettings(): Promise<Record<string, SovereignData>>
// → Nexus.adapter.get(`${Nexus.getTenantPath('settings')}/pages`)
```
Le chemin passe par `Nexus.getTenantPath()` → **SovereignGuard s'applique automatiquement**,
pas de contournement multi-tenant.

**1.2 — Brancher l'écriture**
`updatePageSettingsAtom` (`settingsAtoms.ts:36`) écrit aujourd'hui uniquement dans
l'atome local. Y ajouter l'appel `savePageSettings`.

**1.3 — Garder le localStorage comme cache offline**
Ne **pas** le supprimer : un POS doit fonctionner hors ligne. Le modèle devient
*Nexus = source de vérité · localStorage = cache*, avec rechargement au démarrage
et à la reconnexion.

**1.4 — Journaliser les changements**
Un changement de seuil HACCP ou de politique de remise doit être tracé :
`empireAudit.log({ action: 'SETTING_CHANGED', … })` avec l'auteur et l'ancienne valeur.
Le code émet déjà `CONFIG_CHANGE` (`ContextualSettings.tsx:66`) — vérifier qu'il persiste.

*Critère :* changer un réglage sur un appareil, recharger un second appareil du même
tenant → la valeur suit. Un autre tenant n'est pas affecté.

---

### PHASE 2 — Donner un accès non-React aux services *(1 session)* 🔴

**2.1 — Un lecteur de réglages sans React**
```typescript
// src/lib/settings/SettingsReader.ts
export function getSetting<T>(page: string, key: string, fallback: T): T
```
Lit l'atome Jotai via le store par défaut (`getDefaultStore().get(pageSettingsAtom)`) —
même source que `usePageSetting`, sans hook. Le `fallback` est **la constante actuelle
du code** : si aucun réglage n'est défini, le comportement ne change pas.

> ⚠️ **Point de vigilance mesuré aujourd'hui :** l'application n'utilise ni `<Provider>`
> ni `createStore()` — elle repose sur le store Jotai par défaut. C'est ce qui rend cette
> approche possible, et c'est aussi pourquoi l'invariant **INV-9** (une seule copie de
> Jotai côté client) doit rester vert. Ce lecteur en dépend directement.

**2.2 — Convention de repli obligatoire**
```typescript
// ❌ jamais
const seuil = getSetting('kds', 'overheat_threshold_min');
// ✅ toujours — le défaut actuel devient le fallback
const seuil = getSetting('kds', 'overheat_threshold_min', 20);
```
Aucune régression possible : un tenant qui n'a rien réglé garde exactement le comportement
d'aujourd'hui.

*Critère :* `KDSPacingEngine` lit son seuil via `getSetting` et se comporte à l'identique
tant qu'aucun réglage n'est posé.

---

### PHASE 3 — Déclarer les 29 décisions *(1,5 session)*

Ajouter les entrées dans `config-registry.ts`, **groupées par métier** — c'est le champ
`roles` qui matérialise ton idée.

#### Page `kds` — chef de cuisine
```typescript
{ key: "overheat_threshold_min", label: "Seuil de surchauffe cuisine (min de retard)",
  description: "Au-delà, le bridage automatique des commandes s'active.",
  group: "logic", type: "number", min: 5, max: 60,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-B1

{ key: "throttle_max_orders", label: "Commandes max pendant le bridage",
  group: "logic", type: "number", min: 1, max: 20,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-B2

{ key: "throttle_duration_sec", label: "Durée du bridage (secondes)",
  group: "logic", type: "number", min: 60, max: 3600,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-B2

{ key: "throttle_enabled", label: "Activer le bridage automatique",
  description: "Permet de débrider en urgence pendant un coup de feu.",
  group: "logic", type: "toggle",
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-B2 (manque identifié)

{ key: "audio_volume", label: "Volume des alertes cuisine",
  group: "style", type: "number", min: 0, max: 100,
  roles: ["admin", "directeur", "chef_cuisinier", "cuisinier"] }, // DF-B3
```

#### Page `pos` — maître d'hôtel & salle
```typescript
{ key: "table_lock_ttl_sec", label: "Durée de réservation d'une table (secondes)",
  group: "logic", type: "number", min: 30, max: 600,
  roles: ["admin", "directeur", "manager", "chef_rang"] },        // DF-A1

{ key: "warn_no_terminal", label: "Avertir si aucun TPE n'est configuré",
  group: "logic", type: "toggle",
  roles: ["admin", "directeur", "manager"] },                     // DF-A2
```

#### Page `bar` — responsable bar
```typescript
{ key: "alcohol_loss_alert_eur", label: "Seuil d'alerte perte alcool (€)",
  group: "logic", type: "number", min: 1, max: 500,
  roles: ["admin", "directeur", "manager", "barman"] },           // DF-A3

{ key: "spout_variance_cl", label: "Écart toléré au bec verseur (cl)",
  group: "logic", type: "number", min: 1, max: 50,
  roles: ["admin", "directeur", "manager", "barman"] },           // DF-A4

{ key: "keg_loss_max_pct", label: "Perte fût maximale acceptée (%)",
  group: "logic", type: "number", min: 0, max: 30,
  roles: ["admin", "directeur", "barman"] },                      // DF-A5
```

#### Page `reservations` — gérant
```typescript
{ key: "turnover_factor_per_guest_pct", label: "Allongement par convive au-delà de 2 (%)",
  description: "Modèle de rotation de table. À caler sur des mesures réelles.",
  group: "logic", type: "number", min: 0, max: 30,
  roles: ["admin", "directeur"] },                                // DF-C5

{ key: "turnover_kds_impact_max_pct", label: "Impact max du retard cuisine (%)",
  group: "logic", type: "number", min: 0, max: 100,
  roles: ["admin", "directeur"] },                                // DF-C6
```
> ⚠️ **Corrigé après re-mesure :** DF-C1 à C4 sont **déjà déclarés dans le registre**
> (`noshow_delay`, `min_advance`, `max_advance`, `reminder_hours_before`). Le problème
> n'est donc pas de les déclarer, mais qu'**aucun n'est lu par le code** — cf. Manque 3.
> Idem pour `low_stock_threshold`, `alert_delay`, `sound_alert`, `temperature_alerts`,
> `max_discount_no_pin`, `temp_check_frequency`, `alert_delay_minutes`, `retention_years`,
> `max_hours_day`, `max_hours_week`, `min_rest_hours`.

#### Page `printers` — gérant
```typescript
{ key: "failover_group_only", label: "Secours limité au même groupe (cuisine/bar)",
  group: "logic", type: "toggle",
  roles: ["admin", "directeur", "manager"] },                     // DF-D1

{ key: "on_print_failure", label: "Si l'impression échoue",
  group: "logic", type: "select",
  options: [{ value: "queue", label: "Mettre en file et alerter" },
            { value: "block", label: "Bloquer la vente" },
            { value: "continue", label: "Continuer sans ticket" }],
  roles: ["admin", "directeur"] },                                // DF-D3 ⭐
```

> **DF-D3 est la plus importante de tout le document.** La transformer en `select` de trois
> options est exactement la bonne réponse : le produit n'a plus à trancher une question
> qui dépend du restaurant **et** de son comptable.

#### Page `haccp` — chef + référent hygiène
```typescript
{ key: "thaw_max_hold_hours", label: "Durée max après décongélation (h)",
  group: "logic", type: "number", min: 6, max: 96,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-E3

// DF-E1 — un seuil PAR CATÉGORIE, borné par le plancher légal (cf. §cascade)
{ key: "temp_max_meat", label: "Température max — viandes (°C)",
  group: "logic", type: "number", min: 0, max: 4,
  roles: ["admin", "directeur", "chef_cuisinier"] },
{ key: "temp_max_fish", label: "Température max — poissons & fruits de mer (°C)",
  group: "logic", type: "number", min: 0, max: 2,
  roles: ["admin", "directeur", "chef_cuisinier"] },
{ key: "temp_max_dairy", label: "Température max — produits laitiers (°C)",
  group: "logic", type: "number", min: 0, max: 8,
  roles: ["admin", "directeur", "chef_cuisinier"] },
// … 9 autres catégories — table complète à valider par un référent hygiène

{ key: "escalation_target", label: "Escalade après absence de réaction",
  group: "logic", type: "select",
  options: [{ value: "chef", label: "Chef de cuisine" },
            { value: "manager", label: "Gérant" },
            { value: "both", label: "Les deux" }],
  roles: ["admin", "directeur"] },                                // DF-E2 (manque identifié)
```

#### Page `security` — administrateur uniquement
```typescript
{ key: "max_concurrent_sessions", label: "Appareils simultanés par utilisateur",
  description: "1 = un serveur ne peut pas utiliser deux tablettes en même temps.",
  group: "logic", type: "number", min: 1, max: 5,
  roles: ["admin"] },                                             // DF-G1
```

---

### PHASE 4 — Remplacer les constantes *(2 sessions)*

Ordre imposé par l'impact, pas par la facilité :

| Ordre | Fichier | Décisions | Pourquoi |
|---|---|---|---|
| 1 | `KDSPacingEngine.ts` | DF-B1 · DF-B2 | Modifie le service en temps réel |
| 2 | `settings.defaults.ts` → registre | DF-G1 | Bloque un usage quotidien |
| 3 | `TurnoverPredictionService.ts` | DF-C5 · DF-C6 | Pilote la disponibilité vendue |
| 4 | `FlashAlcoholInventoryService.ts` · `SmartSpoutTelemetryService.ts` | DF-A3 · DF-A4 | Bruit ou silence permanent |
| 5 | `TableLockService.ts` · `ThawingProtocolGuard.ts` | DF-A1 · DF-E3 | |
| 6 | `PrinterFailoverManager.ts` · `PrintingService.ts` | DF-D1 · DF-D3 | Dépend d'une décision produit |

**Règle de sécurité :** chaque remplacement conserve la valeur actuelle en `fallback`.
Un tenant qui ne configure rien ne voit **aucune** différence. Le comportement ne change
que lorsque quelqu'un décide de le changer.

---

## Le principe général : un défaut à chaque niveau, surchargeable à chaque niveau

> *« Il faut mettre des défauts mais configurables. »*

Ce n'est pas un réglage unique par décision — c'est une **cascade**. Le projet applique déjà
ce modèle pour l'UI (`resolveUI` : tenant → verticale → défaut partagé). Il faut l'appliquer
aux valeurs métier.

### DF-E1 revu — le cas emblématique

J'avais classé DF-E1 comme « simple divergence à corriger ». **C'est faux.** Le vrai problème
est plus profond : **un seuil unique pour tous les aliments est faux par construction.**

Une viande maturée, un poisson cru, des légumes et des surgelés n'ont ni les mêmes plages,
ni la même tolérance. Un seuil global à 5 °C alerte à tort sur les uns et laisse passer
les autres.

**Les quatre niveaux — état mesuré au 2026-08-25 :**

| Niveau | Portée | Emplacement | État |
|---|---|---|---|
| **N3** | Par produit | `ProductQualityConfig.tempRange` · atome `productQualityConfigs` | 🟠 Schéma et atome créés — **0 consommateur** |
| **N2** | Par capteur / zone | `haccp.ts:72-73` (`alertMinTemp` / `alertMaxTemp`) | ✅ Fonctionnel |
| **N1** | Par catégorie d'aliment | table de référence sur les **12 `ProductCategory`** | ❌ **N'existe pas** |
| **N0** | Filet global | `useComplianceMapper.ts:14` — `temperature > 5` | ❌ En dur, court-circuite tout |

**12 catégories sont déclarées** (`vegetables`, `meat`, `poultry`, `fish_seafood`, `dairy`,
`eggs`, `charcuterie`, `frozen`, `dry_goods`, `beverages`, `fruits`, `other`) — **aucune
n'a de seuil associé.**

### La règle de résolution à implémenter

```
seuil(produit) =
     tempRange du produit                 (N3 — le plus précis)
  ?? seuils du capteur de la zone         (N2)
  ?? défaut de la catégorie d'aliment     (N1 — à créer)
  ?? filet global                         (N0)
```

Chaque niveau porte un **défaut** et reste **surchargeable** par le niveau au-dessus.
C'est exactement le principe demandé, appliqué à une donnée sanitaire.

### ⚠️ Une contrainte propre à l'HACCP : le plancher réglementaire

Contrairement aux seuils KDS ou bar, les températures de conservation ont des **minima
légaux** (règlement CE 852/2004, arrêté du 21 décembre 2009). Un restaurateur peut être
**plus strict**, jamais plus laxiste.

Le paramétrage doit donc être **borné par le bas** :
```typescript
{ key: "temp_max_meat", label: "Température max — viandes (°C)",
  group: "logic", type: "number",
  min: 0, max: 4,                      // ← le max ne peut pas dépasser le plancher légal
  roles: ["admin", "directeur", "chef_cuisinier"] }
```

C'est la différence entre « configurable » et « libre ». Le champ `min`/`max` de
`PageSettingConfig` sert précisément à ça — et rend le plancher légal **inviolable par l'UI**.

**Travail à prévoir :** une table `CATEGORY_TEMP_DEFAULTS` de 12 entrées, validée par un
référent hygiène, avec les bornes légales — puis brancher la cascade N3→N0 et supprimer
le `> 5` de `useComplianceMapper`.

**Effort :** +1 session (à ajouter à la Phase 4).

---

## Ce qui reste hors de portée de ce plan

Deux décisions ne se paramètrent pas :

| Décision | Pourquoi pas un réglage |
|---|---|
| **DF-A6** (dilution cocktails) | Six coefficients physiques. Les exposer serait ingérable — les documenter comme approximation assumée, ou exposer un seul facteur de correction global. |
| **Zone H** (RH) | Code du travail et convention HCR. Ce sont des **plafonds légaux**, pas des préférences. Un réglage donnerait l'illusion qu'on peut les dépasser — même logique que le plancher HACCP ci-dessus, mais ici il n'y a rien à choisir. |

---

## Séquencement & conflits

```
PHASE 1    1,5 sess.  Persistance tenant        ← prérequis absolu
PHASE 2    1   sess.  Lecteur non-React         ← parallélisable avec 1
PHASE 3    1   sess.  Déclarer les réglages     ← allégée : ~14 des 29 existent déjà
PHASE 3bis 2   sess.  Réconcilier les 2 systèmes ← LE plus gros poste (142 clés inertes)
PHASE 4    2   sess.  Remplacer les constantes  ← dépend de 2, 3 et 3bis
PHASE 5    1   sess.  Cascade HACCP N3→N0       ← table catégories + bornes légales
```

**Total : 9 sessions** (7 initialement · phase 3 bis +2 · extension de 19 décisions +0,5).

> **MAJ extension :** le second balayage a porté le corpus de 29 à **48 décisions**
> (zones finance/trésorerie, approvisionnement, fidélité, marketing, livraison,
> comptabilité). Trois d'entre elles rejoignent le haut de la pile de priorité :
> - **DF-N1** — `AUTO_RECONCILE_SCORE = 98` : le rapprochement bancaire s'automatise
>   sans validation humaine au-delà de ce score. Décision comptable prise dans le code.
> - **DF-K1** — `POINTS_PER_EURO = 1` : le cœur économique du programme de fidélité,
>   non réglable.
> - **DF-J3** — un coefficient `0,3` transforme une flambée de cours en **recommandation
>   de prix de vente**.
>
> Et une seconde divergence du type DF-E1 : **DF-O1**, deux modèles de rotation de table
> concurrents (`TurnoverPredictionService` vs `TableTurnoverOptimizationService`) qui
> donnent des durées différentes pour la même table. À trancher, pas à paramétrer.

### Conflits identifiés

| Risque | Parade |
|---|---|
| `config-registry.ts` touché par plusieurs sessions | Écrivain unique — c'est un fichier-registre |
| Phase 2 dépend de l'invariant **INV-9** (store Jotai unique) | Si INV-9 casse, `getSetting` lit un store fantôme. Vérifier avant la phase 4. |
| Phase 4 touche `usePos.ts` / `Cart.tsx` | ⚠️ Même périmètre que la **migration microunits Lot 4**. Ne pas paralléliser. |
| ~~Session `vague0-ui-cleanup`~~ | ✅ **Levé** — session close, 0 session active au 2026-08-25 fin de journée |

---

## Pourquoi ce plan vaut mieux que l'entretien restaurateur seul

L'audit `DECISIONS-FIGEES` proposait d'interroger un restaurateur pour obtenir les bonnes
valeurs. C'est utile, mais insuffisant : **le restaurateur suivant aura d'autres réponses.**

Paramétrer, c'est répondre une fois pour tous les clients. L'entretien reste utile — mais
pour choisir les **bons défauts** et les **bornes** (`min`/`max`), pas pour graver 29 nombres.

> Ton intuition transforme 29 questions ouvertes en 29 réglages bornés.
> C'est la différence entre un produit qui suppose et un produit qui s'adapte.

---

*Infrastructure mesurée le 2026-08-25, document rendu cohérent sur `main@11fe8d025`.
Chaque chemin et chaque chiffre est vérifiable par commande.*
