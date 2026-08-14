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

Le versionbase est implémenté. Le flow MCC manque de visibilité pour toi, super admin.

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
