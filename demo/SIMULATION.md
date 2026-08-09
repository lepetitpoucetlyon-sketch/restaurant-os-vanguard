# Simulation de vie — Restaurant OS Core
> Mode démo & tests de cohérence bout-en-bout
> Permet de simuler des semaines complètes de restaurant en quelques secondes

---

## Lancement rapide (mode défaut)

```bash
npx vitest run demo/simulation.test.ts
```

Mode défaut = **2 semaines · restaurant 5 tables · 6j/semaine · 2 services/jour · équipe de 4**

---

## Lancement avec paramètres

```bash
# Simulation courte — 3 jours, service midi uniquement
DEMO_WEEKS=1 DEMO_SERVICES=midi DEMO_TABLES=3 npx vitest run demo/simulation.test.ts

# Simulation longue — 4 semaines avec incidents aléatoires
DEMO_WEEKS=4 DEMO_INCIDENTS=true DEMO_SEED=42 npx vitest run demo/simulation.test.ts

# Cibler un scénario précis
DEMO_SCENARIO=maladie_chef npx vitest run demo/simulation.test.ts
DEMO_SCENARIO=no_show_series npx vitest run demo/simulation.test.ts
DEMO_SCENARIO=dlc_cascade npx vitest run demo/simulation.test.ts
DEMO_SCENARIO=rush_critique npx vitest run demo/simulation.test.ts
```

---

## Paramètres disponibles

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DEMO_WEEKS` | `2` | Nombre de semaines simulées |
| `DEMO_TABLES` | `5` | Nombre de tables en salle |
| `DEMO_STAFF` | `4` | Nombre d'employés (serveur, cuisinier, manager, hôtesse) |
| `DEMO_SERVICES` | `midi+soir` | Services simulés : `midi`, `soir`, `midi+soir` |
| `DEMO_COVERS_MIDI` | `35` | Couverts moyens service du midi |
| `DEMO_COVERS_SOIR` | `55` | Couverts moyens service du soir |
| `DEMO_INCIDENTS` | `false` | Active les incidents aléatoires |
| `DEMO_INCIDENT_RATE` | `0.2` | Probabilité d'incident par service (0.0 → 1.0) |
| `DEMO_SCENARIO` | `null` | Forcer un scénario précis (voir liste ci-dessous) |
| `DEMO_SEED` | `null` | Graine aléatoire pour reproductibilité |
| `DEMO_VERBOSE` | `false` | Afficher le détail de chaque event émis |
| `DEMO_TENANT` | `tenant_demo_001` | ID du tenant simulé |
| `DEMO_VARIANT` | `restaurant` | Verticale : `restaurant`, `bakery`, `hotel`... |

---

## Architecture des fichiers à créer

```
demo/
├── SIMULATION.md                    ← ce fichier (plan)
├── simulation.test.ts               ← point d'entrée Vitest
├── engine/
│   ├── SimulacraEngine.ts           ← bootstrap tenant fictif complet
│   ├── TimeController.ts            ← avance le temps + déclenche les crons
│   └── ScenarioRunner.ts            ← exécute une séquence d'événements
├── scenarios/
│   ├── index.ts                     ← barrel de tous les scénarios
│   ├── service.ts                   ← service.midi, service.soir
│   ├── incidents.ts                 ← maladie, no_show, dlc, frigo...
│   ├── staff.ts                     ← absence, heures_supp, shift_swap
│   ├── finance.ts                   ← ecart_caisse, facture_fournisseur, rfa
│   └── haccp.ts                     ← temperature, huile_friture, nonconform
├── fixtures/
│   ├── menu.ts                      ← carte avec 20 produits + recettes
│   ├── staff.ts                     ← 4 employés avec rôles et contrats
│   ├── tables.ts                    ← plan de salle 5 tables
│   ├── suppliers.ts                 ← 3 fournisseurs avec POs
│   └── reservations.ts             ← réservations pré-chargées
└── assertions/
    ├── weeklyCoherence.ts           ← checks fin de semaine
    ├── nf525Integrity.ts            ← chaîne fiscale intacte
    └── businessKPIs.ts              ← food cost, labor cost, ticket moyen
