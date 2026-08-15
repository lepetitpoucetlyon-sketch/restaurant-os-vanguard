# 🛡️ Registre de Dette Technique, Legal & Angles Morts (DEBT.md)

> **Document Maître de Cadrage des Risques, Angles Morts & Actions Pré-Lancement**  
> **Dernière révision** : 2026-08-15 (Audit Codebase Empirique & Cadrage Terrain)  
> **Statut Codebase** : 2 686 fichiers · TSC = 0 · Zero-Defect Standard

---

## 🎯 1. Les 5 Bloquants Absolus d'Avant-Vente (P0)

Ces 5 items bloquent l'onboarding du **premier client payant en production**. Aucune facturation réelle ne doit avoir lieu avant leur résolution complète.

| # | Bloquant P0 | Domaine | Risque | Action Requise | Effort | Statut |
|---|-------------|---------|--------|----------------|--------|--------|
| 1 | **Accord juridique DPA RGPD & CGU/CGV** | Légal | Sanction CNIL (4% CA mondial), invalidité des contrats B2B | Rédaction formelle des CGU/CGV SaaS et du contrat de sous-traitance de données (DPA Art. 28 RGPD) avec avocat spécialisé. | 1-2 sem | 🔴 Bloquant |
| 2 | **Archivage WORM Long-Terme NF525** | Fiscalité | Invalidation fiscale NF525 (amende 7 500 € par caisse) | Configuration du backup Firestore immutable / Cloud Storage WORM avec rétention légale stricte de 6 ans sans possibilité d'effacement. | ~3 jours | 🔴 Bloquant |
| 3 | **Émission `WelcomeGuestButton` → `reservation.matched`** | Sécurité Food | Erreur d'allergènes INCO lors du check-in client | Finaliser le bouton d'accueil dans le plan de salle pour garantir la notification immédiate des fiches allergènes au KDS cuisine. | ~1 jour | 🔴 Bloquant |
| 4 | **Clôture des Handlers Bus Restants (R1-R13)** | Fonctionnel | Perte d'événements asynchrones ou échecs saga | Finaliser les 2 émetteurs manquants (Stripe Deposit Webhook & `ops.table_closed`) et valider la suite `test:bus` à 100% vert. | ~1 sem | 🟠 Prioritaire |
| 5 | **Pipeline CI/CD Minimal & Staging** | DevOps | Régression en production lors des déploiements | Mettre en place un workflow GitHub Actions bloquant la branche `main` si `tsc --noEmit` ou `vitest` échouent. | ~1 sem | 🟠 Prioritaire |

---

## 🧩 2. Les 6 Angles Morts Majeurs d'Architecture & Opérations

### ⚡ 2.1 Idempotence & Ordre des Événements du Bus (`NexusEventBus`)
* **Problème** : `NexusEventBus.ts` persiste les intentions dans l'Outbox locale (Dexie), mais le backend ne possède pas de table de déduplication des `eventId` consommés.
* **Risque en production** : Lors d'une coupure réseau ou d'un retry, un événement critique (`order.paid`, `finance.journal_entry_created`) rejoué deux fois peut doubler une écriture comptable ou un débit de stock.
* **Solution d'Ingénierie** :
  1. Enregistrer un `eventId` UUID unique dans chaque payload.
  2. Middleware `withIdempotencyGuard(eventId)` vérifiant la collection atomique `events_processed_log/{eventId}` avant exécution.

### ⛓️ 2.2 NF525 en Environnement Multi-Caisses & Mode Hors-Ligne
* **Problème** : Tension mathématique entre la chaîne SHA-256 séquentielle (`previousHash`) et le mode hors-ligne sur plusieurs tablettes simultanées.
* **Risque fiscal** : Deux tablettes hors-ligne qui encaissent en parallèle génèrent deux chaînes concurrentes qui "forkent", cassant la validation du vérificateur fiscal NF525 lors de la resynchronisation.
* **Solution d'Ingénierie** :
  1. **Chaîne Fiscale par Caisse (`registerId`)** : Chaque tablette tient sa propre sous-chaîne cryptographique continue `FiscalSeal_{registerId}`.
  2. **Grand Livre de Clôture Z Consolidé** : Lors de la clôture journalière Z, le serveur scelle un `MasterFiscalSeal` qui agrège les derniers hashes de tous les terminaux enregistrés.

