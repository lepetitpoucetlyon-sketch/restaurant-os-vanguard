# Audit Complet i18n & Dictionnaire Français (2026-09-01)

> **Référence d'audit :** Réalisé le 2026-09-01 en conformité avec les Lois 7 (Zero-Claim Policy) et 8 (Bout-en-bout).  
> **Objectif :** Évaluer l'état réel de l'internationalisation (`src/i18n/`), identifier la cause des mots anglais / clés brutes visibles sur l'interface francophone, et fournir la cartographie exhaustive des clés manquantes et des termes à franciser.

---

## 1. Synthèse Exécutive & Métriques Réelles (Loi 7)

| Métrique | Valeur Mesurée | Statut |
|---|---|---|
| **Langues prises en charge** | 5 (`fr`, `en`, `es`, `pt`, `ja`) | ✅ Structuré |
| **Clés déclarées par langue (`src/i18n/locales/*.ts`)** | **347 clés** (parité stricte sur les 5 fichiers) | ✅ Aligné |
| **Appels `t('...')` uniques dans le code (`src/`)** | **172 clés uniques** appelées | ⚠️ Partiel |
| **Clés appelées mais ABSENTES du dictionnaire `fr.ts`** | **107 clés manquantes** (62,2% des appels) | ❌ Cause des clés brutes |
| **Clés trouvées et traduites dans `fr.ts`** | **65 clés** | 🟡 37,8% |
| **Termes anglais non traduits dans `fr.ts`** | **38 termes** | ⚠️ Bilinguisme résiduel |
| **Statut du câblage `LanguageContext`** | Actif via `NexusCoreProvider` (fallback `fr`) | ✅ Opérationnel |

---

## 2. Causes Racines de la Présence d'Anglais sur l'Interface

L'apparition de termes en anglais ou de libellés techniques sur l'interface utilisateur provient de **trois causes racines distinctes** :

### Cause Racine A — Les 107 Clés Manquantes dans `src/i18n/locales/fr.ts` (62%)
Quand un composant React appelle `t('pos.split_bill')` ou `t('settings.tab_logic')`, la fonction `t()` de `NexusCoreProvider` interroge le dictionnaire `fr.ts`.  
Ne trouvant pas la clé, elle exécute son fallback :
```ts
return fallback ?? key; // Affiche 'pos.split_bill' ou le fallback anglais du développeur
```
C'est ainsi que des libellés comme `pos.payment.title`, `sidebar.logout`, ou `recipe_sheet.ingredients` s'affichent bruts ou en anglais.

### Cause Racine B — Clés présentes dans `fr.ts` mais contenant des termes anglais (22%)
38 entrées de `src/i18n/locales/fr.ts` contiennent des termes ou phrases en anglais non traduits lors de la création initiale (ex: *"Dashboard"*, *"Live"*, *"KDS"*, *"VIP Lounge"*).

### Cause Racine C — Données Métier & Seeders en Anglais (16%)
Les états techniques de tables (`'available'`, `'occupied'`, `'cleaning'`, `'reserved'`), les modes de consommation (`'dine_in'`, `'takeaway'`) et les cartes de démonstration sont injectés en anglais brut sans passer par une fonction de formattage localisée.

---

## 3. Cartographie Exhaustive des 107 Clés Manquantes par Module

