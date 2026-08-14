# 🗺️ ROADMAP COMPLÈTE — Restaurant OS Platform
> Fusion de : ROADMAP_EXECUTION · ROADMAP_PAR_VERTICAL · ROADMAP_PAR_VARIANT  
> Dernière mise à jour : 2026-08-14  
> Gate acquis : TSC=0 · cycles=2 · barrel=0 · NF525 E2E · 8 verticales · RBAC 14 rôles tenant · MCC séparé

---

## 📚 Navigation rapide

| Section | Contenu |
|---------|---------|
| [🚀 Plan d'exécution](#-plan-dexécution) | Sprints · Horizons · Bloquants · Calendrier |
| [🗺️ Roadmap par verticale](#️-roadmap-par-verticale) | Restaurant · Bakery · Retail · Salon · Garage · Hotel · Clinic · Custom |
| [🎨 Composants UI Restaurant](#-composants-ui--verticale-restaurant) | 16 zones · ~600 composants · statuts RBAC |

---

## 🔐 Note RBAC — Convention globale

| Niveau | Qui | Périmètre |
|--------|-----|-----------|
| `10` | Plongeur / Apprenti | Timeclock, consultation basique |
| `20` | Commis / Runner | POS saisie, KDS lecture |
| `30` | Serveur · Barman · Hôtesse · Cuisinier | POS complet, encaissement |
| `40` | Chef de Rang | POS avancé, planning lecture |
| `50` | Sommelier / Expert Produit | Cave, accords, stocks boissons |
| `60` | Sous-Chef · Comptable | Finance lecture, HACCP, fournisseurs |
| `70` | Manager · Chef Cuisinier | Planning écriture, recrutement, remises > 10% |
| `80` | Directeur | Audit fiscal, analytics stratégiques, DUERP |
| `100` | **Propriétaire** (gérant de l'établissement) | **Accès total à son tenant** — migration, vanguard, paramétrage complet |
| MCC | **Vous** (opérateur plateforme) | **Hors RBAC tenant** — routes `/app/(admin)/` · `isMCCMode()` · `MccOperatorContract` |

> ⚠️ Le niveau `100` (Propriétaire) est le **gérant légal de l'établissement client**, borné par SovereignGuard.  
> **Vous** (constructeur MCC) n'êtes pas un `PermissionRole` — votre système est entièrement séparé.

---

# ROADMAP EXÉCUTION — Post plan complet + UI refonte
> Base de départ : plan complet v6.0 terminé · UI refonte terminée · 2026-08-14
> Gate acquis : TSC=0 · cycles=2 · barrel=0 · NF525 E2E · 8 verticales généralisées

---

## Ce qui est acquis (le socle)

| Couche | État |
|--------|------|
| Architecture DDD 8 piliers | ✅ kernel / orchestration / design / modules propres |
| Bus événementiel + garde-fou | ✅ 139 handlers · outbox · DLQ · NF525 E2E · guardrail orphelins |
| NF525 Grade X | ✅ FiscalSealer atomique · SHA-256 · TicketZ · horodatage serveur |
| Multi-tenant SovereignGuard | ✅ Isolation garantie · assertHandlerTenant() critiques |
| 8 verticales généralisées | ✅ Tronc générique · MetricLabels · gate culinaire · VerticalEventBridge |
| Versionbase demo/test/ref | ✅ 24 tenants système · cloneFromReference() · write-guard MCC |
| E-facture (obligation 1er sept.) | ✅ Factur-X/UBL/CII · inbound + outbound · stock/trésorerie |
| Onboarding B2B | ✅ Wizard 7 étapes · OCR · DNA seeds · 7 connecteurs · rollback |
| Sentry multi-tenant | ✅ Câblé (manque DSN prod) |
| UI | ✅ Design tokens · dark mode · SplashGate · branding tenant |
| Tests unitaires | ✅ ~560 tests · gate vert |
| CI/CD | ❌ Zéro pipeline — gate local uniquement |
| Tests intégration Firestore | ❌ 0 test sur vrai Firestore |
| API REST découplée | ❌ Tout passe par Server Actions Next.js |
| Bus émetteurs côté modules | ⚠️ ~20% manquants (R1-R13) |

---

## Horizon 1 — Prod-Ready `[4 semaines · août 2026]`

> Objectif : le premier vrai client peut signer. La plateforme tient seule en production.

---

### Sprint 1 · Bus — émetteurs manquants R1-R13 `[~1 semaine]`

Le bus écoute, mais 13 endroits dans les modules n'émettent pas encore.
Sans ça, des features annoncées (fidélité, allergènes, alertes) ne marchent pas silencieusement.

| Ref | Émetteur manquant | Fichier | Impact si absent |
|-----|-------------------|---------|-----------------|
| R1 | `reservation.created/updated/cancelled` | `modules/commerce/relation/reservations/` hooks | Plan de salle jamais synchro en temps réel |
| R2 | `reservation.matched` — bouton "Accueillir" | `NewReservationDialog.tsx` ou composant check-in | Allergènes jamais transmis au KDS ⚠️ |
| R3 | `hr.absence_declared` | Formulaire déclaration absence RH | Manager jamais alerté d'un sous-effectif |
| R4 | `commerce.promotion_activated` | Hook/service sauvegarde promo | Prix promo jamais appliqués au POS |
| R5 | `commerce.loyalty_points_earned` | POS — post-paiement | Fidélité jamais créditée |
| R6 | `finance.invoice_generated` | `InvoiceService` | Comptabilité pas notifiée |
| R7 | `logistics.delivery_received` | Réception marchandise | Stock jamais mis à jour à la réception |
| R8 | `compliance.certificate_expiring` | Checker de certificats | Alerte 30j avant expiration jamais déclenchée |
| R9 | `hr.shift_started/ended` | Module timeclock | Planning jamais synchronisé |
| R10 | `commerce.reservation_deposit_paid` | Webhook Stripe réservation | Dépôt jamais comptabilisé |
| R11 | `ops.table_closed` | Clôture addition POS | Libération de table jamais propagée au plan de salle |
| R12 | `facility.maintenance_requested` | Formulaire signalement | Bon de travail jamais créé |
| R13 | `intelligence.anomaly_detected` | Seuil IoT HACCP | Alerte managers jamais déclenchée |

**Pattern** : dans chaque fichier concerné, ajouter `NexusEventBus.emitDurable('<event>', { tenantId, ...payload })` au bon endroit (post-write Nexus, pas avant).
**Gate** : smoke test bus 24/24 vert · `npm run test:bus`.

---

### Sprint 2 · CI/CD + Tests intégration `[~1 semaine]`

**CI/CD** (`.github/workflows/gate.yml` ou `.gitlab-ci.yml` selon migration confirmée)

```yaml
on: [push, pull_request]
jobs:
  gate:
    steps:
      - npx tsc --noEmit
      - npx vitest run
      - npx vitest run src/__tests__/integration/  # avec emulateur
      - ./scripts/agent-gate.sh
  lint:
    steps:
      - eslint . --max-warnings 0
```

- Règle de protection branche : merge bloqué si gate rouge
- Deploy staging auto sur push `main` (Vercel preview ou OVH)
- Deploy prod sur tag `v*.*.*` + approbation manuelle
- Notification Slack/email si pipeline cassé

**Tests intégration** (émulateur Firestore déjà configuré dans `firebase.json`)

5 flux à couvrir en priorité :
1. Flux POS complet → commande → paiement → JournalEntry → FiscalSeal chaîné
2. Flux réservation → confirmation → notification
3. Flux HACCP → relevé température → alerte si hors seuil → log immuable
4. Flux multi-tenant → tenant A ne lit pas les données de tenant B
5. Flux timeclock → pointage → calcul heures

```bash
npm run test:integration   # démarre emulateur, exécute les 5 flux, arrête
```

---

### Sprint 3 · Monitoring production opérationnel `[~3 jours]`

Sentry est câblé dans le code. Il manque les clés et les alertes.

- Créer projet Sentry → `SENTRY_DSN` dans `.env.production`
- Alertes obligatoires :
  - `> 10 erreurs/min` par tenant → Slack
  - Toute erreur `FISCAL_*` → alerte immédiate (NF525 critique)
  - Toute erreur `SovereignGuard` → alerte immédiate (fuite cross-tenant)
  - Toute entrée DLQ `done_no_consumer` inattendue → alerte
- Câbler Axiom pour logs structurés (token manquant dans env)
- Dashboard Axiom par tenant : latence · erreurs · volume requêtes
- Uptime monitor sur `/api/health` (UptimeRobot ou Betterstack)

---

### Sprint 4 · MCC provisioning — flow ref/custom opérationnel `[~3 jours]`

Le versionbase est implémenté. Le flow MCC manque de visibilité pour toi, opérateur MCC.

- **Preview avant clone** : dans `SystemTenantsTab`, afficher l'état du `_ref_<vertical>` (splash, couleurs, modules DNA activés) avant de confirmer le clone
- **Choix ref vs custom** : radio explicite dans le wizard création tenant avec explication des différences
- **Indicateur read-only** sur les formulaires pour `_ref_*` et `_demo_*` (champs disabled + badge "Tenant système")
- **Promote test→ref** : flow de promotion `_test_*` → `_ref_*` avec diff visuel des changements → write-guard se lève le temps du promote puis se remet
- **Reset demo** : bouton opérationnel dans MCC (la route `/api/admin/mcc/system-tenants/reset-demo` existe)

---

## Horizon 2 — Premier client `[4 semaines · sept. 2026]`

> Objectif : signer, onboarder et accompagner le premier client payant. Valider le produit sur le terrain.

---

### Sprint 5 · API REST découplée (Hono) `[~5 jours]`

Aujourd'hui tout passe par Server Actions couplées au front. Une app mobile, un webhook ou un partenaire ne peut pas consommer la plateforme.

**Structure** :
```
api-server/
  src/
    routes/v1/
      orders.ts        # POST /v1/orders · GET /v1/orders
      menu.ts          # GET /v1/menu
      reservations.ts  # POST /v1/reservations
      timeclock.ts     # POST /v1/timeclock/clock-in|out
      inventory.ts     # GET /v1/inventory · POST /v1/inventory/adjust
    middleware/
      auth.ts          # Bearer JWT (Firebase Auth — même token que le front)
      tenant.ts        # Header X-Tenant-ID → SovereignGuard
      rateLimit.ts     # 100 req/min par tenant
    openapi/
      spec.ts          # zod-to-openapi auto-généré depuis les schémas Zod existants
```

Les Server Actions Next.js existantes deviennent des clients de cette API — zéro duplication de logique.

---

### Sprint 6 · Onboarding terrain — premier client réel `[~1 semaine]`

L'onboarding B2B est implémenté (wizard 7 étapes, OCR, DNA seeds). Valider sur un vrai client.

**Checklist premier client** :
- [ ] Choisir la verticale (restaurant pour le premier)
- [ ] `cloneFromReference('restaurant')` depuis le MCC → preview → confirmer
- [ ] Parcourir le wizard onboarding avec les vraies données (SIRET, RIB, menu, staff, plan de salle)
- [ ] POS fonctionnel dès J+1 — KDS configuré — impression reçus
- [ ] Premier ticket NF525 généré → scellé → vérifiable
- [ ] SplashScreen brandée avec logo/couleurs du client
- [ ] Tenant visible dans la fleet MCC
- [ ] Facture abonnement générée via Stripe Billing

**Bug tracker** : noter chaque friction dans le wizard → itérer sur S6 bis si nécessaire.

---

### Sprint 7 · Documentation client `[~3 jours]`

- Guide démarrage rapide restaurant (PDF + page in-app)
- Tutoriel vidéo : premier ticket POS → encaissement → clôture Z
- Guide KDS : configuration postes cuisine, routage des plats
- Guide manager : dashboard, rapports NF525, exports comptables FEC
- FAQ : reset PIN, changement de caisse, récupération session hors-ligne

---

### Sprint 8 · Facturation MCC opérationnelle `[~3 jours]`

- Plans tarifaires configurables depuis le MCC (mensuel/annuel par verticale)
- Génération facture MCC → tenant via `InvoiceService` existant
- Relance automatique si paiement échoué (`finance.payment_failed` → NexusEventBus)
- Dashboard MCC : MRR · churn · revenue par tenant · date prochain renouvellement

---

## Horizon 3 — Scale `[2-4 mois · oct. 2026 – janv. 2027]`

> Objectif : passer de 1 client à N, sur plusieurs verticales. L'opérationnel tourne sans intervention manuelle quotidienne.

---

### Blocs S9-S10 · Application mobile native

L'API REST (S5) débloque une vraie app mobile — pas juste du PWA.

**Stack** : Expo (React Native) — partage le TypeScript, les types Zod, la logique Microunits avec le front existant.

**Modules prioritaires** :
- `caisse-ipad/` : POS tactile optimisé iPad pour la salle
- `kds-tablette/` : écran cuisine Android — swipe pour changer le statut de commande
- `timeclock-mobile/` : pointage NFC/QR sur téléphone staff
- `manager-app/` : dashboard temps réel sur téléphone — chiffre du jour, alertes, stock

---

### Blocs S11-S12 · Intégrations tierces prioritaires

| Intégration | Priorité | État actuel |
|-------------|----------|-------------|
| **Deliveroo / UberEats** | P0 restaurant | Connecteur squelette — câbler l'API réelle |
| **Google Reserve** | P0 restaurant/salon/clinic | Routes `/api/google/reserve/` en place — finaliser |
| **Stripe Marketplace** | P0 (revenu platform) | Stripe Billing câblé — ajouter platform fees |
| **Pennylane** | P1 (comptabilité) | Export FEC + grand livre automatique |
| **Lightspeed / Zelty** | P1 (migration clients) | Importer catalogue + historique commandes |
| **Mercure / SSE** | P2 (temps réel) | Remplacer polling Firestore sur KDS et floor plan |
| **Novapost / Yousign** | P2 (e-signature) | Contrats, devis signés électroniquement |

---

### Blocs S13-S14 · 2 nouvelles verticales opérationnelles

Les 8 verticales sont généralisées dans le tronc. Il reste à remplir les modules et tester sur de vrais clients.

**Ordre recommandé** :

1. **Bakery** — proche restaurant, gate culinaire, vente comptoir, NF525 identique. Effort faible.
2. **Retail** — catalogue produits, gestion stock, caisse sans table. Marché large (épiceries, cavistes, boutiques).
3. **Salon** — appointments, serviceticket, tip-pooling, très peu de HACCP. Marché: coiffeurs, barbiers, spa.
4. **Garage** — RepairIntake, devis, facturation pièces/main d'oeuvre. Marché: garages auto.

**Pour chaque verticale** :
- Remplir les adapters `VerticalEventBridge` × 25 events manquants
- Peaufiner le DNA seed `_ref_<vertical>` avec un vrai menu/catalogue de référence
- Tester l'onboarding B2B de bout en bout avec 1 client beta
- Documenter les spécificités réglementaires de la verticale

---

### Bloc S15 · LightRAG — Intelligence opérationnelle pour les clients

LightRAG est en place (sidecar Python port 9621). Les clients ne s'en servent pas encore.

- Oracle chat activé pour toutes les verticales (pas seulement restaurant)
- RAG sur les données du tenant : menu, commandes, clients CRM, stock
- Suggestions proactives : "Votre plat le plus commandé ce soir est X, il vous reste Y portions"
- Anomalie HACCP détectée → résumé naturel pour le manager, pas juste un code d'erreur
- "Qu'est-ce qui a le mieux marché ce weekend ?" — réponse en langage naturel depuis les données réelles

---

### Bloc S16 · MCC avancé — fleet à l'échelle

Quand la fleet dépasse ~10 tenants, le MCC doit automatiser ce qui est aujourd'hui manuel.

- **Bulk operations** : appliquer une mise à jour de configuration à N tenants en une action
- **Audit trail MCC** : qui a fait quoi sur quel tenant — log immuable
- **SLA monitoring** : uptime par tenant, alerte si > 5 min indisponible
- **Changelog automatique** : release notes générées depuis les commits via ChangelogService (déjà implémenté)
- **White-label domaine** : `pos.lenom-du-client.fr` pointe vers la plateforme sans iframe (CNAME + certificat auto Let's Encrypt)

---

## Horizon 4 — Croissance `[6-12 mois · 2027]`

> Objectif : position établie sur ≥2 verticales en France · >10k MRR · opérationnel auto-scalant.

---

### Produit

| Axe | Détail |
|-----|--------|
| **Marketplace connecteurs** | Les clients activent eux-mêmes les intégrations (Deliveroo, WooCommerce, Lightspeed) depuis leur dashboard, sans intervention MCC |
| **Multi-établissements** | Un groupe avec 5 adresses sur un seul compte — consolidation P&L, stock mutualisé, staff partagé |
| **Analytics prédictif** | Prédiction de stock (éviter rupture/gaspillage), optimisation planning RH selon historique d'affluence |
| **Certifications verticales** | NF525 audit pour bakery/retail · Certification ISO 22000 assistance (HACCP) · Agrément URSSAF paie pour salon/clinic |
| **Self-ordering QR** | Commande depuis la table via QR code → KDS directement, zéro saisie serveur |
| **Hôtel complet** | PMS lite (rooms, housekeeping, channel manager Booking.com), proche de ce qui existe mais plus profond |

### Infrastructure

| Axe | Détail |
|-----|--------|
| **Multi-région** | Déploiement EU Frankfurt + option hébergement France (données RGPD) |
| **Offline total** | IndexedDB local-first déjà en place — finaliser la sync à la reconnexion sur tous les modules (POS offline partiel → complet) |
| **Rate limiting à l'échelle** | Redis ou Upstash par tenant (actuellement géré par Firestore rules — insuffisant à volume) |
| **Backup automatique** | Snapshot quotidien par tenant, rétention 90j, restore en 1 clic depuis MCC |
| **Hono server** | Remplacer les Server Actions par l'API Hono comme couche de transport unique (découplage total front/back) |

### Commercial

| Axe | Détail |
|-----|--------|
| **Réseau apporteurs d'affaires** | Commissions sur clients signés — pas de MCC white-label (décision confirmée) |
| **SEO long tail** | Guides "logiciel NF525 restaurant", "HACCP numérique boulangerie", "caisse enregistreuse certifiée garage" |
| **Programme beta** | Early access verticales en développement → feedback terrain avant GA |
| **Pricing transparent** | Plans tarifaires publics par verticale sur la landing — pas de "demandez un devis" |

---

## Les 4 bloquants absolus avant le premier client

> Sans ces 4 items, ne pas chercher de client. La liste dans l'ordre d'urgence :

1. **Bus émetteurs R1-R13** — des features annoncées ne marchent pas silencieusement (fidélité, allergènes, alertes sous-effectif). Un client qui teste et voit que ça ne marche pas ne signe pas.

2. **CI/CD** — un merge qui casse la prod d'un client payant = churn immédiat + mauvaise réputation. C'est non-négociable dès le premier client.

3. **Sentry DSN configuré** — sans monitoring, tu découvres les bugs par le client, pas avant. Le pire des scénarios en SaaS.

4. **Tests intégration NF525** — un FiscalSeal corrompu en prod = problème légal, pas juste un bug. Un test d'intégration qui joue la chaîne complète en émulateur Firestore est la seule garantie fiable.

---

# 🗺️ ROADMAP PAR VERTICALE — Restaurant OS Platform
> Base : plan complet v6.0 terminé · UI refonte terminée · 2026-08-14
> ✅ = Fait · 🔧 = À finir · ⚫ = À faire

---

## 📖 Structure de lecture

Chaque verticale est organisée par **🖥️ zones d'interface client** (les grandes surfaces UI que le client utilise). Pour chaque zone :

- 📁 **Catégorie** (groupement fonctionnel)
  - 📂 **Sous-catégorie** (module précis)
    - 📄 **Sous-sous-catégorie** (fonctionnalité)
      - Tâches individuelles avec statut ✅ 🔧 ⚫

Pour chaque tâche significative :
- 🎯 **Pilier(s) mobilisé(s)** : ops/commerce/finance/compliance/human/logistics/intelligence/facility
- 📡 **Events bus** : émetteurs/handlers avec leur statut (✅ actif, 🔧 partiel, ⚫ manquant)
- 🔐 **RBAC** : actions custom + niveaux minimums (paramétrables par admin client)

---

## 📊 Sommaire

| Verticale | Progress | Statut | Effort restant |
|-----------|:--------:|--------|----------------|
| 🍽️ **Restaurant** | 95% | ✅ Verticale de référence | 🔧 Polish + onboarding terrain |
| 🥖 **Bakery** | 80% | 🔧 Extension immédiate | Fournées + précommandes |
| 🛍️ **Retail** | 60% | 🔧 Marché large | E-commerce sync + variantes |
| 💇 **Salon** | 50% | 🔧 Marché volumineux | Agenda visuel + commissions |
| 🚗 **Garage** | 55% | 🔧 B2B lucratif | Devis pièces + planning atelier |
| 🏨 **Hotel** | 40% | ⚫ Complexité PMS | Channel manager + housekeeping |
| 🩺 **Clinic** | 35% | ⚫ RGPD renforcé | Tiers-payant + DMP + Ségur |
| 🎨 **Custom** | 20% | ⚫ Framework long tail | Custom fields + templates |

---

# 🍽️ VERTICALE RESTAURANT

## 📊 Vue d'ensemble

**Positionnement** : verticale de référence — 95% du tronc générique construit avec restaurant comme cas type. Cible : restaurants indépendants + petites chaînes (1-10 étab.), gamme bistronomique à gastronomique. TAM France : ~180 000 restaurants.

**Pricing** : Starter 79€ → Business 129€ → Premium 189€ → Enterprise sur devis.

**Différenciateurs** : IA Oracle native · comptabilité automatisée · mode offline vrai · ergonomie iPad first · onboarding 30 min chrono.

---

## 🖥️ Zone 1 — SERVICE (Salle + Cuisine)

### 📁 1.1 · Point de Vente (POS)

#### 📂 1.1.1 · Prise de commande

##### 📄 Panier & articles
- ✅ Ajout produit au panier depuis grille tactile
- ✅ Options / modificateurs (cuisson, accompagnement, allergies)
- ✅ Notes libres par plat ("bien cuit, sans oignon")
- ✅ Quantité fractionnaire (0.5 verre de vin)
- ✅ Split addition par article / par convive / custom
- ✅ Remise ligne + remise globale (avec RBAC seuils)
- 🔧 Envoi partiel cuisine (entrées d'abord, plats après)
  - 🎯 ops
  - 📡 émet `ops.course.fired` 🔧 (handler prêt, émetteur partiel)
  - 🔐 `pos.send_partial` — niveau min 20 (serveur)
- ⚫ Groupage par convive (siège 1, siège 2 sur même table)
  - 🎯 ops
  - 🔐 `pos.assign_seat` — niveau min 20

##### 📄 Séquençage des plats
- 🔧 Statuts par étape (entrée → plat → dessert)
- ⚫ Bouton "Envoyer suite" quand entrées consommées
  - 🎯 ops + intelligence
  - 📡 émet `ops.course.next_requested` ⚫
  - 🔐 `pos.request_next_course` — niveau min 20
- ⚫ Vue KDS "prochain plat à sortir par table"

##### 📄 Alerte allergènes
- 🔧 Framework prêt côté données CRM/réservation
- ⚫ Alerte visuelle KDS quand commande vient de table avec allergie
  - 🎯 ops + commerce + compliance
  - 📡 consomme `reservation.matched` (R2 bus) ⚫ **émetteur manquant**
  - 🔐 automatique (pas de RBAC — obligation légale INCO)

##### 📄 Vérification âge alcool
- ⚫ Modal blocage POS sur catégorie `alcool` avec confirmation majorité
  - 🎯 ops + compliance
  - 📡 émet `compliance.age_verification_requested` ⚫
  - 🔐 `pos.override_age_check` — niveau min 60 (manager)

#### 📂 1.1.2 · Paiement & encaissement

##### 📄 Modes de paiement
- ✅ Espèces avec rendu monnaie
- ✅ CB via Stripe Terminal (physique)
- ✅ CB via saisie manuelle
- ✅ Ticket restaurant / carte titre-restaurant
- ✅ Chèque
- ✅ Virement (référence facture)
- 🔧 Pré-autorisation CB table ouverte (Stripe Terminal API)
  - 🎯 ops + finance
  - 📡 émet `payment.pre_authorized` ⚫
  - 🔐 `pos.pre_authorize` — niveau min 30

##### 📄 Split payment
- ✅ Split par article
- ✅ Split par convive (n personnes)
- ✅ Split custom (montants libres)
- ✅ Multi-modes sur un même ticket (moitié CB, moitié espèces)

##### 📄 Pourboires
- ✅ Ajout pourboire au terminal Stripe
- ✅ Pourboire manuel (espèces)
- ✅ Déclaration légale 2022 (pool ou individuel)
  - 🎯 ops + human + finance
  - 📡 émet `hr.tip_declared` ✅
  - 🔐 `pos.record_tip` — niveau min 30

#### 📂 1.1.3 · Impression tickets

##### 📄 Ticket client
- ✅ Impression thermique ESC/POS (Epson TM-T88, Star)
- ✅ Format avec logo, TVA effective, mentions NF525
- ✅ Ticket avec fidélité (points cumulés + solde)
- ✅ Reprint depuis historique
- 🔧 Ticket dématérialisé (email/SMS avec QR)
  - 🎯 ops + commerce
  - 📡 émet `commerce.receipt_sent` ⚫

##### 📄 Bon de préparation cuisine
- ✅ Impression sur imprimante KDS de fallback
- ✅ Regroupement par station (chaud/froid/pâtisserie)
- ⚫ Impression QR sur bon pour scan côté salle (validation "prêt")

---

### 📁 1.2 · Écran Cuisine (KDS)

#### 📂 1.2.1 · Affichage commandes

##### 📄 Layout écran
- ✅ Grille de tickets (2×4 sur 32", 4×6 sur 55")
- ✅ Auto-scroll si trop de tickets
- 🔧 Vue "par plat" (bouillon en cours × 3, plats froids × 2)
- 🔧 Vue "par table" (tous les plats de la 12)
- ⚫ Vue "par mode service" (sur place / à emporter / livraison)

##### 📄 Timers et alertes
- ✅ Timer par ticket
- 🔧 Seuil rouge configurable (> 8 min = alerte visuelle)
- ⚫ Alerte sonore configurable (silencieuse par défaut, cloche à 10 min)
- ⚫ Estimation temps préparation IA par station
  - 🎯 ops + intelligence
  - 📡 émet `intelligence.prep_time_estimated` ⚫

#### 📂 1.2.2 · Interactions cuisinier

##### 📄 Actions ticket
- ✅ Bump ticket (marquer terminé)
- ✅ Recall ticket (annuler bump)
- 🔧 Support bump bar physique USB (clavier configurable)
  - 🐕 ops
  - 🔐 pas de RBAC (fonctionnalité par défaut cuisinier)
- ⚫ Split ticket cuisine (envoi entrée à froid, plat à chaud simultanément)

##### 📄 Communication salle ↔ cuisine
- ⚫ Chat vocal push-to-talk
  - 🎯 ops
  - 📡 émet `ops.kitchen_call` ⚫
- ⚫ Notifications ciblées ("Table 82 attend l'entrée")
  - 🎯 ops
  - 📡 émet `ops.service_alert` ⚫

#### 📂 1.2.3 · Multi-station

##### 📄 Routage automatique
- ✅ Routage plat → station configurable (chaud/froid/pâtisserie/bar)
- ✅ Fan-out : un plat sur 2 stations si nécessaire
- ✅ Filtrage par station à l'écran (KDS chaud ne voit que ses plats)

##### 📄 Coordination sortie
- ⚫ Coordonnateur "expeditor" : vue globale synchronisation sorties
  - 🎯 ops
  - 🔐 `kds.expeditor_view` — niveau min 60 (chef de cuisine)

---

### 📁 1.3 · Plan de salle

#### 📂 1.3.1 · Édition du plan

##### 📄 Éditeur graphique
- ✅ Drag & drop tables sur canvas
- ✅ Rotation tables (rectangulaire orientable)
- ✅ Zones (terrasse, salle principale, salon privé)
- ✅ Verrouillage zones (empêcher modifs sans droit)
  - 🔐 `floorplan.edit` — niveau min 60

##### 📄 Templates de départ
- ✅ Bistrot 40 couverts
- ✅ Brasserie 80 couverts
- ✅ Gastronomique 30 couverts
- ⚫ Import DWG/PDF (plan architecte)

#### 📂 1.3.2 · Vue temps réel service

##### 📄 États tables
- ✅ Libre (gris)
- ✅ Occupée (couleur selon durée)
- ✅ Réservée (badge horaire)
- ✅ Nettoyage / à débarasser
- 🔧 Alerte table qui attend depuis > X min
  - 🎯 ops
  - 📡 émet `ops.table_delay_alert` ⚫

##### 📄 Actions rapides
- ✅ Ouvrir addition depuis clic table
- ✅ Transférer commande table → table
- ✅ Fusionner tables (groupe qui se rejoint)
- 🔧 Libérer table (fin de service)
  - 📡 émet `ops.table_closed` (R11 bus) 🔧 émetteur partiel
  - 🔐 `floorplan.close_table` — niveau min 20

#### 📂 1.3.3 · Capacité et occupation

##### 📄 Suivi capacité
- ✅ Total couverts disponibles
- ✅ Occupation temps réel (%)
- 🔧 Prévision occupation (basée sur réservations + walk-ins)
  - 🎯 ops + intelligence
- ⚫ Alerte surcapacité (105% en semaine tolérée, 95% weekend)

---

## 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

### 📁 2.1 · Prise de réservation

#### 📂 2.1.1 · Canaux d'entrée

##### 📄 Manuelle (téléphone/comptoir)
- ✅ Formulaire hôtesse : nom, téléphone, nb convives, date/heure
- ✅ Affectation table auto ou manuelle
- ✅ Notes internes ("client VIP, table cheminée")
- 🔧 Émission events bus (R1 — reservation.created)
  - 📡 émet `reservation.created/updated/cancelled` 🔧 **émetteur partiel — R1 du bus**

##### 📄 En ligne (site public + Google Reserve)
- ✅ Widget site web (formulaire embed)
- 🔧 Google Reserve API (routes en place, sync à finaliser)
  - 🎯 commerce + ops
  - 📡 émet `reservation.created` via Google 🔧
- ⚫ The Fork (Yums) API — sync bidirectionnelle
- ⚫ Zenchef API (alternative premium)

##### 📄 Acomptes et garanties
- ✅ Stripe deposit configurable (montant fixe ou % couvert)
- ✅ Auto-deposit si groupe > 6 ou dimanche soir
- ✅ Remboursement automatique si annulation J-2

#### 📂 2.1.2 · Règles métier

##### 📄 Overbooking contrôlé
- 🔧 Framework en place
- ⚫ Config UI : 105% semaine, 95% weekend (paramétrable)
  - 🔐 `reservations.configure_overbooking` — niveau min 70

##### 📄 Créneaux et durées
- ✅ Durée par défaut par type couvert (2 pers = 1h30, 6 pers = 2h30)
- ✅ Créneaux configurables (12h/12h30/13h, 19h/19h30/20h/20h30/21h)
- ⚫ Blocages ponctuels (fermeture privatisation, événement)

### 📁 2.2 · Accueil client

#### 📂 2.2.1 · Check-in réservation

##### 📄 Bouton "Accueillir"
- ⚫ **Bouton "Accueillir le client"** dans le dialog réservation ⚫ **CRITIQUE — R2 bus**
  - 🎯 ops + commerce + compliance
  - 📡 émet `reservation.matched` ⚫ **transmet allergènes au KDS**
  - 🔐 `reservations.check_in` — niveau min 20

##### 📄 Attribution table à l'arrivée
- ✅ Suggestion auto (meilleure table disponible pour la config)
- ✅ Override manuel hôtesse
- 🔧 Vue plan de salle avec highlighting réservation

#### 📂 2.2.2 · Walk-in (sans réservation)

##### 📄 Accueil rapide
- 🔧 Flow rapide "client sans résa" (nom + nb + table)
- ⚫ Estimation temps d'attente
- ⚫ Liste d'attente avec SMS de rappel quand table libre
  - 📡 émet `commerce.waitlist_ready` ⚫

### 📁 2.3 · Rappels et no-show

#### 📂 2.3.1 · Rappels programmés

##### 📄 SMS/Email
- 🔧 SMS J-2 configurable
  - 📡 émet `reservation.reminder_sent` ⚫
- 🔧 Email J-1 avec lien annulation
- ⚫ Rappel 2h avant (dernier moment)

#### 📂 2.3.2 · No-show tracking

##### 📄 Détection & suivi
- 🔧 Marquer no-show manuellement
  - 📡 émet `reservation.no_show` ✅
- ⚫ Détection auto (table libérée > 30 min après horaire)
- ⚫ CRM auto-update : flag "risque" après 2 no-show
- ⚫ Demande acompte obligatoire au prochain RDV client no-show

---

## 🖥️ Zone 3 — MENU & CATALOGUE

### 📁 3.1 · Menu Builder

#### 📂 3.1.1 · Structure du menu

##### 📄 Catégories et sections
- ✅ Créer catégorie (Entrées, Plats, Desserts, Vins, Cocktails)
- ✅ Drag & drop ordre affichage
- ✅ Sous-catégories (Vins → Rouges/Blancs/Rosés)
- ✅ Menu par service (déjeuner / dîner / brunch weekend)
- 🔧 Menu saisonnier (activation/désactivation par période)
  - 📡 émet `commerce.menu_activated` ⚫

##### 📄 Produits
- ✅ Créer produit (nom, description, prix, TVA, allergènes)
- ✅ Photo produit (upload + optimisation)
- ✅ Prix multiples (heure creuse / heure pleine / brunch)
- ✅ Disponibilité configurable (rupture manuelle)
- ✅ Modificateurs (cuisson, sauce, accompagnement)

#### 📂 3.1.2 · Recettes & food cost

##### 📄 Composition recette
- ✅ Ingrédients avec quantités
- ✅ Coût matière calculé automatiquement (PMP × qté)
- ✅ Marge brute affichée
- ✅ Prix conseillé pour cible de marge (30%, 25%, 20%)

##### 📄 Menu Engineering (matrice Bruce-Miller)
- ✅ Classification Star / Puzzle / Plowhorse / Dog
- ✅ Basée sur popularité × marge
- 🔧 Suggestions IA de repositionnement
  - 🎯 commerce + intelligence
  - 🔐 `menu.view_engineering` — niveau min 60

### 📁 3.2 · Cartes physiques et digitales

#### 📂 3.2.1 · Cartes imprimables
- 🔧 Export PDF avec design personnalisable
- ⚫ Templates de mise en page (bistrot / gastro / brasserie)
- ⚫ QR code carte allergènes obligatoire

#### 📂 3.2.2 · Menu digital (QR table)
- ⚫ Page mobile responsive
  - 🎯 commerce + ops
- ⚫ Photos plats + description
- ⚫ Choix langue (FR/EN/DE/ES/IT)
- ⚫ Commande directe depuis QR (self-ordering)
  - 📡 émet `ops.order_placed_from_qr` ⚫

### 📁 3.3 · Promotions et offres

#### 📂 3.3.1 · Types de promo
- ✅ Happy hour (prix réduit sur créneau)
- ✅ Menu du jour (formule prix fixe)
- ✅ Remise % sur catégorie
- 🔧 Code promo (COUPON10 = -10%)
  - 📡 émet `commerce.promotion_activated` (R4 bus) 🔧 **émetteur manquant**
  - 🔐 `promotions.create` — niveau min 60

#### 📂 3.3.2 · Bons cadeaux
- ⚫ Émission (montant + validité)
- ⚫ Utilisation partielle (solde restant)
- ⚫ Suivi bons émis vs utilisés
  - 🎯 commerce + finance
  - 📡 émet `commerce.gift_card_issued/redeemed` ⚫

---

## 🖥️ Zone 4 — CLIENTS & FIDÉLITÉ (CRM)

### 📁 4.1 · Fichier client

#### 📂 4.1.1 · Fiche contact

##### 📄 Coordonnées
- ✅ Nom, prénom, téléphone, email
- ✅ Anniversaire (pour campagnes)
- ✅ Adresse (utile pour livraison)
- ✅ Consentement RGPD (opt-in SMS/email)

##### 📄 Préférences et notes
- ✅ Allergies déclarées (liste 14 allergènes INCO)
- ✅ Régime (végé / végan / sans gluten)
- ✅ Préférences (table calme, coin cheminée)
- ✅ Notes libres ("Client Michelin en visite")
- ✅ VIP flag

#### 📂 4.1.2 · Historique client
- ✅ Toutes réservations passées
- ✅ Toutes visites (avec ticket moyen)
- ✅ Plats favoris (top 5 commandés)
- ✅ Vins favoris
- 🔧 Photo profil (upload ou avatar auto)

### 📁 4.2 · Segments et campagnes

#### 📂 4.2.1 · Segmentation
- ✅ Segments auto (VIP, régulier, occasionnel, dormant)
- ✅ Segments manuels custom
- 🔧 Segments dynamiques (règles : "clients venus > 5x sur 6 mois")

#### 📂 4.2.2 · Campagnes marketing

##### 📄 Email
- ✅ Éditeur campagne (framework EmailCampaign)
- ✅ Templates (nouveau menu, anniversaire, promo saisonnière)
- ✅ Tracking ouvertures et clics
- ✅ Désabonnement conforme RGPD

##### 📄 SMS
- ✅ Envoi SMS ciblé
- 🔧 Notification promo ponctuelle
- ⚫ Automation : SMS anniversaire J-0 avec coupon

##### 📄 Google Business
- 🔧 Sync horaires + menu
- ⚫ Notifications avis Google (nouveau avis reçu)
- ⚫ Réponse avis assistée par IA

### 📁 4.3 · Fidélité

#### 📂 4.3.1 · Programme points
- 🔧 Attribution auto post-paiement (1 point / euro)
  - 📡 émet `commerce.loyalty_points_earned` (R5 bus) 🔧 **émetteur manquant**
  - 🔐 automatique
- 🔧 Paliers récompenses (100pts = café, 500pts = dessert)
- ⚫ Notification client à chaque palier
  - 📡 émet `commerce.loyalty_reward_reached` ⚫

#### 📂 4.3.2 · Carte fidélité digitale
- ⚫ Carte QR sur téléphone client
- ⚫ Solde consultable côté client
- ⚫ Historique points gagnés / utilisés

---

## 🖥️ Zone 5 — STOCK & APPROVISIONNEMENT (LOGISTICS)

### 📁 5.1 · Inventaire

#### 📂 5.1.1 · Fiche produit stock

##### 📄 Attributs stock
- ✅ Nom, unité (kg/L/pièce), fournisseur principal
- ✅ Prix unitaire moyen pondéré (PMP)
- ✅ Stock actuel + seuil rupture (minQuantity)
- ✅ DLC / DDM si applicable
- 🔧 Multi-emplacement (chambre froide, réserve, bar)

##### 📄 Traçabilité
- ✅ Lot fournisseur à la réception
- ✅ Étiquette de traçabilité imprimée
- ✅ Historique mouvements (entrées/sorties)

#### 📂 5.1.2 · Inventaire physique
- 🔧 Assistant inventaire mensuel
- ⚫ Scan code-barres pour count rapide
- ⚫ Écart théorique/réel avec justification
- ⚫ Ajustement auto après validation
  - 📡 émet `inventory.stock_adjusted` ✅ (handler câblé après fix P0)
  - 🔐 `inventory.adjust` — niveau min 40

### 📁 5.2 · Approvisionnement

#### 📂 5.2.1 · Fournisseurs

##### 📄 Fiche fournisseur
- ✅ Coordonnées, conditions commerciales
- ✅ Catalogue négocié (produits + prix)
- 🔧 Multi-fournisseurs par produit (comparaison prix)

##### 📄 Catalogues connectés
- 🔧 Metro France (connecteur en cours)
- ⚫ Transgourmet
- ⚫ Pomona
- ⚫ Grands Moulins de Paris (boulangerie/pizzeria)
- ⚫ Sysco France

#### 📂 5.2.2 · Commandes fournisseur

##### 📄 Création bon de commande
- 🔧 Suggestion auto basée sur stock + prévisions J+7
  - 🎯 logistics + intelligence
- ✅ Édition bon de commande PDF
- ✅ Envoi email fournisseur
- 🔧 Suivi statut (envoyé/confirmé/expédié/livré)
  - 📡 émet `logistics.purchase_order_sent` ✅

#### 📂 5.2.3 · Réception marchandises

##### 📄 Bon de livraison
- ✅ Scan/upload BL fournisseur
- ✅ Rapprochement BL vs bon de commande
- ✅ Signalement écarts (manquants, casse)
- 🔧 Émission event bus
  - 📡 émet `logistics.delivery_received` (R7 bus) 🔧 **émetteur partiel**
  - 🔐 `logistics.receive_delivery` — niveau min 30

##### 📄 Impact stock
- ✅ Mise à jour auto stock après réception validée
- ✅ Mise à jour PMP (prix moyen pondéré)
- ✅ Étiquettes traçabilité imprimées

### 📁 5.3 · DLC / DDM tracking

#### 📂 5.3.1 · Alertes péremption
- ✅ Alerte 48h avant DLC
- 🔧 Vue dashboard "à consommer d'urgence"
- ⚫ Suggestion menu du jour utilisant ces produits
  - 🎯 logistics + intelligence

#### 📂 5.3.2 · Gestion déchets (waste)
- ⚫ Saisie déchet avec raison (périmé, cassé, brûlé)
- ⚫ Coût gaspillage calculé
- ⚫ Rapport mensuel top produits gaspillés
  - 📡 émet `logistics.waste_recorded` ✅

---

## 🖥️ Zone 6 — RESSOURCES HUMAINES (HR)

### 📁 6.1 · Effectifs

#### 📂 6.1.1 · Fiche employé

##### 📄 Contrat & administratif
- ✅ Coordonnées, RIB, sécu, mutuelle
- ✅ Contrat (CDI/CDD, temps plein/partiel)
- 🔧 Génération contrat PDF depuis template
- ⚫ Signature électronique contrat (Yousign)
- ⚫ DPAE auto envoi Urssaf
  - 📡 émet `hr.dpae_submitted` ⚫

##### 📄 Compétences & rôles
- ✅ Rôle principal (serveur/chef/manager…)
- ✅ Niveau RBAC (10-100)
- ✅ Compétences additionnelles (bilingue, sommellerie)
- 🔧 Formations suivies (avec dates)

#### 📂 6.1.2 · Recrutement
- ✅ Base candidats
- 🔧 Pipeline (candidature → entretien → embauche)
- ⚫ Import Indeed / HelloWork (webhook)
- ⚫ Notation entretien
- ⚫ Test aptitude (mini quiz produit)

### 📁 6.2 · Planning

#### 📂 6.2.1 · Génération planning

##### 📄 Planning manuel
- ✅ Vue semaine (jours × collaborateurs)
- ✅ Drag & drop shifts
- ✅ Copier semaine précédente

##### 📄 Planning IA
- 🔧 Suggestion basée sur affluence prévue + réservations
- ⚫ Contraintes légales auto (11h repos, 35h max, jour off)
- ⚫ Contraintes perso (dispos, indispos)
  - 🎯 human + intelligence

#### 📂 6.2.2 · Diffusion & échanges
- ✅ Notification employé J-7 planning validé
  - 📡 émet `hr.schedule_published` ⚫
- 🔧 Échange shifts (proposition entre collègues, validation manager)
- ⚫ App mobile employé (voir planning + swap)

### 📁 6.3 · Timeclock (pointage)

#### 📂 6.3.1 · Modes de pointage
- ✅ PIN sur borne (hashed PBKDF2)
- ✅ NFC (badge personnel)
- ⚫ QR code depuis téléphone
- ⚫ Reconnaissance faciale (option)

#### 📂 6.3.2 · Événements pointage
- ✅ Clock-in / clock-out
- 🔧 Émission events bus
  - 📡 émet `hr.shift_started/ended` (R9 bus) 🔧 **émetteur partiel**
- ✅ Coupures (pause déjeuner)
- ✅ Correction manager (oubli pointage)
  - 🔐 `hr.correct_timeclock` — niveau min 60

### 📁 6.4 · Absences

#### 📂 6.4.1 · Déclaration absence
- ✅ Formulaire employé (maladie/congé/RTT)
- 🔧 Justificatif upload
- ⚫ Émission event bus
  - 📡 émet `hr.absence_declared` (R3 bus) ⚫ **émetteur manquant**
  - 🔐 `hr.declare_absence` — niveau min 20

#### 📂 6.4.2 · Validation & impact planning
- 🔧 Workflow validation manager
- ⚫ Alerte sous-effectif automatique
  - 📡 consomme `hr.absence_declared` → émet `hr.understaffed_alert` ⚫
- ⚫ Suggestion remplacement (qui est libre + compétent)

### 📁 6.5 · Paie

#### 📂 6.5.1 · Calcul heures
- ✅ Heures normales
- ✅ Heures sup 25% / 50%
- ✅ Coupures et repos
- 🔧 Prime rendement
- 🔧 Pourboires (pool ou individuel)

#### 📂 6.5.2 · Bulletin & DSN
- 🔧 Connecteur Payfit (paie externalisée)
- 🔧 Connecteur Silae (alternative)
- ⚫ DSN mensuelle générée + télétransmise
- ⚫ Bulletin PDF envoyé employé

---

## 🖥️ Zone 7 — FINANCE & COMPTABILITÉ

### 📁 7.1 · Comptabilité automatisée

#### 📂 7.1.1 · Écritures comptables

##### 📄 Génération auto
- ✅ Vente POS → JournalEntry immuable NF525
- ✅ Ventilation TVA 5.5% / 10% / 20% par produit
- ✅ Réception fournisseur → écriture achat
- ✅ Chaîne fiscale SHA-256 chaînée

##### 📄 Événements bus
- ✅ `finance.journal_entry_created`
- 🔧 `finance.invoice_generated` (R6 bus) 🔧 **émetteur partiel**
- ✅ `finance.ticket_z_closed`
- ✅ `finance.bank_synced`

#### 📂 7.1.2 · Exports comptables

##### 📄 Formats
- ✅ FEC (Fichier des Écritures Comptables) — export standard
- 🔧 Pennylane (format direct API)
- ⚫ Cegid (format spécifique)
- ⚫ Sage 100 (format spécifique)
- ⚫ QuickBooks (format spécifique)

##### 📄 Fréquence
- ✅ Manuel (à la demande)
- ⚫ Automatique mensuel (dernier jour du mois → envoi comptable)

### 📁 7.2 · Trésorerie

#### 📂 7.2.1 · Caisse temps réel

##### 📄 Suivi cash
- ✅ Espèces en caisse (calcul auto ventes cash)
- ✅ CB du jour (rapprochement Stripe)
- ✅ Autres modes (chèques, TR)
- ⚫ Alerte écart caisse > seuil configurable
  - 🔐 `finance.close_cash_drawer` — niveau min 40

##### 📄 Dépôt bancaire
- ✅ Fond de caisse configurable
- ✅ Calcul dépôt (cash - fond de caisse)
- ⚫ Bordereau dépôt bancaire imprimable

#### 📂 7.2.2 · Prévisionnel
- 🔧 Dashboard cash flow J+7
- ⚫ Prévision J+30 avec IA
- ⚫ Provisions charges (URSSAF, TVA, IS)

#### 📂 7.2.3 · Banques
- ✅ Connecteur open banking (bridge/plaid)
- ✅ Rapprochement bancaire semi-auto
- 🔧 Multi-comptes bancaires
- 🔧 Suivi reconnexion (event `bank.connection_expired` handler câblé)

### 📁 7.3 · Facturation

#### 📂 7.3.1 · Auto-facture
- ✅ Ticket > 150€ HT → génération facture auto (obligation légale)
- ✅ Numérotation continue conforme
- ✅ Envoi email au client si SIRET renseigné

#### 📂 7.3.2 · Factures BtoB
- ✅ Facturation entreprise (SIRET client)
- ✅ Groupes/séminaires (multi-couvert facturé consolidé)
- 🔧 Chorus Pro (secteur public — envoi obligatoire)

#### 📂 7.3.3 · E-facture (obligation légale 1er sept 2026)
- ✅ **Réception e-facture** — 100% conforme
- ✅ Format Factur-X (PDF/A-3 + XML)
- ✅ Format UBL 2.1
- ✅ Format CII (Cross Industry Invoice)
- ✅ Lifecycle inbound (reçu → validation → paiement)
- ✅ Câblage stock + trésorerie sur facture entrante

### 📁 7.4 · Avoirs et remboursements
- ✅ Émission avoir
- ✅ Ticket de remboursement NF525
- ✅ Séparation nette des flux (avoir ≠ vente négative)

### 📁 7.5 · Suivi impayés
- 🔧 Relance J+30 automatique
- ⚫ Relance J+45, J+60
- ⚫ Mise en recouvrement (Alma / Floa)

---

## 🖥️ Zone 8 — CONFORMITÉ & SÉCURITÉ (COMPLIANCE)

### 📁 8.1 · NF525 & Fiscalité

#### 📂 8.1.1 · Chaîne fiscale
- ✅ FiscalSealer atomique (chaîne SHA-256)
- ✅ TicketZ quotidien avec fermeture verrouillée
- ✅ Grand livre fiscal immuable
- ✅ FEC exportable conforme
- ✅ Horodatage serveur autoritaire

#### 📂 8.1.2 · Contrôle et audit
- ✅ Vérification intégrité chaîne (bouton audit)
- ✅ Historique complet immuable
- 🔧 Rapport audit annuel PDF

### 📁 8.2 · HACCP

#### 📂 8.2.1 · Températures

##### 📄 Relevés manuels
- ✅ Formulaire saisie température (chambre froide, congélateur, viande)
- ✅ Photo obligatoire
- ✅ Journal quotidien

##### 📄 IoT connecté
- 🔧 Sondes Bluetooth (Testo, SwissAvant)
- 🔧 Capture automatique températures
  - 📡 émet `haccp.temperature_logged` ✅ (fix P0 récent)
- ⚫ Alerte immédiate SMS/push si seuil franchi
  - 📡 émet `haccp.threshold_exceeded` ⚫
- ⚫ Auto-création non-conformité si récurrent
  - 📡 émet `haccp.non_conformity_created` ✅

#### 📂 8.2.2 · Non-conformités

##### 📄 Registre
- ✅ Création NC manuelle
- ✅ Photos + description + gravité
- ✅ Plan d'action associé
- 🔧 Workflow validation manager
- ⚫ Rapport mensuel PDF pour DDCCRF

#### 📂 8.2.3 · Traçabilité étiquettes
- ✅ Impression étiquette avec lot + date + fournisseur
- ✅ Historique consommation lot
- 🔧 Import lot via scan photo BL

### 📁 8.3 · Allergènes INCO

#### 📂 8.3.1 · Déclaration
- ✅ 14 allergènes obligatoires cochés par recette
- ✅ Vue matrice par produit
- 🔧 Fiche allergène PDF par produit (obligation vitrine)

#### 📂 8.3.2 · Diffusion
- 🔧 Sync KDS (alerte serveur/cuisinier)
- ⚫ Consumer allergen event depuis réservation (voir zone 2 R2)

### 📁 8.4 · RGPD

#### 📂 8.4.1 · Consentements
- ✅ Opt-in email/SMS
- ✅ Cookie banner conforme CNIL
- ✅ Registre traitements par tenant

#### 📂 8.4.2 · Droits clients
- ✅ Droit à l'oubli (crypto-shredding)
- ✅ Export données (portabilité JSON)
- 🔧 Interface self-service client

### 📁 8.5 · Registre du personnel
- ✅ Framework en place
- 🔧 Génération PDF conforme
- ⚫ Historique modifications immuable

---

## 🖥️ Zone 9 — FACILITY & MAINTENANCE

### 📁 9.1 · Équipements

#### 📂 9.1.1 · Registre équipements
- ✅ Fiche équipement (nom, marque, date achat, garantie)
- ✅ Photo + facture achat
- 🔧 QR code physique à coller sur l'équipement
- ⚫ Historique interventions

#### 📂 9.1.2 · Maintenance préventive
- ⚫ Rappels entretien (filtre hotte tous les 3 mois)
  - 📡 émet `facility.maintenance_due` ⚫
- ⚫ Calendrier interventions
- ⚫ Contact prestataire par équipement

### 📁 9.2 · Signalements
- 🔧 Formulaire signalement panne + photo
  - 📡 émet `facility.maintenance_requested` (R12 bus) 🔧 **émetteur partiel**
- ⚫ Priorité (critique/haute/normale)
- ⚫ Assignation prestataire
- ⚫ Suivi jusqu'à résolution

### 📁 9.3 · Consommation énergétique
- ⚫ Interface Linky (Enedis API)
- ⚫ Alerte pic hors service
- ⚫ Rapport mensuel

### 📁 9.4 · Nettoyage
- ✅ Check-list ouverture/fermeture par zone
- 🔧 Registre nettoyage HACCP-adjacent
- ⚫ Photo post-nettoyage (preuve)

---

## 🖥️ Zone 10 — ANALYTICS & BI

### 📁 10.1 · Dashboards temps réel

#### 📂 10.1.1 · Dashboard salle (manager service)
- ✅ Occupation actuelle
- ✅ CA du jour vs objectif
- ✅ Ticket moyen jour
- ✅ Top plats du jour
- 🔧 Comparaison N-1 (même jour l'an dernier)

#### 📂 10.1.2 · Dashboard cuisine (chef)
- ✅ Vue KDS globale
- 🔧 Temps moyen préparation par plat
- 🔧 Ratio food cost temps réel
- ⚫ Alertes ruptures ingrédients

#### 📂 10.1.3 · Dashboard direction (propriétaire)
- ✅ CA cumulé mois/année
- ✅ Marge brute
- 🔧 Charges vs prévisionnel
- ⚫ Alertes anomalies (CA en baisse anormale)

### 📁 10.2 · Rapports périodiques

#### 📂 10.2.1 · Rapport quotidien
- ✅ Ticket Z (fin de journée)
- ✅ Ventilation TVA
- ✅ Répartition modes paiement
- 🔧 Envoi email propriétaire chaque soir

#### 📂 10.2.2 · Rapport hebdo/mensuel
- 🔧 CA + marge + food cost
- ⚫ Menu Engineering (Star/Puzzle/Plowhorse/Dog)
- ⚫ Performance staff (ventes serveur)
- ⚫ Fréquentation par créneau
- ⚫ Export PDF envoyé au comptable

#### 📂 10.2.3 · Rapports fiscaux
- ✅ FEC exportable
- ✅ Rapport TVA mensuel
- 🔧 Rapport IS annuel préparation

### 📁 10.3 · Analytics avancés

#### 📂 10.3.1 · Menu Engineering (Bruce-Miller)
- ✅ Matrice popularité × marge
- 🔧 Suggestions repositionnement
- ⚫ Historique évolution mensuelle par plat

#### 📂 10.3.2 · Analyse clientèle
- 🔧 Cohortes (clients acquis en mars 2026, rétention à N mois)
- ⚫ CLV (Customer Lifetime Value) par segment
- ⚫ Détection turnover (clients qui décrochent)

#### 📂 10.3.3 · Multi-établissements (chaîne)
- ⚫ Consolidation groupe (5 restos → dashboard unifié)
- ⚫ Benchmark inter-établissements
- ⚫ Alerte automatique si un établissement décroche
- ⚫ Export direction générale mensuel

### 📁 10.4 · Data exports
- ✅ Export CSV commandes
- ✅ Export CSV clients CRM
- 🔧 Export inventaire (comptable)
- ⚫ API GraphQL analytics (pour BI externe type Metabase)

---

## 🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)

### 📁 11.1 · Oracle chat

#### 📂 11.1.1 · Chat conversationnel
- 🔧 Interface chat activée (LightRAG sidecar)
- 🔧 Questions naturelles : "Quel est mon plat le plus rentable ce mois ?"
- 🔧 Réponse SQL-free avec citations sources
- ⚫ Historique conversations
- ⚫ Suggestions questions

#### 📂 11.1.2 · Suggestions proactives
- ⚫ "Il vous reste 3 portions saumon, vente moyenne 5/soir → rupture ce soir"
- ⚫ "Ce soir vous avez 40% de couverts en moins que d'habitude"
- ⚫ Alertes anomalies (comportement inhabituel)

### 📁 11.2 · Prédictions

#### 📂 11.2.1 · Fréquentation
- 🔧 Prévision J+7 par créneau (déjeuner/dîner)
- ⚫ Impact météo (pluie/soleil)
- ⚫ Impact événements locaux (match/concert)
- ⚫ Suggestion staff optimal par créneau

#### 📂 11.2.2 · Commandes
- ⚫ Prévision commandes par catégorie
- ⚫ Suggestion menu du jour (météo + stocks + historique)
- ⚫ Prévision ruptures ingrédients

#### 📂 11.2.3 · Client
- ⚫ Prédiction turnover client (non revenu depuis 90j)
- ⚫ Suggestion relance ciblée
  - 📡 émet `intelligence.churn_risk_detected` ⚫

### 📁 11.3 · Détection anomalies
- 🔧 Détection écarts CA
- 🔧 Détection fraudes potentielles (annulations excessives)
- ✅ Détection anomalie IoT (HACCP hors seuil)
  - 📡 émet `intelligence.anomaly_detected` (R13 bus) 🔧 **émetteur partiel**

---

## 🖥️ Zone 12 — INTÉGRATIONS

### 📁 12.1 · Plateformes de commande en ligne

#### 📂 12.1.1 · Delivery
- 🔧 Deliveroo (connecteur squelette)
- ⚫ UberEats (marché critique)
- ⚫ Just Eat Takeaway
- 🔧 Stuart / Coursier local

#### 📂 12.1.2 · Click & Collect
- ⚫ Interface propre site web
- ⚫ Réception commande → KDS
- ⚫ Paiement en ligne Stripe

### 📁 12.2 · Réservations

- 🔧 Google Reserve (routes en place)
- ⚫ The Fork (Yums)
- ⚫ Zenchef

### 📁 12.3 · Paiement

- ✅ Stripe (paiement + Terminal + Billing)
- ⚫ SumUp Air
- ⚫ Ingenico Move
- ⚫ Alma (paiement fractionné)

### 📁 12.4 · Comptabilité

- ✅ Export FEC générique
- 🔧 Pennylane
- ⚫ Cegid
- ⚫ Sage 100
- ⚫ QuickBooks

### 📁 12.5 · Fournisseurs

- 🔧 Metro France
- ⚫ Transgourmet
- ⚫ Pomona
- ⚫ Sysco

### 📁 12.6 · Paie et RH

- 🔧 Payfit
- 🔧 Silae
- ⚫ Combo (planning + paie)

### 📁 12.7 · Marketing

- 🔧 Google Business Profile
- ✅ Resend (transactionnel email)
- ⚫ Sendinblue (marketing campagnes)
- ⚫ Twilio SMS (à confirmer usage)

### 📁 12.8 · Objets connectés (IoT)

- 🔧 Sondes Bluetooth Testo
- ⚫ Sondes SwissAvant
- ⚫ Compteur Linky (Enedis)
- ⚫ Balance connectée USB (Bizerba, Dibal)

---

## 🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT

### 📁 13.1 · Paramètres établissement

#### 📂 13.1.1 · Identité
- ✅ Nom, SIRET, adresse, téléphone
- ✅ Logo (upload avec optim)
- ✅ Couleurs brand tokens
- ✅ Font brand (Playfair, Cormorant, custom)
- 🔧 Splash screen brandée toggle

#### 📂 13.1.2 · Horaires et calendrier
- ✅ Horaires ouverture par jour
- ✅ Jours fériés et fermetures
- ⚫ Événements spéciaux (privatisation, journée porte ouverte)

#### 📂 13.1.3 · Configuration fiscale
- ✅ Régime (BIC réel/simplifié)
- ✅ TVA par catégorie
- ✅ Numéro RCS
- ✅ Cabinet comptable (contact)

### 📁 13.2 · Utilisateurs et rôles

#### 📂 13.2.1 · Gestion utilisateurs
- ✅ Invitation par email
- ✅ Attribution rôle
- ✅ Activation/désactivation
- 🔧 Bulk import CSV (grosse équipe)

#### 📂 13.2.2 · RBAC paramétrable

##### 📄 Rôles standards (levels 10-100)
- **10** : Apprenti / Plongeur
- **20** : Commis / Serveur junior / Runner
- **30** : Serveur / Barman / Vendeur
- **40** : Chef de rang / Timeclock manager
- **50** : Sommelier / Expert produit
- **60** : Sous-chef / Manager service / Chef d'équipe
- **70** : Chef de cuisine / Chef de salle
- **80** : Directeur établissement
- **100** : Propriétaire (gérant de l'établissement — PAS le MCC)

##### 📄 Libellés paramétrables par client
- ✅ Renommage libellés rôles (RoleLabels par verticale)
- 🔧 Personnalisation avancée depuis MCC (opérateur plateforme)
- ⚫ Rôles custom (créer un rôle sur-mesure "Chef sommelier" niveau 55)

##### 📄 Actions RBAC (ACTION_MAP)
- ✅ Framework `minLevel` par action
- ✅ Override par action pour un rôle (ex : accorder `pos.void_ticket` au serveur senior)
- 🔧 Interface admin visuelle (matrice rôles × actions)
- ⚫ Audit trail des changements RBAC (qui a changé quoi quand)

##### 📄 Actions clés (extrait)
| Action | Level défaut | Paramétrable |
|--------|:-----------:|:------------:|
| `pos.void_ticket` | 60 | ✅ |
| `pos.discount_line` (< 10%) | 30 | ✅ |
| `pos.discount_line` (> 10%) | 60 | ✅ |
| `pos.pre_authorize` | 30 | ✅ |
| `pos.override_age_check` | 60 | ✅ |
| `pos.record_tip` | 30 | ✅ |
| `pos.close_cash_drawer` | 40 | ✅ |
| `reservations.check_in` | 20 | ✅ |
| `reservations.configure_overbooking` | 70 | ✅ |
| `floorplan.edit` | 60 | ✅ |
| `floorplan.close_table` | 20 | ✅ |
| `menu.edit_prices` | 60 | ✅ |
| `menu.view_engineering` | 60 | ✅ |
| `promotions.create` | 60 | ✅ |
| `inventory.adjust` | 40 | ✅ |
| `inventory.receive` | 30 | ✅ |
| `hr.correct_timeclock` | 60 | ✅ |
| `hr.declare_absence` | 20 | ✅ |
| `hr.view_payroll` | 80 | ✅ |
| `finance.view_z_report` | 60 | ✅ |
| `finance.export_fec` | 80 | ✅ |
| `finance.close_cash_drawer` | 40 | ✅ |
| `compliance.view_haccp_history` | 40 | ✅ |
| `compliance.close_non_conformity` | 60 | ✅ |
| `facility.request_maintenance` | 20 | ✅ |
| `analytics.view_dashboard_service` | 40 | ✅ |
| `analytics.view_dashboard_direction` | 80 | ✅ |
| `intelligence.query_oracle` | 40 | ✅ |
| `settings.edit_establishment` | 80 | ✅ |
| `settings.edit_rbac` | 100 | ⚫ (uniquement owner) |
| `settings.edit_integrations` | 80 | ✅ |

### 📁 13.3 · Notifications

#### 📂 13.3.1 · Configuration notifs
- 🔧 Choix canal par événement (email/SMS/push)
- ⚫ Configuration par rôle (managers reçoivent alertes stock, pas les serveurs)
- ⚫ Silencer plages horaires (pas de push la nuit)

#### 📂 13.3.2 · Push notifications
- ✅ Framework WebPush avec VAPID
- 🔧 Émission via NexusEventBus
- ⚫ Ciblage par rôle et permissions

### 📁 13.4 · Intégrations client

#### 📂 13.4.1 · Marketplace connecteurs
- 🔧 Framework connector-hub en place
- ⚫ Auto-activation par verticale (DNA)
- 🔧 Configuration OAuth par connecteur
- ⚫ Health monitoring (ping périodique)

### 📁 13.5 · Facturation SaaS (côté client)

#### 📂 13.5.1 · Abonnement
- ✅ Plan actuel + prochain renouvellement
- ✅ Historique factures MCC
- ⚫ Changement de plan self-service
- ⚫ Portail Stripe (mise à jour CB)

---

## 📡 Events Bus — Synthèse Restaurant

### ✅ Émetteurs actifs
- `finance.journal_entry_created`
- `finance.ticket_z_closed`
- `finance.bank_synced`
- `hr.tip_declared`
- `hr.employee_created`
- `haccp.temperature_logged`
- `haccp.non_conformity_created`
- `inventory.stock_adjusted`
- `logistics.purchase_order_sent`
- `logistics.waste_recorded`
- `reservation.no_show`

### 🔧 Émetteurs partiels (à finaliser R1-R13 bus)
- `reservation.created/updated/cancelled` — **R1**
- `hr.shift_started/ended` — **R9**
- `logistics.delivery_received` — **R7**
- `finance.invoice_generated` — **R6**
- `facility.maintenance_requested` — **R12**
- `intelligence.anomaly_detected` — **R13**
- `commerce.promotion_activated` — **R4**
- `ops.table_closed` — **R11**

### ⚫ Émetteurs manquants (à construire)
- `reservation.matched` — **R2 CRITIQUE (allergènes)**
- `hr.absence_declared` — **R3**
- `commerce.loyalty_points_earned` — **R5**
- `commerce.reservation_deposit_paid` — **R10**
- `ops.course.fired/next_requested`
- `ops.table_delay_alert`
- `commerce.gift_card_issued/redeemed`
- `commerce.receipt_sent`
- `commerce.menu_activated`
- `commerce.waitlist_ready`
- `commerce.loyalty_reward_reached`
- `facility.maintenance_due`
- `haccp.threshold_exceeded`
- `hr.schedule_published`
- `hr.dpae_submitted`
- `hr.understaffed_alert`
- `intelligence.prep_time_estimated`
- `intelligence.churn_risk_detected`
- `ops.kitchen_call / service_alert`
- `ops.order_placed_from_qr`

---

# 🥖 VERTICALE BAKERY (BOULANGERIE)

## 📊 Vue d'ensemble

**Progress** : 80% (proche restaurant, mêmes zones 1-13 avec spécificités).

Les zones 1-13 sont **héritées du restaurant** avec les mêmes tâches ✅/🔧/⚫. Ce qui suit décrit **uniquement les spécificités bakery** à ajouter/remplacer.

---

## 🖥️ Zone 1 — SERVICE (spécificités bakery)

### 📁 1.4 · Production & fournées

#### 📂 1.4.1 · Planning production
- ⚫ Interface production (baguettes/croissants par fournée)
  - 🎯 ops + logistics + intelligence
  - 📡 émet `ops.batch_planned` ⚫
- ⚫ Suggestion auto historique + météo + jour semaine
- ⚫ Alarme pétrin/cuisson (mise en route → sortie four)
- ⚫ Registre production quotidien (traçabilité HACCP)
  - 🔐 `production.plan_batch` — niveau min 60 (boulanger)

#### 📂 1.4.2 · Cuisson
- ⚫ Timer fournée (60 min baguette, 20 min croissant)
- ⚫ Alerte sortie four SMS/push
- ⚫ Historique fournées (nb pièces / lot farine)

### 📁 1.5 · Vente comptoir (POS mode flux rapide)

#### 📂 1.5.1 · Interface caisse
- 🔧 Mode "flux rapide" (gros boutons favoris)
- ⚫ Balance connectée USB (Bizerba, Dibal) — vente au poids
  - 📡 émet `commerce.weighed_item_sold` ⚫
- ⚫ Impression étiquette prix à la part
- ⚫ Rendu monnaie grand écran client

### 📁 1.6 · Précommandes clients

#### 📂 1.6.1 · Commande à l'avance
- ⚫ Saisie précommande ("dimanche 8h : 3 tradi + tarte pommes 6 parts")
- ⚫ Notification production auto la veille au soir
- ⚫ Retrait comptoir (scan numéro commande)
  - 📡 émet `commerce.pre_order_placed` ⚫
- ⚫ Acompte ou paiement retrait (choix client)

---

## 🖥️ Zone 4 — CLIENTS (spécificités bakery)

### 📁 4.4 · Comptes clients pro (B2B)

#### 📂 4.4.1 · Cafés / restos / hôtels / entreprises
- ⚫ Compte pro avec conditions négociées
- ⚫ Commandes récurrentes ("40 croissants lundi-vendredi 7h")
  - 📡 émet `commerce.recurring_order_scheduled` ⚫
- ⚫ Facturation mensuelle groupée
- ⚫ Portail client (consulter historique + modifier)

---

## 🖥️ Zone 5 — STOCK (spécificités bakery)

### 📁 5.4 · Traçabilité farine
- ⚫ Lot farine par fournée (obligation rappels)
- ⚫ Lien fournée → produits vendus (traçabilité rappel)
  - 📡 émet `haccp.batch_tracked` ⚫

### 📁 5.5 · Fournisseurs boulangerie
- ⚫ Catalogue Grands Moulins de Paris
- ⚫ Catalogue Foricher / Girardeau
- ⚫ Alerte stock farine hebdo

---

## 🖥️ Zone 11 — INTELLIGENCE (spécificités bakery)

### 📁 11.4 · Prédiction demande fournées
- ⚫ Historique × jour semaine × météo → suggestion fournée
- ⚫ Suivi précision prédiction (auto-amélioration)

### 📁 11.5 · Gestion invendus
- ⚫ Prédiction fin de journée
- ⚫ Suggestion pricing dynamique (-30% après 18h)
- ⚫ Intégration Too Good To Go / Phenix pour don
  - 📡 émet `commerce.food_donated` ⚫

---

## 📡 Events bus spécifiques bakery
- ⚫ `ops.batch_planned`
- ⚫ `commerce.weighed_item_sold`
- ⚫ `commerce.pre_order_placed`
- ⚫ `commerce.recurring_order_scheduled`
- ⚫ `haccp.batch_tracked`
- ⚫ `commerce.food_donated`

---

# 🛍️ VERTICALE RETAIL (COMMERCE DE DÉTAIL)

## 📊 Vue d'ensemble

**Progress** : 60% (catalogue et POS génériques OK, spécifiques e-commerce et variantes à construire).

---

## 🖥️ Zone 1 — VENTE COMPTOIR (pas de KDS ni plan de salle)

### 📁 1.7 · POS retail
- ⚫ Mode caisse pure (pas de table, pas de KDS)
- ⚫ Scan EAN-13 (webcam ou lecteur USB Zebra/Datalogic)
- ⚫ Recherche produit rapide (autocomplete nom/ref)
- ⚫ Multi-tarifs (pro/particulier/soldé)

### 📁 1.8 · Retours & échanges
- ⚫ Recherche ticket original
- ⚫ Retour partiel (1 article sur 3 achetés)
- ⚫ Note de crédit à valoir
- ⚫ Politique retour configurable (14j/30j)
  - 📡 émet `commerce.return_processed` ⚫
  - 🔐 `pos.process_return` — niveau min 30

### 📁 1.9 · Bons cadeaux
- ⚫ Émission (QR ou email)
- ⚫ Suivi valeur restante
- ⚫ Rapport bons émis/utilisés

---

## 🖥️ Zone 3 — MENU/CATALOGUE (spécificités retail)

### 📁 3.4 · Variantes produits (tailles × couleurs)
- ⚫ Matrice variantes (T-shirt : S/M/L × Rouge/Bleu/Noir)
- ⚫ Stock par variante
- ⚫ Impression étiquette par variante avec EAN

### 📁 3.5 · E-commerce natif

#### 📂 3.5.1 · Connecteurs
- ⚫ Shopify (P0)
  - 📡 émet `commerce.web_order_received` ⚫
- ⚫ WooCommerce (P0)
- ⚫ Prestashop (P1, marché FR)
- ⚫ Amazon MWS (P1)
- ⚫ Cdiscount / Manomano (P2)

#### 📂 3.5.2 · Réconciliation
- ⚫ Commande web → fulfilment magasin ou expédition
- ⚫ Sync stock temps réel (pas de survente)

---

## 🖥️ Zone 5 — STOCK (spécificités retail)

### 📁 5.6 · Multi-emplacement
- ⚫ Stock par emplacement (boutique/réserve/entrepôt)
- ⚫ Transfert entre emplacements
  - 📡 émet `inventory.transfer_completed` ⚫
- ⚫ Vue consolidée + par emplacement

### 📁 5.7 · Inventaire physique
- ⚫ Assistant annuel (scan tous produits)
- ⚫ Écart théorique/réel + justification
- ⚫ Ajustement auto après validation

---

## 🖥️ Zone 6 — HR (spécificités retail)

### 📁 6.6 · Commissions vendeur
- ⚫ Suivi ventes par vendeur
- ⚫ Commission % par catégorie
- ⚫ Rapport mensuel commission
- ⚫ Objectifs mensuels avec tracker

---

## 🖥️ Zone 10 — ANALYTICS (spécificités retail)

### 📁 10.5 · Ruptures et rotations
- ⚫ Rotation lente (non vendu 90j)
  - 📡 émet `intelligence.slow_moving_detected` ⚫
- ⚫ ABC analysis (top 20% = 80% CA)
- ⚫ Suggestion réassort auto

---

## 📡 Events spécifiques retail
- ⚫ `commerce.return_processed`
- ⚫ `commerce.web_order_received`
- ⚫ `commerce.gift_card_issued/redeemed`
- ⚫ `inventory.transfer_completed`
- ⚫ `intelligence.slow_moving_detected`

---

# 💇 VERTICALE SALON (COIFFURE / ESTHÉTIQUE)

## 📊 Vue d'ensemble

**Progress** : 50% (appointments génériques OK, agenda visuel et commissions à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS (spécificités salon — CENTRE DU MÉTIER)

### 📁 2.4 · Agenda visuel collaborateurs

#### 📂 2.4.1 · Vue Gantt journée
- ⚫ Colonnes = collaborateurs × lignes = créneaux 15 min
- ⚫ Drag & drop RDV entre créneaux
  - 📡 émet `appointment.rescheduled` ⚫
- ⚫ Bloc "pause" configurable
- ⚫ Vue semaine (planning global)

#### 📂 2.4.2 · Auto-attribution
- ⚫ "Cliente veut Sophie pour couleur" → suggère créneaux libres Sophie
- ⚫ Filtrage par compétence (coloriste vs coupe)

### 📁 2.5 · Walk-in barbier
- ⚫ File d'attente sans RDV
- ⚫ Temps d'attente estimé
- ⚫ SMS d'appel ("Dans 5 min !")
  - 📡 émet `commerce.walkin_notified` ⚫

### 📁 2.6 · Prise RDV en ligne (site salon)
- ⚫ Page publique par salon (`salon-marie.mycaisse.fr`)
- ⚫ Sélection prestation + collaborateur
- ⚫ Créneaux libres temps réel
- ⚫ Acompte optionnel (10-30% Stripe)

---

## 🖥️ Zone 4 — CLIENTS (spécificités salon)

### 📁 4.5 · Fiche technique cliente

#### 📂 4.5.1 · Historique prestations
- ⚫ Dates, prestations, prix
- ⚫ Formule couleur utilisée (Wella 6.34 + 20 vol, temps 25 min)
- ⚫ Photos avant/après
- ⚫ Notes personnelles ("préfère ambiance calme")

#### 📂 4.5.2 · Sécurité couleur
- ⚫ Patch test PPD (paraphénylènediamine) obligatoire
- ⚫ Date validité (6 mois)
- ⚫ Refus service si test expiré
  - 📡 émet `compliance.allergy_test_missing` ⚫

### 📁 4.6 · Relances automatiques
- ⚫ Client non revenu 45j → "Il est temps de reprendre RDV"
- ⚫ Anniversaire → SMS "-20% ce mois"

---

## 🖥️ Zone 6 — HR (spécificités salon)

### 📁 6.7 · Commissions coiffeur
- ⚫ Configuration par collaborateur (fixe / % / paliers)
- ⚫ Ex : Sophie = 40% prestations + 15% produits
- ⚫ Calcul auto mensuel
- ⚫ Bulletin commission PDF
- ⚫ Intégration paie
  - 📡 émet `hr.commission_calculated` ⚫

---

## 🖥️ Zone 5 — STOCK (spécificités salon)

### 📁 5.8 · Produits pro
- ⚫ Inventaire colorations, oxydants, shampooings pros
- ⚫ Consommation par prestation (1 couleur = 60g Wella)
- ⚫ Commande auto L'Oréal Pro / Kadus / Wella
  - 📡 émet `logistics.pro_products_reorder` ⚫

---

## 📡 Events spécifiques salon
- ⚫ `appointment.rescheduled`
- ⚫ `commerce.walkin_notified`
- ⚫ `compliance.allergy_test_missing`
- ⚫ `hr.commission_calculated`
- ⚫ `logistics.pro_products_reorder`

---

# 🚗 VERTICALE GARAGE (AUTOMOBILE)

## 📊 Vue d'ensemble

**Progress** : 55% (RepairIntake amorcé, devis pièces + planning atelier à construire).

---

## 🖥️ Zone 2 — INTAKE (spécificité garage)

### 📁 2.7 · Fiche véhicule

#### 📂 2.7.1 · Identification
- ⚫ Immat client → auto-fetch SIV (marque/modèle/année)
  - 📡 émet `service.vehicle_identified` ⚫
- ⚫ Kilométrage à l'entrée
- ⚫ Photos état extérieur
- ⚫ Historique interventions (dates + km)

#### 📂 2.7.2 · Ordre de Réparation (OR)
- 🔧 ServiceTicket → OR
- ⚫ Génération document légal OR
- ⚫ Signature électronique client (Yousign)
  - 📡 émet `service.repair_order_signed` ⚫
- ⚫ Suivi statut ("Pièces reçues", "Test route", "Prêt")

---

## 🖥️ Zone 3 — CATALOGUE (spécificités garage)

### 📁 3.6 · Devis pièces + main d'oeuvre

#### 📂 3.6.1 · Recherche pièces
- ⚫ Catalogue AD Autodistribution
- ⚫ Catalogue Groupauto
- ⚫ Recherche référence OEM ou équivalent
- ⚫ Comparaison prix multi-fournisseurs

#### 📂 3.6.2 · Temps main d'oeuvre
- ⚫ Barème constructeur ou Autodata
- ⚫ Calcul total HT/TTC
- ⚫ Ventilation obligatoire pièces / MO
- ⚫ Envoi devis PDF client (email/SMS avec lien signature)
  - 📡 émet `service.quote_sent` ⚫

---

## 🖥️ Zone 6 — HR (spécificités garage)

### 📁 6.8 · Planning atelier
- ⚫ Vue journée mécaniciens × heures × interventions
- ⚫ Drag & drop réattribution
- ⚫ Temps réel ("Julien a fini 308 en 4h vs 5h prévu")
  - 📡 émet `service.intervention_completed` ⚫
- ⚫ Alerte surcharge

---

## 🖥️ Zone 8 — COMPLIANCE (spécificités garage)

### 📁 8.6 · Environnement
- ⚫ Registre déchets dangereux (huiles, batteries, filtres)
- ⚫ Bordereau de suivi BSDD vers collecteur agréé
  - 📡 émet `compliance.waste_manifest_created` ⚫

### 📁 8.7 · Rappels réglementaires
- ⚫ Contrôle Technique rappel 2 mois avant
- ⚫ Révisions constructeur

---

## 📡 Events spécifiques garage
- ⚫ `service.vehicle_identified`
- ⚫ `service.repair_order_signed`
- ⚫ `service.quote_sent`
- ⚫ `service.intervention_completed`
- ⚫ `compliance.waste_manifest_created`

---

# 🏨 VERTICALE HOTEL

## 📊 Vue d'ensemble

**Progress** : 40% (rooms basiques, PMS et channel manager à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS HÔTEL (PMS)

### 📁 2.8 · Vue calendrier chambres
- ⚫ Gantt chambres × jours
- ⚫ Drag & drop client entre chambres
  - 📡 émet `booking.room_reassigned` ⚫
- ⚫ Bloc "hors service"
- ⚫ Check-in / check-out signature électronique

### 📁 2.9 · Channel manager

#### 📂 2.9.1 · Connecteurs OTA
- ⚫ Booking.com API
  - 📡 émet `booking.ota_synced` ⚫
- ⚫ Expedia Rapid
- ⚫ Airbnb API (Guesty)
- ⚫ Hostelworld

#### 📂 2.9.2 · Sync temps réel
- ⚫ Stock chambres (pas de surbooking)
- ⚫ Prix (yield management)
- ⚫ Restrictions (min stay)

### 📁 2.10 · Groupes et séminaires
- ⚫ Multi-chambres + salle séminaire
- ⚫ Facturation entreprise
- ⚫ Prix négocié
- ⚫ Suivi acompte / solde

---

## 🖥️ Zone 9 — FACILITY (spécificités hôtel)

### 📁 9.5 · Housekeeping
- ⚫ Vue statuts chambres (à faire / en cours / propre / inspectée)
  - 📡 émet `facility.room_cleaned` ⚫
- ⚫ Attribution femme de chambre par étage
- ⚫ Notification arrivée anticipée → priorité
- ⚫ Signalement problèmes (télé cassée)

---

## 🖥️ Zone 1 — SERVICE (spécificité hôtel : Room Service)

### 📁 1.10 · Room service
- ⚫ Commande depuis chambre (QR menu ou téléphone)
- ⚫ Envoi cuisine (KDS partagé F&B hôtel)
  - 📡 émet `ops.room_service_ordered` ⚫
- ⚫ Livraison chambre avec coche "livré"
- ⚫ Ajout auto à la facture chambre

---

## 🖥️ Zone 7 — FINANCE (spécificités hôtel)

### 📁 7.6 · Facturation cumulée séjour
- ⚫ Cumul auto : nuitées + petit-déj + F&B + minibar + spa + parking
  - 📡 émet `finance.folio_updated` ⚫
- ⚫ Facture unique fin de séjour
- ⚫ Split facture (client paie chambre, entreprise paie séminaire)

### 📁 7.7 · Yield Management
- ⚫ Prix dynamique selon taux occupation
- ⚫ Règles ("> 80% occup → +15%")
- ⚫ Historique + optimisation

---

## 🖥️ Zone 8 — COMPLIANCE (spécificités hôtel)

### 📁 8.8 · Registre police
- ⚫ Registre voyageurs (obligation)
  - 📡 émet `compliance.guest_registered` ⚫
- ⚫ Déclaration mensuelle préfecture

### 📁 8.9 · Taxe séjour
- ⚫ Calcul auto par nuitée / personne
- ⚫ Barème par commune
- ⚫ Reversement mensuel/trimestriel mairie
  - 📡 émet `finance.tourist_tax_calculated` ⚫

---

## 📡 Events spécifiques hôtel
- ⚫ `booking.room_reassigned`
- ⚫ `booking.ota_synced`
- ⚫ `facility.room_cleaned`
- ⚫ `ops.room_service_ordered`
- ⚫ `finance.folio_updated`
- ⚫ `compliance.guest_registered`
- ⚫ `finance.tourist_tax_calculated`

---

# 🩺 VERTICALE CLINIC (PARAMÉDICAL / SANTÉ)

## 📊 Vue d'ensemble

**Progress** : 35% (consultation amorcée, tiers-payant + DMP + Ségur à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS (spécificités clinic)

### 📁 2.11 · Doctolib sync
- ⚫ Sync bidirectionnelle API Doctolib
- ⚫ RDV Doctolib → apparaît agenda plateforme
  - 📡 émet `appointment.imported_from_doctolib` ⚫
- ⚫ RDV direct → sync inverse

### 📁 2.12 · Télé-consultation
- ⚫ Intégration Doctolib Télésanté
- ⚫ Alternatives : Livi, Qare, Maiia
- ⚫ Salle d'attente virtuelle
- ⚫ Cotation acte télé-consultation

---

## 🖥️ Zone 4 — CLIENTS (Dossier Médical Partagé)

### 📁 4.7 · DMP (Dossier Médical Patient)

#### 📂 4.7.1 · Antécédents
- ⚫ Antécédents médicaux
- ⚫ Allergies
- ⚫ Traitements en cours
- ⚫ Historique consultations avec cotation
  - 🔐 `patient.view_medical_record` — niveau min 60 (praticien)

#### 📂 4.7.2 · Bilans thérapeutiques
- ⚫ Bilan initial + objectifs (kiné, ostéo)
- ⚫ Évolution (EVA douleur, mobilité)
- ⚫ Photos évolution (dermato, blessures)

### 📁 4.8 · Ordonnances
- ⚫ Éditeur ordonnance avec templates
- ⚫ Envoi patient email/SMS
  - 📡 émet `patient.prescription_sent` ⚫
- ⚫ Envoi pharmacie (Ordoclic)
- ⚫ Historique par patient

---

## 🖥️ Zone 7 — FINANCE (spécificités clinic : tiers-payant)

### 📁 7.8 · Feuille de Soins Électronique (FSE)
- ⚫ Lecture carte Vitale (lecteur GALSS ou Cegetel)
- ⚫ Génération FSE conforme
- ⚫ Télétransmission Cegetel/Almerys/Cnda
  - 📡 émet `finance.fse_sent` ⚫
- ⚫ Suivi paiement Sécu (délai 5j)

### 📁 7.9 · Tiers-payant
- ⚫ Interrogation droits Vitale
- ⚫ Facturation part Sécu directe
- ⚫ Facturation part mutuelle
- ⚫ Reste à charge patient

### 📁 7.10 · Cotation actes
- ⚫ Nomenclature NGAP (paramédical : AMK, AMS, AMO)
- ⚫ Nomenclature CCAM (médical)
- ⚫ Calcul auto prix Sécu + complémentaire
- ⚫ Vérification cumul actes autorisé

---

## 🖥️ Zone 8 — COMPLIANCE (RGPD santé)

### 📁 8.10 · HDS et RGPD santé
- ⚫ Certification Hébergeur Données Santé (OVH Santé, AWS HDS)
- ⚫ Consentement explicite art. 9 RGPD
- ⚫ Conservation dossier 20 ans obligatoire
- ⚫ Journal accès (qui a consulté quand)
  - 📡 émet `compliance.medical_record_accessed` ⚫

### 📁 8.11 · Ségur numérique santé
- ⚫ Compatibilité ROSP
- ⚫ Intégration Mon Espace Santé
  - 📡 émet `compliance.segur_sync_completed` ⚫
- ⚫ Envoi vers MSS (Messagerie Sécurisée Santé)

---

## 📡 Events spécifiques clinic
- ⚫ `appointment.imported_from_doctolib`
- ⚫ `patient.prescription_sent`
- ⚫ `finance.fse_sent`
- ⚫ `compliance.medical_record_accessed`
- ⚫ `compliance.segur_sync_completed`

---

# 🎨 VERTICALE CUSTOM (SUR-MESURE)

## 📊 Vue d'ensemble

**Progress** : 20% (2/9 adapters, framework de personnalisation à construire).

Custom = **framework**, pas produit fini. Objectif : permettre à des intégrateurs/consultants de configurer la plateforme pour des métiers "long tail".

---

## 🖥️ Zone 13 — PARAMÉTRAGE (spécificités custom)

### 📁 13.6 · Custom fields
- ⚫ Éditeur no-code : ajouter champ "Type de peau" fiche client
  - 🔐 `settings.add_custom_field` — niveau min 100
- ⚫ Types : texte, nombre, date, sélection, multi-sélection, fichier, calcul dérivé
- ⚫ Groupement par section

### 📁 13.7 · Formulaires custom
- ⚫ Éditeur wizard : formulaire de prise en charge métier
- ⚫ Ex auto-école : questionnaire médical préalable
- ⚫ Ex photographe : brief avant séance

### 📁 13.8 · Workflow builder
- ⚫ Éditeur no-code séquences
- ⚫ "Après RDV → SMS satisfaction J+1 → email newsletter J+30"
- ⚫ Trigger-based (events du bus)
  - 📡 émet `workflow.custom_step_executed` ⚫

### 📁 13.9 · Templates communautaires
- ⚫ Store de templates par métier
- ⚫ Fork template → adapter à son cas
- ⚫ Contribution partagée

---

# 🔀 CROSS-VERTICAL — Chantiers transverses

## 📁 CX.1 · Application mobile Expo

Modules par verticale :
- Restaurant : caisse iPad + KDS tablette + manager smartphone
- Bakery : caisse comptoir tactile
- Retail : caisse iPad + scanner Bluetooth
- Salon : agenda mobile + reporting manager
- Garage : réceptionniste tablette + fiche véhicule
- Hotel : housekeeping mobile + reception iPad
- Clinic : agenda praticien + saisie compte-rendu

Statut : ⚫ (débloqué par API REST Hono — Sprint S5 du roadmap execution)

## 📁 CX.2 · API REST Hono (S5)
- ⚫ Serveur Hono découplé
- ⚫ Routes v1 (orders, menu, reservations, timeclock, inventory)
- ⚫ Auth Bearer JWT
- ⚫ OpenAPI auto-généré

## 📁 CX.3 · CI/CD (S2)
- ⚫ `.github/workflows/gate.yml`
- ⚫ Protection branche merge
- ⚫ Deploy staging auto
- ⚫ Notification Slack

## 📁 CX.4 · Monitoring (S3)
- ✅ Sentry câblé multi-tenant
- ⚫ DSN production configuré
- ⚫ Alertes FISCAL_/SovereignGuard/DLQ
- ⚫ Axiom logs structurés
- ⚫ Uptime monitor

## 📁 CX.5 · MCC provisioning ref/custom (S4)
- ✅ SystemTenantRegistry (24 tenants système)
- ✅ cloneFromReference()
- ✅ Write-guard `_ref_*` / `_demo_*`
- 🔧 Preview avant clone dans SystemTenantsTab
- 🔧 Choix ref vs custom explicite dans wizard
- ⚫ Indicateur read-only sur formulaires système
- ⚫ Promote test→ref avec diff visuel

## 📁 CX.6 · Marketplace connecteurs (H4)
- 🔧 Framework connector-hub en place
- ⚫ Auto-activation par DNA (verticale)
- ⚫ Self-service client (activer sans MCC)
- ⚫ Health monitoring périodique
- ⚫ Marketplace publique avec docs

## 📁 CX.7 · Multi-établissements (H4)
- ⚫ Dashboard consolidé groupe
- ⚫ Comparaison inter-établissements
- ⚫ Stock/staff partagé si applicable
- ⚫ Facturation centralisée
- ⚫ RBAC hiérarchique (directeur groupe > directeur établissement)

## 📁 CX.8 · Intelligence Oracle par verticale
- 🔧 LightRAG opérationnel
- ⚫ Prompts spécialisés par verticale
- ⚫ Fine-tuning modèles par domaine (H4)

---

# 📈 Phasing global multi-verticales

## T+0 à T+3 mois — 🎯 RESTAURANT priorité absolue

**Objectif** : 30 clients restaurant payants + valider les Sprints 1-13 du roadmap execution.

**Sprints prioritaires** :
- Sprint 1 bus (R1-R13 émetteurs)
- Sprint 2 CI/CD + tests intégration
- Sprint 3 monitoring
- Sprint 4 MCC provisioning
- Sprint 5 API REST Hono
- Sprint 6-8 onboarding + documentation + facturation

**Nouveau code par zone** : zone 1 (POS avancé, KDS pro), zone 2 (R2 bouton accueillir), zone 4 (fidélité opérationnelle).

## T+3 à T+6 mois — 🥖 BAKERY en extension

**Objectif** : 20 boulangeries + validation du framework "verticale héritée".

**Sprints** :
- OPS-B1 planning production
- OPS-B2 vente comptoir + balance
- OPS-B3 précommandes
- COM-B1 clients pro
- INT-B1/B2 prédiction demande + invendus

## T+6 à T+12 mois — 💇 SALON + 🛍️ RETAIL en parallèle

**Objectif** : 100 clients cumulés sur les 2 verticales.

**Sprints salon** : OPS-S1 agenda visuel · COM-S1 RDV en ligne · FIN-S1 commissions · OPS-S2 fiche technique.

**Sprints retail** : OPS-RT1 POS retail · OPS-RT2 retours · COM-RT1 e-commerce · LOG-RT1 multi-emplacement · LOG-RT2 variantes.

## T+12 à T+18 mois — 🚗 GARAGE niche premium

**Objectif** : 100 garages payants (ticket moyen élevé).

**Sprints** : OPS-G1 fiche véhicule · OPS-G2 devis pièces · OPS-G4 planning atelier · COM-G1 RDV en ligne · FIN-G1 facturation détaillée.

## T+18 à T+24 mois — 🏨 HOTEL + 🩺 CLINIC (verticales complexes)

**Sprints hotel** : PMS core, channel manager (Booking + Expedia + Airbnb), housekeeping, room service, yield management.

**Sprints clinic** : Doctolib sync, FSE tiers-payant, DMP, ordonnances, Ségur numérique santé, HDS hébergement.

## T+24+ — 🎨 CUSTOM en ouverture

Custom fields, formulaires custom, workflow builder, templates communautaires, programme intégrateurs.

---

# 🎯 Objectifs consolidés

| Horizon | MRR total | Clients cumulés | Verticales actives |
|:-------:|:---------:|:---------------:|:-------------------|
| **T+6** | ~10 000€ | ~50 | 🍽️ + 🥖 |
| **T+12** | ~50 000€ | ~250 | + 💇 + 🛍️ |
| **T+18** | ~120 000€ | ~600 | + 🚗 |
| **T+24** | ~250 000€ | ~1 200 | + 🏨 + 🩺 |
| **T+36** | ~600 000€ | ~2 500 | + 🎨 (toutes) |

---

# 🔑 Ce qui fait tenir cette roadmap

1. ✅ **Le tronc est construit** — 8 piliers × 30 modules × 8 verticales généralisées.
2. ✅ **La dette est identifiée** — plan complet v6.0 documente les blocages restants.
3. ✅ **Chaque verticale a un leader identifié** dans les concurrents — tu proposes 20-30% mieux sur des points précis.
4. ✅ **La rentabilité opère au-delà de 100 clients cumulés** — à 10k€ MRR, tu couvres les frais fixes.
5. ✅ **L'écosystème connecteurs t'affranchit** de développer tout toi-même.

---

# 🚨 La décision T+0

Après Horizon 1 (Prod-Ready) du `ROADMAP_EXECUTION.md`, ta première décision stratégique :

**🍽️ Restaurant seul les 3 premiers mois** (recommandation) — validation ultra-focalisée, tous les efforts commerciaux et supports sur une verticale.

**🍽️ + 🥖 en parallèle** — élargit la base acquisition mais dilue l'attention.

Recommandation : Restaurant seul jusqu'à 30 clients payants, puis bakery en opportunité.

---

# 🍽️ COMPOSANTS UI — Verticale Restaurant
> Décomposition exhaustive des écrans, composants et interactions.
> ✅ Fait · 🔧 À finir · ⚫ À faire · RBAC: niveaux d'accès en fin de ligne

---

## 📖 Grille de lecture

Chaque composant a le format : `ComponentName — RBAC: 30 · 60 · 100`

Les nombres = **niveaux RBAC** qui peuvent VOIR/UTILISER le composant.

**Barème des niveaux** :
- `10` Apprenti · Plongeur
- `20` Commis · Serveur junior · Runner
- `30` Serveur · Barman · Vendeur · Réceptionniste
- `40` Chef de rang · Timeclock manager
- `50` Sommelier · Expert produit
- `60` Sous-chef · Manager service · Chef d'équipe
- `70` Chef de cuisine · Chef de salle
- `80` Directeur établissement
- `100` Propriétaire — gérant légal de l'établissement (PAS le MCC — voir ci-dessous)
- `∀` = tous niveaux (10 → 100)

> ⚠️ **Séparation RBAC / MCC** : Le niveau `100` (Propriétaire) est le **gérant de l'établissement client**
> (restaurant, salon, boulangerie…). Il a accès complet à **son tenant uniquement** (SovereignGuard le borne).
> Le constructeur de la plateforme (**MCC / vous**) n'est **pas** un niveau RBAC — il opère via
> `isMCCMode()` + routes `/app/(admin)/` + `MccOperatorContract`, complètement séparé du RBAC tenant.

---

# 🖥️ Zone 1 — SERVICE

## 🖼️ Écran 1.1 — POS (`/pos`)

### 🧩 Composants principaux

- ✅ `HeaderBar` — RBAC: ∀
- ✅ `CategoryTabs` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductGrid` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductCard` (item dans grid) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductDetailsDialog` (modal options) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ModifierPicker` (radio/checkbox options) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `QuantitySelector` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `NotesTextarea` (note libre par plat) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `NotesAutocomplete` (suggestions notes fréquentes) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `AllergenTagPicker` (tag allergie inline) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `WinePairingSuggestion` (IA suggère vin par plat) — RBAC: 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `ProductFavoritesGrid` (mode flux rapide) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `RecentlyUsedItemsBar` (5 derniers plats servis) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ProductSearchOverlay` (Cmd+K style recherche produit) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `BarcodeScanner` (scan code-barres carte cadeau/produit) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceOrderInput` (dictée vocale commande) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Panier & addition

- ✅ `CartHeader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartLines` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartLineItem` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartFooter` (totaux + TVA) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartActions` (envoyer/encaisser/split) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `PartialSendButton` (envoyer entrées seulement) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GuestGroupingPanel` (siège 1/2/3 par convive) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CourseSequencer` (ordre entrée→plat→dessert) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableTransferDialog` (transférer commande table→table) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CartHoldMenu` (mise en attente panier) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HoldingCartsListDrawer` (paniers en attente) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ServiceChargeToggle` (frais de service groupe > 8) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CoverCountSelector` (déclaration nb couverts) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CartTimeline` (historique modif panier) — RBAC: 60 · 70 · 80 · 100

### 🧩 Modales encaissement

- ✅ `PaymentDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PaymentMethodPicker` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `AmountInput` (pad numérique tactile) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ChangeCalculator` (rendu monnaie espèces) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TipInput` (montant / % / arrondi) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitBillDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitByItem` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitByGuest` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitCustom` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscountDialog` (< 10%) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscountDialog` (> 10%) — RBAC: 60 · 70 · 80 · 100
- ✅ `RefundDialog` (avoir) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PreAuthDialog` (pré-autorisation CB Stripe Terminal) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardRedeemModal` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardIssuanceModal` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `LoyaltyPointsRedeemDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AgeVerificationModal` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AllergenAlertBanner` (bandeau rouge table allergique) — RBAC: ∀
- ⚫ `TenderInsertionOverlay` (attente TPE Stripe Terminal) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReceiptDeliveryDialog` (imprimer/email/SMS/QR) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PaymentReceiptSummary` (récap post-encaissement) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MealVoucherValidator` (validation carte titre-restaurant) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `InvoiceRequestModal` (client demande facture) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Table selector

- ✅ `TableSelector` (drawer bas) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `MiniFloorPlan` (mini-carte tables) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TablesListView` (vue alternative liste) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableSearchInput` (recherche par numéro) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WalkInFlashCreateButton` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TakeawayModeToggle` (mode à emporter sans table) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryModeToggle` (mode livraison) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Impression

- ✅ `TicketPrinterService` (service ESC/POS) — RBAC: — (service)
- ✅ `KitchenPrinterService` (fallback KDS) — RBAC: — (service)
- 🔧 `DigitalReceiptQR` (QR ticket dématérialisé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PrinterConfigModal` (paramètres imprimantes) — RBAC: 80 · 100
- ⚫ `PrinterStatusIndicator` (statut imprimante header) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

---

## 🖼️ Écran 1.2 — KDS (`/kds`)

### 🧩 Composants principaux

- ✅ `KdsHeader` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketGrid` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketCard` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketHeader` (table + timer) — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketItems` (liste plats) — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketFooter` (bump/recall) — RBAC: 20 · 60 · 70 · 100
- ✅ `BumpButton` — RBAC: 20 · 60 · 70 · 100
- ✅ `RecallButton` (long-press) — RBAC: 60 · 70 · 100
- 🔧 `BumpBarUsbListener` (bump bar physique) — RBAC: — (service)
- ⚫ `StationFilterTabs` (filtrer par station) — RBAC: 60 · 70 · 100
- ⚫ `ViewByPlateToggle` (vue par plat vs table) — RBAC: 60 · 70 · 100
- ⚫ `ViewByServiceToggle` (sur place/emporter/livraison) — RBAC: 60 · 70 · 100
- ⚫ `AllergenBadge` (badge critique) — RBAC: 20 · 60 · 70 · 100
- ⚫ `SpecialRequestHighlight` (surlignage "sans oignon") — RBAC: 20 · 60 · 70 · 100
- ⚫ `TicketExpandOverlay` (zoom ticket tactile) — RBAC: 20 · 60 · 70 · 100

### 🧩 Coordination

- ⚫ `ExpeditorView` (chef expeditor global) — RBAC: 60 · 70 · 100
- ⚫ `TableSyncPanel` (synchro sortie plats table) — RBAC: 60 · 70 · 100
- ⚫ `AllPlatesForTableGrouping` — RBAC: 60 · 70 · 100
- ⚫ `ServiceCallButton` (appeler serveur "plat prêt") — RBAC: 20 · 60 · 70 · 100
- ⚫ `PrepTimeEstimator` (IA temps préparation) — RBAC: 60 · 70 · 100
- ⚫ `KitchenIntercomWidget` (chat voice push-to-talk) — RBAC: 20 · 30 · 60 · 70 · 100
- ⚫ `StationCapacityBar` (charge par station) — RBAC: 60 · 70 · 100

### 🧩 Stats & alertes

- 🔧 `KdsFooter` (stats jour) — RBAC: 60 · 70 · 100
- ⚫ `AverageCookTimeWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PeakLoadIndicator` (pic de charge) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LateTicketAlarm` (alerte sonore ticket rouge) — RBAC: — (service)
- ⚫ `KdsShiftHandoverSummary` (récap fin shift) — RBAC: 60 · 70 · 100

### 🧩 Modes spéciaux

- ⚫ `KdsPrepListMode` (mode liste préparation matin) — RBAC: 60 · 70 · 100
- ⚫ `KdsInventoryCheckMode` (revue stock cuisine) — RBAC: 60 · 70 · 100
- ⚫ `KdsBrigadeChatMode` (chat cuisine interne) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsRecipeQuickView` (accès rapide fiche recette) — RBAC: 20 · 60 · 70 · 100

---

## 🖼️ Écran 1.3 — Plan de salle (`/floor-plan`)

### 🧩 Composants vue service

- ✅ `FloorPlanHeader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `FloorCanvas` (SVG interactif) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableRenderer` (SVG shape) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableChairs` (chaises visibles) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ZoneRenderer` (zones terrasse/salon) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableActionsMenu` (popup contextuel) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsQueue` (bas de page) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `TableStatusIndicator` (couleur selon durée) — RBAC: ∀
- ⚫ `CapacityIndicator` (jauge visuelle) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableDelayAlert` (table qui attend > X min) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableGuestInfoPopover` (hover client info) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ZoomFitControls` (zoom in/out/fit) — RBAC: ∀

### 🧩 Composants édition (RBAC 60+)

- ✅ `EditPanel` (drawer palette outils) — RBAC: 60 · 70 · 80 · 100
- ✅ `TableAddDialog` (ajouter table forme+capa) — RBAC: 60 · 70 · 80 · 100
- ✅ `ZoneAddDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `EditPanel > DeleteButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `EditPanel > ZoneLockToggle` — RBAC: 60 · 70 · 80 · 100
- ✅ `FloorPlanSaveButton` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanTemplateGallery` (templates bistrot/gastro/brasserie) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanImportWizard` (import DWG/PDF architecte) — RBAC: 80 · 100
- ⚫ `FloorPlanVersionHistory` (versions sauvegardées) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MultiFloorSelector` (étages 1/2/terrasse) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TableCombineTool` (fusionner 2 tables adjacentes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TableSplitTool` (séparer table double) — RBAC: 60 · 70 · 80 · 100

---

## 🖼️ Écran 1.4 — Bar (`/bar`)

### 🧩 Nouveaux composants dédiés bar

- 🔧 `WineDetailPanel` (fiche vin détaillée) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ✅ `KdsBarTab` (KDS bar spécifique) — RBAC: 30 · 60 · 70 · 100
- ⚫ `CocktailRecipeCard` (fiche cocktail avec dosages) — RBAC: 30 · 50 · 60 · 70 · 100
- ⚫ `WineListFilterPanel` (filtres cépage/région/prix) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `VintageStockTracker` (millésimes en stock) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `SommelierRecommendationEngine` (IA suggère vin) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `HappyHourActivator` (activer/désactiver happy hour) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `BarInventoryFastCount` (compte rapide bouteilles) — RBAC: 30 · 60 · 70 · 100

---

## 🖼️ Écran 1.5 — POS Mobile serveur (`/pos-mobile`)

### 🧩 Composants mobile-first

- 🔧 `MobilePosLayout` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `MobileCartSheet` (bottom sheet panier) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileMenuCarousel` (swipe catégories) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileProductBottomSheet` (options plat) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileTableSelectorSheet` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileQuickTipButtons` (tips arrondi) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HapticFeedbackController` (vibrations validation) — RBAC: — (service)

---

# 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

## 🖼️ Écran 2.1 — Liste réservations (`/reservations`)

### 🧩 Composants principaux

- ✅ `ReservationsHeader` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationDatePicker` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsFilters` (statut/service/canal) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsTable` (chronologique) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsListView` (vue alternative liste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsCalendarView` (vue calendrier mois) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationCard` (item liste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationsExportCSV` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReservationsBulkActions` (bulk annuler/rappeler) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AdvancedFilterDrawer` (nb couverts/allergies/VIP) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Création & édition résa

- 🔧 `NewReservationDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ClientSearchInput` (autocomplete CRM) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ClientQuickCreateForm` (créer client à la volée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DateTimePicker` (créneaux libres) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PartySizeSelector` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableAssignmentPicker` (auto/manuel) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `AllergyChecklistInput` (14 INCO) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `InternalNotesTextarea` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DepositToggle` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DepositAmountConfig` — RBAC: 60 · 70 · 80 · 100
- ⚫ `VipTagPicker` (tag client VIP) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `OccasionSelector` (anniversaire/mariage/repas d'affaires) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SeatingPreferenceInput` (préférence table cheminée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Édition résa existante

- 🔧 `ReservationDetailsDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationInfoTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationClientHistoryTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationAllergiesTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationCommunicationsTab` (SMS/email envoyés) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ **`WelcomeGuestButton` (bouton "Accueillir client" — CRITIQUE R2 bus)** — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationCancelDialog` (annuler + gérer acompte) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationRescheduleDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SendManualReminderButton` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `NoShowMarkButton` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationLogTimeline` (audit trail modifs) — RBAC: 60 · 70 · 80 · 100

### 🧩 Walk-in & liste d'attente

- 🔧 `WalkInFlashDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitlistQueue` (file d'attente sans table) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitlistEntryCard` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitEstimateCalculator` (temps attente estimé) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SmsCallReadyButton` (SMS "on vous attend") — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Groupes & privatisations

- ⚫ `GroupReservationWizard` (résa > 8 pers) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `SetMenuBuilder` (formule prépayée groupe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PrivatizationCalendar` (bloquer salle privée) — RBAC: 60 · 70 · 80 · 100
- ⚫ `GroupInvoicePreview` — RBAC: 60 · 70 · 80 · 100
- ⚫ `GroupPaymentTracker` (acompte/solde) — RBAC: 60 · 70 · 80 · 100

### 🧩 Rappels & no-show

- 🔧 `SmsReminderScheduler` — RBAC: — (service)
- 🔧 `EmailReminderScheduler` — RBAC: — (service)
- ⚫ `RemindersConfigPanel` (J-2 / J-1 / heures) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NoShowRiskDashboard` (clients à risque) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutoDepositRuleEditor` (règles acompte auto) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 2.2 — Booking widget public (`/[slug]/reservations`)

### 🧩 Composants publics (sans RBAC — public)

- ✅ `PublicBookingHeader` — RBAC: — (public)
- ✅ `AvailabilityCalendar` — RBAC: — (public)
- ✅ `PartyDetailsForm` — RBAC: — (public)
- ✅ `DepositCheckout` (Stripe Elements) — RBAC: — (public)
- ✅ `ConfirmationScreen` — RBAC: — (public)
- ⚫ `LanguageSwitcher` (FR/EN/DE/ES/IT) — RBAC: — (public)
- ⚫ `MenuPreviewSection` (aperçu menu du jour) — RBAC: — (public)
- ⚫ `RestaurantPhotosGallery` — RBAC: — (public)
- ⚫ `ReviewsWidget` (avis Google intégrés) — RBAC: — (public)
- ⚫ `AllergenPreDeclarationForm` — RBAC: — (public)
- ⚫ `AddToCalendarButton` (Apple/Google) — RBAC: — (public)
- ⚫ `ChangeOrCancelSelfService` (client change sa résa) — RBAC: — (public + token)
- ⚫ `WhatsappConfirmationOptIn` — RBAC: — (public)

---

# 🖥️ Zone 3 — MENU & CATALOGUE

## 🖼️ Écran 3.1 — Menu Builder (`/menu-builder`)

### 🧩 Composants édition

- ✅ `MenuBuilderHeader` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategorySidebar` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryDragDropList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryRenameInline` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryAddButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductListPanel` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductRow` (ligne tableau) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductAvailabilityToggle` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `ProductDuplicateButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductArchiveButton` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductBulkActions` (bulk publish/archive) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductSearchInput` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductImportCSV` — RBAC: 80 · 100
- ⚫ `ProductExportCSV` — RBAC: 60 · 70 · 80 · 100

### 🧩 Édition produit (fragmenté)

- ✅ `ProductEditDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > GeneralTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductPhotoUploader` (crop + optim) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > PricingTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `MultiPricingEditor` (heure creuse/pleine) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > ModifiersTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `ModifierGroupBuilder` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > RecipeTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `RecipeComposer` — RBAC: 60 · 70 · 80 · 100
- ✅ `IngredientSearchInput` — RBAC: 60 · 70 · 80 · 100
- ✅ `IngredientLine` (qté/unité/coût) — RBAC: 60 · 70 · 80 · 100
- ✅ `RecipeSummary` (coût/marge %) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > AllergensTab` (14 INCO) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > AvailabilityTab` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AvailabilityScheduleGrid` (par jour × créneau) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NutritionalValuesEditor` (kcal/protéines/glucides) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AiDescriptionGenerator` (rédiger description IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductTranslationsPanel` (traductions FR/EN/DE) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SeasonalToggle` (produit saisonnier avec période) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WinePairingSuggestionsEditor` — RBAC: 50 · 60 · 70 · 80 · 100

### 🧩 Historique & versioning

- 🔧 `MenuVersionHistory` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuVersionDiffViewer` (comparaison entre versions) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuRollbackButton` (restaurer version antérieure) — RBAC: 80 · 100
- ⚫ `MenuScheduleActivator` (publier menu automatiquement à date) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.2 — Menu Engineering (`/menu-engineering`)

- ✅ `EngineeringMatrix` (heatmap 4 quadrants) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductClassification` (Star/Puzzle/Plowhorse/Dog) — RBAC: 60 · 70 · 80 · 100
- 🔧 `AISuggestionsPanel` (repositionnement) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MonthlyReport` (export PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `HistoricalEvolutionChart` (évolution mensuelle par plat) — RBAC: 60 · 70 · 80 · 100
- ⚫ `RepricingSimulator` (impact prix simulé) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuMixAnalysis` (mix ventes par catégorie) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ContributionMarginChart` (marge contribution) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.3 — Menu digital (QR) — nouveau

- ⚫ `DigitalMenuEditor` — RBAC: 60 · 70 · 80 · 100
- ⚫ `QRCodeGenerator` (QR par table) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DigitalMenuPreview` (aperçu mobile) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DigitalMenuThemePicker` (couleurs/fonts client) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PhotoGalleryPerDish` (photos multiples par plat) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DietaryFilterConfig` (végé/vegan/sans gluten) — RBAC: 60 · 70 · 80 · 100
- ⚫ `OrderFromQrToggle` (activer commande depuis QR) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.4 — Promotions

- ✅ `PromotionsList` — RBAC: 60 · 70 · 80 · 100
- ✅ `PromotionEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `HappyHourScheduleEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `MenuDayFormulaBuilder` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PromoCodeGenerator` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PromoCodeUsageStats` — RBAC: 60 · 70 · 80 · 100
- ⚫ `BOGOBuilder` (Buy One Get One) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyOnlyPromoBuilder` (promo fidèles) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.5 — Bons cadeaux (nouveau)

- ⚫ `GiftCardsList` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardIssuanceForm` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardStatsWidget` (émis/utilisés/valeur) — RBAC: 60 · 70 · 80 · 100
- ⚫ `GiftCardExpiryConfig` — RBAC: 80 · 100
- ⚫ `GiftCardPublicPurchasePage` — RBAC: — (public)

---

# 🖥️ Zone 4 — CLIENTS & FIDÉLITÉ (CRM)

## 🖼️ Écran 4.1 — Liste clients (`/crm`)

- ✅ `CRMHeader` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMSearchInput` (fulltext) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SegmentsSidebar` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMList` (table paginée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMRow` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMBulkActions` — RBAC: 60 · 70 · 80 · 100
- ✅ `CRMImportCSVDialog` — RBAC: 80 · 100
- 🔧 `CRMExportDialog` (CSV/JSON) — RBAC: 80 · 100
- ⚫ `AdvancedSegmentBuilder` (règles dynamiques) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CustomerScoringWidget` (score fidélité IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MergeDuplicatesDialog` (fusionner doublons) — RBAC: 80 · 100

## 🖼️ Écran 4.2 — Fiche client détaillée

- ✅ `CRMDetailView` (drawer/route) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > InfoTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > PreferencesTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > HistoryTab` (timeline visites) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > LoyaltyTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `CRMDetailView > CommunicationsTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ClientAvatarUpload` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientNotesFeed` (fil de notes datées équipe) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientTagsPicker` (tags custom : "gastronome", "difficile") — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientCLVWidget` (Customer Lifetime Value) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ClientTimelineExport` (export historique complet) — RBAC: 80 · 100
- ⚫ `ClientBirthdayReminderBadge` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientPreferredServerAssignment` — RBAC: 60 · 70 · 80 · 100
- ⚫ `LinkedFamilyGuestsPanel` (conjoint/enfants) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientDocumentsUploader` (allergène doc médical) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.3 — Campagnes marketing (`/marketing`)

- ✅ `CampaignsList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignBuilder` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignTemplatePicker` — RBAC: 60 · 70 · 80 · 100
- ✅ `EmailWYSIWYGEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignAudienceSelector` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignSchedulerPicker` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignResultsPanel` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SMSCampaignBuilder` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ABTestConfigurator` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CampaignPerformanceComparison` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationsPanel` (workflows auto) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationTriggerPicker` (bus events) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationStepsBuilder` (SMS J+1 → email J+30) — RBAC: 60 · 70 · 80 · 100
- ⚫ `BirthdayAutomationTemplate` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WinbackAutomationTemplate` (client dormant) — RBAC: 60 · 70 · 80 · 100
- ⚫ `UnsubscribesList` (opt-out RGPD) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WhatsappBusinessConnector` — RBAC: 80 · 100
- ⚫ `EmailDeliverabilityMonitor` (bounce/spam) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.4 — Fidélité (nouveau `/loyalty`)

- 🔧 `LoyaltyProgramSettings` — RBAC: 80 · 100
- 🔧 `LoyaltyTierBuilder` (Bronze/Argent/Or/Platine) — RBAC: 80 · 100
- 🔧 `RewardsCatalog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RewardEditor` (créer récompense) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyDashboard` (KPIs programme) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyMembersList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyPointsAdjustmentTool` (ajustement manuel) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyDigitalCard` (vue client QR) — RBAC: — (public)
- ⚫ `LoyaltyReferralProgram` (parrainage) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyExpiryConfig` (expiration points) — RBAC: 80 · 100
- ⚫ `LoyaltyRedemptionHistory` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.5 — Avis & réputation (nouveau)

- ⚫ `ReviewsFeedGoogle` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewsFeedTheFork` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewsAggregatedDashboard` (Google + TF + Trip) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AIResponseGenerator` (rép. avis assistée IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NegativeReviewAlertPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewInviteEmailAutomation` (SMS post-visite) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SentimentAnalysisChart` — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 5 — STOCK & APPROVISIONNEMENT

## 🖼️ Écran 5.1 — Inventaire (`/inventory`)

- ✅ `InventoryHeader` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `InventoryTable` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `InventoryRow` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockStatusBadge` (normal/alerte/rupture) — RBAC: ∀
- ✅ `InventoryFilters` (catégorie/rupture/DLC) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockAdjustmentDialog` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `ProductStockCard` (détail) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockMovementsHistory` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `LotsActiveList` (traçabilité lots) — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard > CountStep` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard > DiscrepancyStep` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `BarcodeInput` (scan EAN) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MultiLocationStockPanel` (chambre froide/bar/réserve) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `StockTransferDialog` (transfert entre emplacements) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `InventoryHistoryChart` (évolution stock produit) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LowStockDashboard` (produits à commander) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `OverstockDashboard` (surstock à écouler) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ExpiringBatchesBoard` (lots à consommer) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `WasteRecordingForm` (déchet + raison) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WasteAnalyticsDashboard` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 5.2 — Réception marchandises

- ✅ `ReceptionDashboard` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DeliveryNotesQueue` (BL en attente) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DeliveryNoteEditor` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `LinesEditorGrid` (produits reçus) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `LotAssignmentInput` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscrepancyPanel` (auto-calc manquants) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PhotoBLUploader` (photo BL obligatoire) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SignaturePad` (signature réceptionniste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TraceabilityLabelPrinter` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TemperatureCheckAtReception` (temp produits froids) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `QualityInspectionChecklist` (contrôle qualité) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `RejectDeliveryDialog` (refus livraison) — RBAC: 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 5.3 — Fournisseurs (`/suppliers`)

- ✅ `SuppliersList` — RBAC: 60 · 70 · 80 · 100
- ✅ `SupplierEditor` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SupplierCatalogViewer` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PurchaseOrderBuilder` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SuggestedOrderPanel` (basé sur prévisions) — RBAC: 60 · 70 · 80 · 100
- ✅ `LineItemEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `OrderTotalSummary` — RBAC: 60 · 70 · 80 · 100
- ✅ `PoSendEmailDialog` — RBAC: 60 · 70 · 80 · 100
- 🔧 `MetroCatalogConnector` — RBAC: — (service)
- ⚫ `TransgourmetCatalogConnector` — RBAC: — (service)
- ⚫ `PomonaCatalogConnector` — RBAC: — (service)
- ⚫ `SysCoCatalogConnector` — RBAC: — (service)
- ⚫ `PriceComparisonTable` (multi-fournisseurs par produit) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierPerformanceCard` (délai livraison, écarts) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierNegotiationLog` (traces négos) — RBAC: 80 · 100
- ⚫ `RecurringOrdersEditor` (commandes récurrentes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierInvoicesInbox` (factures fournisseurs reçues) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 5.4 — DLC/DDM alertes (nouveau)

- ⚫ `ExpiryDashboard` (vue centralisée DLC) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ExpiryCalendarView` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `SuggestMenuDayFromExpiring` (IA suggestion) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MarkAsWastedWizard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DonationOfferToTGTG` (Too Good To Go) — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 6 — RESSOURCES HUMAINES

## 🖼️ Écran 6.1 — Staff (`/staff`)

- ✅ `StaffList` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffRow` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffAvatar` — RBAC: ∀
- ✅ `StaffMemberDetail` (drawer) — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > PersonalTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > ContractTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > CompetenciesTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > TrainingsTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > PayrollHistoryTab` — RBAC: 80 · 100
- ✅ `InviteEmployeeDialog` — RBAC: 80 · 100
- ✅ `StaffBulkImportCSV` — RBAC: 80 · 100
- 🔧 `EmployeeContractGenerator` — RBAC: 80 · 100
- 🔧 `ContractTemplatePicker` — RBAC: 80 · 100
- ⚫ `EmployeeContractSignYouSign` — RBAC: 80 · 100
- ⚫ `DPAEModal` (Déclaration Préalable Embauche) — RBAC: 80 · 100
- ⚫ `EmployeeIdCardGenerator` (carte pro PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeTrainingsScheduler` (formations obligatoires) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MedicalVisitTracker` (visites médicales) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WorkAccidentRecordForm` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ExitInterviewForm` (départ salarié) — RBAC: 80 · 100

## 🖼️ Écran 6.2 — Planning (`/planning`)

- ✅ `WeekPlanningGrid` — RBAC: 60 · 70 · 80 · 100
- ✅ `PlanningDayColumn` — RBAC: 60 · 70 · 80 · 100
- ✅ `ShiftBlock` (bloc shift dans cellule) — RBAC: 60 · 70 · 80 · 100
- ✅ `ShiftEditorDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `CopyWeekButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `LegalConstraintsChecker` (11h repos, 35h/sem) — RBAC: — (service)
- 🔧 `AIScheduleSuggestion` — RBAC: 60 · 70 · 80 · 100
- 🔧 `ShiftSwapRequestDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ShiftSwapApprovalQueue` — RBAC: 60 · 70 · 80 · 100
- ✅ `PublishScheduleDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MonthlyPlanningView` — RBAC: 60 · 70 · 80 · 100
- ⚫ `IndividualSchedulePrintout` (planning perso PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeAvailabilityInput` (dispos employé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HolidaysCalendarBlocker` — RBAC: 80 · 100
- ⚫ `ShiftTemplatesLibrary` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanningCostCalculator` (masse salariale du planning) — RBAC: 80 · 100
- ⚫ `AttendanceForecastOverlay` (superposition affluence prévue) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 6.3 — Timeclock (`/timeclock`)

- ✅ `ClockInScreen` (borne dédiée) — RBAC: — (auth PIN/NFC)
- ✅ `PinKeypad` — RBAC: — (auth)
- ✅ `NFCReaderListener` — RBAC: — (service)
- ✅ `TimeclockDashboard` (vue manager) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TimeclockDailyTable` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TimeclockCorrectDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `PinResetModal` — RBAC: 60 · 70 · 80 · 100
- ⚫ `QRClockInMobile` (pointage QR téléphone) — RBAC: — (auth)
- ⚫ `FacialRecognitionClockIn` (optionnel) — RBAC: — (auth)
- ⚫ `GeoFencedClockIn` (vérif géolocalisation) — RBAC: — (service)
- ⚫ `BreakTracker` (pause déjeuner obligatoire) — RBAC: — (service)
- ⚫ `OvertimeAlert` (heures sup atteintes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TimeclockWeeklyReport` — RBAC: 80 · 100

## 🖼️ Écran 6.4 — Congés & absences (`/leaves`)

- ✅ `LeavesHeader` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `LeaveRequestForm` (employé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `LeaveTypePicker` (CP/RTT/maladie/enfant malade) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `JustificatifUpload` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `LeavesApprovalQueue` (manager) — RBAC: 60 · 70 · 80 · 100
- 🔧 `LeavesCalendar` (vue équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LeaveBalanceWidget` (compteur CP/RTT) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AbsenceReplacementSuggestion` (qui remplacer) — RBAC: 60 · 70 · 80 · 100
- ⚫ `UnderStaffingAlertBanner` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AbsenceStatsPerEmployee` (taux absentéisme) — RBAC: 80 · 100

## 🖼️ Écran 6.5 — Recrutement (`/recruitment`)

- ✅ `CandidatesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CandidateDetailModal` — RBAC: 60 · 70 · 80 · 100
- ✅ `CandidateCVUpload` — RBAC: 60 · 70 · 80 · 100
- ✅ `InterviewNotesEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `EvaluationScoreCard` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PipelineKanban` — RBAC: 60 · 70 · 80 · 100
- ⚫ `JobPostingEditor` — RBAC: 80 · 100
- ⚫ `IndeedConnector` — RBAC: — (service)
- ⚫ `HelloWorkConnector` — RBAC: — (service)
- ⚫ `LinkedInJobsConnector` — RBAC: — (service)
- ⚫ `SchoolPartnersPortal` (écoles hôtelières) — RBAC: 80 · 100
- ⚫ `HireDecisionDialog` (embauche → génère contrat) — RBAC: 80 · 100
- ⚫ `RejectionEmailTemplate` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 6.6 — Communication interne (nouveau)

- ⚫ `TeamChatInterface` (chat équipe temps réel) — RBAC: ∀
- ⚫ `AnnouncementBoard` (annonces manager → équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AcknowledgmentTracker` (lu par tous) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PollsCreator` (sondage équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeFeedbackInbox` — RBAC: 80 · 100

## 🖼️ Écran 6.7 — Paie (`/payroll`)

- 🔧 `PayrollDashboard` — RBAC: 80 · 100
- 🔧 `PayrollGenerationMonthWizard` — RBAC: 80 · 100
- 🔧 `TipDistributionPanel` (pool tips) — RBAC: 60 · 70 · 80 · 100
- 🔧 `PayfitConnector` — RBAC: — (service)
- 🔧 `SilaeConnector` — RBAC: — (service)
- ⚫ `PayslipViewer` (bulletin PDF) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100 (le sien)
- ⚫ `PayrollDsnGeneration` — RBAC: 80 · 100
- ⚫ `PayrollJournalPreview` (avant validation) — RBAC: 80 · 100
- ⚫ `PayrollAdjustmentDialog` (prime/retenue) — RBAC: 80 · 100

---

# 🖥️ Zone 7 — FINANCE & COMPTABILITÉ

## 🖼️ Écran 7.1 — Dashboard finance (`/finance`)

- ✅ `FinanceOverview` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaDay` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaMonth` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > GrossMargin` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CashInDrawer` — RBAC: 60 · 70 · 80 · 100
- ✅ `RevenueChart` (line) — RBAC: 60 · 70 · 80 · 100
- ✅ `VATBreakdown` (ventilation 5.5/10/20) — RBAC: 60 · 70 · 80 · 100
- 🔧 `PeriodPicker` (day/week/month/year/custom) — RBAC: 60 · 70 · 80 · 100
- 🔧 `ComparisonToggle` (vs N-1) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CashFlowForecast` (J+7/J+30) — RBAC: 80 · 100
- ⚫ `ChargesVsBudgetChart` — RBAC: 80 · 100
- ⚫ `AnomalyAlertsWidget` (CA en baisse anormale) — RBAC: 80 · 100
- ⚫ `EBITDACalculator` — RBAC: 80 · 100
- ⚫ `BreakEvenAnalysisChart` (seuil rentabilité) — RBAC: 80 · 100

## 🖼️ Écran 7.2 — Caisse (`/cash`)

- ✅ `CashDrawerOpenDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DenominationBreakdownInput` (billets/pièces) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CashCountModal` (fermeture) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `DiscrepancyDisplay` (écart) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `CashMovementsLog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ManualCashMovementDialog` (retrait/apport) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SafeDepositTracker` (coffre) — RBAC: 80 · 100
- ⚫ `CashDropDialog` (dépôt banque) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CashierPerformanceReport` (écarts par caissier) — RBAC: 80 · 100

## 🖼️ Écran 7.3 — Banque (`/finance/bank`)

- ✅ `BankAccountsList` — RBAC: 80 · 100
- ✅ `BankConnectionCard` — RBAC: 80 · 100
- ✅ `BankConnectionStatusBadge` — RBAC: 80 · 100
- ✅ `BankReconnectButton` (OAuth) — RBAC: 80 · 100
- ✅ `TransactionsList` — RBAC: 80 · 100
- ✅ `TransactionReconciliationRow` — RBAC: 80 · 100
- 🔧 `ReconciliationAssistant` (matching auto) — RBAC: 80 · 100
- ⚫ `MultiBankAccountToggle` — RBAC: 80 · 100
- ⚫ `BankConnectionExpiryAlert` — RBAC: 80 · 100
- ⚫ `TransactionCategorizationRules` — RBAC: 80 · 100
- ⚫ `BankStatementImportOFX` — RBAC: 80 · 100

## 🖼️ Écran 7.4 — NF525 & fiscal (`/nf525`)

- ✅ `TicketZViewer` — RBAC: 60 · 70 · 80 · 100
- ✅ `TicketZDailyList` — RBAC: 60 · 70 · 80 · 100
- ✅ `FiscalChainAudit` — RBAC: 80 · 100
- ✅ `SealChainVisualizer` (chaîne SHA-256) — RBAC: 80 · 100
- ✅ `FECExportDialog` — RBAC: 80 · 100
- ✅ `FECPeriodPicker` — RBAC: 80 · 100
- 🔧 `PennylaneSyncPanel` — RBAC: 80 · 100
- ⚫ `CegidExportPanel` — RBAC: 80 · 100
- ⚫ `Sage100ExportPanel` — RBAC: 80 · 100
- ⚫ `QuickBooksSyncPanel` — RBAC: 80 · 100
- ⚫ `NF525CertificateViewer` (attestation) — RBAC: 80 · 100
- ⚫ `AnnualFiscalReportPDF` — RBAC: 80 · 100
- ⚫ `TicketZReprintDialog` — RBAC: 80 · 100

## 🖼️ Écran 7.5 — Facturation (`/invoicing`)

- ✅ `InvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceLinesGrid` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceLegalMentionsPreview` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoicePDFPreview` — RBAC: 60 · 70 · 80 · 100
- ✅ `EInvoicingPanel` — RBAC: 60 · 70 · 80 · 100
- ✅ `InboundInvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `OutboundInvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `LifecycleTracker` (émise→envoyée→reçue→validée→payée) — RBAC: 60 · 70 · 80 · 100
- ✅ `FormatSelector` (Factur-X/UBL/CII) — RBAC: 60 · 70 · 80 · 100
- 🔧 `ChorusProConnector` — RBAC: 80 · 100
- ⚫ `DunningQueue` (relances impayés) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DunningTemplateEditor` (templates relance) — RBAC: 80 · 100
- ⚫ `CreditNoteGenerator` (avoir) — RBAC: 60 · 70 · 80 · 100
- ⚫ `RefundIssuanceDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PaymentReceivedNotifier` (marquer payée) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 7.6 — Comptabilité analytique (nouveau)

- ⚫ `CostCentersEditor` (centres de coûts) — RBAC: 80 · 100
- ⚫ `AnalyticalPnLReport` (P&L par centre) — RBAC: 80 · 100
- ⚫ `BudgetPlanningWizard` (budget annuel) — RBAC: 100
- ⚫ `BudgetVsActualChart` — RBAC: 80 · 100
- ⚫ `MonthlyClosureChecklist` (fermeture mois) — RBAC: 80 · 100
- ⚫ `ProvisionsAutoCalculator` (URSSAF/TVA/IS) — RBAC: 80 · 100

---

# 🖥️ Zone 8 — CONFORMITÉ & SÉCURITÉ

## 🖼️ Écran 8.1 — HACCP (`/haccp`)

- ✅ `HaccpDashboard` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `HaccpKPITiles` (temp OK, NC ouvertes, tâches à faire) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureLogForm` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PhotoRequiredUploader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureZonePicker` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureHistoryChart` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureThresholdConfig` — RBAC: 60 · 70 · 80 · 100
- 🔧 `IoTSensorsPanel` — RBAC: 60 · 70 · 80 · 100
- 🔧 `TestoSensorConnector` — RBAC: — (service)
- ⚫ `SwissAvantSensorConnector` — RBAC: — (service)
- ⚫ `SensorBatteryLowAlert` — RBAC: 60 · 70 · 80 · 100
- ⚫ `SensorCalibrationTracker` — RBAC: 60 · 70 · 80 · 100
- ✅ `NonConformityForm` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `NonConformityList` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `NonConformityStatusChip` — RBAC: ∀
- ⚫ `NonConformityCloseDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RootCauseAnalysisEditor` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CorrectiveActionTracker` — RBAC: 60 · 70 · 80 · 100
- ✅ `TracabiliteEtiquettes` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `EtiquetteEditor` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `EtiquettePrintQueue` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReceptionMarchandises` (aussi zone 5) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HaccpMonthlyReport` — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpAuditPrepDashboard` (avant contrôle DDCCRF) — RBAC: 80 · 100
- ⚫ `HaccpChecklistLibrary` — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpTasksScheduler` (nettoyage, calibrage récurrents) — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpTaskCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 8.2 — Allergènes (`/allergens`)

- ✅ `AllergenMatrix` — RBAC: 60 · 70 · 80 · 100
- ✅ `AllergenChecklistPerProduct` — RBAC: 60 · 70 · 80 · 100
- 🔧 `AllergenPublicSheet` (PDF vitrine) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AllergenAlertConfig` (config alertes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CrossContaminationWarnings` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 8.3 — RGPD (`/rgpd`)

- ✅ `TreatmentsRegister` — RBAC: 80 · 100
- ✅ `RightToBeForgottenModal` — RBAC: 80 · 100
- ✅ `DataExportRequestModal` — RBAC: 80 · 100
- ✅ `ConsentTrackerPerClient` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `CookieBannerConfig` — RBAC: 80 · 100
- ⚫ `GDPRRequestsInbox` (demandes clients) — RBAC: 80 · 100
- ⚫ `DPOContactPanel` — RBAC: 80 · 100
- ⚫ `DataBreachIncidentForm` (déclaration violation) — RBAC: 100
- ⚫ `PrivacyPolicyEditor` — RBAC: 100

## 🖼️ Écran 8.4 — Registre du personnel (`/hr/registry`)

- 🔧 `PersonnelRegistryView` — RBAC: 80 · 100
- 🔧 `PersonnelRegistryPDFExport` — RBAC: 80 · 100
- ⚫ `PersonnelRegistryChangesHistory` (immuable) — RBAC: 80 · 100

## 🖼️ Écran 8.5 — Audits externes (nouveau)

- ⚫ `ExternalAuditsPlanning` (calendrier audits DDCCRF/URSSAF) — RBAC: 80 · 100
- ⚫ `AuditDocumentsRepository` — RBAC: 80 · 100
- ⚫ `AuditReportUpload` — RBAC: 80 · 100
- ⚫ `ComplianceScoreDashboard` — RBAC: 80 · 100
- ⚫ `ISO22000PrepChecklist` (option premium) — RBAC: 80 · 100

---

# 🖥️ Zone 9 — FACILITY & MAINTENANCE

## 🖼️ Écran 9.1 — Équipements (nouveau `/equipments`)

- ⚫ `EquipmentsList` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentCard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentDetail` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentPhotoGallery` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentWarrantyTracker` — RBAC: 80 · 100
- ⚫ `EquipmentQRCodeGenerator` (QR physique à coller) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EquipmentSuppliersDirectory` — RBAC: 80 · 100
- ⚫ `EquipmentDocumentsUploader` (factures/garanties) — RBAC: 80 · 100
- ⚫ `MaintenanceScheduler` (préventive) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceCalendar` — RBAC: 60 · 70 · 80 · 100
- 🔧 `MaintenanceRequestForm` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MaintenanceRequestsList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceRequestDetail` (statut/photos/coût) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceProviderContactPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PreventiveMaintenanceReminders` — RBAC: 60 · 70 · 80 · 100
- ⚫ `EquipmentCostHistoryChart` — RBAC: 80 · 100

## 🖼️ Écran 9.2 — Consommations (nouveau)

- ⚫ `EnergyDashboard` (Linky/Enedis) — RBAC: 80 · 100
- ⚫ `WaterConsumptionTracker` — RBAC: 80 · 100
- ⚫ `GasConsumptionTracker` — RBAC: 80 · 100
- ⚫ `EnergyAnomalyDetector` — RBAC: 80 · 100
- ⚫ `MonthlyEnergyReport` — RBAC: 80 · 100

## 🖼️ Écran 9.3 — Nettoyage (nouveau)

- ⚫ `CleaningSchedulesDashboard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningChecklistTemplates` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CleaningOpeningChecklist` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningClosingChecklist` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PhotoProofRequired` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningComplianceScore` — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 10 — ANALYTICS & BI

## 🖼️ Écran 10.1 — Dashboard direction (`/dashboard`)

- ✅ `KPIStripHeader` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaDay` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CoverCount` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > AverageCheck` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > GrossMargin` — RBAC: 80 · 100
- ✅ `RevenueEvolutionChart` (Area) — RBAC: 60 · 70 · 80 · 100
- ✅ `TopProductsChart` (Horizontal bar) — RBAC: 60 · 70 · 80 · 100
- 🔧 `OccupancyHeatmap` (jours × créneaux) — RBAC: 60 · 70 · 80 · 100
- 🔧 `StaffPerformancePanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CategoryMixDoughnut` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PaymentMethodsBreakdown` — RBAC: 60 · 70 · 80 · 100
- ⚫ `NewVsReturningCustomers` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WasteRateWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AverageServiceTimeWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MultiEstablishmentToggle` (groupe) — RBAC: 80 · 100
- ⚫ `MultiEstablishmentComparison` — RBAC: 80 · 100
- ⚫ `GroupConsolidatedPnL` — RBAC: 80 · 100

## 🖼️ Écran 10.2 — Reports (`/reports`)

- 🔧 `ReportsCatalog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReportCard` (item catalogue) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ScheduledReportsSetup` — RBAC: 80 · 100
- ⚫ `DailyReportEmailAutoSender` — RBAC: — (service)
- ⚫ `MonthlyReportPDFBuilder` — RBAC: 80 · 100
- ⚫ `CustomReportBuilder` (drag & drop widgets) — RBAC: 80 · 100
- ⚫ `ReportSharingSettings` (envoyer au comptable) — RBAC: 80 · 100

## 🖼️ Écran 10.3 — Cohortes & rétention (nouveau)

- ⚫ `CohortsTable` (acquisition par mois × rétention M+1/M+3/M+6) — RBAC: 80 · 100
- ⚫ `RetentionCurveChart` — RBAC: 80 · 100
- ⚫ `ChurnAnalysisPanel` — RBAC: 80 · 100
- ⚫ `CLVBySegmentChart` — RBAC: 80 · 100

## 🖼️ Écran 10.4 — Analyse fréquentation (nouveau)

- ⚫ `HourlyOccupancyHeatmap` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WeatherImpactChart` — RBAC: 60 · 70 · 80 · 100
- ⚫ `EventsImpactCorrelation` (match/concert) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SeasonalityChart` (année N vs N-1) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 10.5 — Data exports (`/data`)

- ✅ `OrdersCSVExport` — RBAC: 80 · 100
- ✅ `ClientsCSVExport` — RBAC: 80 · 100
- 🔧 `InventoryCSVExport` — RBAC: 80 · 100
- ⚫ `GraphQLAPIExplorer` (BI externe Metabase) — RBAC: 80 · 100
- ⚫ `APIKeysManager` — RBAC: 100

---

# 🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)

## 🖼️ Écran 11.1 — Oracle chat (`/intelligence`)

- 🔧 `OracleChatWindow` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `MessageThread` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `UserMessageBubble` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `AssistantMessageBubble` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `MessageInput` (textarea + micro dictée) — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `SourcesPanel` (citations) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `QuickSuggestionsBar` (prompts fréquents) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ConversationsHistorySidebar` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ConversationExportButton` (PDF/copy) — RBAC: 60 · 70 · 80 · 100
- ⚫ `VoiceInputController` (dictée vocale) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ChatContextSelector` (scope : ventes / stocks / RH) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ChatFileUploader` (analyser doc uploadé) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.2 — Insights proactifs

- ⚫ `ProactiveInsightsPanel` (side dashboard) — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightCard` — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightDismissAction` — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightDeepDiveModal` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.3 — Prédictions (nouveau)

- ⚫ `ForecastingDashboard` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AttendanceForecastChart` (J+7) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CategorySalesForecast` — RBAC: 60 · 70 · 80 · 100
- ⚫ `StockRuptureForecast` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WeatherWidget` (impact météo) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuDaySuggestion` (IA suggère menu jour) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ChurnRiskCustomersList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RelanceTargetingWizard` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.4 — Détection anomalies (nouveau)

- 🔧 `AnomalyFeedDashboard` — RBAC: 80 · 100
- ⚫ `AnomalyCard` (IoT hors seuil, CA baisse, void abusifs) — RBAC: 80 · 100
- ⚫ `FraudDetectionAlerts` (annulations excessives) — RBAC: 80 · 100
- ⚫ `AnomalyRulesEditor` — RBAC: 100

## 🖼️ Écran 11.5 — Assistant vocal (nouveau)

- ⚫ `VoiceAssistantOverlay` (déjà scaffolded) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoicePushToTalkButton` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceCommandsDictionary` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceReceiverKitchen` (cuisine reçoit ordre vocal) — RBAC: 20 · 60 · 70 · 100

---

# 🖥️ Zone 12 — INTÉGRATIONS

## 🖼️ Écran 12.1 — Marketplace connecteurs (`/integrations`)

- 🔧 `ConnectorsMarketplace` — RBAC: 80 · 100
- 🔧 `ConnectorCategoryTabs` — RBAC: 80 · 100
- ✅ `ConnectorCard` — RBAC: 80 · 100
- ✅ `ConnectorStatusBadge` — RBAC: 80 · 100
- 🔧 `ConnectorSetupWizard` — RBAC: 80 · 100
- 🔧 `ConnectorOAuthStep` — RBAC: 80 · 100
- 🔧 `ConnectorConfigStep` — RBAC: 80 · 100
- 🔧 `ConnectorTestConnectionStep` — RBAC: 80 · 100
- 🔧 `ConnectorActivationStep` — RBAC: 80 · 100
- ⚫ `ConnectorHealthMonitor` — RBAC: 80 · 100
- ⚫ `ConnectorLogsViewer` — RBAC: 80 · 100
- ⚫ `ConnectorRetryFailedSync` — RBAC: 80 · 100
- ⚫ `ConnectorDisconnectDialog` — RBAC: 80 · 100
- ⚫ `WebhookBuilder` (créer webhook custom) — RBAC: 100
- ⚫ `APIKeysManager` — RBAC: 100
- ⚫ `SandboxModeToggle` (test connecteur) — RBAC: 80 · 100

## 🖼️ Écran 12.2 — Livraison / plateformes (nouveau)

- ⚫ `DeliveryOrdersInbox` (Deliveroo/UberEats commandes) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryOrderCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AcceptRejectDeliveryOrderButtons` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryPlatformStatusPanel` (temps livraison réel) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryMenusSyncPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `DeliveryCommissionsSummary` — RBAC: 80 · 100

---

# 🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT

## 🖼️ Écran 13.1 — Paramètres généraux (`/settings`)

- ✅ `SettingsNavigation` — RBAC: 80 · 100
- ✅ `EstablishmentForm` — RBAC: 80 · 100
- ✅ `SiretAutoLookupInput` (INSEE) — RBAC: 80 · 100
- ✅ `OpeningHoursEditor` — RBAC: 80 · 100
- ✅ `HolidayCalendarEditor` — RBAC: 80 · 100
- ✅ `FiscalConfigPanel` — RBAC: 80 · 100
- ⚫ `SpecialEventsCalendar` (privatisations récurrentes) — RBAC: 80 · 100
- ⚫ `TimezoneSelector` — RBAC: 100
- ⚫ `LanguageDefaultPicker` — RBAC: 80 · 100
- ⚫ `CurrencyConfigPanel` (multi-devise groupes) — RBAC: 100

## 🖼️ Écran 13.2 — Apparence & branding

- ✅ `BrandingPanel` — RBAC: 80 · 100
- ✅ `LogoUploader` — RBAC: 80 · 100
- ✅ `ColorPicker > PrimaryColor` — RBAC: 80 · 100
- ✅ `ColorPicker > AccentColor` — RBAC: 80 · 100
- ✅ `ColorPicker > DarkBackgroundColor` — RBAC: 80 · 100
- ✅ `FontPicker > BrandFont` — RBAC: 80 · 100
- ✅ `FontPicker > UiFont` — RBAC: 80 · 100
- ✅ `LivePreviewPanel` (splash/POS/factures) — RBAC: 80 · 100
- ✅ `SplashScreenToggle` — RBAC: 80 · 100
- ✅ `BrandImportWizard` (extraction URL site) — RBAC: 80 · 100
- ⚫ `CustomCssEditor` (avancé — code CSS) — RBAC: 100
- ⚫ `EmailTemplatesEditor` — RBAC: 80 · 100
- ⚫ `PrintTemplatesEditor` (tickets/factures) — RBAC: 80 · 100
- ⚫ `WhiteLabelDomainWizard` (pos.monresto.fr) — RBAC: 100
- ⚫ `BrandGuidelinesExport` (PDF charte) — RBAC: 80 · 100

## 🖼️ Écran 13.3 — Utilisateurs & rôles

- ✅ `UsersList` — RBAC: 80 · 100
- ✅ `UserRow` — RBAC: 80 · 100
- ✅ `UserStatusBadge` — RBAC: 80 · 100
- ✅ `InviteUserDialog` — RBAC: 80 · 100
- ✅ `UserDeactivateDialog` — RBAC: 80 · 100
- ✅ `UserPinResetDialog` — RBAC: 80 · 100
- ✅ `RolesPermissionsPanel` — RBAC: 100
- ✅ `RolesList` — RBAC: 100
- ✅ `PermissionsMatrix` (rôles × actions) — RBAC: 100
- ✅ `RoleLabelsCustomizer` (renommer libellés) — RBAC: 100
- 🔧 `PermissionOverrideDialog` (autoriser action à un rôle) — RBAC: 100
- ⚫ `CustomRoleBuilder` (créer rôle sur-mesure) — RBAC: 100
- ⚫ `RoleClonerButton` — RBAC: 100
- ⚫ `RBACAuditTrail` (qui a changé quoi) — RBAC: 100
- ⚫ `RBACPresetTemplates` (bistrot/gastro/brasserie) — RBAC: 100
- ⚫ `AccessTestSimulator` ("Si je suis serveur, puis-je annuler ?") — RBAC: 80 · 100
- ⚫ `TwoFactorAuthConfig` (par utilisateur) — RBAC: 80 · 100

## 🖼️ Écran 13.4 — Notifications

- 🔧 `NotificationChannelsConfig` — RBAC: 80 · 100
- ✅ `PushSubscriptionManager` — RBAC: ∀
- 🔧 `NotificationRulesByRole` — RBAC: 80 · 100
- 🔧 `NotificationRulesByEvent` — RBAC: 80 · 100
- ⚫ `QuietHoursConfig` — RBAC: ∀
- ⚫ `NotificationHistoryLog` — RBAC: 80 · 100
- ⚫ `TestNotificationSender` — RBAC: 80 · 100
- ⚫ `SlackIntegrationConfig` — RBAC: 80 · 100
- ⚫ `TeamsIntegrationConfig` — RBAC: 80 · 100

## 🖼️ Écran 13.5 — Facturation SaaS (côté client)

- ✅ `SubscriptionSummary` — RBAC: 80 · 100
- ✅ `PlanBadge` — RBAC: 80 · 100
- ✅ `NextRenewalCard` — RBAC: 80 · 100
- ✅ `InvoicesHistory` — RBAC: 80 · 100
- ✅ `InvoiceDownloadButton` — RBAC: 80 · 100
- ⚫ `PlanChangeDialog` (upgrade/downgrade) — RBAC: 100
- ⚫ `StripePortalRedirect` — RBAC: 100
- ⚫ `SeatsUsageWidget` (X/Y utilisateurs) — RBAC: 80 · 100
- ⚫ `AddonsMarketplace` (fonctions premium) — RBAC: 100
- ⚫ `UsageAnalyticsPanel` (utilisation modules) — RBAC: 80 · 100

## 🖼️ Écran 13.6 — Multi-établissements (nouveau)

- ⚫ `EstablishmentsSwitcher` — RBAC: 80 · 100
- ⚫ `GroupConsolidatedDashboard` — RBAC: 100
- ⚫ `EstablishmentComparisonChart` — RBAC: 100
- ⚫ `SharedStaffPoolManager` (staff partagé) — RBAC: 100
- ⚫ `SharedSuppliersManager` — RBAC: 100
- ⚫ `IntercompanyTransfersLog` — RBAC: 100
- ⚫ `GroupBillingCentralization` — RBAC: 100
- ⚫ `HierarchicalRolesConfig` (directeur groupe > directeur étab) — RBAC: 100

---

# 🖥️ Zone 14 — MOBILE COMPANION (nouveau)

## 🖼️ Écran 14.1 — App staff (Expo)

- ⚫ `StaffMobileHome` (dashboard perso) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyScheduleWeekView` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyClockInWidget` (pointage NFC/QR) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyTipsWidget` (pool + individuel) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyLeaveBalanceCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyPayslipsList` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ShiftSwapRequestMobile` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TeamChatMobile` — RBAC: ∀
- ⚫ `AnnouncementsInboxMobile` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 14.2 — App manager mobile

- ⚫ `ManagerMobileHome` (KPIs jour) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LiveOccupancyWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `NotificationsCenterMobile` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AlertsInboxMobile` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ApprovalsInboxMobile` (leaves/swaps) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MobileVoidsAuthDialog` (autoriser void à distance) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 14.3 — App KDS tablette (Expo)

- ⚫ `KdsTabletApp` — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsTabletTicketCard` (optimisée touch) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsSwipeGestures` (swipe → bump) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsAudioAlertsNative` — RBAC: — (service)

## 🖼️ Écran 14.4 — App caisse iPad (Expo)

- ⚫ `PosIpadApp` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PosIpadOfflineIndicator` — RBAC: ∀
- ⚫ `PosIpadPrinterBluetoothManager` — RBAC: — (service)
- ⚫ `PosIpadStripeReaderNative` — RBAC: — (service)

---

# 🖥️ Zone 15 — SITE WEB PUBLIC (nouveau)

## 🖼️ Écran 15.1 — Landing publique

- ⚫ `PublicLandingHero` — RBAC: — (public)
- ⚫ `PublicMenuPreview` — RBAC: — (public)
- ⚫ `PublicPhotosGallery` — RBAC: — (public)
- ⚫ `PublicReviewsWidget` — RBAC: — (public)
- ⚫ `PublicOpeningHoursWidget` — RBAC: — (public)
- ⚫ `PublicMapEmbed` — RBAC: — (public)
- ⚫ `PublicBookingCTA` — RBAC: — (public)
- ⚫ `PublicSocialMediaLinks` — RBAC: — (public)

## 🖼️ Écran 15.2 — Menu digital public

- ⚫ `PublicMenuHeader` — RBAC: — (public)
- ⚫ `PublicMenuCategoryNav` — RBAC: — (public)
- ⚫ `PublicMenuDishCard` — RBAC: — (public)
- ⚫ `PublicMenuAllergenFilter` — RBAC: — (public)
- ⚫ `PublicMenuDietaryFilter` — RBAC: — (public)
- ⚫ `PublicMenuLanguageSwitcher` — RBAC: — (public)
- ⚫ `PublicMenuAllergenDisclaimer` — RBAC: — (public)

## 🖼️ Écran 15.3 — Click & Collect public

- ⚫ `CollectMenuList` — RBAC: — (public)
- ⚫ `CollectCartDrawer` — RBAC: — (public)
- ⚫ `CollectSlotPicker` (créneaux retrait) — RBAC: — (public)
- ⚫ `CollectPaymentStripe` — RBAC: — (public)
- ⚫ `CollectConfirmationScreen` — RBAC: — (public)
- ⚫ `CollectStatusTracking` (préparation/prêt) — RBAC: — (public)

## 🖼️ Écran 15.4 — Gift cards public

- ⚫ `GiftCardPurchasePage` — RBAC: — (public)
- ⚫ `GiftCardAmountPicker` — RBAC: — (public)
- ⚫ `GiftCardRecipientForm` (email destinataire) — RBAC: — (public)
- ⚫ `GiftCardPaymentStripe` — RBAC: — (public)
- ⚫ `GiftCardDeliveryConfirmation` — RBAC: — (public)

---

# 🖥️ Zone 16 — TRANSVERSES / DESIGN SYSTEM

## 🧩 Layout & navigation

- ✅ `PageLayout` — RBAC: — (structural)
- ✅ `PageHeader` — RBAC: — (structural)
- ✅ `DashboardLayout` — RBAC: — (structural)
- ✅ `SplitLayout` — RBAC: — (structural)
- ✅ `GridLayout` — RBAC: — (structural)
- ✅ `Sidebar` — RBAC: — (structural)
- ✅ `DesktopSidebar` — RBAC: — (structural)
- ✅ `DesktopTopbar` — RBAC: — (structural)
- ✅ `SidebarBranding` — RBAC: — (structural)
- ✅ `SidebarNavigation` — RBAC: filtré par level user
- ✅ `SidebarQuickActions` — RBAC: filtré par level user
- ✅ `SidebarProfile` — RBAC: ∀
- ✅ `MobileHeader` — RBAC: — (structural)
- ✅ `MobileNavBar` — RBAC: — (structural)
- ✅ `Header` — RBAC: — (structural)

## 🧩 Overlays

- ✅ `Modal` — RBAC: — (structural)
- ✅ `Dialog` — RBAC: — (structural)
- ✅ `BottomSheet` (drawer mobile) — RBAC: — (structural)
- ✅ `Toast` — RBAC: — (structural)
- ✅ `NotificationPanel` — RBAC: ∀
- ✅ `CommandModal` (Cmd+K) — RBAC: ∀
- ✅ `TutorialOverlay` — RBAC: ∀
- ✅ `TutorialBubble` — RBAC: ∀
- ✅ `TrainingOverlay` — RBAC: ∀

## 🧩 États

- ✅ `EmptyState` — RBAC: — (structural)
- ✅ `Skeleton` — RBAC: — (structural)
- ✅ `LoadingState` — RBAC: — (structural)
- ✅ `Spinner` — RBAC: — (structural)
- ✅ `ErrorBoundary` — RBAC: — (structural)
- ⚫ `NetworkOfflineState` (message pas de réseau) — RBAC: ∀

## 🧩 Data display

- ✅ `StatCard` — RBAC: dépend du contenu
- ✅ `PremiumCard` — RBAC: dépend du contenu
- ✅ `GlassCard` — RBAC: dépend du contenu
- ✅ `ContentSection` — RBAC: — (structural)
- ✅ `SectionHeader` — RBAC: — (structural)
- ✅ `PageHeaderWithDocs` — RBAC: — (structural)
- ✅ `StatusBadge` — RBAC: ∀
- ✅ `Chip` — RBAC: ∀
- ✅ `Badge` — RBAC: ∀
- ✅ `Avatar` — RBAC: ∀

## 🧩 Forms

- ✅ `Input` — RBAC: — (structural)
- ✅ `Select` — RBAC: — (structural)
- ✅ `PremiumSelect` — RBAC: — (structural)
- ✅ `SearchInput` — RBAC: — (structural)
- ✅ `QuantitySelector` — RBAC: — (structural)
- ✅ `DateNavigator` — RBAC: — (structural)
- ✅ `TimePicker` — RBAC: — (structural)
- ✅ `FilterBar` — RBAC: — (structural)
- ✅ `ToolbarTabs` — RBAC: — (structural)
- ✅ `Button` — RBAC: — (structural)
- ✅ `ActionToolbar` — RBAC: — (structural)
- ✅ `Feedback` (like/dislike) — RBAC: ∀
- ⚫ `AutocompleteInput` (générique) — RBAC: — (structural)
- ⚫ `RichTextEditor` (générique) — RBAC: — (structural)
- ⚫ `MultiFileUploader` — RBAC: — (structural)

## 🧩 Sécurité & sessions

- ✅ `SovereignShield` — RBAC: — (service)
- ✅ `SovereignLock` — RBAC: — (service)
- ✅ `SovereignLockout` — RBAC: — (service)
- ✅ `SecurityPinModal` — RBAC: — (auth)
- ✅ `ImpersonationBanner` — RBAC: — (superadmin)
- ✅ `ConnectivityBanner` — RBAC: ∀
- ✅ `AlertSync` (sync IoT) — RBAC: — (service)
- ✅ `NeuralShield` — RBAC: — (service)

## 🧩 Branding

- ✅ `SplashScreen` — RBAC: ∀
- ✅ `SplashGate` — RBAC: — (service)
- ✅ `ThemeApplicator` — RBAC: — (service)
- ⚫ `LogoRenderer` (générique svg/png) — RBAC: — (structural)

## 🧩 Launchpad

- ✅ `AppLaunchpad` — RBAC: filtré par level
- ✅ `LaunchpadStatusHub` — RBAC: filtré par level
- ✅ `GlobalFAB` — RBAC: filtré par level

## 🧩 Media

- ✅ `CameraCapture` — RBAC: — (structural)
- ✅ `VisionScanner` — RBAC: — (service IA)
- ✅ `AmbientAudio` — RBAC: — (service)
- ⚫ `AudioRecorder` (dictée) — RBAC: — (structural)
- ⚫ `VideoPlayer` (tutos in-app) — RBAC: — (structural)

## 🧩 Charts (Recharts)

- ⚫ `LineChartComponent` — RBAC: — (structural)
- ⚫ `BarChartComponent` — RBAC: — (structural)
- ⚫ `AreaChartComponent` — RBAC: — (structural)
- ⚫ `PieChartComponent` — RBAC: — (structural)
- ⚫ `HeatmapComponent` — RBAC: — (structural)
- ⚫ `SparklineComponent` — RBAC: — (structural)
- ⚫ `RadarChartComponent` — RBAC: — (structural)

## 🧩 Fleet (opérateur MCC — hors RBAC tenant)

- ✅ `FleetContext` — MCC uniquement (hors RBAC tenant)
- ✅ `AppLaunchpad` (variante MCC) — MCC uniquement
- ✅ `DocumentationPortal` — MCC uniquement

---

# 📊 Statistiques composants restaurant

| Zone | Écrans | ✅ | 🔧 | ⚫ | Total |
|------|:------:|:--:|:--:|:-:|:-----:|
| 1. Service (POS/KDS/Floor/Bar/Mobile) | 5 | 42 | 8 | 47 | **97** |
| 2. Réservations & Accueil | 2 | 20 | 8 | 25 | **53** |
| 3. Menu & Catalogue | 5 | 24 | 5 | 30 | **59** |
| 4. Clients & Fidélité | 5 | 21 | 5 | 45 | **71** |
| 5. Stock & Approvisionnement | 4 | 24 | 6 | 30 | **60** |
| 6. RH | 7 | 24 | 12 | 45 | **81** |
| 7. Finance | 6 | 30 | 5 | 33 | **68** |
| 8. Conformité | 5 | 15 | 3 | 25 | **43** |
| 9. Facility | 3 | 0 | 1 | 26 | **27** |
| 10. Analytics & BI | 5 | 5 | 3 | 30 | **38** |
| 11. Intelligence & IA | 5 | 0 | 6 | 26 | **32** |
| 12. Intégrations | 2 | 2 | 6 | 14 | **22** |
| 13. Paramétrage | 6 | 25 | 4 | 24 | **53** |
| 14. Mobile companion | 4 | 0 | 0 | 21 | **21** |
| 15. Site web public | 4 | 0 | 0 | 24 | **24** |
| 16. Transverses (design system) | — | 45 | 0 | 12 | **57** |
| **TOTAL** | **68 écrans** | **277** | **72** | **457** | **806** |

---

# 🎯 Priorités refonte UI par tranche

## 🚨 Tranche 1 — CRITIQUES avant refonte (bloquants métier)

1. ⚫ **`WelcomeGuestButton`** (bus R2 — allergènes) — RBAC: 20+
2. ⚫ **`AllergenAlertBanner`** (POS) — RBAC: ∀
3. ⚫ **`AgeVerificationModal`** — RBAC: 60+
4. 🔧 **`PhysicalInventoryWizard`** (inventaires physiques) — RBAC: 40+
5. ⚫ **`CashFlowForecast`** — RBAC: 80+
6. ⚫ **`WasteRecordingForm`** — RBAC: 20+

## 🎨 Tranche 2 — À polir pendant la refonte

1. `GuestGroupingPanel` (POS — siège 1/2/3)
2. `ViewByPlateToggle` (KDS)
3. `CRMDetailView > CommunicationsTab`
4. `CustomRoleBuilder` (settings RBAC)
5. `AutomationsPanel` (marketing workflows)
6. `ExpiryDashboard` (DLC alertes)

## 🆕 Tranche 3 — Nouveaux modules refonte

1. **Zone 11 IA** : `OracleChatWindow` + `ProactiveInsightsPanel` + `ForecastingDashboard`
2. **Zone 12 Livraison** : `DeliveryOrdersInbox` + Deliveroo/UberEats connecteurs
3. **Zone 14 Mobile** : app Expo staff + manager + KDS tablette
4. **Zone 15 Public** : landing + menu digital + click & collect

## 🏗️ Tranche 4 — Extensions groupe (multi-établissements)

1. Zone 13.6 — `EstablishmentsSwitcher` + `GroupConsolidatedDashboard`
2. `SharedStaffPoolManager` · `SharedSuppliersManager`
3. `HierarchicalRolesConfig`

---

## 🎨 Principes UX pour la refonte

### Cohérence design tokens
- Toutes les couleurs via `var(--surface-*)`, `var(--action-*)`, `var(--text-*)`
- Dark mode via `[data-theme="dark"]` + `prefers-color-scheme`
- Fonts `next/font/google` (Inter + Cormorant + JetBrains Mono)
- Framer Motion pour animations riches, CSS pour micro-transitions

### Priorités device
1. **iPad landscape** — cible principale (POS, KDS, plan de salle, réservations)
2. **Desktop 1440+** — cible secondaire (analytics, admin, RH, compta)
3. **Mobile 375+** — cible tertiaire (dashboards, notifications, staff app)
4. **TV 32-55"** — cible KDS uniquement

### Ergonomie tactile
- Touch target min 44×44 pt
- Gestures : swipe (delete/mark), long-press (recall), pinch (zoom)
- Feedback haptique iOS via Web Vibration API
- Support bump bar physique USB (KDS)

### Accessibilité WCAG 2.1 AA
- Contraste ≥ 4.5:1 texte / fond
- Navigation clavier complète (Tab / Enter / Esc)
- Aria-labels sur tous les composants interactifs
- Support VoiceOver / TalkBack (mobile companion)
- Respect `prefers-reduced-motion`

### RBAC visuel
- Composants non-accessibles masqués (pas grisés)
- Actions non-autorisées : bouton absent (pas d'error message)
- Sauf actions rares : bouton avec badge cadenas + tooltip "Requiert manager"

---

# 🔍 Dette cachée & angles morts
> Audit complémentaire · 2026-08-14 · Base : 806 composants · 68 écrans · 8 verticales · 192 fichiers de test
>
> **Légende sévérité** : 🔴 P0 bloquant légal/sécurité · 🟠 P1 bloquant client · 🟡 P2 dette structurelle · 🔵 P3 nice-to-have

---

## 📌 Partie 1 — Manques déjà identifiés dans la roadmap (consolidé priorisé)

### 1.1 Les 5 bloquants absolus (correction : 4 → 5)

| Sév. | Item | Motif |
|------|------|-------|
| 🔴 | Bus R1-R13 — 13 émetteurs manquants/partiels | Features vendues silencieusement cassées (fidélité, allergènes, alertes) |
| 🔴 | **R2 isolé : `reservation.matched` — bouton "Accueillir"** | Allergènes jamais transmis au KDS → risque sécurité alimentaire. C'est un risque santé public, pas un bug UX. Mérite son propre rang P0, pas noyé dans R1-R13 |
| 🔴 | CI/CD — zéro pipeline | Merge cassé en prod = churn immédiat d'un client payant |
| 🔴 | Tests intégration NF525 (0 test bout-en-bout) | FiscalSeal corrompu non détecté = problème légal article 286 CGI |
| 🟠 | Sentry DSN non configuré | Bugs découverts par le client avant vous |

### 1.2 Déséquilibre structurel entre verticales

| Zone | Statut | Risque |
|------|--------|--------|
| Zone 9 Facility | 0 ✅ / 27 composants | Entièrement à construire malgré son statut implicite "acquis" |
| Zone 14 Mobile + 15 Public | 0 ✅ (× 45 composants) | Bloquées par S5 (API REST Hono, 5 jours, pas démarré). Tout T+3/T+6 en dépend |
| Clinic (35%) et Hotel (40%) | Effort sous-estimé × 2-3 | HDS, Ségur, FSE, channel manager = complexité réglementaire hors-normes vs bakery/retail |

### 1.3 Sprints S5–S8 : critères de sortie absents

S5 (API REST), S7 (doc client), S8 (facturation MCC) n'ont pas de gate testable. Contrairement au Sprint 1 qui a `npm run test:bus 24/24 vert`, ces sprints peuvent se "terminer" sans preuve de bon fonctionnement. Chacun doit se doter d'un critère de sortie binaire.

---

## 🕳️ Partie 2 — Angles morts (absents de toute la roadmap)

### 🔐 2.1 Sécurité & conformité technique

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | Zéro audit externe / pentest avant premier client payant | Les gates actuels (TSC=0, cycles=2) vérifient la compilation, pas les vulnérabilités comportementales |
| 🟠 | Pas de gestion des secrets en rotation | Clés API (Stripe, Gemini, Firebase) dans `.env` sans coffre ni rotation planifiée |
| 🟡 | Pas de scan vulnérabilités dépendances | Dependabot / Snyk absents du pipeline CI/CD proposé en S2 |
| 🟡 | PCI-DSS SAQ-A non documenté | Stripe délègue le chiffrement mais la conformité (aucune carte en clair, logs securisés) se documente et s'atteste |
| 🟠 | Pas de WAF / protection DDoS | Le passage à une API REST publique (S5) ouvre une surface d'attaque nouvelle sans protection devant |
| 🟡 | `TwoFactorAuthConfig` (⚫ Zone 13) jamais rendu obligatoire | Le niveau 100 (Propriétaire) et le MCC lui-même devraient imposer le 2FA, pas le laisser optionnel |
| 🔴 | **Backups 90j vs NF525 6 ans : écart non résolu** | La rétention backup (90j, H4) est 24× inférieure à la rétention fiscale légale (6 ans, art. L102 B LPF). Il faut une archive froide immuable (WORM) séparée des snapshots opérationnels |
| 🟡 | Aucun RTO/RPO défini | "SLA monitoring" évoqué en S16 sans cibles de disponibilité, de temps de reprise ni de RPO chiffré |

### ⚖️ 2.2 Legal / contractuel / gouvernance

| Sév. | Gap | Détail |
|------|-----|--------|
| 🔴 | **CGU/CGV absentes** | Aucune ligne dans la roadmap. Impossible de signer légalement un premier client sans contrat encadrant la relation SaaS : propriété des données, SLA, responsabilité |
| 🔴 | **DPA RGPD (accord sous-traitant) absent** | Vous traitez des données personnelles pour le compte de vos clients restaurateurs — ils sont responsables de traitement, vous êtes sous-traitant. L'article 28 RGPD impose un DPA signé. Aussi un registre des sous-traitants (Stripe, Firebase, Sentry, Axiom, LLM derrière Oracle) |
| 🔴 | **Clinic + données de santé avant agrément HDS** | Traiter des données médicales sans hébergement de données de santé agréé (HDS ANSSI) est une infraction. La verticale Clinic ne peut pas être commercialisée en l'état — c'est un prérequis légal, pas un backlog item |
| 🟠 | Portabilité données à résiliation absente | RGPD art. 20 : le client a droit à la portabilité. À résiliation, procédure d'export final + purge à 30j à documenter |
| 🟡 | Aucune assurance RC Pro / cyber-assurance mentionnée | En cas d'incident (perte données client, attaque) vous êtes exposé sans couverture |
| 🟡 | Transferts hors UE non cartographiés | Si le LLM derrière Oracle est hébergé hors UE (US), les données passées aux prompts tombent sous les clauses de transfert RGPD. Particulièrement critique pour Clinic |

### 🎧 2.3 Support tenant — ce qui existe et ce qui manque

> ⚠️ **Correction par rapport à l'analyse brute** : La plomberie backend **existe** — `SupportEscalationHandler`, `SupportTicketAnalysisHandler`, events `support.ticket_submitted` / `support.ticket_escalated` sont câblés dans l'orchestration. Ce qui est absent, c'est **l'UI tenant-facing**.

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | Aucun composant UI ticket support dans les 16 zones | Le tenant ne peut pas signaler un bug depuis l'app — aucun bouton, formulaire ou fil de discussion dans la roadmap. Les handlers back existent mais rien ne déclenche `support.ticket_submitted` depuis le front |
| 🟡 | Pas de mesure de satisfaction côté MCC (NPS/CSAT) | Le CRM restaurants gère les avis des *clients des restaurants* ; rien pour mesurer la satisfaction des *restaurants eux-mêmes* envers le SaaS |
| 🟡 | Pas de rôle customer success défini | Qui fait le suivi J+7/J+30 après onboarding terrain (S6) ? Aucune mention de ressource humaine dédiée |
| 🟡 | Centre d'aide en libre-service absent | Au-delà du "guide démarrage rapide" (S7), pas de base de connaissances indexée ni de chatbot de support |

### 🧪 2.4 QA / Testing — solidité apparente vs réelle

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | **Zéro test E2E UI** sur les parcours critiques | 192 fichiers de test recensés, tous unitaires ou intégration. Aucun test Playwright/Cypress jouant l'encaissement complet, la clôture Z, la récupération NF525 |
| 🟠 | Zéro test de charge / performance | Combien de commandes/seconde le POS encaisse lors d'un samedi soir à 80 couverts ? Aucun benchmark établi, aucun seuil défini |
| 🟡 | WCAG 2.1 AA intention ≠ chantier | Les principes d'accessibilité sont énoncés en section UX mais aucune tâche d'audit (Axe, Lighthouse) n'existe dans le backlog |
| 🟡 | Pas d'environnement UAT | Zéro procédure de test avec de vrais restaurateurs avant une release majeure |

### 🛠️ 2.5 DevOps / SRE / résilience

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | CI/CD sans rollback automatique | Un déploiement cassé exige une intervention manuelle — pas de canary release ni de rollback automatique sur health-check échoué |
| 🟡 | Feature flags : infrastructure partielle | `FeatureFlagSyncHandler` existe — il push des flags MCC vers des listes de tenants via `mcc.feature_flag_toggled`. Ce qui manque : UI MCC pour créer/activer ces flags, et rollout progressif par pourcentage (pas juste liste statique) |
| 🟡 | Mono-fournisseur Firestore + Vercel | Pas de stratégie de bascule ni d'analyse de risque de dépendance unique. Si Vercel down = app down |
| 🟠 | Pas de runbook d'astreinte | Qui est réveillé si le POS d'un client tombe un samedi à 21h ? Aucun on-call, aucun escalation path documenté |
| 🟡 | API REST (S5) sans stratégie de versioning | Les breaking changes futurs ne sont pas anticipés — `v1` doit être stable dès le premier connecteur externe |

### 🌍 2.6 i18n & internationalisation

> ⚠️ **Précision** : L'inactivité i18n est une **décision documentée** (CLAUDE.md : "app monolingue FR en dur, ne pas câbler i18n sans décision explicite") — ce n'est pas un angle mort, c'est un choix conscient de focalisation France.

| Sév. | Gap | Détail |
|------|-----|--------|
| 🔵 | Back-office 100% FR | Pas de blocage court terme (marché France) mais Garage/Salon/Retail s'exportent facilement en Belgique/Suisse sans i18n |
| 🔵 | Fiscalité FR uniquement | TVA FR (5.5/10/20%) câblée en dur — Belgique (6/12/21%), Suisse nécessiteraient une couche d'abstraction |

### 🔄 2.7 Continuité d'activité & dépendances critiques

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟡 | Aucun plan de continuité si Firestore / GCP tombe | Pas de DR site, pas de mode dégradé documenté |
| 🔴 | **Rétention NF525 (6 ans) vs backup (90j) — écart de 24×** | Art. L102 B du Livre des Procédures Fiscales : les données comptables doivent être conservables 6 ans en cas de contrôle fiscal. Le snapshot Firestore à 90j ne couvre pas ça. Nécessite une archive WORM dédiée, distincte des backups opérationnels |
| 🟡 | Paiement carte 100% Stripe sans plan B | SumUp/Ingenico cités en "futures intégrations", jamais en solution de repli. Si Stripe a un incident le 31/12, le réveillon est compromis |
| 🟡 | Mode dégradé Oracle/LightRAG non spécifié | Si le sidecar LightRAG (port 9621) est down, le comportement de l'UI Oracle n'est pas défini |

### 🍽️ 2.8 Produit — cas limites non couverts

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | Pas de gestion des chargebacks / litiges carte | Un client qui conteste sa CB génère un chargeback Stripe — aucun workflow pour le contester, logguer la preuve, ou alerter le restaurateur |
| 🟡 | Multi-devise touristes | `CurrencyConfigPanel` existe en ⚫ (Zone 13) mais le moteur fiscal multi-devise (TVA EUR vs CHF) n'est pas scopé |
| 🟡 | Turnover staff élevé non adressé | Le secteur restauration a 70%+ de turnover annuel. Aucun parcours "réonboarding rapide" (enregistrement PIN, formation express) pour les nouveaux entrants fréquents |
| 🚫 | **`FacialRecognitionClockIn` sans cadre CNIL** | Ce composant (⚫ Zone 6.3) ne peut pas être traité comme une simple checkbox backlog. La biométrie au travail en France est extrêmement encadrée (CNIL délibération 2019-001, RGPD art. 9) : consentement exprès de *chaque* salarié, base légale restrictive, déclaration CNIL spécifique, AIPD obligatoire. À marquer **🚫 bloquant légal** et non ⚫ todo |
| 🟡 | Oracle en mode hors-ligne non défini | Fallback si Gemini API ou LightRAG down : erreur silencieuse ? mode local ? message explicite ? |

### 📚 2.9 Documentation & scaling

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟡 | Pas d'ADR (Architecture Decision Records) | Les grandes décisions (pourquoi Firestore vs PG, pourquoi Jotai vs Zustand, pourquoi microunits vs cents) ne sont pas tracées — elles se réapprennent à chaque contexte |
| 🟡 | Pas de doc onboarding développeur | CLAUDE.md + ARCHITECTURE.md existent mais pas de "README: do this to run the project from scratch in 10 min" |
| 🔵 | Aucun plan de recrutement | Toute la roadmap T+0 à T+36 suppose l'opérateur MCC solo. À partir de quel point (ARR ?) un premier dev est-il nécessaire ? |

### 💰 2.10 FinOps / économie unitaire

| Sév. | Gap | Détail |
|------|-----|--------|
| 🟠 | Pas de suivi du coût d'infrastructure par tenant | Impossible de savoir si un compte à 79€/mois coûte 5€ ou 40€ d'infra (Firestore reads, Sentry events, Axiom logs, Gemini tokens Oracle). Risque de marge négative silencieuse |
| 🟡 | Impayés SaaS : handler partiel | `GracePeriodHandler` existe et met le tenant en read-only à J+7 après `tenant.subscription_expired`. Ce qui manque : le workflow de réactivation post-paiement, et la communication vers le Propriétaire pendant la période de grâce |
| 🟡 | Pas de freemium / trial géré au niveau infra | L'offre trial/freemium éventuelle n'a pas de mécanisme de quota ou de limitation automatique à l'expiration |

---

## 🎯 Les 7 actions à mener avant le premier client (version corrigée)

> Initialement listées comme "5" dans l'analyse brute — ajout de 2 éléments légaux non négociables.

| # | Action | Sévérité | Effort |
|---|--------|----------|--------|
| 1 | **R2 bus : implémenter `WelcomeGuestButton` → `reservation.matched`** | 🔴 Sécurité alimentaire | ~1j |
| 2 | **Rédiger CGU/CGV + DPA RGPD** (avec avocat spécialisé SaaS) | 🔴 Bloquant légal | 1-2 sem |
| 3 | **Archive WORM pour NF525** (Firestore long-term backup, 6 ans) | 🔴 Bloquant fiscal | ~3j |
| 4 | Compléter R1-R13 restants + gate `test:bus` vert | 🟠 Fonctionnel | ~1 sem |
| 5 | CI/CD minimal (lint + TSC + tests + deploy staging) | 🟠 Opérationnel | ~1 sem |
| 6 | Tests E2E sur 3 parcours critiques (encaissement, clôture Z, réservation) | 🟠 Qualité | ~3j |
| 7 | Runbook on-call + Sentry configuré + alertes Slack | 🟠 Opérationnel | ~1j |

> Les items 8-N (DPoS, WAF, pentest, NPS, WCAG) passent en H2/H3 sans bloquer le premier client.
