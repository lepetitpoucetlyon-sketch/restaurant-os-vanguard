# Plan de Validation — 80 Promesses Existantes

> Ces 80 promesses ont du code. Ce plan dit comment vérifier que chacune fonctionne vraiment.
> Organisé du plus risqué au moins risqué.

---

## Méthode

Trois niveaux de vérification :
- **A** : Test automatisé Vitest (sans Firebase, lance `npx vitest run`)
- **B** : Firebase Emulator (lance `firebase emulators:start` puis le test)
- **M** : Manuel dans le navigateur (pas automatisable proprement)

---

## BLOC 1 — NF525 (obligation légale)

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P01-A | Vente → sceau NF525 | `npx vitest run src/__tests__/infrastructure/FiscalSealer.test.ts` | A |
| P01-B | Vente → JournalEntry | `npx vitest run src/__tests__/infrastructure/FinancialNexusBridge.test.ts` | A |
| P01-K | TVA 5.5/10/20% ventilée | `npx vitest run src/__tests__/infrastructure/TaxCalculator.test.ts` + ajouter test chaînage par taux | A |
| P01-L | Mode formation → taxExempt | Vérifier dans FiscalSealer.test.ts qu'il y a un test `isTrainingMode: true` | A |
| P01-J | Vente offline → sync | Couper réseau → vendre → rétablir → vérifier 1 seul JournalEntry en base | B |
| P07-E | FEC exportable | `curl http://localhost:3000/api/admin/finance/fec/export` → ouvrir CSV → vérifier colonnes pipe | M |
| P07-F | Clôture → écritures bloquées | Tenter une vente sur période clôturée → doit rejeter | B |
| P09-D | Cross-tenant → Killswitch | `npx vitest run src/__tests__/b2b/B2BSovereignty.test.ts` | A |
| P09-I | Write Nexus → path tenant scopé | `npx vitest run src/__tests__/infrastructure/SovereignGuard.test.ts` | A |

**Tests à ajouter maintenant** (manquent dans la suite actuelle) :

```typescript
// TaxCalculator.test.ts — à ajouter
it('ventile correctement TVA 5.5%, 10%, 20% sur même commande', () => {
  const items = [
    { productId: 'p1', name: 'Pain', quantity: 1, unitPriceInMicrounits: 2_000_000, taxRate: '0.055' },
    { productId: 'p2', name: 'Plat', quantity: 1, unitPriceInMicrounits: 15_000_000, taxRate: '0.10' },
    { productId: 'p3', name: 'Alcool', quantity: 1, unitPriceInMicrounits: 8_000_000, taxRate: '0.20' },
  ];
  const breakdown = TaxCalculator.computeTvaBreakdown(items);
  expect(breakdown['0.055']).toBeCloseTo(104_265, -2); // 2€ × 0.055/1.055
  expect(breakdown['0.10']).toBeCloseTo(1_363_636, -3); // 15€ × 0.10/1.10
  expect(breakdown['0.20']).toBeCloseTo(1_333_333, -3); // 8€ × 0.20/1.20
});

// FiscalSealer.test.ts — à ajouter
it('le seal N contient le hash du seal N-1', async () => {
  const seal1 = await FiscalSealer.sealDataAtomically('tenant_1', { orderId: 'o1', amount: 1000 });
  const seal2 = await FiscalSealer.sealDataAtomically('tenant_1', { orderId: 'o2', amount: 2000 });
  expect(seal2.previousHash).toBe(seal1.hash);
  expect(seal2.previousHash).not.toBe('GENESIS_ROOT_0000000000000000');
});
```

---

## BLOC 2 — Sécurité

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P09-A | Tiroir sans transaction → lockdown | Simuler accès caisse sans vente → vérifier `lockdownMode: true` dans Nexus | B |
| P09-B | Seul manager déverrouille | Tenter déverrouillage avec rôle `serveur` → doit rejeter | B |
| P09-C | Push lockdown < 5s | Chronométrer entre déclenchement et réception push | M |
| P09-E | Killswitch → forceLogout | Déclencher Killswitch → vérifier que JWT est révoqué | B |
| P09-F | PIN incorrect ×5 → verrouillé | `npx vitest run src/__tests__/app/api/verify-pin.test.ts` | A |
| P09-G | PIN hashé PBKDF2 | Lire le code de `verify-pin` → confirmer qu'il n'y a pas de stockage en clair | A |
| P09-H | Rate limit PIN survit rechargement | `npx vitest run src/__tests__/lib/MemoryRateLimiter.test.ts` | A |
| P09-J | JWT expiré → accès révoqué | `npx vitest run src/__tests__/middleware/middleware.test.ts` | A |
| P09-K | Route admin sans RBAC → alerte | Appeler une route `/api/admin/` sans token → doit retourner 401 | A |
| P10-E | Webhook → signature HMAC vérifiée | Envoyer webhook avec mauvaise signature → doit rejeter 403 | A |
| P10-F | Webhook réservation idempotent | Envoyer le même webhook 2× → vérifier 1 seule réservation créée | B |