```
                                  RÉPARTITION DES 107 CLÉS MANQUANTES
┌──────────────────────────────┬──────────────────┬────────────────────────────────────────────────────────┐
│ Module / Domaine             │ Clés Manquantes  │ Exemples de Clés & Écrans Impactés                     │
├──────────────────────────────┼──────────────────┼────────────────────────────────────────────────────────┤
│ 🛒 POS & Encaissement Caisse │ 27 clés          │ pos.split_bill, pos.payment.title, pos.details.notes   │
│ ⚙️ Paramètres & Personnalis. │ 23 clés          │ settings.tab_logic, settings.tab_style, settings.reset │
│ 📇 CRM & Relation Client     │ 19 clés          │ crm.filter_all, crm.stat_total_customers, crm.edit     │
│ 🔧 Maintenance & SOS         │ 10 clés          │ maintenance_recipients.director, .immediate, .matrix   │
│ 📖 Fiches Recettes Cuisine   │ 9 clés           │ recipe_sheet.ingredients, .prep_steps, .difficulty     │
│ 📊 Dashboard Opérations      │ 8 clés           │ ops_dashboard.stock_napping, .brigade, .weather        │
│ 🧭 Barre Latérale (Sidebar)  │ 5 clés           │ sidebar.logout, sidebar.admin_fallback, .expense_claim │
│ 🌐 Vocabulaire Commun        │ 3 clés           │ common.covers, common.enabled, common.disabled         │
│ 🪟 En-tête & Navigation      │ 2 clés           │ nav.dashboard, nav.executive_intelligence              │
│ 📅 Réservations              │ 1 clé            │ reservations.client_list                               │
└──────────────────────────────┴──────────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. Inventaire Détaillé des Clés Manquantes

### A. Caisse & Split d'Addition (`pos.*`) — 27 clés
* `pos.table` — Table
* `pos.cart.empty` — Votre panier est vide
* `pos.split_bill` — Partager l'addition
* `pos.payment.title` — Règlement de la commande
* `pos.payment.subtitle` — Encaissement certifié NF525
* `pos.payment.processing` — Traitement du paiement en cours...
* `pos.payment.confirm_seal` — Confirmer et sceller le règlement
* `pos.payment.security_seal` — Sceau de sécurité cryptographique
* `pos.payment.encryption_protocol` — Protocole d'inaltérabilité NF525
* `pos.payment.methods.card` — Carte Bancaire
* `pos.payment.methods.cash` — Espèces
* `pos.payment.methods.mobile` — Paiement Mobile / Sans contact
* `pos.payment.transaction_success` — Transaction validée avec succès
* `pos.payment.generating_receipt` — Génération du ticket client...
* `pos.search_placeholder` — Rechercher un plat, une boisson...
* `pos.split.title` — Répartition de l'addition
* `pos.split.subtitle` — Division par convive ou par article
* `pos.split.modes.equal` — Parts égales
* `pos.split.modes.by_item` — Par article
* `pos.split.modes.custom` — Montants personnalisés
* `pos.split.convive_spirit` — Convive
* `pos.split.collect` — Encaisser la part
* `pos.split.remaining` — Solde restant dû
* `pos.split.close_archive` — Clôturer le partage

### B. Paramètres & Thème (`settings.*`) — 23 clés
* `settings.title` — Configuration & Personnalisation
* `settings.tab_logic` — Logique Métier
* `settings.tab_style` — Style & Apparence
* `settings.reset` — Réinitialiser par défaut
* `settings.apply` — Enregistrer les modifications
* `settings.aura_title` — Ambiance Visuelle
* `settings.mode_label` — Mode d'affichage
* `settings.modes.light.label` — Mode Clair
* `settings.modes.light.desc` — Optimisé pour les environnements très éclairés
* `settings.modes.dark.label` — Mode Sombre
* `settings.modes.dark.desc` — Réduit la fatigue visuelle lors des services du soir
* `settings.modes.auto.label` — Automatique
* `settings.modes.auto.desc` — Suit les réglages du système d'exploitation
* `settings.accent_label` — Couleur d'accentuation
* `settings.density_label` — Densité de l'interface
* `settings.radius_label` — Arrondi des composants
* `settings.glass_label` — Effet Verre Dépoli (Glassmorphism)
* `settings.animations_label` — Micro-animations & Transitions

### C. CRM & Clients (`crm.*`) — 19 clés
* `crm.title` — Répertoire Clients & Fidélité
* `crm.stat_total_customers` — Total Clients Répertoriés
* `crm.stat_active_loyalty` — Membres Fidélité Actifs
* `crm.stat_total_revenue` — Chiffre d'Affaires Cumulé
* `crm.filter_all` — Tous les clients
* `crm.filter_vip` — Clients VIP
* `crm.filter_regular` — Habitués
* `crm.filter_new` — Nouveaux clients
* `crm.search_placeholder` — Rechercher par nom, email ou téléphone...
* `crm.add_contact` — Nouveau Contact
* `crm.edit` — Modifier la fiche
* `crm.export_csv` — Exporter la base (CSV)

### D. Navigation & Structure (`sidebar.*`, `nav.*`, `common.*`) — 10 clés
* `nav.dashboard` — Tableau de Bord
* `nav.executive_intelligence` — Intelligence Exécutive
* `sidebar.logout` — Déconnexion
* `sidebar.admin_fallback` — Administrateur
* `sidebar.expense_claim` — Note de frais
* `common.covers` — Couverts
* `common.enabled` — Activé
* `common.disabled` — Désactivé

---

## 5. Plan d'Action Recommandé (3 Lots)

1. **Lot 1 — Complétion Intégrale de `src/i18n/locales/fr.ts`** :
   - Insérer les 107 clés manquantes directement dans `fr.ts` avec des traductions françaises soignées, adaptées à la restauration française et conformes au design system.
   - Propager ces 107 clés vers `en.ts`, `es.ts`, `pt.ts`, `ja.ts` pour préserver la parité stricte des 5 langues (347 $\rightarrow$ **454 clés**).

2. **Lot 2 — Formatage des États Techniques & Énumérations** :
   - Créer un helper de traduction des statuts (`formatTableStatus(status)`, `formatConsumptionMode(mode)`).
   - Remplacer les statuts anglais bruts (`available`, `occupied`, `takeaway`) par leurs équivalents français (*Libre*, *Occupée*, *À emporter*).

3. **Lot 3 — Resserrement de la Gate Last-Mile (Compteur i18n)** :
   - Valider que le compteur `MISSING_I18N_KEYS_MAX` de la Gate 6 reste scellé à **0**.
