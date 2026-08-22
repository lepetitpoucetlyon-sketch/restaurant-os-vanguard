# 🧭 Matrice de Qualification Systémique & Diagnostic de Profondeur

> **Skill Reference** : `vertical-forge`  
> **Standard** : Nexus Empire Architecture & Invariants Fiscaux NF525  
> **Niveau d'Exhaustivité** : Aligné sur `docs/anglemort-restaurant-mcc.md`

Ce document constitue le **référentiel de qualification** utilisé par les agents IA et le wizard d'onboarding pour concevoir, calibrer et dimensionner une nouvelle **Verticale Métier** ou un nouveau **Tenant** sur le socle universel.

---

## 🏛️ Invariants Systémiques Non-Négociables

Toute configuration générée via cette matrice DOIT respecter les 5 invariants du tronc commun :
1. **Inaltérabilité Fiscale (NF525)** : Toute transaction financière est scellée de manière immuable (`journalEntries`, `fiscalSeals`, Grand Total, chaînage SHA-256). Zéro `UPDATE`, zéro `DELETE`.
2. **Isolation Suzerain/Vassal (`SovereignGuard`)** : Cloisonnement strict des données par `activeTenantId` (`tenants/{tenantId}/{collection}/{id}`).
3. **Arithmétique Monétaire en Microunités** : `1 € = 1 000 000 µ` (Type branded `Microunits`). Tout split de montant alloue le résidu indivisible au dernier élément.
4. **Loi des Couches (ADR-015)** : Découplage strict entre piliers (EventBus pour effets de bord, contrats neutres pour requêtes synchrones, shared components pour l'UI).
5. **Anti-DST & Horodatage Absolu** : Calculs de durées et shifts en millisecondes UTC (`Date.now()`). Rattachement à la session de service (`ServiceSessionId`).

---

## 📊 Matrice des 7 Axes de Qualification

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LES 7 AXES DE PROFONDEUR                        │
├────────────────────────────────────────────────────────────────────────┤
│  AXE 1 : 🏢 Échelle, Gouvernance & Multi-Sites                         │
│  AXE 2 : 💶 Fiscalité, Encaissement & Modèle Commercial                │
│  AXE 3 : 👥 Ressources Humaines, Temps de Travail & Conventions        │
│  AXE 4 : 📦 Logistique, Chaîne d'Approvisionnement & Matières          │
│  AXE 5 : 🖨️ Hardware, IoT & Réseau de Périphériques                   │
│  AXE 6 : ⚖️ Conformité Réglementaire, Hygiène & Sécurité Métier        │
│  AXE 7 : 🧠 Intelligence Artificielle, Prédictions & Autonomie         │
└────────────────────────────────────────────────────────────────────────┘
```

---

### AXE 1 : 🏢 Échelle, Gouvernance & Multi-Sites

| Question Diagnostic | Options / Niveaux | Capabilities Impactées | Tiers de Précision |
|---|---|---|:---:|
| **Q1.1 Structure juridique & taille** | • **Solo / Artisan** (1 pers.)<br>• **TPE** (2 à 9 employés)<br>• **PME** (10 à 49 employés)<br>• **Entreprise / ETI** (50 à 250+ employés) | `mod_hr: off` (solo)<br>`mod_hr: on`, `mod_rbac: on`<br>`mod_payroll: on`, `mod_audit: on`<br>`mod_mcc: on`, `mod_governance: on` | L0 / L1<br>L1<br>L2<br>L3 |
| **Q1.2 Topologie des établissements** | • **Mono-site** unique<br>• **Multi-sites indépendants** (2-5 sites)<br>• **Réseau / Franchise intégrée** (10+ sites, dépôts centraux) | Base standard<br>`mod_multisite: on`<br>`mod_franchise: on`, `mod_stock_transfer: on`, `mod_central_billing: on` | L1<br>L2<br>L3 |
| **Q1.3 Rôles et hiérarchie (RBAC)** | • **Simple** (Admin / Vendeur)<br>• **Intermédiaire** (Directeur / Manager / Collaborateur / Stagiaire)<br>• **Matrice fine** (Permissions par action, double validation pour remises > 20%, audit des ouvertures tiroir) | `mod_rbac: basic`<br>`mod_rbac: standard`<br>`mod_rbac: granular`, `mod_security_audit: on` | L0<br>L1 / L2<br>L3 |

---

### AXE 2 : 💶 Fiscalité, Encaissement & Modèle Commercial

| Question Diagnostic | Options / Niveaux | Capabilities Impactées | Configuration Fiscale |
|---|---|---|---|
| **Q2.1 Modèle de transaction principal** | • **B2C Comptoir** (Vente directe, encaissement immédiat)<br>• **B2B / Devis & Factures** (Acomptes, situations, paiement à 30j)<br>• **Mixte B2C / B2B** (Caisse + Facturation périodique fin de mois)<br>• **Abonnements & Récurrent** (Prélèvements SEPA, forfaits mensuels) | `mod_pos: on`<br>`mod_quotes: on`, `mod_invoicing: on`, `mod_situations: on`<br>`mod_pos: on`, `mod_invoicing: on`, `mod_deferred_billing: on`<br>`mod_subscriptions: on`, `mod_sepa: on` | Scellement NF525 direct<br>Factur-X / Chorus Pro<br>Double pipeline de scellement<br>Échéancier récurrent |
| **Q2.2 Régime de TVA & Fiscalité** | • **Franchise en base (Art. 293 B CGI)** (Pas de TVA)<br>• **Taux standard unique (20%)**<br>• **Multi-taux complexe** (5.5%, 10%, 20%, ventilation sur formules)<br>• **Autoliquidation BTP / Export** (Sous-traitance, exonérations) | `TaxRateGuard: zero_tax`<br>`TaxRateGuard: standard_20`<br>`TaxRateGuard: multi_rate`, `mod_combo_prorata: on`<br>`TaxRateGuard: reverse_charge`, `mod_fec: on` | Taux 0% certifié<br>Compte 445710<br>Ventilation prorata temporis<br>Mentions légales obligatoires |
| **Q2.3 Moyens de paiement acceptés** | • **Carte & Espèces simples**<br>• **Titres-restaurant / Chèques-vacances** (Plafond 25€/j, CONECS)<br>• **Comptes prépayés / Cartes cadeaux / Portefeuille client**<br>• **Paiement fractionné (Split bill)** (Parts égales, articles, montants) | `mod_cash: on`, `mod_card: on`<br>`mod_meal_vouchers: on`, `MealVoucherLimitGuard: on`<br>`mod_customer_wallets: on`, `mod_gift_cards: on`<br>`mod_split_bill: on` (Invariant micro-unit residue) | Clôture de caisse Z<br>Recon. journalière<br>Gestion des créances<br>Somme(parts) === Total |

---

### AXE 3 : 👥 Ressources Humaines, Temps de Travail & Conventions

| Question Diagnostic | Options / Niveaux | Capabilities Impactées | Règles Métier |
|---|---|---|---|
| **Q3.1 Gestion du pointage & présence** | • **Aucun salarié** (Solo)<br>• **Planning indicatif** (Pas d'enregistrement d'heures réelles)<br>• **Pointage digital (Badgeuse / Code PIN / RFID)**<br>• **Pointage biométrique / Géolocalisé** (Chantiers nomades) | `mod_hr: off`, `mod_timeclock: off`<br>`mod_hr: basic`, `mod_planning: on`<br>`mod_hr: on`, `mod_timeclock: on`, `BadgeClockoutAtZService`<br>`mod_timeclock_geo: on`, `mod_offline_clockin: on` | Zéro RH<br>Planning visuel<br>Calcul des écarts réels<br>Outbox offline cryptée |
| **Q3.2 Complexité de la paie & Convention** | • **Standard 35h sans majoration**<br>• **Modulation du temps de travail (39h, forfaits jours, RTT)**<br>• **Heures majorées & Primes** (Travail de nuit, dimanche, jours fériés, paniers)<br>• **Export Paie Spécialisé** (SILAE, Payfit, Cegid, Sage) | `mod_payroll: basic`<br>`mod_payroll: modulation`, `mod_rtt: on`<br>`mod_payroll: advanced_bonuses`, `RestPeriodGuard: on`<br>`mod_payroll_export: on` | Heures sup standards<br>Compteurs RTT dynamiques<br>Repos 11h obligatoire<br>Export EDI normé |
| **Q3.3 Sécurité & Santé au travail** | • **Non applicable**<br>• **Registre unique du personnel & Visites médicales**<br>• **Habilitations obligatoires (CACES, SST, Travail en hauteur)**<br>• **Suivi des accidents du travail (Cerfa, registre AT bénévoles)** | `mod_safety: off`<br>`mod_hr_compliance: on`<br>`mod_certifications_tracking: on`<br>`mod_work_accidents: on`, `WorkAccidentService: on` | —<br>Alertes renouvellement<br>Blocage assignation si expiré<br>Génération Cerfa auto |

---

### AXE 4 : 📦 Logistique, Approvisionnement & Matières

| Question Diagnostic | Options / Niveaux | Capabilities Impactées | Moteurs Activés |
|---|---|---|---|
| **Q4.1 Nature du stock** | • **Zéro Stock** (Prestation intellectuelle ou de service pur)<br>• **Produits Finis (Unitaires / Code-barres)** (Retail, revente)<br>• **Matières Premières & Recettes / Fiches Techniques** (Production)<br>• **Périssable à rotation rapide** (Frais, fleurs, viande, DLC) | `usesCulinaryStock: false`, `mod_inventory: off`<br>`mod_inventory: on`, `mod_barcode: on`<br>`mod_recipes: on`, `mod_costing: on`, `mod_waste_tracking: on`<br>`mod_dlc: on`, `mod_haccp: on`, `usesCulinaryStock: true` | —<br>Décrémentation atomique<br>Explosion nomenclature<br>Déstockage FEFO/FIFO |
| **Q4.2 Traçabilité & Numéros de Lot** | • **Pas de traçabilité lot requise**<br>• **Traçabilité standard par lot fournisseur**<br>• **Traçabilité stricte avec chaîne du froid / IoT**<br>• **Rappels sanitaires & Fanout automatique** (Alerte clients/fournisseurs) | `mod_lots: off`<br>`mod_lots: on`, `TraceabilityLotManager: on`<br>`mod_iot_temp: on`, `ChillingComplianceService: on`<br>`mod_recall_fanout: on`, `RappelConsoFanoutService: on` | Stock global<br>Généalogie produit<br>Alertes sondes 24/7<br>Push notification SMS/Email |
| **Q4.3 Réception & Rapprochement Fournisseur** | • **Facture directe sans BL**<br>• **Réception avec pointage BL (Bon de Livraison)**<br>• **Rapprochement 3 Voies (Commande ↔ BL ↔ Facture)**<br>• **Contrôle des dérives tarifaires fournisseurs** | `mod_procurement: basic`<br>`mod_reception: on`, `mod_bl_scanning: on`<br>`ThreeWayMatchEngine: on`, `mod_supplier_invoices: on`<br>`SupplierPriceDeviationWatcher: on` | Saisie simple<br>Écarts de quantité<br>Validation comptable auto<br>Alerte inflation produit |

---

### AXE 5 : 🖨️ Hardware, IoT & Réseau de Périphériques

| Question Diagnostic | Options / Niveaux | Capabilities Impactées | Modules Hardware |
|---|---|---|---|
| **Q5.1 Périphériques d'encaissement** | • **Tablette tactile / PC autonome**<br>• **Pack Caisse Standard** (Tiroir-caisse, Imprimante ticket ESC/POS, TPE IP/BT)<br>• **Afficheur client 2 lignes ou écran secondaire publicitaire**<br>• **Monnayeur automatique (Cashlogy, Glory)** | `hardware: []`<br>`hardware: ['printer_receipt', 'cash_drawer', 'tpe_smart']`<br>`hardware: ['customer_display', 'printer_receipt', 'tpe_smart']`<br>`hardware: ['smart_cash_drawer', 'tpe_smart']` | Virtual POS<br>`UniversalPrinterBridge`<br>`CustomerFacingDisplay`<br>Contrôle variance zéro |
| **Q5.2 Postes de travail distribués & Production** | • **Poste unique**<br>• **Écrans de production / KDS (Kitchen/Workshop Display System)**<br>• **Réseau multi-imprimantes de production** (Bar, Cuisine, Atelier)<br>• **Bornes de commande en libre-service (Kiosks)** | `mod_kds: false`<br>`mod_kds: true`, `KDSPacingEngine: on`<br>`mod_production_printers: on`, `PrintRoutingDAG: on`<br>`mod_kiosk: on`, `mod_kiosk_pos: on` | Monoposte<br>Gestion du pacing/cadence<br>Routage par catégorie<br>Tunnel de vente kiosque |
| **Q5.3 Contrôle d'accès & Périphériques avancés** | • **Aucun**<br>• **Douchette / Scanner 1D/2D Bluetooth**<br>• **Lecteurs RFID / Tourniquets de contrôle d'accès** (Gym, Coworking)<br>• **Balances de pesage homologuées métrologie légale** | `hardware: []`<br>`hardware: ['barcode_scanner']`<br>`hardware: ['turnstile', 'rfid_reader']`<br>`hardware: ['certified_scale']` | —<br>`BarcodeScannerInput`<br>Contrôle de jauge/accès<br>Poids certifié au ticket |

---

### AXE 6 : ⚖️ Conformité Réglementaire, Hygiène & Sécurité Métier

| Secteur Métier | Réglementations Spécifiques Activées | Services & Guards Obligatoires |
|---|---|---|
| **🍽️ Restauration & Métiers de Bouche** | • Plan de Maîtrise Sanitaire (PMS / HACCP)<br>• Déclaration allergènes Décret 2015-447 (14 allergènes INCO)<br>• Registre des huiles de friture et bio-déchets (Loi AGEC 2024)<br>• Carafe d'eau et vaisselle réutilisable (Loi AGEC) | `AllergenGateService`<br>`FryingOilTestRegisterService`<br>`BiodechetsRegistryService`<br>`AgecCarafeService`<br>`WitnessDishService` (Plats témoins) |
| **🔨 BTP & Chantiers / Artisans** | • Plan Particulier de Sécurité et de Protection de la Santé (PPSPS)<br>• Bordereau de Suivi des Déchets Dangereux (BSDD amiante/peinture)<br>• Gestion des cautions de garantie et retenues de 5%<br>• Facturation des situations de travaux (Norme AFNOR NF P 03-001) | `BsddWasteOilService`<br>`mod_situations: on`<br>`mod_retention_guarantee: on`<br>`LegalContractGenerator: BTP` |
| **🚗 Automobile & Ateliers de Réparation** | • Système d'Immatriculation des Véhicules (SIV / VIN)<br>• Pièces Issues de l'Économie Circulaire (PIEC obligatoire Décret 2016-703)<br>• Déchets dangereux (Huiles usagées, filtres, batteries, fluides R134a/R1234yf)<br>• Ordre de Réparation (OR) et Devis préalable signé | `mod_siv_lookup: on`<br>`mod_piec_inventory: on`<br>`BsddWasteOilService`<br>`mod_repair_orders: on` |
| **🩺 Santé, Vétérinaire & Optique** | • Chiffrement fort des dossiers patients (AES-256-GCM / HDS)<br>• Respect RGPD Données Sensibles (Art. 9 RGPD)<br>• Suivi des rappels vaccinaux et carnets de santé électroniques<br>• Tiers-Payant / Télétransmission NOEMIE / Sesam-Vitale | `SovereignDataEncryption`<br>`mod_patient_records: on`<br>`mod_vaccine_reminders: on`<br>`LegalContractGenerator: HEALTH` |
| **🏢 Établissements Recevant du Public (ERP)** | • Registre de Sécurité Incendie dématérialisé (Extincteurs, BAES, SSI)<br>• Contrôle des jauges en temps réel et accès PMR<br>• Déclaration SACEM / SPRE pour diffusion musicale | `FireSafetyRegisterService`<br>`mod_occupancy_gauge: on`<br>`SACEMDeclarationService` |

---

### AXE 7 : 🧠 Intelligence Artificielle, Prédictions & Autonomie

| Niveau d'IA | Fonctionnalités Débloquées | Rôles & Sécurité (RBAC Membrane) |
|---|---|---|
| **IA Niveau 0 : Désactivée** | Aucune suggestion, système 100% déterministe. | Aucune clé API, 0 consommation LLM. |
| **IA Niveau 1 : Suggestions Passives** | • Aide à la rédaction des devis et fiches produits.<br>• Calcul statistique de repli (ex: prévision de rupture via médiane). | Modèles légers locaux (SLM / heuristic). |
| **IA Niveau 2 : Copilote Prédictif (Hermes)** | • Prédiction d'affluence et recommandations d'achats.<br>• Détection d'anomalies de caisse et de dérives alimentaires.<br>• Analyse des avis clients et synthèse de réputation. | `TenantAIRegistry`<br>`OracleEngine`<br>`AnomalyDetector` |
| **IA Niveau 3 : Agent Métier Autonome** | • Relance automatique des factures impayées selon scoring client.<br>• Commande automatique auprès des fournisseurs sur seuil de sécurité.<br>• RAG complet sur les manuels techniques et la convention collective. | `HermesKnowledgeManager` (RAG)<br>Double validation requise pour actions financières critiques (`ShieldedContext`). |

---

## 🎚️ 3. Grille des 4 Tiers de Précision (L0 ➔ L3)

| Tier | Cible Métier | Temps de Génération | Expérience Utilisateur |
|:---:|---|:---:|---|
| **L0 : Squelette Express** | Artisan solo, auto-entrepreneur, micro-boutique | < 1 minute | Interface ultra-épurée (3 boutons essentiels), 0 jargon technique, formulaires en 1 étape. |
| **L1 : Opérationnel Roulant** | TPE 2-9 salariés, commerce indépendant | ~ 2 minutes | Gestion des stocks, caisse complète, planning collaborateurs, devis/facturation conforme. |
| **L2 : Expert Métier** | PME 10-49 salariés, restaurant établi, atelier | ~ 5 minutes | Tableaux de bord dynamiques, alertes temps réel, KPIs sectoriels, traçabilité réglementaire complète. |
| **L3 : Enterprise & Réseau** | ETI 50+ salariés, franchise, multi-sites, ERP | ~ 10 minutes | Télémétrie flotte complète, consolidation multi-magasins, conformité auditée, hardware distribué. |

---

## 🎛️ 4. Le Switchboard Dynamique Client (« Hauteur / Profondeur »)

Dans l'interface utilisateur (`/settings/display-depth`), le gérant peut basculer son application entre 3 niveaux de vue sans jamais impacter la persistance des données :

```typescript
export type DisplayDepthLevel = 'essential' | 'manager' | 'enterprise';
```

1. **Vue Essentielle (Hauteur maximale / Complexité zéro)** :
   * Masque les 80% de menus avancés.
   * Affiche uniquement le flux de production du jour (Prendre une commande, Encaisser, Planning du jour).
2. **Vue Gestionnaire (Équilibre)** :
   * Affiche les marges brutes, les alertes de stocks, le suivi des heures et les relances clients.
3. **Vue Enterprise / Expert (Profondeur maximale)** :
   * Affiche l'audit trail complet SHA-256, le Grand Livre comptable, les exports FEC 19 colonnes, la matrice RBAC fine et les logs de synchronisation IoT.
