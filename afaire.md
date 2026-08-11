# A FAIRE — Infrastructure manquante pour la prod

> Constat : le projet a un front riche et un modèle de données solide, mais **aucune fondation backend/infra de production**. Ce plan comble les 6 lacunes critiques identifiées.

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

- [ ] **2.1** Java installé + emulateur configuré (FAIT — `firebase.json` section emulators)
- [ ] **2.2** Fixer le test existant `pos-to-fiscal.test.ts` (échoue sur `totalInMicrounits` — dette Phase 5)
- [ ] **2.3** Ajouter des tests d'intégration pour chaque flux critique :
  - [ ] Flux POS complet : commande → paiement → JournalEntry → FiscalSeal chaîné
  - [ ] Flux réservation → confirmation → notification
  - [ ] Flux HACCP : relevé température → alerte si hors seuil
  - [ ] Flux multi-tenant : vérifier que tenant A ne lit pas les données de tenant B
  - [ ] Flux timeclock : pointage → calcul heures → paie
- [ ] **2.4** Ajouter un helper `withEmulator()` qui bootstrap l'emulateur + seed automatiquement
- [ ] **2.5** Script npm : `npm run test:integration` (démarre emulateur, exécute, arrête)

**Livrable** : 15-20 tests d'intégration couvrant les flux critiques, exécutables en CI.

**Effort** : ~5 jours

---

## 3. Pipeline CI/CD (GitHub Actions ou GitLab CI)

**Problème** : `agent-gate.sh` tourne en local uniquement. Rien ne bloque un merge si le gate est rouge. Tout repose sur la discipline humaine.

**Plan** :

- [ ] **3.1** Créer `.github/workflows/gate.yml` (ou `.gitlab-ci.yml` si migration GitLab confirmée) :
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
- [ ] **3.5** Notification Slack/email si pipeline cassé

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
- [ ] **4.5** Health check MCC réel (pas juste vérifier les env vars — ping Firestore, vérifier le seal chain)
- [ ] **4.6** Uptime monitoring externe (UptimeRobot ou Checkly) sur `/api/admin/mcc/health`

**Livrable** : erreurs remontées en temps réel, logs structurés consultables, alertes configurées.

**Effort** : ~2 jours

---

## 5. Migration de données Firestore (InCents → InMicrounits)

**Problème** : Le code change les noms de champs mais les documents Firestore existants gardent `amountInCents`. Les fallbacks `?? (cents * 10_000)` resteront nécessaires indéfiniment sauf migration.

**Plan** :

- [ ] **5.1** Script de migration `scripts/migrate-microunits.ts` :
  - Scanner toutes les collections avec des champs `*InCents`
  - Pour chaque document : ajouter le champ `*InMicrounits = cents * 10_000`
  - Ne PAS supprimer les anciens champs (rétrocompatibilité pendant la transition)
  - Logger chaque migration dans un rapport
- [ ] **5.2** Dry-run d'abord : lister les documents à migrer sans les toucher
- [ ] **5.3** Migration sur l'emulateur d'abord, puis staging, puis prod
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

- [ ] **6a.1** Firestore Security Rules strictes par tenant :
  ```
  match /tenants/{tenantId}/{document=**} {
    allow read, write: if request.auth.token.tenantId == tenantId;
  }
  ```
- [ ] **6a.2** Test automatisé des règles avec `@firebase/rules-unit-testing`
- [ ] **6a.3** Custom claim `tenantId` sur chaque token Firebase Auth (ajouté lors du signup/assign)
- [ ] **6a.4** Audit : scanner toutes les requêtes Firestore pour vérifier qu'aucune ne bypass le path tenant

### 6b. Performance

**Problème** : Pas de cache, pas de pagination serveur, pas de rate limiting. Jamais testé avec 50 tenants simultanés.

**Plan** :

- [ ] **6b.1** Rate limiting par tenant : Upstash Redis (déjà dans `.env.example`) ou in-memory avec sliding window
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

**Total estimé : ~28 jours de travail**

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

Les deux plans sont **complémentaires** : PLAN_COMPLET nettoie la dette interne, celui-ci construit l'infrastructure de production.
