# Plan — Paramétrage RBAC des décisions figées

> Rédigé le **2026-08-25** · **à jour sur `main@095b83645`** (corpus étendu à 48 décisions)
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

**Le travail n'est donc pas de construire un système. C'est de brancher 48 décisions
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

**Conséquence sur ce plan :** la Phase 3 s'allège — **~16 des 48 décisions sont déjà
déclarées** dans le registre :

| Zone | Clés déjà présentes dans `config-registry.ts` |
|---|---|
| Réservations (DF-C1→C4) | `noshow_delay` · `min_advance` · `max_advance` · `reminder_hours_before` |
| KDS (DF-B3) | `alert_delay` · `sound_alert` · `sound_new_order` |
| Stocks (DF-F1) | `low_stock_threshold` · `critical_threshold` |
| HACCP (DF-E2, DF-E4) | `temperature_alerts` · `temp_check_frequency` · `alert_delay_minutes` · `retention_years` |
| RH (Zone H) | `max_hours_day` · `max_hours_week` · `min_rest_hours` |
| POS | `max_discount_no_pin` |

**Aucune n'est lue par le code.** La Phase 4 est donc **beaucoup plus lourde** que prévu :
il ne s'agit pas de brancher 48 constantes, mais de réconcilier deux systèmes entiers.

**Nouvelle phase 3 bis — Réconcilier les deux systèmes** *(2 sessions)*
1. Pour chaque clé du registre, identifier sa contrepartie dans `settings.defaults.ts`
2. Faire de `settings.defaults.ts` la **table des défauts** du registre (une seule source)
3. Brancher les lectures : le code lit le registre, qui retombe sur le défaut
4. Supprimer les clés du registre qui n'ont aucune contrepartie — ce sont des promesses vides

> ⚠️ **Ce manque touche déjà les utilisateurs**, indépendamment des 48 décisions figées.
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

## Le plan — 7 phases

### PHASE 0 — Trancher DF-O1 *(0,5 session)* — indépendante, à faire quand on veut

Deux services calculent la durée d'occupation d'une table avec des règles différentes :

| Service | Règle | Table de 4 |
|---|---|---|
| `TurnoverPredictionService.ts:55` | `base × (1 + 0,06 × (convives − 2)) × facteurKDS` | `base × 1,12` |
| `TableTurnoverOptimizationService.ts:26` | paliers `≤2 → 75` · `≤4 → 90` · `6+ → 120` min | `90 min` |

Selon l'écran consulté, le restaurateur voit **deux disponibilités différentes**.

**Ce n'est pas un arbitrage à paramétrer** — c'est une divergence à supprimer. Un des deux
services doit devenir la source, l'autre l'appeler. Le choix du modèle (multiplicatif ou
paliers) devient ensuite un réglage unique (DF-C5).

*Critère :* une seule fonction répond à « combien de temps cette table sera-t-elle occupée ».
*Ne dépend d'aucune autre phase.*

---

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

### PHASE 3 — Déclarer les décisions manquantes *(1,5 session)*

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

#### Page `finance` — gérant & comptable *(extension)*
```typescript
{ key: "auto_reconcile_score", label: "Score de rapprochement automatique",
  description: "Au-delà, une écriture est rapprochée sans validation humaine.",
  group: "logic", type: "number", min: 80, max: 100,
  roles: ["admin", "directeur", "comptable"] },                   // DF-N1 ⭐

{ key: "dunning_delay_days", label: "Relance impayé après (jours)",
  group: "logic", type: "number", min: 7, max: 90,
  roles: ["admin", "directeur", "comptable"] },                   // DF-I2

{ key: "payout_approval_threshold_eur", label: "Seuil d'approbation virement (€)",
  description: "Au-delà, une validation éditeur est requise.",
  group: "logic", type: "number", min: 100, max: 50000,
  roles: ["admin"] },                                             // DF-I1
```

> **DF-N1 rejoint DF-D3 au sommet de la priorité.** Un score de `98` déclenche
> aujourd'hui un rapprochement bancaire **sans validation humaine**. C'est une décision
> comptable, elle appartient à l'expert-comptable du tenant — pas au code.

