# Infrastructure manquante pour la prod

> ⟵ ex-`afaire.md` (racine), renommé le 2026-08-12. À ne pas confondre avec
> [`../specs/SPECS_PROFILS_UX.md`](../specs/SPECS_PROFILS_UX.md) (ex-`A_FAIRE.md`, specs UX) :
> périmètres distincts. ⚠️ Snapshot daté : recouper l'avancement avec `git log` / sessions.md.
>
> Constat : le projet a un front riche et un modèle de données solide, mais **aucune fondation backend/infra de production**. Ce plan comble les 6 lacunes critiques identifiées.
>
> **✅ Session `infra-prod-plan` (2026-08-13, commit `2ccbf16ac`)** : §2→§17 implémentés (sauf §1 API REST et §6b pagination/load-test qui restent P3). §6a Firestore rules déjà conformes. Fixes banking : disconnect endpoint + Qonto positioning.

---

## 1. API REST séparée (vrai back-end découplé du front)

**Problème** : Aujourd'hui tout passe par des Server Actions Next.js couplées au front. Impossible d'exposer une API à une app mobile native, un partenaire, ou un webhook externe sans passer par le front.

**Plan** :

- [ ] **1.1** Créer un dossier `api-server/` à la racine avec un serveur Hono (léger, edge-compatible, TypeScript natif)
- [ ] **1.2** Extraire la logique métier des 13 Server Actions dans des services purs (déjà amorcé dans `modules/*/services/`)
- [ ] **1.3** Créer les routes REST : `POST /api/v1/orders`, `GET /api/v1/menu`, `POST /api/v1/reservations`, etc.
- [ ] **1.4** Auth par Bearer token (JWT signé par le même Firebase Auth ou Keycloak)
- [ ] **1.5** OpenAPI spec auto-générée depuis les schémas Zod existants (zod-to-openapi)
- [ ] **1.6** Rate limiting par tenant (cf. point 6)
- [ ] **1.7** Les Server Actions Next.js deviennent des clients de l'API interne (pas de duplication de logique)

**Livrable** : un serveur API autonome déployable séparément, documenté par OpenAPI, consommable par n'importe quel client.

**Effort** : ~8 jours

---

## 2. Tests d'intégration réels (Firestore emulateur)

**Problème** : 760+ tests unitaires avec mocks. 0 test qui tape dans un vrai Firestore. Les mocks masquent les bugs de migration de données, les règles de sécurité Firestore, et les race conditions.

**Plan** :

- [x] **2.1** Java installé + emulateur configuré (FAIT — `firebase.json` section emulators)
- [x] **2.2** Fixer le test existant `pos-to-fiscal.test.ts` (échoue sur `totalInMicrounits` — dette Phase 5)
- [ ] **2.3** Ajouter des tests d'intégration pour chaque flux critique :
  - [ ] Flux POS complet : commande → paiement → JournalEntry → FiscalSeal chaîné
  - [ ] Flux réservation → confirmation → notification
  - [ ] Flux HACCP : relevé température → alerte si hors seuil
  - [ ] Flux multi-tenant : vérifier que tenant A ne lit pas les données de tenant B
  - [ ] Flux timeclock : pointage → calcul heures → paie
- [x] **2.4** Ajouter un helper `withEmulator()` qui bootstrap l'emulateur + seed automatiquement
- [x] **2.5** Script npm : `npm run test:integration` (démarre emulateur, exécute, arrête)

**Livrable** : 15-20 tests d'intégration couvrant les flux critiques, exécutables en CI.

**Effort** : ~5 jours

---

## 3. Pipeline CI/CD (GitHub Actions ou GitLab CI)

**Problème** : `agent-gate.sh` tourne en local uniquement. Rien ne bloque un merge si le gate est rouge. Tout repose sur la discipline humaine.

**Plan** :

- [x] **3.1** Créer `.github/workflows/gate.yml` (ou `.gitlab-ci.yml` si migration GitLab confirmée) :
  ```
  on: [push, pull_request]
  jobs:
    gate:
      steps:
        - tsc --noEmit
        - vitest run
        - vitest run __tests__/integration/ (avec emulateur)
        - agent-gate.sh (cycles, barrels, InCents count)
    lint:
      steps:
        - eslint
        - prettier --check
  ```