```

---

## Scénarios disponibles

### Services de base
| Scénario | Description |
|----------|-------------|
| `service.midi` | Service complet 12h-14h30, N couverts, commandes + paiements + Z |
| `service.soir` | Service complet 19h-22h30, N couverts |
| `service.complet` | Midi + soir dans la même journée |

### Incidents RH
| Scénario | Description | Ce que ça doit déclencher |
|----------|-------------|--------------------------|
| `maladie_chef` | Chef cuisinier absent 3 jours | Alerte sous-effectif → manager notifié |
| `maladie_serveur` | Serveur absent 1 jour | Alerte sous-effectif |
| `oubli_pointage` | Employé oublie de pointer la sortie | `hrAlerts` + alerte manager à la clôture Z |
| `shift_swap` | 2 employés s'échangent un shift | Vérification repos 11h + validation manager |
| `conge_sans_remplacant` | Congé créé sans effectif suffisant | Alerte planification |
| `contrat_expire_bientot` | Contrat expire dans 29 jours | Alert RH lundi matin (ContractExpiryJob) |
| `visite_medicale_depassee` | Visite médicale expirée | Alerte manager + blocage possible |

### Incidents HACCP & Stock
| Scénario | Description | Ce que ça doit déclencher |
|----------|-------------|--------------------------|
| `dlc_expire` | 2 produits DLC dépassée au matin | Blocage POS automatique + alerte |
| `dlc_cascade` | DLC expire pendant service | Blocage mi-service, plat retiré de la carte |
| `frigo_temperature` | Frigo monte à 12°C la nuit | HACCP alert + journal légal + action corrective |
| `huile_friture_25pct` | Taux polaires > 25% | Interdiction d'utilisation + ordre changement |
| `stock_zero` | Ingrédient tombe à 0 en service | Plat 86 automatique + commande fournisseur draft |
| `livraison_ecart_prix` | Livraison à +8% du prix PO | Alerte comptable + recalcul food cost |
| `rupture_fournisseur` | Fournisseur ne livre pas | PO en retard + alerte stock + suggestion alternatif |

### Incidents Finance & Caisse
| Scénario | Description | Ce que ça doit déclencher |
|----------|-------------|--------------------------|
| `ecart_caisse_5euros` | Écart de 5€ à la clôture | Anomalie détectée + alerte manager |
| `ecart_caisse_gros` | Écart de 50€ | Anomalie critique + audit déclenché |
| `no_show_sans_empreinte` | Client ne vient pas, pas d'empreinte | Statut no_show + flag CRM |
| `no_show_avec_empreinte` | Client ne vient pas, empreinte Stripe | Débit automatique pénalité + écriture NF525 |
| `no_show_series` | 3 no-shows en 2 semaines même client | Flag risk CRM + acompte obligatoire |
| `facture_impayee_b2b` | Facture groupe non réglée à J+7 | Relance auto step 1 |
| `facture_impayee_30j` | Facture non réglée à J+30 | Mise en demeure + 40€ forfait légal |

### Incidents Ops & Cuisine
| Scénario | Description | Ce que ça doit déclencher |
|----------|-------------|--------------------------|
| `rush_critique` | KDS delay > 20 min | Bridage commandes bornes automatique |
| `imprimante_tombee` | Imprimante cuisine hors ligne | Bascule imprimante secours automatique |
| `plat_retourne` | Client refuse un plat (allergie) | Notification CRITIQUE cuisine + log rebound |
| `plat_retourne_allergie` | Plat retourné pour allergie | Alerte CRITIQUE + audit incident |
| `annulation_commande` | Commande annulée après envoi cuisine | Stock restitué + table libérée + notif cuisine |
| `transfert_table` | Addition transférée d'une table à une autre | Recalcul totaux + libération table source |

### Scénarios combinés (réalisme maximal)
| Scénario | Description |
|----------|-------------|
| `semaine_noire` | Chef malade + frigo + DLC + écart caisse dans la même semaine |
| `semaine_forte` | Service complet 60 couverts soir sans incident |
| `lancement_promo` | Promotion activée en cours de service → POS recalcule |
| `anniversaire_client_vip` | Client VIP avec anniversaire → offre automatique envoyée |
| `semaine_complete` | 6 jours × 2 services avec 30% d'incidents aléatoires |

---

## Ce que vérifie chaque assertion

### `weeklyCoherence.ts` — checks de fin de semaine
```typescript
// NF525
- Tous les Z ont été clôturés (1 par jour de service)
- Chaîne de hachage intacte (H_N = SHA256(H_{N-1} + data))
- Numéros de séquence continus (Z_N = Z_{N-1} + 1)
- 0 modification sur journalEntries/fiscalSeals

