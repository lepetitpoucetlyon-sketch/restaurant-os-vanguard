# 🏛️ ÉTUDE MAÎTRESSE & GRAND PLAN DU MCC (Merchant Control Center)
> **Le Système Nerveux Suzerain de la Métaplateforme & Gestion de Flotte (1 à 10 000+ Commerces)**  
> *Architecture Multi-Tenant, Double Moteur RBAC, Provisioning Transactionnel, Télémétrie Hardware, Moteur de Franchises & Gouvernance Fiscale.*  
> **Dernière révision** : 2026-08-15 · Statut : Référence Architecturale Grade X

---

## 📚 Sommaire

1. [Vision Fondamentale & Découplage Suzerain / Vassaux](#1-vision-fondamentale--découplage-suzerain--vassaux)
2. [L'Architecture RBAC à Double Moteur (Opérateur vs Tenant vs Franchise)](#2-larchitecture-rbac-à-double-moteur-opérateur-vs-tenant-vs-franchise)
3. [Cartographie Exhaustive des 10 Zones Opérationnelles du MCC](#3-cartographie-exhaustive-des-10-zones-opérationnelles-du-mcc)
4. [Analyse Détaillée des 41 Panneaux & Composants Actuels](#4-analyse-détaillée-des-41-panneaux--composants-actuels)
5. [Les 40 API Routes Administrateur (`/api/admin/*`)](#5-les-40-api-routes-administrateur-apiadmin)
6. [Angles Morts & Plan de Propulsion Enterprise Grade (Les 6 Piliers d'Évolution)](#6-angles-morts--plan-de-propulsion-enterprise-grade-les-6-piliers-dévolution)
7. [Feuille de Route d'Intégration & Backlog Tactique (H1 → H4)](#7-feuille-de-route-dintégration--backlog-tactique-h1--h4)

---

## 1. Vision Fondamentale & Découplage Suzerain / Vassaux

Le **MCC (Merchant Control Center)** est le **Cockpit Suzerain** qui gouverne l'ensemble de la flotte de commerces physiques (Restaurants, Boulangeries, Salons, Hôtels, Garages, Cliniques, Retail).

```
                      ┌───────────────────────────────────────────┐
                      │        COCKPIT SUZERAIN (MCC)             │
                      │  Flotte · Billing · Télémétrie · OTA · IA │
                      └─────────────────────┬─────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               │                                                         │
   [Flotte Indépendants]                                    [Réseaux Multi-Sites]
┌─────────────────────────────┐                         ┌─────────────────────────────┐
│  Restaurant A (Vassal)      │                         │  Groupe Franchise X         │
│  - POS, KDS, Tables, Stocks │                         │  - 15 Pizzerias rattachées  │
│  - Clôture NF525, HACCP     │                         │  - Sous-MCC "Holding" dédié │
└─────────────────────────────┘                         └─────────────────────────────┘
```

### Invariants Architecturaux Absolus :
1. **Zéro Logique Métier dans le MCC** : Le MCC ne manipule jamais d'ingrédients, de tables ou de plats. Il manipule des **tenants**, des **licences**, des **sauvegardes PITR**, des **versions logicielles**, des **clés d'activation de terminaux (MDM)** et des **flux monétaires Stripe**.
2. **Isolation PII & Données Locataires** : Un opérateur MCC ne peut **jamais** consulter les données personnelles (clients, salariés, chiffre d'affaires nominatif) d'un restaurant sans une **procédure d'impersonation / Support Access Session** horodatée, signée et approuvée par le gérant du commerce.
3. **Imperméabilité Multi-Tenant** : Le changement de tenant dans le MCC purge instantanément la mémoire vive (RAM) pour éviter tout saignement inter-établissements ($O(1)$ memory footprint).

---

## 2. L'Architecture RBAC à Double Moteur (Opérateur vs Tenant vs Franchise)

L'accès à la plateforme repose sur une stricte séparation en **trois niveaux de souveraineté** :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔴 NIVEAU 1 : OPÉRATEURS INTERNES MCC (Vous, Support, Développeurs)         │
│ - Auth : MFAGate (TOTP/Biométrie) + Token Bearer + Device Registry          │
│ - Rôles : mcc_junior_dev (L1) · mcc_support (L2) · fleet_admin (L3)         │
│ - Périmètre : Vue globale sur la flotte, zéro accès PII par défaut          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 🟡 NIVEAU 2 : SOUS-MCC FRANCHISES & GROUPES MULTI-SITES                     │
│ - Auth : Firebase JWT + Custom Claim `franchiseGroupId`                     │
│ - Rôles : Franchise_Master (Supervision) · Franchise_Auditor (Comptabilité) │
│ - Périmètre : Uniquement les établissements de leur propre réseau           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 🟢 NIVEAU 3 : GRILLE RBAC TENANT (Commerçant & Équipe Terrain)              │
│ - Auth : Firebase JWT + Code PIN Staff (PBKDF2) sur tablette                │
│ - Rôles : 14 rôles hiérarchisés du niveau 10 (Plongeur) au 100 (Propriétaire)│
│ - Périmètre : Strictement confiné à l'établissement local (tenants/{id})    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Détail des Rôles Opérateurs MCC :
* **`mcc_junior_dev` (Niveau 1)** : Lecture seule de la télémétrie, des versions et de l'état de santé. Aucune action mutante autorisée.
* **`mcc_support` (Niveau 2)** : Diagnostic IA, génération de brouillons de tickets, réinitialisation de code PIN de secours, demande de session de support délégué.
* **`fleet_admin` / `SUPER_ADMIN` (Niveau 3)** : Provisioning de nouveaux établissements, révocation de clés MDM, bascule de versions OTA, gestion des abonnements Stripe, accès aux exports légaux.
* **Sécurité « Hidden Door »** : Toute requête non authentifiée sur `/api/admin/*` renvoie un **HTTP 404 Not Found** (et non 401/403) pour dissimuler l'existence des routes de contrôle.

---

## 3. Cartographie Exhaustive des 10 Zones Opérationnelles du MCC

Le MCC centralise **10 espaces de pilotage** (`src/app/(admin)/admin/mcc/_tabs/`) :

| # | Espace MCC | Finalité Opérationnelle | Risque & Dépendance |
|---|---|---|---|
| **1** | 🚀 **Flotte (Fleet)** | Déploiement instantané d'instances (<30s), vue matricielle de la santé des établissements, inventaire du parc d'iPads/TPE. | Clé Stripe + Firebase Admin |
| **2** | 🛡️ **Conformité & NF525** | Visualiseur de chaîne cryptographique SHA-256, génération des attestations fiscales A4, Disaster Recovery PITR. | Algorithme de scellement immutable |
| **3** | 🧠 **Intelligence & IA** | Diagnostic automatisé des pannes par Gemini, copilote de support, détection proactive de risque de churn. | Clé Gemini / LightRAG |
| **4** | 💳 **Trésorerie & Billing** | Suivi du MRR / ARR, portail revendeurs/intégrateurs B2B, gestion des proratas de modules payants. | Webhooks Stripe & Dunning |
| **5** | 🔄 **Patch Center & OTA** | Mises à jour Over-The-Air en cascade, déploiements progressifs (Canary Releases), diffusion des changelogs. | Registre de versions |
| **6** | 🧩 **Moteur de Plugins** | Marketplace d'extensions à la carte (module livraison, borne tactile, cave à vin), activation sans redémarrage. | EventBus & FeatureFlags |
| **7** | ⚡ **EventBus & DLQ** | Supervision des 130 événements métier, mise en quarantaine des messages corrompus (Dead Letter Queue), réinjection automatique. | DLQRetryService |
| **8** | 🌲 **Arbre Suzerain / Vassaux** | Cartographie de l'héritage des paramètres, diffusion des politiques de marque et des cartes menus aux filiales. | SovereignGenome |
| **9** | 🧪 **Tenants Système (Sandbox)** | Environnements étanches `test`, `demo`, `preview` réinitialisables en 1 clic pour les démos commerciales. | SystemTenantRegistry |
| **10** | 📖 **CLI & Runbooks** | Guide technique, commandes CLI d'urgence (`fleet:list`, `instance:preflight`), procédures de crise. | Terminal local / Script |

---

## 4. Analyse Détaillée des 41 Panneaux & Composants Actuels

Voici l'inventaire complet des 41 composants modulaires du MCC (`src/app/(admin)/admin/mcc/components/`) :

### Bloc A : Flotte & Matériel
1. `FleetCommandTable.tsx` : Tableau dynamique avec recherche, statut en direct (HealthScore 0-100%), version logicielle et actions rapides.
2. `FleetDeviceInventory.tsx` : Recensement de tous les terminaux appairés (tablettes de caisse, écrans cuisine KDS, bornes, TPE).
3. `DeviceManager.tsx` & `DeviceManagerPanel.tsx` : Contrôle MDM, verrouillage à distance en cas de vol, révocation de jeton.
4. `TrustedDevicePanel.tsx` : Enrôlement des appareils de confiance avec empreinte hardware (`x-mcc-device-fp`).
5. `HealthHistorySparkline.tsx` : Graphique sparkline de l'historique de stabilité réseau et applicatif de chaque restaurant.
6. `VerticalActivePanel.tsx` : Affichage de la verticale métier activée (Restaurant, Boulangerie, etc.) et de ses modules spécifiques.

### Bloc B : Fiscalité & Sécurité
7. `FiscalChainExplorer.tsx` : Audit visuel de la chaîne de blocs fiscale NF525 (vérification que `Hash(N) === SHA256(Hash(N-1) + Ticket)`).
8. `CertificationCenter.tsx` : Checklist de certification réglementaire (NF525, HACCP, RGPD, e-invoicing Factur-X).
9. `TaxAuditPanel.tsx` : Audit de cohérence des taux de TVA appliqués par établissement.
10. `DisasterRecoveryPanel.tsx` : Restauration d'urgence PITR (Point-In-Time-Recovery) à la seconde près.
11. `LegalCertificateA4.tsx` : Moteur de rendu et d'export PDF de l'attestation légale de conformité NF525 pour l'administration fiscale.
12. `MFAGate.tsx` : Sas de sécurité biométrique / TOTP protégeant l'accès au cockpit opérateur.

### Bloc C : Intelligence Artificielle & Support
13. `SupportAIPanel.tsx` : Copilote IA analysant les anomalies remontées par la flotte pour guider le technicien de support.
14. `SupportDraftsPanel.tsx` : Générateur automatique de réponses aux tickets clients avec contexte technique pré-rempli.
15. `AIWorkshop.tsx` : Laboratoire de test des prompts et du comportement de l'assistant IA Oracle.
16. `StrategyOracle.tsx` : Moteur de recommandations stratégiques pour maximiser le chiffre d'affaires et la fidélisation.

### Bloc D : Trésorerie & Partenaires
17. `MCCTreasury.tsx` : Tableau de bord financier consolidé (MRR, ARR, churn rate, volume de transactions encaissées).
18. `TenantBillingPanel.tsx` : Gestion du lien Stripe Customer, du moyen de paiement de l'établissement et de ses factures d'abonnement.
19. `ResellerPortal.tsx` : Portail pour les intégrateurs et revendeurs partenaires (suivi de leur parc de clients et des commissions reversées).

### Bloc E : Déploiements & Résilience
20. `DeploymentEngine.tsx` : Moteur de synchronisation Git et de déploiement des nouvelles versions vers la flotte.
21. `FleetUpgradePanel.tsx` : Sélecteur de vagues de mise à jour (Canary Rollouts : 5% → 25% → 100%).
22. `TenantChangelogPanel.tsx` : Journal de bord des modifications système distribué à chaque restaurant.
23. `PluginEnginePanel.tsx` & `PluginCatalogManager.tsx` : Gestionnaire de plugins avec calcul automatique des proratas de facturation.
24. `EventBusHealthPanel.tsx` : Télémétrie de l'EventBus, file d'attente Outbox et monitoring de la quarantaine DLQ.
25. `MCCAuditStream.tsx` : Flux d'audit des actions opérateurs (traçabilité interne).
26. `LifecycleTreePanel.tsx` : Arbre d'héritage généalogique Suzerain / Vassaux.

---

## 5. Les 40 API Routes Administrateur (`/api/admin/*`)

Toutes ces routes sont hermétiquement protégées par `requireMccLevel()` / `adminAuthGuard.ts` :

1. **Flotte & Provisioning** : `/api/admin/fleet/seed-demo`, `/api/admin/fleet/contracts`, `/api/admin/fleet/changelog`, `/api/admin/fleet/upgrade`, `/api/admin/fleet/rollout`, `/api/admin/fleet/shadow-mode`, `/api/admin/fleet/dns`, `/api/admin/fleet/hotspot`.
2. **Support & Accès Délégué** : `/api/admin/fleet/support-access`, `/api/admin/fleet/support-gate`, `/api/admin/fleet/support-ai/diagnose`, `/api/admin/fleet/support-ai/drafts`, `/api/admin/fleet/users/impersonate`, `/api/admin/fleet/users/reset-pin`, `/api/admin/fleet/users/role`.
3. **Télémétrie & Santé** : `/api/admin/fleet/telemetry/heartbeat`, `/api/admin/fleet/telemetry/crash-report`, `/api/admin/fleet/health-score`, `/api/admin/fleet/churn`, `/api/admin/fleet/drain-outbox`.
4. **Billing & Trésorerie** : `/api/admin/fleet/billing/usage`, `/api/admin/fleet/billing/feature-flags`, `/api/admin/fleet/billing/portal-session`, `/api/admin/fleet/billing/treasury-report`, `/api/admin/fleet/tenant-billing`, `/api/admin/mcc/reseller`, `/api/admin/mcc/reseller/commissions`.
5. **Conformité & NF525** : `/api/admin/compliance/chain-audit`, `/api/admin/compliance/fiscal-tenant-audit`, `/api/admin/compliance/nf525-certificate`, `/api/admin/finance/fec/export`, `/api/admin/fleet/cron/nf525-audit`, `/api/admin/fleet/rgpd-purge`, `/api/admin/fleet/backup`, `/api/admin/fleet/restore`.
6. **MDM & Hardware** : `/api/admin/mdm/devices`, `/api/admin/mdm/lock`, `/api/admin/mdm/erase`, `/api/admin/mcc/fleet/devices/lock`, `/api/admin/mcc/fleet/devices/delivery`.
7. **Tenants Système** : `/api/admin/mcc/system-tenants/reset-demo`, `/api/admin/mcc/system-tenants/reset-test`, `/api/admin/mcc/system-tenants/promote`.

---

## 6. Angles Morts & Plan de Propulsion Enterprise Grade (Les 6 Piliers d'Évolution)

Pour donner au MCC une envergure industrielle sans rival :

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    LES 6 PILIERS DE PROPULSION DU MCC                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. 🔄 Rollback Transactionnel Automatique sur Provisioning (Saga Pattern)    │
│ 2. 🖨️ Télémétrie Hardware Découplée en Temps Réel (IoT / TPE / Imprimantes)  │
│ 3. 🏢 Portail Franchiseur Dédié (Sous-MCC Multi-Sites avec RBAC Holding)     │
│ 4. ⚖️ Générateur d'Archives Fiscales Groupe en 1 Clic (FEC + ZIP Scellé)     │
│ 5. 🚨 Simulateur de Crise & Chaos Monkey Déclenché depuis le MCC             │
│ 6. 🏥 SAS de Sécurité HDS & Traçabilité Médicale Renforcée (Clinic OS)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Pilier 1 : Rollback Transactionnel Automatique (Saga Pattern)
* **Objectif** : Éviter tout résidu orphelin (Stripe customer créé sans base Firebase, ou base créée sans compte admin).
* **Implémentation** : Structurer `TenantProvisioningService` sous forme de machine d'état avec journal de compensation : en cas d'échec à l'étape $N$, les étapes $N-1$ à $1$ sont automatiquement détricotées.

### Pilier 2 : Télémétrie Hardware Découplée (Terrain)
* **Objectif** : Identifier immédiatement les problèmes physiques avant que le restaurateur ne panique.
* **Implémentation** : Panneau `HardwareFleetStatus` affichant par restaurant :
  - Imprimante thermique : 🟢 Connectée (Niveau papier OK) / 🔴 Capot ouvert / 🟡 Hors papier
  - Terminal de paiement TPE : 🟢 Connecté IP local / 🔴 En veille Bluetooth
  - Routeur 4G failover : 🟢 En veille / 🟡 Actif (fibre coupée)

### Pilier 3 : Portail Franchiseur Dédié (Sous-MCC Multi-Sites)
* **Objectif** : Permettre à des groupes de 5 à 100 établissements de piloter leur réseau en totale autonomie.
* **Implémentation** :
  - Création du rôle `Franchise_Master`.
  - Vue agrégée MacroBrain : comparaison des tickets moyens, benchmarks des coûts matières entre restaurants du même groupe.
  - Diffusion des fiches techniques et des prix en 1 clic sur tout le réseau.

### Pilier 4 : Export d'Archive Fiscale Groupe en 1 Clic
* **Objectif** : Répondre instantanément aux contrôles fiscaux sans stress pour le commerçant.
* **Implémentation** : Bouton dans `ComplianceTab` générant une archive ZIP scellée contenant les 12 fichiers FEC normalisés, le journal des événements de caisse et l'attestation NF525 signée par clé privée.

### Pilier 5 : Simulateur de Crise & Chaos Monkey
* **Objectif** : Prouver aux clients grands comptes la résilience absolue du système.
* **Implémentation** : Bouton dans `SystemTenantsTab` permettant d'injecter des pannes simulées (coupure réseau forcée, saturation de commandes) pour vérifier le bon comportement des queues offline.

### Pilier 6 : SAS de Sécurité HDS (Pour la Verticale Santé / Clinique)
* **Objectif** : Respecter les exigences ANSSI / HDS pour la gestion des données de santé.
* **Implémentation** : Toute consultation technique par un opérateur MCC est obligatoirement soumise à un motif légal, doublement authentifiée et inscrite dans un journal d'audit infalsifiable (`mcc/hds_access_audit`).

---

## 7. Feuille de Route d'Intégration & Backlog Tactique (H1 → H4)

| Horizon | Phase | Chantier Prioritaire | Impact Business & Opérationnel |
|:---:|---|---|---|
| **H1** | **Sécurisation & Terrain** | • Rollback Saga sur Provisioning<br>• Télémétrie Hardware (Imprimantes / TPE) | Éradique 80% des tickets de support technique |
| **H2** | **Grands Comptes & Franchises** | • Portail Multi-Franchises (`Franchise_Master`)<br>• Export Fiscal Groupe (ZIP FEC en 1 Clic) | Permet de signer des chaînes de 10 à 50 restaurants |
| **H3** | **Distribution & Réseau** | • Portail Revendeurs B2B & Commissions Stripe<br>• Déploiements OTA progressifs (Canary Rollouts) | Déploiement à grande échelle via des intégrateurs régionaux |
| **H4** | **Souveraineté & Haute Sécurité** | • SAS d'audit HDS pour la Verticale Clinic<br>• Simulateur de Crise (Chaos Testing) | Homologation grands comptes et secteur médical |