---

## BLOC 3 — Opérations (vente, stock, cuisine)

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P01-C | Vente → déduction stock BOM | Faire une vente → vérifier `stockLevels` décrémenté par quantité × ingrédients recette | B |
| P01-I | Annulation → restitution stock + avoir | Annuler commande → vérifier stock recrédité ET document `avoirs/{orderId}` créé | B |
| P02-A | Déduction BOM au gramme | `npx vitest run src/__tests__/helpers/stockEngine.helpers.test.ts` | A |
| P02-B | Stock < seuil → alerte | Déduire stock sous le seuil → vérifier document dans `stockAlerts` | B |
| P02-D | BL validé → stock incrémenté | Valider une réception → vérifier `stockLevels` incrémenté | B |
| P02-F | Facture → food cost recalculé | Enregistrer facture fournisseur → vérifier `foodCost` produits impactés mis à jour | B |
| P02-G | Food cost → alerte marge | Simuler hausse prix fournisseur → vérifier `marginAlerts` créé | B |
| P02-H | Marge < 25% → alerte | `npx vitest run` + chercher test MarginWarningHandler | A |
| P02-I | Gaspillage → stock + ratio 7j | Logger un gaspillage → vérifier stock déduit ET `wasteRatio` mis à jour | B |

---

## BLOC 4 — HACCP & Conformité

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P03-A | HACCP CRITICAL → quarantaine | `npx vitest run src/__tests__/helpers/haccp.helpers.test.ts` | A |
| P03-B | QuarantineHandler émet cascade | Vérifier dans le code que `inventory.quarantine_activated` est bien émis après quarantaine | A |
| P03-E | Contrôle manuel → horodatage | Créer contrôle HACCP → vérifier `haccpLogs` avec timestamp | B |
| P03-F | Non-conformité → action corrective | Enregistrer non-conformité → vérifier `nonConformities` créé avec délai | B |
| P03-G | Certif expirée → alerte RH | Forcer date expiration certif dans passé → vérifier notification créée | B |
| P03-H | Rappel produit → lots quarantinés | Déclarer rappel → vérifier que le produit est bien dans `quarantine` | B |
| P03-K | Calendrier conformité J-7, J-1 | Vérifier que le cron `ComplianceWatcherService` tourne et crée des alertes | M |

---

## BLOC 5 — RH & Paie

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P04-A | Badge arrivée → timeclock | Émettre `staff.clock_in` → vérifier `timeclock/{date}/{id}` créé | B |
| P04-B | Badge départ → durée calculée | Émettre `staff.clock_out` → vérifier `duration` calculée | B |
| P04-E | Absence → alerte sous-effectif | Déclarer absence → vérifier `understaffingAlerts` créé | B |
| P04-G | Clôture mois → pré-paie | Simuler fin de mois → vérifier `payrollResults/{period}` créé | B |
| P04-H | Push Silae/Merge.dev | Vérifier que `SilaeClient.syncPeriod` est appelé avec les bonnes données | A |
| P04-K | Contrat expiré → alerte J-30 | Forcer date expiration contrat J-30 → vérifier notification créée | B |
| P04-L | Visite médicale → alerte | Idem pour `medical.expiry` | B |
| P04-M | Planning → notification équipe | Créer planning → vérifier push envoyé aux serveurs/cuisiniers | B |
| P04-N | Candidature → recruteur assigné | Soumettre candidature → vérifier `assignedRecruiter` non null | B |

---

## BLOC 6 — Réservations

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P05-A | Réservation → email confirmation | Créer réservation → vérifier email envoyé (log Resend ou NotificationGateway) | B |
| P05-G | LaFourchette → idempotent | Envoyer même webhook 2× → 1 seule réservation en base | B |
| P05-J | Capacité max → bloqué | Remplir toutes les tables → tenter réservation → doit rejeter | B |

---

## BLOC 7 — CRM & Marketing

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P06-A | 5ème visite → tag VIP | Simuler 5 commandes même client → vérifier `tag: 'VIP'` | B |
| P06-C | 500€ cumulés → VIP | Simuler commandes pour dépasser seuil → vérifier VIP | B |
| P06-D | Anniversaire J-3 → email | Forcer date anniversaire J+3 → vérifier email envoyé | B |
| P06-J | Promotion activée → prix réduit | Activer promo → vérifier `promotionDiscountBps` sur `menuItems` | B |
| P06-K | Promo expirée → prix normal | Expirer promo → vérifier reset `promotionDiscountBps: null` | B |

---