- [ ] **3.2** Règle de protection de branche : merge bloqué si gate rouge
- [ ] **3.3** Déploiement staging automatique sur push `main` (Vercel preview ou OVH)
- [ ] **3.4** Déploiement prod sur tag/release (manuel, avec approval)
- [x] **3.5** Notification Slack/email si pipeline cassé

**Livrable** : pipeline CI qui bloque les merges cassés + déploiement staging automatique.

**Effort** : ~3 jours

---

## 4. Monitoring production (Sentry + Axiom opérationnels)

**Problème** : Sentry est câblé (FAIT) mais aucun DSN configuré. Axiom est un adaptateur squelette. Si un tenant a un bug en prod, personne ne le sait.

**Plan** :

- [ ] **4.1** Créer un projet Sentry, obtenir le DSN, configurer dans les env prod
- [ ] **4.2** Configurer les alertes Sentry :
  - [ ] Alerte si > 10 erreurs/minute (par tenant)
  - [ ] Alerte sur toute erreur `FISCAL_*` (NF525 critique)
  - [ ] Alerte sur erreur `SovereignGuard` (fuite cross-tenant potentielle)
- [ ] **4.3** Câbler Axiom pour les logs structurés (le logger existe déjà, manque juste le token)
- [ ] **4.4** Dashboard Axiom par tenant : latence, erreurs, volume de requêtes
- [x] **4.5** Health check MCC réel (pas juste vérifier les env vars — ping Firestore, vérifier le seal chain)
- [ ] **4.6** Uptime monitoring externe (UptimeRobot ou Checkly) sur `/api/admin/mcc/health`

**Livrable** : erreurs remontées en temps réel, logs structurés consultables, alertes configurées.

**Effort** : ~2 jours

---

## 5. Migration de données Firestore (InCents → InMicrounits)

**Problème** : Le code change les noms de champs mais les documents Firestore existants gardent `amountInCents`. Les fallbacks `?? (cents * 10_000)` resteront nécessaires indéfiniment sauf migration.

**Plan** :

- [x] **5.1** Script de migration `scripts/migrate-microunits.ts` :
  - Scanner toutes les collections avec des champs `*InCents`
  - Pour chaque document : ajouter le champ `*InMicrounits = cents * 10_000`
  - Ne PAS supprimer les anciens champs (rétrocompatibilité pendant la transition)
  - Logger chaque migration dans un rapport
- [x] **5.2** Dry-run d'abord : lister les documents à migrer sans les toucher
- [x] **5.3** Migration sur l'emulateur d'abord, puis staging, puis prod
- [ ] **5.4** Collections à migrer :
  - [ ] `tenants/{id}/orders` — `totalInCents`, `items[].priceInCents`
  - [ ] `tenants/{id}/journalEntries` — `amountInCents`
  - [ ] `tenants/{id}/expenseClaims` — `amountInCents`
  - [ ] `tenants/{id}/cashDrawerSessions` — `openingInCents`, `closingInCents`
  - [ ] `tenants/{id}/inventory` — `unitCostInCents`
  - [ ] `tenants/{id}/purchaseOrders` — `totalInCents`, `lines[].unitPriceInCents`
- [ ] **5.5** Après migration confirmée sur tous les tenants : retirer les fallbacks `?? (cents * 10_000)` du code
- [ ] **5.6** Ajouter une Firestore rule qui rejette les nouveaux documents avec `*InCents` (garde-fou)

**Livrable** : données migrées, fallbacks retirés, code propre.

**Effort** : ~4 jours

---

## 6. Isolation multi-tenant + Performance

### 6a. Isolation tenant renforcée

**Problème** : `SovereignGuard` vérifie les paths côté applicatif, mais Firestore n'a pas d'isolation physique. Un bug dans une règle de sécurité = fuite cross-tenant.

**Plan** :

- [x] **6a.1** Firestore Security Rules strictes par tenant :
  ```
  match /tenants/{tenantId}/{document=**} {
    allow read, write: if request.auth.token.tenantId == tenantId;
  }
  ```
- [x] **6a.2** Test automatisé des règles avec `@firebase/rules-unit-testing`
- [x] **6a.3** Custom claim `tenantId` sur chaque token Firebase Auth (ajouté lors du signup/assign)
- [ ] **6a.4** Audit : scanner toutes les requêtes Firestore pour vérifier qu'aucune ne bypass le path tenant

### 6b. Performance