#### Page `inventory` / approvisionnement — chef & gérant *(extension)*
```typescript
{ key: "supplier_cutoff_warning_min", label: "Alerte avant clôture fournisseur (min)",
  group: "logic", type: "number", min: 15, max: 240,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-J1

{ key: "commodity_surge_alert_pct", label: "Flambée de cours — seuil d'alerte (%)",
  group: "logic", type: "number", min: 5, max: 50,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-J2

{ key: "food_cost_weight_pct", label: "Poids food cost dans l'ajustement prix (%)",
  description: "Si un cours monte de 20 %, le prix menu est recommandé à +20 % × ce poids.",
  group: "logic", type: "number", min: 10, max: 60,
  roles: ["admin", "directeur"] },                                // DF-J3 ⭐

{ key: "ocr_confidence_threshold", label: "Confiance OCR minimale (%)",
  description: "En dessous, la facture part en validation manuelle.",
  group: "logic", type: "number", min: 60, max: 99,
  roles: ["admin", "directeur", "comptable"] },                   // DF-J4

{ key: "weather_procurement_temp_c", label: "Température déclenchant l'ajustement (°C)",
  group: "logic", type: "number", min: 15, max: 40,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-J5
{ key: "weather_procurement_boost_pct", label: "Ajustement météo produits frais (%)",
  group: "logic", type: "number", min: 0, max: 50,
  roles: ["admin", "directeur", "chef_cuisinier"] },              // DF-J5
```

#### Page `customer` — fidélité & CRM *(extension)*
```typescript
{ key: "loyalty_points_per_euro", label: "Points de fidélité par euro dépensé",
  description: "Cœur économique du programme. Permet les opérations ponctuelles (×2).",
  group: "logic", type: "number", min: 0, max: 10,
  roles: ["admin", "directeur"] },                                // DF-K1 ⭐

{ key: "quote_base_score", label: "Score de base d'un devis",
  group: "logic", type: "number", min: 0, max: 100,
  roles: ["admin", "directeur"] },                                // DF-K3
```
> ⚠️ **DF-K2 (seuils VIP) n'a rien à déclarer :** `vip_threshold_visits` et
> `vip_threshold_spend` **existent déjà** dans le registre. Le travail est en Phase 3 bis —
> faire lire ces clés par `CRMVipHandler.ts:40` au lieu de sa constante en dur.

#### Page `seo` / marketing *(extension)*
```typescript
{ key: "review_bombing_burst_threshold", label: "Avis négatifs déclenchant une alerte",
  group: "logic", type: "number", min: 3, max: 50,
  roles: ["admin", "directeur"] },                                // DF-L1
{ key: "review_bombing_no_text_ratio", label: "Part d'avis sans texte suspecte (%)",
  group: "logic", type: "number", min: 20, max: 100,
  roles: ["admin", "directeur"] },                                // DF-L1
```

#### Page `pos` / livraison *(extension)*
```typescript
{ key: "delivery_min_address_score", label: "Score d'adresse minimal accepté",
  group: "logic", type: "number", min: 0, max: 100,
  roles: ["admin", "directeur", "manager"] },                     // DF-M2
```
> **DF-M1 n'est pas déclaré** — `MIN_HOT_HANDOVER_TEMP_CELSIUS = 63 °C` est un
> **minimum réglementaire** (arrêté du 21 décembre 2009). Cf. §hors périmètre.

#### Page `security` — administrateur uniquement
```typescript
{ key: "max_concurrent_sessions", label: "Appareils simultanés par utilisateur",
  description: "1 = un serveur ne peut pas utiliser deux tablettes en même temps.",
  group: "logic", type: "number", min: 1, max: 5,
  roles: ["admin"] },                                             // DF-G1
```

---

### PHASE 4 — Remplacer les constantes *(3 sessions · 13 lots)*

Ordre imposé par l'impact, pas par la facilité :

| Ordre | Fichier | Décisions | Pourquoi |
|---|---|---|---|
| 1 | `KDSPacingEngine.ts` | DF-B1 · DF-B2 | Modifie le service en temps réel |
| 2 | `settings.defaults.ts` → registre | DF-G1 | Bloque un usage quotidien |
| 3 | `TurnoverPredictionService.ts` | DF-C5 · DF-C6 | Pilote la disponibilité vendue |
| 4 | `FlashAlcoholInventoryService.ts` · `SmartSpoutTelemetryService.ts` | DF-A3 · DF-A4 | Bruit ou silence permanent |
| 5 | `TableLockService.ts` · `ThawingProtocolGuard.ts` | DF-A1 · DF-E3 | |
| 6 | `PrinterFailoverManager.ts` · `PrintingService.ts` | DF-D1 · DF-D3 | Dépend d'une décision produit |
| 7 | `AccountingMatchingService.ts` | DF-N1 | Automatise des écritures comptables sans humain |
| 8 | `LoyaltyEngine.ts` | DF-K1 | Cœur économique du programme de fidélité |
| 9 | `CommodityPriceSurgeWatcherService.ts` | DF-J2 · DF-J3 | Pilote une recommandation de prix de vente |
| 10 | `CRMVipHandler.ts` | DF-K2 | ⚠️ Clés registre existantes — relève surtout de la Phase 3 bis |
| 11 | `SovereignPayout.ts` · `EscalationEngine.ts` | DF-I1 · DF-I2 | Argent |
| 12 | `DoublePassOcrService.ts` · `SupplierOrderCutoffScheduler.ts` · `PredictiveProcurementEngine.ts` | DF-J1 · DF-J4 · DF-J5 | |
| 13 | `ReviewBombingDetectorService.ts` · `DeliveryAddressScoringService.ts` | DF-L1 · DF-M2 | |

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