## BLOC 8 — Finance & Banking

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P07-A | Transaction bancaire → rapprochement | Envoyer webhook bancaire → vérifier `reconciliationResults` créé | B |
| P07-D | Trésorerie → KPIs dashboard | Ouvrir `/finance` onglet Trésorerie → vérifier chiffres non zéro | M |
| P07-J | SEPA → pain.001 + marqué payé | Déclencher virement → vérifier fichier XML + `status: 'paid'` | B |
| P07-K | Stripe échoué → retry + email | Simuler échec Stripe → vérifier retry queue + email dunning | B |
| P07-L | TVA mensuelle via TicketZ | Faire 3 ventes de taux différents → vérifier ventilation dans `taxEntries` | B |
| P10-G | Connexion bancaire expirée → alerte | Simuler token bancaire expiré → vérifier alerte créée | B |
| P10-H | Sync bancaire → dedup | Envoyer même transaction 2× → 1 seule entrée en base | B |

---

## BLOC 9 — Intelligence & IA

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P08-A | Oracle RAG → réponse contextualisée | Poser une question sur les données du tenant → vérifier réponse non-générique | M |
| P08-B | Nouveau doc → indexation LightRAG | Uploader doc → vérifier indexation dans LightRAG (GET /api/health LightRAG) | B |
| P08-D | Cron lundi 8h → rapport multi-tenant | Attendre lundi 8h OU déclencher manuellement le cron | M |
| P08-F | Anomalie détectée → alerte manager | Simuler anomalie (vente à heure inhabituelles) → vérifier `anomalyAlerts` | B |
| P08-H | Clôture caisse → prévision J+1 | Clôturer caisse → vérifier `forecasts` mis à jour | B |
| P08-I | Oracle MCC → briefing flotte | Appeler Oracle en mode MCC → vérifier données cross-tenant dans réponse | M |
| P08-K | Simulation → sans écriture prod | Lancer simulation → vérifier qu'aucun document `journalEntries` n'a été créé | B |

---

## BLOC 10 — Connecteurs & IoT

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P10-B | Commande livreur → stock déduit | Envoyer webhook delivery → vérifier `stockLevels` décrémenté | B |
| P10-C | LaFourchette → idempotent | Voir P05-G | B |

---

## BLOC 11 — MCC & Provisioning

| ID | Promesse | Comment vérifier | Niveau |
|----|----------|-----------------|--------|
| P12-A | Signup → provisioning Firestore + Auth | Créer tenant de test → vérifier documents créés | B |
| P12-B | Signup → email bienvenue | Vérifier email envoyé après signup | B |
| P12-C | Onboarding step → étape suivante | Compléter une étape → vérifier que la suivante se débloque | M |
| P12-D | Stripe activé → features | Activer Stripe test → vérifier `PLAN_FEATURES` mis à jour | B |
| P12-E | Abonnement expiré → grace period | Forcer expiration → vérifier accès restreint mais non coupé | B |
| P12-F | Score santé < 50 → ticket support | Forcer score bas → vérifier ticket auto créé | B |
| P12-G | Ticket → draft IA | Créer ticket → vérifier draft Gemini généré | B |
| P12-H | MDM tablette provisionnée | `POST /api/admin/mdm/devices` → vérifier device créé | A |
| P12-I | MDM tablette perdue → wipe | Marquer perdue → vérifier audit + notification | B |
| P12-J | Upgrade plan → nouvelles features | Changer plan → vérifier `PLAN_FEATURES` étendu | B |
| P12-K | Fleet report → agrégat | Appeler endpoint fleet report → vérifier données multi-tenant | B |

---

## Lancer les tests automatisés maintenant

```bash
# Tous les tests automatisés (niveau A) :
npx vitest run

# Tests spécifiques par bloc :
npx vitest run src/__tests__/infrastructure/FiscalSealer.test.ts
npx vitest run src/__tests__/infrastructure/TaxCalculator.test.ts
npx vitest run src/__tests__/infrastructure/SovereignGuard.test.ts
npx vitest run src/__tests__/b2b/B2BSovereignty.test.ts
npx vitest run src/__tests__/middleware/middleware.test.ts
npx vitest run src/__tests__/app/api/verify-pin.test.ts
npx vitest run src/__tests__/helpers/haccp.helpers.test.ts
npx vitest run src/__tests__/helpers/stockEngine.helpers.test.ts

# Tests à ajouter (voir section BLOC 1) avant de lancer :
# TaxCalculator.test.ts — ajouter ventilation 3 taux
# FiscalSealer.test.ts — ajouter chaînage previousHash
```

## Démarrer Firebase Emulator pour les tests niveau B

```bash
firebase emulators:start --only firestore,auth
# Puis dans un autre terminal :
npx vitest run src/__tests__/integration/
```