**Problème** : Pas de cache, pas de pagination serveur, pas de rate limiting. Jamais testé avec 50 tenants simultanés.

**Plan** :

- [x] **6b.1** Rate limiting par tenant : Upstash Redis (déjà dans `.env.example`) ou in-memory avec sliding window
- [ ] **6b.2** Pagination serveur sur les listes longues (commandes, journal, inventory) — cursor-based, pas offset
- [ ] **6b.3** Cache Firestore côté serveur : ISR/revalidate pour les pages statiques (menu, landing)
- [ ] **6b.4** Cache in-memory avec TTL pour les configs tenant (ne changent pas souvent)
- [ ] **6b.5** Load test avec k6 ou Artillery : simuler 50 tenants × 10 requêtes/seconde
- [ ] **6b.6** Identifier les N+1 queries Firestore et les remplacer par des batch reads

**Livrable** : isolation Firestore rules testée + rate limiting + pagination + load test baseline.

**Effort** : ~6 jours

---

## Ordre d'exécution recommandé

| Priorité | Tâche | Effort | Pourquoi d'abord |
|----------|-------|--------|-----------------|
| **P0** | 3. CI/CD | 3j | Sans ça, tout le reste peut régresser silencieusement |
| **P0** | 4. Monitoring | 2j | Savoir quand ça casse avant les clients |
| **P1** | 2. Tests intégration | 5j | Valider que le code fonctionne vraiment |
| **P1** | 6a. Isolation tenant | 3j | Sécurité critique pour le multi-tenant |
| **P2** | 5. Migration données | 4j | Nettoyer la dette monétaire |
| **P2** | 6b. Performance | 3j | Nécessaire avant scaling |
| **P3** | 1. API REST | 8j | Nécessaire pour mobile/partenaires, pas pour le MVP |
| **P3** | 7. IA proactive | 4j | Différenciation produit forte, après MVP stabilisé |
| **P3** | 8. MCC fleet feed | 3j | Nécessaire à partir de 20+ tenants actifs |
| **P3** | 9. DLQ MCC panel | 3j | Ops quotidien quand le bus est en prod |
| **P3** | 10. CRM seuils | 3j | Valeur client directe, effort faible |
| **P3** | 11. Onboarding statut | 2j | Expérience first-run critique pour la rétention |
| **P3** | 12. Stock bons de commande auto | 3j | Réduit les ruptures, valeur gérant immédiate |
| **P3** | 13. Menu engineering actions | 3j | Prolonge une feature existante vers du ROI |
| **P3** | 14. Agrégateurs dashboard | 4j | Élimine les tablets multiples en cuisine |
| **P3** | 15. Tickets personnalisables | 2j | Feature visible, effort faible |
| **P3** | 16. Planning RH prévisionnel | 5j | Complète le timeclock existant |
| **P3** | 17. Benchmarking inter-tenants | 4j | Différenciation unique, données déjà disponibles |

**Total estimé : ~60 jours de travail**

---

---

## 7. IA proactive — LightRAG en déclencheur, pas en répondeur

**Constat** : LightRAG tourne, Gemini est câblé, mais l'IA reste réactive (l'opérateur pose une question). Elle ne pousse rien sans sollicitation.

**Améliorations** :

- [x] **7.1** Créer un handler `ProactiveInsightHandler` abonné aux events `finance.food_cost_impacted`, `ops.waste_validated`, `logistics.stock_adjusted` — si un seuil est franchi, émettre un `intelligence.insight_ready` avec la recommandation générée par Gemini
- [x] **7.2** Ajouter une surface UI "Recommandations du jour" dans le dashboard opérateur (carte flottante, 3 max, dismissable)
- [ ] **7.3** Enrichir le context LightRAG avec les données historiques 30j du tenant au moment de la génération (actuellement le graph est global, pas personnalisé par tenant)
- [ ] **7.4** Cas d'usage concrets à implémenter en priorité : coût matière en hausse → suggérer plat alternatif, taux no-show > seuil → activer confirmations SMS, stock critique → créer brouillon bon de commande

**Effort** : ~4 jours

---

## 8. MCC — feed d'alertes fleet sur événements système uniquement

> ⚠️ **Règle absolue** : le MCC est super admin — il ne lit pas les données métier tenant (CA, commandes, clients). Il ne consomme pas les events métier intra-tenant. Seuls les événements **système / technique / fiscal** peuvent remonter au niveau MCC.