### Valeurs légales — à documenter, jamais à exposer

| Décision | Référence |
|---|---|
| **Zone H** (RH) — majorations `× 1,10 / 1,20 / 1,50`, plafond 48 h, nuit 22 h–7 h | Convention HCR · Code du travail |
| **DF-M1** — remise au chaud à `63 °C` | Arrêté du 21 décembre 2009 |

Un curseur laisserait croire qu'on peut les modifier. À annoter dans le code avec leur
référence légale.

> ⚠️ **Contradiction à trancher :** le registre déclare pourtant déjà `max_hours_day`,
> `max_hours_week` et `min_rest_hours`. Position défendable **si** les bornes n'autorisent
> que du **plus protecteur** que la loi. À arbitrer avec un expert-paie.

### Divergences — à trancher, pas à paramétrer

Trois endroits du code répondent différemment à la même question. Ce ne sont pas des
arbitrages métier, ce sont des **contradictions internes** :

| Code | Contradiction | Effort |
|---|---|---|
| **DF-E1** | Seuil température : configurable par capteur **vs** `> 5` en dur | Phase 5 |
| **DF-K2** | Seuils VIP : réglables au registre **vs** `500 €` en dur | Phase 3 bis |
| **DF-O1** | Rotation de table : `TurnoverPredictionService` (multiplicatif) **vs** `TableTurnoverOptimizationService` (paliers 75/90/120 min) | **0,5 session** |

**Elles sont les moins chères à corriger et les plus dangereuses tant qu'elles vivent** —
selon l'écran consulté, le restaurateur voit deux vérités.

### Non paramétrable pour d'autres raisons

| Décision | Pourquoi |
|---|---|
| **DF-A6** (dilution cocktails) | Six coefficients physiques. Les exposer serait ingérable — les documenter comme approximation assumée, ou exposer un seul facteur de correction global. |
| **DF-I3** (taux d'interchange carte) | Dépend des accords acquéreurs, pas du restaurateur. À faire évoluer avec les contrats. |

---

## Séquencement & conflits

```
PHASE 1    1,5 sess.  Persistance tenant        ← prérequis absolu
PHASE 2    1   sess.  Lecteur non-React         ← parallélisable avec 1
PHASE 3    1   sess.  Déclarer les réglages     ← allégée : ~16 des 48 existent déjà
PHASE 3bis 2   sess.  Réconcilier les 2 systèmes ← LE plus gros poste (142 clés inertes)
PHASE 4    2   sess.  Remplacer les constantes  ← dépend de 2, 3 et 3bis
PHASE 5    1   sess.  Cascade HACCP N3→N0       ← table catégories + bornes légales
```

**Total : 9 sessions** (7 initialement · phase 3 bis +2 · extension de 19 décisions +0,5).

### Les 4 décisions au sommet de la priorité

| Code | Ce qu'elle décide aujourd'hui, seule |
|---|---|
| **DF-D3** | Ticket scellé NF525, impression échouée → comportement non tranché |
| **DF-N1** | `AUTO_RECONCILE_SCORE = 98` — écritures comptables rapprochées **sans humain** |
| **DF-K1** | `POINTS_PER_EURO = 1` — cœur économique du programme de fidélité |
| **DF-J3** | Coefficient `0,3` — transforme une flambée de cours en **prix de vente recommandé** |

Ces quatre-là ont un point commun : elles engagent **de l'argent ou une responsabilité
légale**, et aucune n'a été validée par la personne concernée.

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

> Ton intuition transforme 48 questions ouvertes en 45 réglages bornés — les 3 restantes
> étant des divergences à trancher, pas des arbitrages.
> C'est la différence entre un produit qui suppose et un produit qui s'adapte.

---

*Infrastructure mesurée le 2026-08-25, document à jour sur `main@095b83645`
(corpus 48 décisions, 6 phases, 10,5 sessions).
Chaque chemin et chaque chiffre est vérifiable par commande.*