### 🩺 2.3 Traçabilité des Allergies = Données de Santé (RGPD Art. 9)
* **Problème** : Les fiches allergies (`Customer.allergens`) liées à l'identité d'un client sont des **données de santé** au sens de l'Article 9 du RGPD.
* **Risque légal** : Sanction CNIL si stockées en clair comme de simples métadonnées CRM sans consentement explicite.
* **Solution d'Ingénierie** :
  1. Case à cocher de consentement explicite sur le formulaire de réservation / CRM.
  2. Chiffrement de repos sur le champ `allergens` et application stricte de la politique de suppression `ErasureService` (crypto-shredding).

### 🏢 2.4 Support B2B Tenant, Astreinte & Dépendance ("Bus Factor = 1")
* **Problème** : La plateforme propose un CRM pour les clients des restaurants, mais aucun canal de ticketing dédié pour que le restaurateur appelle l'opérateur en cas de bug en plein service.
* **Risque opérationnel** : Panne un samedi soir à 21h sans astreinte = perte de confiance et churn immédiat.
* **Solution d'Ingénierie** :
  1. Intégration d'un bouton **SOS Caisse** sur l'écran POS déclenchant une alerte prioritaire PagerDuty/Slack avec dump de diagnostic chiffré.
  2. Plan de continuité et d'astreinte formalisé dans `docs/guides/ON_CALL_RUNBOOK.md`.

### 📦 2.5 Provisioning Matériel & Réseau On-Site (Le Jour J)
* **Problème** : Absence de procédure standardisée pour le déploiement physique des iPads, imprimantes thermiques ESC/POS, TPE Stripe Terminal et sondes Bluetooth Testo.
* **Risque terrain** : Échec du premier service chez le client dû à un WiFi défaillant ou une imprimante mal appairée.
* **Solution Opérationnelle** :
  1. **Kit Valise d'Onboarding** : Routeur 4G multi-opérateurs de secours préconfiguré pour chaque établissement.
  2. **Checklist Matérielle J-0** : Procédure de validation en 12 points (test impression, test tiroir-caisse, test TPE CB 1€, test coupure WiFi).

### ⏳ 2.6 Délais d'Homologation des APIs Partenaires Tierces
* **Problème** : Des intégrations clés (Google Reserve, Doctolib, Booking.com, UberEats) dépendent de processus de validation commerciale et technique externes.
* **Risque de planning** : Bloquer une roadmap en supposant que l'activation API est instantanée après le développement.
* **Solution de Cadrage** :
  - Bufferiser obligatoirement un délai de **3 à 6 mois** pour les homologations tierces dans les Horizons H2 à H4.

---

## 🔍 3. Diagnostic Détaillé des 10 Catégories d'Angles Morts