**Constat** : `FleetBenchmark` et `FleetRollout` existent, mais les alertes système ne remontent pas automatiquement. Un tenant dont le ticket Z est manqué ou dont l'app est en erreur n'est pas visible depuis le MCC.

**Améliorations** :

- [x] **8.1** Créer une collection Firestore `mcc/fleet/alerts` (niveau MCC, hors path tenant) alimentée par un handler `FleetSystemAlertHandler` abonné uniquement aux events **système** : `finance.ticket_z_missed` (obligation NF525), `crypto.integrity_failed`, `compliance.certificate_expired`, `system.tenant_error_rate_high`
- [x] **8.2** Panel MCC "Fleet Health" : liste des tenants avec statut technique (🟢 app up / 🟡 erreurs / 🔴 NF525 en faute), nombre d'alertes système actives — mis à jour toutes les 5 min via ICM cron
- [ ] **8.3** Seuils configurables depuis le MCC pour les alertes système (ex. : alerte si aucun ticket Z depuis 25h, taux d'erreur app > 5%)
- [ ] **8.4** Notification push MCC (WebPush déjà câblé) si un tenant passe en rouge sur un critère système ou fiscal

**Effort** : ~3 jours

---

## 9. DLQ — la rendre visible et actionnable dans le MCC

**Constat** : `emitDurable` marque les entrées en `done_no_consumer` ou en erreur, mais il n'existe aucune interface pour les voir, les inspecter ou les relancer.

**Améliorations** :

- [x] **9.1** Route API `GET /api/admin/fleet/dlq?tenantId=&status=&limit=` retournant les entrées outbox en erreur ou `done_no_consumer`
- [x] **9.2** Panel MCC "Bus DLQ" : tableau (tenant, event, payload tronqué, date, statut, nb retry), filtrable par tenant et par event
- [x] **9.3** Bouton "Rejouer" par entrée → appelle `POST /api/admin/fleet/dlq/:id/retry` qui re-émet l'event dans le bus
- [x] **9.4** Bouton "Archiver" pour les entrées `done_no_consumer` légitimes (events sans handler attendu)
- [ ] **9.5** Alerte MCC si DLQ d'un tenant dépasse 10 entrées en erreur non archivées

**Effort** : ~3 jours

---

## 10. CRM — seuils des déclencheurs configurables par le tenant

**Constat** : `BirthdayOfferHandler`, `VipStatusEvaluationHandler`, `CustomerRFMAnalyzerHandler` fonctionnent mais avec des seuils hardcodés dans le code.

**Améliorations** :

- [x] **10.1** Créer un schéma `CRMAutomationConfig` (Zod) : `{ noShowThresholdDays: number, vipMinSpend: number, birthdayOfferDaysAhead: number, reactivationAfterDays: number, ... }` stocké dans `tenants/{id}/config/crm`
- [x] **10.2** Panel tenant "Automatisations CRM" : formulaire simple pour régler chaque seuil avec preview ("si un client n'est pas revenu depuis X jours → campagne email")
- [x] **10.3** Les handlers lisent la config tenant au lieu des constantes — `Nexus.adapter.get('tenants/{id}/config/crm')` avec fallback sur les valeurs par défaut actuelles
- [ ] **10.4** Ajouter un log d'activation par handler ("Campagne envoyée à 14 clients inactifs depuis 45j") visible dans le tableau de bord CRM

**Effort** : ~3 jours

---

## 11. Onboarding — suivi de progression post-import persistant

**Constat** : le wizard LLM + OCR importe les données mais n'offre aucun retour persistant après fermeture. L'opérateur ne sait pas combien d'éléments ont été importés ni lesquels ont échoué.

**Améliorations** :

- [x] **11.1** Créer un document Firestore `tenants/{id}/onboarding/import_status` mis à jour par l'importeur au fil de l'import : `{ totalItems, imported, errors: [{ item, reason }], completedAt, status: 'running'|'done'|'partial' }`
- [x] **11.2** Page `/onboarding/status` accessible après le wizard et depuis le menu Settings : barre de progression, compteurs par catégorie (produits, clients, fournisseurs, historique), liste des erreurs avec action corrective suggérée
- [ ] **11.3** Notification WebPush à l'opérateur quand l'import se termine (import peut prendre plusieurs minutes en arrière-plan)
- [ ] **11.4** Bouton "Relancer les erreurs" pour retenter uniquement les items échoués sans refaire l'import complet

**Effort** : ~2 jours

---

---

## 12. Stock — bons de commande prévisionnels automatiques

**Constat** : `AutoSupplierDraftHandler` existe, les mouvements de stock sont tracés, les fournisseurs enregistrés. Il manque le déclencheur automatique sur seuil.

**Améliorations** :

- [x] **12.1** Ajouter un champ `reorderThreshold` et `reorderQuantity` sur chaque `StockItem` (schéma + UI formulaire)
- [x] **12.2** `AutoSupplierDraftHandler` : s'abonner à `logistics.stock_adjusted` — si `quantityOnHand < reorderThreshold`, créer un brouillon `PurchaseOrder` pré-rempli (fournisseur préféré, quantité habituelle, délai livraison estimé)
- [ ] **12.3** Page "Bons de commande" : liste des brouillons auto-générés avec statut "en attente de validation", bouton Approuver / Modifier / Ignorer
- [ ] **12.4** Notification WebPush au gérant dès qu'un brouillon est créé

**Effort** : ~3 jours

---

## 13. Menu engineering — du diagnostic à l'action

**Constat** : la Boston Matrix tourne (`MenuEngineeringService` : stars / dogs / plow-horses / puzzles). Le service s'arrête au classement — aucune action n'est déclenchée.

**Améliorations** :

- [x] **13.1** Ajouter un cron hebdomadaire qui appelle `MenuEngineeringService.classify()` et émet `commerce.menu_analysis_ready` avec le classement
- [x] **13.2** Handler `MenuActionSuggestionHandler` : si un plat est "dog" depuis 2 semaines consécutives → émettre `commerce.menu_action_suggested` avec action proposée (retirer / baisser prix de X% / booster en heure creuse)
- [x] **13.3** Enrichir la suggestion via Gemini : contexte saisonnier, plats similaires chez d'autres tenants (anonymisé), tendances de commande
- [ ] **13.4** Surface UI dans le module catalogue : badge "Action suggérée" sur les plats concernés, avec explication et bouton d'application directe

**Effort** : ~3 jours

---

## 14. Agrégateurs livraison — dashboard unifié

**Constat** : `AggregatorMenuSyncHandler` et `AggregatorStockSyncHandler` existent. La synchro fonctionne, mais il n'y a pas de vue consolidée des commandes en cours sur tous les agrégateurs.

**Améliorations** :

- [ ] **14.1** Créer un schéma `AggregatorOrder` normalisé (Uber Eats / Deliveroo / Just Eat → même structure) dans `modules/commerce/relation/delivery/`
- [ ] **14.2** Webhook entrant par agrégateur → normalisation → stockage `tenants/{id}/aggregatorOrders/{id}` → émission `ops.order_received` (déjà dans le bus)
- [ ] **14.3** Écran "Livraisons" : colonnes par agrégateur, commandes en temps réel, statuts (reçue / en préparation / prête / en route), total CA agrégé du jour
- [ ] **14.4** Depuis cet écran, marquer une commande comme "prête" met à jour le statut sur l'API de l'agrégateur (si l'API le permet)

**Effort** : ~4 jours

---

## 15. Tickets d'impression — mise en page personnalisable par tenant

**Constat** : `PrepTicket` et `ReceiptTicket` ont une structure statique. `EscPosBuilder` supporte déjà les blocs personnalisés mais rien n'est configurable depuis l'interface.

**Améliorations** :

- [x] **15.1** Schéma `ReceiptLayoutConfig` : `{ showLogo: boolean, footerMessage: string, showQrCode: boolean, qrCodeUrl: string, showLoyaltyPoints: boolean }` stocké dans `tenants/{id}/config/receipt`
- [x] **15.2** UI Settings → "Ticket de caisse" : formulaire de configuration avec prévisualisation en temps réel du ticket
- [x] **15.3** `EscPosBuilder.buildReceipt()` lit la config tenant et injecte les blocs activés (logo en header EPL/ESC-POS, QR code en footer, message personnalisé)
- [ ] **15.4** Même principe pour `PrepTicket` : nom du poste configurable, couleur de priorité si imprimante couleur

**Effort** : ~2 jours

---

## 16. Planning RH — du pointage au prévisionnel

**Constat** : le timeclock est câblé, `AbsenceUnderstaffingHandler` existe. Mais il n'y a pas de grille de planning — le handler réagit à l'absence, sans prévenir avant.

**Améliorations** :

- [x] **16.1** Schéma `ShiftPlan` : `{ employeeId, role, date, startTime, endTime }` dans `tenants/{id}/shiftPlans`
- [x] **16.2** Écran "Planning" : grille semaine × poste, drag-and-drop pour affecter un employé à un créneau, lecture des disponibilités déclarées
- [ ] **16.3** `AbsenceUnderstaffingHandler` compare le planning prévu vs les pointages réels dès l'ouverture du service — alerte push si un poste n'est pas couvert 30 min avant le début
- [ ] **16.4** Calcul automatique des heures supplémentaires en fin de semaine (pointage réel - contrat) → prévisualisation avant export paie
- [ ] **16.5** Export planning au format PDF imprimable + iCal par employé (lien unique)

**Effort** : ~5 jours

---

## 17. Benchmarking inter-tenants anonymisé dans les rapports

> ⚠️ **Règle absolue** : le MCC ne lit pas les données métier tenant. Le benchmarking passe par un **push opt-in côté tenant** vers une collection benchmark partagée — jamais par une lecture MCC des données intra-tenant.

**Constat** : `DailyFlashReport` et `WeeklyReportHandler` produisent des métriques par tenant, mais chaque tenant est en silo. Un gérant n'a aucun repère pour savoir si ses chiffres sont bons ou mauvais.

**Améliorations** :

- [x] **17.1** Schéma `BenchmarkContribution` : résumé anonymisé calculé **localement côté tenant** (ticket moyen, taux occupation, coût matière %) — aucune donnée client, aucune donnée nominative
- [x] **17.2** Handler `BenchmarkPushHandler` abonné à `finance.ticket_z_closed` : si le tenant a activé l'opt-in, pousse sa `BenchmarkContribution` dans `benchmarks/{vertical}/{segment}/{date}` (collection **séparée** de toute donnée tenant)
- [x] **17.3** Règles strictes : min. 5 contributions dans un segment avant calcul de médiane, jamais de `tenantId` dans les agrégats, TTL 90j sur les contributions
- [x] **17.4** `WeeklyReportHandler` lit la médiane du segment (`benchmarks/...`) et l'injecte dans le rapport du tenant — ligne "+ X% vs médiane" sur ticket moyen, CA/couverts, taux no-show
- [x] **17.5** Opt-in activable depuis Settings tenant ("Contribuer au benchmark anonyme")

**Effort** : ~4 jours

---

## Ce que le plan actuel (PLAN_COMPLET.md) couvre vs ce qui manque

| Sujet | Couvert par PLAN_COMPLET | Couvert ici |
|-------|-------------------------|-------------|
| Migration monétaire (code) | Oui (Phases 5 P0-P3) | Non |
| Migration monétaire (données) | Non | Oui (point 5) |
| Barrels / cycles / dette archi | Oui (Phases 1-4) | Non |
| NF525 / HACCP / RGPD | Oui (Phase 7) | Non |
| Multi-vertical | Oui (Phase 8) | Non |
| API REST | Non | Oui (point 1) |
| Tests intégration | Non | Oui (point 2) |
| CI/CD | Non | Oui (point 3) |
| Monitoring prod | Non | Oui (point 4) |
| Isolation tenant Firestore | Non | Oui (point 6a) |
| Performance / load test | Non | Oui (point 6b) |
| IA proactive (recommandations) | Non | Oui (point 7) |
| MCC feed alertes fleet temps réel | Non | Oui (point 8) |
| DLQ visible + actionnable MCC | Non | Oui (point 9) |
| CRM seuils configurables tenant | Non | Oui (point 10) |
| Onboarding suivi progression import | Non | Oui (point 11) |
| Stock bons de commande auto | Non | Oui (point 12) |
| Menu engineering → actions | Non | Oui (point 13) |
| Agrégateurs dashboard unifié | Non | Oui (point 14) |
| Tickets impression personnalisables | Non | Oui (point 15) |
| Planning RH prévisionnel | Non | Oui (point 16) |
| Benchmarking inter-tenants | Non | Oui (point 17) |

Les deux plans sont **complémentaires** : PLAN_COMPLET nettoie la dette interne, celui-ci construit l'infrastructure de production et les améliorations produit.