// RH
- Tous les shifts ont un clock_in ET un clock_out
- Pas d'heures > 10h sans pause de 30min (L3121-16)
- Compteur modulation à jour (AnnualizationEngine)

// Stock
- Quantités cohérentes (stock initial - consommé + reçu = stock final)
- 0 produit DLC dépassée en stock actif
- Food cost % dans les bornes (25-35% selon le menu)

// Finance
- Total des tickets = somme des journalEntries
- TVA ventilée = somme des lignes TVA de chaque ticket
- Caisse clôturée sans écart non résolu

// CRM
- Points fidélité accrédités sur chaque commande avec customerId
- No-shows marqués + flag CRM si récidive
- Rappels envoyés J-1 pour chaque réservation du lendemain
```

### `nf525Integrity.ts` — audit fiscal complet
```typescript
- Aucune entrée journal sans fiscalSeal associé
- Hash de chaque seal recalculé et comparé
- 0 trou dans la séquence
- Montants HT + TVA = TTC sur chaque entrée
```

### `businessKPIs.ts` — indicateurs métier
```typescript
- Ticket moyen dans la fourchette attendue (±20% du paramètre)
- Food cost % calculé et stocké après chaque livraison
- Labor cost % calculé à la clôture de chaque service
- Taux de transformation réservation → présent (objectif > 85%)
```

---

## Exemple de sortie attendue

```
🎬 Simulation démarrée — 2 semaines · Restaurant Le Nexus · 5 tables · 4 employés

  Semaine 1
  ─────────
  Lun 12:00  ✓ Service midi — 33 couverts · 8 commandes · Z clôturé 23:59
  Lun 19:30  ✓ Service soir — 51 couverts · 13 commandes
  Mar 08:30  ⚠ Incident: DLC expirée — salade_verte bloquée au POS
  Mar 12:00  ✓ Service midi — plat 86 déclenché · draft PO envoyé fournisseur
  Mer 07:45  ⚠ Incident: Chef cuisinier malade (3j)
  Mer 12:00  ✓ Alerte sous-effectif → manager notifié push
  ...

  Semaine 2
  ─────────
  ...

📊 Résultats finaux
  ├─ 24 services simulés
  ├─ 847 commandes · CA total 48 230€
  ├─ 12 incidents gérés automatiquement
  ├─ 24 clôtures Z · chaîne NF525 intacte ✓
  ├─ Food cost moyen : 29.4% ✓
  ├─ Labor cost moyen : 32.1% ✓
  └─ 0 assertion échouée ✓

✅ Simulation complète — cohérence 100%
```

---

## Ordre de développement conseillé

1. **`engine/SimulacraEngine.ts`** — le bootstrap tenant avec fixtures
2. **`engine/TimeController.ts`** — mock Vitest `vi.setSystemTime()` + crons
3. **`scenarios/service.ts`** — service.midi et service.soir (base de tout)
4. **`simulation.test.ts`** — test maître mode défaut qui tourne
5. **`assertions/weeklyCoherence.ts`** — les checks les plus importants
6. **`scenarios/incidents.ts`** — les 20 incidents un par un
7. **`assertions/nf525Integrity.ts`** + **`businessKPIs.ts`**
8. Scénarios combinés + CLI de sélection par `DEMO_SCENARIO`

---

## Pourquoi c'est important

- **Avant de déployer chez un client** : lancer la simulation 4 semaines, 0 assertion échouée = go
- **Après chaque grosse feature** : vérifier que rien n'a cassé dans les cas réels
- **Pour les autres verticales** : changer `DEMO_VARIANT=bakery` et réutiliser 80% des scénarios
- **Pour les démos commerciales** : lancer en mode verbose, montrer le système qui se gère tout seul en live

---

*Restaurant OS Core — demo/SIMULATION.md · v1.0 · 2026-08-09*