### 1. Sécurité & Conformité Données (RGPD / HDS / WORM)
- **Constat** : Le moteur `ErasureService` (droit à l'oubli) existe, mais nécessite un masquage systématique des logs (`logger.info`).
- **Remède** : Masquage automatique des emails, téléphones et données santé dans le middleware de logging.

### 2. Fiscalité & Garanties Légales NF525
- **Constat** : Le scellage `FiscalSeal` SHA-256 en mémoire doit être doublé d'un archivage immuable WORM 6 ans.
- **Remède** : Auto-export au format PDF/A-3 Factur-X avec signature distante à la clôture du Ticket Z.

### 3. Support & Diagnostic d'Urgence (SLA 24/7)
- **Constat** : Absence de canal direct d'escalade d'urgence en direct.
- **Remède** : Bouton "SOS Caisse" avec transmission de logs d'état hors-ligne.

### 4. Assurance Qualité & Couverture de Tests (QA)
- **Constat** : 0 test E2E UI Playwright sur le parcours d'encaissement complet et la clôture Z.
- **Remède** : Écriture de 3 parcours E2E critiques sous Playwright.

### 5. Infrastructure & Résilience (DevOps)
- **Constat** : Absence d'auto-scaling du sidecar vectoriel LightRAG (port 9621).
- **Remède** : Encapsulation Docker avec fallback gracieux si timeout > 2s.

### 6. Internationalisation & Multi-Devises (i18n)
- **Constat** : Infrastructure `src/i18n/` dormante (Option B) et devises typées en EUR.
- **Remède** : Isoler l'affichage de la devise via `formatCurrency(microunits, currencyCode)`.

### 7. Continuité d'Activité (Disaster Recovery Plan)
- **Constat** : Pas de test documenté de restauration totale à partir de zéro (*Bare-Metal Recovery*).
- **Remède** : Automatisation du script `restore-tenant-from-vault.ts`.

### 8. Produit & Ergonomie Terrain
- **Constat** : Ergonomie desktop ultra-complète, mais besoin d'un mode "Prise Rapide" à une main sur mobile.
- **Remède** : Mode Mobile POS avec gros pavés tactiles et retours haptiques.

### 9. Documentation Opérationnelle & Runbooks
- **Constat** : Manque le guide d'urgence pour les incidents nocturnes.
- **Remède** : Publication de `docs/guides/ON_CALL_RUNBOOK.md`.

### 10. Pilotage Économique (FinOps)
- **Constat** : Coûts cloud (Firestore, requêtes IA) non réattribués par tenant.
- **Remède** : Dashboard FinOps dans le MCC attribuant le coût réel à chaque `tenantId`.

---

## 🚀 4. Les 7 Actions à Mener Avant le 1er Client (Planning Réaliste : 3-4 Semaines)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CALENDRIER PRÉ-LANCEMENT COMMERCIAL                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Semaine 1 : Juridique (CGU/DPA) + Backup WORM NF525 + RGPD Art. 9           │
│ Semaine 2 : Finalisation Bus (R1-R13 + Idempotence) + Sentry / SOS Caisse   │
│ Semaine 3 : Pipeline CI/CD + 3 Parcours E2E Playwright                      │
│ Semaine 4 : Kit Matériel J-0 + Runbook Astreinte & Go Live Staging          │
└─────────────────────────────────────────────────────────────────────────────┘
```

| # | Action | Domaine | Responsable | Durée Réelle | Critère de Validation |
|---|--------|---------|-------------|--------------|-----------------------|
| 1 | **Signature DPA RGPD & CGU/CGV** | Légal | Avocat / PO | 1-2 sem | Documents validés, signables électroniquement dans l'onboarding. |
| 2 | **Vault WORM Firestore 6 ans** | Fiscal | Dev Lead | 3 jours | Test de tentative de suppression d'archive rejeté par la règle Firestore. |
| 3 | **Émetteurs Bus R2, R10, R11 & Idempotence** | Core | Dev Lead | 3 jours | `reservation.matched`, `deposit_paid`, `table_closed` reçus et dédupliqués via `eventId`. |
| 4 | **3 Parcours E2E Playwright** | QA | QA / Dev | 3 jours | Encaissement, Clôture Z et Réservation exécutés en vert dans le pipeline. |
| 5 | **CI/CD GitHub Actions** | DevOps | DevOps | 4 jours | Pull Request bloquée automatiquement si TSC!=0 ou tests en échec. |
| 6 | **Configuration Sentry & SOS Caisse** | Ops | Ops | 2 jours | Alerte Slack/PagerDuty reçue instantanément sur erreur critique fiscale ou appel SOS. |
| 7 | **Kit Matériel J-0 & Runbook On-Call** | Ops | Ops | 2 jours | Routeur 4G testé et `docs/guides/ON_CALL_RUNBOOK.md` validé. |
