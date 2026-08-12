# RESTAURANT-OS-CORE — Tickets prêts à coder (toutes vagues)

> Découpage PR-par-PR du [plan d'implémentation](../plans/PLAN-IMPLEMENTATION.md). Chaque ticket = 1 PR mergeable.
> **Chemins** : seuls les fichiers **vérifiés** sont cités en dur. Pour les composants non localisés par leur nom (grille POS, wizard de clôture), on cite le **répertoire/la page** — à confirmer en ouvrant le dossier.
> **Branche de base** : `grade-x-vanguard`. Nommage : `feat/<vague>-<id>-<slug>`.
> **Avant chaque PR** : `npx tsc --noEmit` · `npx vitest run` · `sentrux check .` · respect des invariants §0 du plan.

**Légende taille** : `XS` <½j · `S` 1–2j · `M` 3–5j · `L` 1–2 sem · `XL` 2+ sem (à re-découper).
**Légende dépendance** : « après T## » = ne merge pas avant que T## soit sur `grade-x-vanguard`.

---

## Conventions communes (à lire une fois)

- **Schémas** : toute nouvelle donnée = schéma Zod dans `src/domain/schemas/` (ou contrat dans `src/shared/nexus/contracts/`), typage via `z.infer<>`.
- **Montants** : `MicrounitsSchema` + `toMicrounits()` depuis `src/domain/schemas/primitives.ts`. Jamais `*InCents` en neuf.
- **Accès données** : via le singleton `Nexus` (`src/lib/nexus/NexusAdapter.ts`) ; path `tenants/{tenantId}/...` via `Nexus.getTenantPath()` ; `tenantId` depuis `useTenant()`.
- **Écritures fiscales** : uniquement via `src/infrastructure/adapters/FinancialNexusBridge.ts` → `FiscalAdapter` → `FiscalEngine`. Jamais d'update/delete sur `journalEntries`/`fiscalSeals`.
- **Nouveau code pilier** → `src/modules/<pilier>/`. **Nouvelle route** → entrée dans `src/lib/icm/TaskContext.ts`.
- **Tests** : co-localiser (`*.test.ts`) ou sous `src/tests/`/`src/__tests__/` selon le voisinage.

---

# VAGUE 0 — Socle & vérité  *(détail fin)*

### T00 — Bootstrap : dossiers & flags de vague
`[socle]` · **XS** · branche `chore/v0-t00-bootstrap`
- **Modifier** : `.env.example` (placeholders VAPID, feature-flags), `README`/docs internes si besoin.
- **Créer** : `src/config/flags.ts` (ou étendre l'existant) — flags `POLICY_ENFORCE`, `MUNITS_CASH`, `OFFLINE_FISCAL` pour livrer en « warn » avant « enforce ».
- **AC** : flags lisibles côté serveur+client ; aucun impact runtime tant que off.
- **Merge** : en premier.

## C0.1 — Notifications VAPID

### T01 — Configurer VAPID + test d'envoi
`[C0.1]` · **S** · `feat/v0-t01-vapid`
- **Modifier** : `.env.example` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`), doc de déploiement.
- **Vérifier/ajuster** : `src/lib/push/webPushService.ts` (path multi-tenant `tenants/{tenantId}/pushSubscriptions/{userId}`), `src/lib/push/usePushSubscription.ts`, `src/app/api/push/subscribe/route.ts`.
- **Créer** : `src/lib/push/webPushService.test.ts` (abonnement fictif → `sendToUser` → assert appel `web-push`).
- **AC** : notif test reçue sur un device abonné en recette ; sans clés → skip propre (log), pas de crash.
- **Merge** : après T00.

### T02 — Câbler les 3 cascades émettrices par rôle
`[C0.1]` · **S** · `feat/v0-t02-push-cascades`
- **Modifier** : `src/app/(client)/(ops)/haccp/page.tsx` (température hors seuil → chef), `src/app/(client)/(ops)/kds/components/KDSTicket.tsx` (plat prêt/audit → serveur), `src/app/(client)/(ops)/staff/page.tsx` (planning publié → équipe).
- **AC** : chaque événement pousse au bon rôle (respect `PERMISSION_ROLE_LEVELS`) ; testable en recette.
- **Merge** : après T01.

## C0.2 — Discipline µunits (caisse)

### T03 — Modèle session caisse en µunits + adaptateur rétro
`[C0.2]` · **M** · `feat/v0-t03-cash-munits`
- **Créer** : `src/domain/schemas/cash.ts` (`CashSessionSchema` avec `openingInMicrounits`, `closingInMicrounits`, `collectedInMicrounits`, `changeGivenInMicrounits`), `src/domain/schemas/cash.test.ts`.
- **Modifier** : `src/modules/commerce/ui/pos/CashDrawerModal.tsx` (remplacer `*InCents` par `*InMicrounits`, conversion à la frontière UI seulement).
- **AC** : logique caisse 100 % µunits ; tests aux bornes (0, arrondi, gros montant) ; parité € affichée inchangée.
- **Merge** : après T00.

### T04 — Migration one-shot cents→µunits (idempotente)
`[C0.2]` · **S** · `feat/v0-t04-cash-migration`
- **Créer** : `scripts/migrations/2026-cash-cents-to-munits.ts` (×10 000, idempotent, tracé, derrière flag `MUNITS_CASH`).
- **AC** : rejouable sans double conversion ; réconciliation comptable avant/après identique ; rapport d'exécution.
- **Merge** : après T03.

### T05 — Inventaire des `*InCents` restants
`[C0.2/B3]` · **XS** · `chore/v0-t05-cents-audit`
- **Créer** : `docs/dette-munits.md` (sortie de `rg "InCents" src`, checklist priorisée, dont `usePos`).
- **AC** : liste exhaustive + ordre de sortie.
- **Merge** : parallèle.

## C0.3 — Audit immuable

### T06 — Schéma AuditEvent append-only + chaînage
`[C0.3]` · **M** · `feat/v0-t06-audit-schema`
- **Créer** : `src/domain/schemas/audit.ts` (`AuditEventSchema { actorId, actorRole, action, collection, entityId, before?, after?, tenantId, ts, hash, previousHash }`), `src/modules/compliance/audit/AuditService.ts` (émission + hash via `CryptoService`), tests.
- **AC** : event scellé, chaîné, non-supprimable ; PII exclues du payload (renvoi vers `subjectId`).
- **Merge** : après T00.

### T07 — Interception des écritures sensibles
`[C0.3]` · **M** · `feat/v0-t07-audit-interceptor`
- **Modifier** : `src/lib/nexus/NexusInterceptor.ts` (hook sur collections finance/staff/settings/RBAC → `AuditService.record`).
- **Modifier** : `src/modules/commerce/ui/pos/PinModal.tsx` (chaque override PIN → `AuditEvent` type `override`).
- **Créer** : `src/modules/compliance/audit/OverrideLogView.tsx` (vue overrides 30j, lecture `manager+`).
- **AC** : toute modif d'une collection sensible produit un `AuditEvent` ; la vue liste les overrides.
- **Merge** : après T06.

## C0.4 — Plan de contrôle RBAC

### T08 — Modèle Policy + évaluateur SoD
`[C0.4]` · **M** · `feat/v0-t08-policy-sod`
- **Créer** : `src/domain/schemas/policy.ts` (`PolicySchema { type:'sod'|'threshold'|'template', rule, scope, tenantId }`), `src/domain/services/PolicyEngine.ts` (matrice de tâches incompatibles reception ⊗ invoiceApproval ⊗ payment), tests.
- **AC** : une combinaison SoD interdite est refusée + auditée (T07) ; mode `warn|enforce` via flag.
- **Merge** : après T07.

### T09 — Seuils d'approbation dans useActionPermission
`[C0.4]` · **M** · `feat/v0-t09-thresholds`
- **Modifier** : `src/hooks/useActionPermission.ts` (consulter seuils `amount`/`discountPct` → exiger élévation), `src/domain/services/AccessPolicyManager.ts` (exposer seuils).
- **Créer** : `src/modules/commerce/ui/pos/ElevationPrompt.tsx` (PIN d'un rôle ≥ requis) si absent.
- **AC** : action au-dessus du seuil bloquée sans élévation ; élévation tracée (T07).
- **Merge** : après T08.

### T10 — Templates de rôles métier
`[C0.4]` · **S** · `feat/v0-t10-role-templates`
- **Créer** : `src/domain/services/RoleTemplates.ts` (3 bundles : Serveur/Chef/Manager).
- **Modifier** : `src/app/(admin)/account-settings/page.tsx` (bouton « appliquer template »).
- **AC** : appliquer un template renseigne d'un clic les catégories/actions du rôle ; tracé.
- **Merge** : après T09.

---

# VAGUE 1 — Conformité fiscale & légale

## C1.1 — TVA mode consommation

### T11 — Modèle mode conso + résolution de taux
`[C1.1/B1]` · **M** · `feat/v1-t11-tva-mode`
- **Modifier** : `src/domain/schemas/orders.ts` (`consumptionMode: z.enum(['dine_in','takeaway'])` au niveau commande + override ligne dans `OrderLineSchema`), `src/domain/schemas/pos.ts` (propager au `PosTicket`).
- **Créer** : `src/modules/finance/tax/vatResolver.ts` (`{category, consumptionMode} → TaxRate`, alcool = 20 % forcé), tests.
- **Modifier** : `src/infrastructure/adapters/FinancialNexusBridge.ts` (recalcul `taxAmountInMicrounits` par ligne, ventilation multi-taux).
- **AC** : ticket mixte (plat 10 % + café emporter 5,5 % + vin 20 %) → 3 lignes TVA justes, scellées ; FEC cohérent.
- **Merge** : après vague 0.

### T12 — UI POS : toggle sur place / à emporter
`[C1.1]` · **S** · `feat/v1-t12-tva-ui`
- **Modifier** : POS (`src/app/(client)/(ops)/pos/` + `src/modules/commerce/ui/pos/`) — toggle ticket + override ligne.
- **AC** : bascule visible ; override ligne `chef_rang+` ; recalcul instantané.
- **Merge** : après T11.

## C1.2 — RGPD × NF525  ⚠️ *décision d'abord*

### T13 — Audit des PII dans les dataSnapshots scellés
`[C1.2/G29]` · **S** · `chore/v1-t13-pii-audit`
- **Créer** : `docs/rgpd-nf525-audit.md` — inventaire des PII sérialisées en clair (`FinancialNexusBridge`, `FiscalAdapter`, `journalEntries`), + décision d'archi validée.
- **AC** : liste exhaustive + go/no-go pseudonymisation documenté. **Bloquant** pour T14.
- **Merge** : en tout premier de la vague 1.

### T14 — piiVault + référence par subjectId
`[C1.2]` · **M** · `feat/v1-t14-pii-vault`
- **Créer** : `src/modules/compliance/rgpd/PiiVault.ts` (`tenants/{tenantId}/piiVault/{subjectId}`, chiffrement par-sujet), `src/domain/schemas/pii.ts`, tests.
- **Modifier** : `FinancialNexusBridge.ts` + points sérialisant des PII → ne stocker que `subjectId` + non-PII.
- **AC** : aucun nouveau `dataSnapshot` ne contient de PII en clair ; chaîne NF525 intacte.
- **Merge** : après T13.

### T15 — Workflow d'effacement client
`[C1.2]` · **M** · `feat/v1-t15-erasure`
- **Créer** : `src/modules/compliance/rgpd/ErasureService.ts` (destruction clé sujet → PII irrécupérables), vue DPO.
- **Modifier** : CRM (`src/components/crm/` ou module commerce) → action « effacer client ».
- **AC** : effacement rend les PII irrécupérables, écritures fiscales préservées & vérifiables ; tracé (T07).
- **Merge** : après T14.

## C1.3 — Clôtures NF525 + JET

### T16 — Clôtures mensuelle/annuelle + grand total perpétuel
`[C1.3/B7]` · **M** · `feat/v1-t16-periodic-closure`
- **Créer** : `src/domain/schemas/periodClosure.ts`, `src/modules/finance/fiscal/PeriodClosureService.ts` (agrégats scellés/chaînés), tests.
- **Modifier** : `src/domain/services/FiscalEngine.ts` (exposer cumuls/grand total perpétuel).
- **AC** : clôtures M/A scellées, chaînées ; grand total cohérent ; export archivage.
- **Merge** : après vague 0.

### T17 — JET (Journal des Événements Techniques)
`[C1.3/B7]` · **S** · `feat/v1-t17-jet`
- **Modifier** : `src/lib/services/ImmunityAuditLogger.ts` (types NF525 : coupure, correction, changement d'heure, restauration).
- **AC** : événements techniques journalisés append-only + exportables.
- **Merge** : après T16 (réutilise l'audit T06/T07).

## C1.4 — Résilience fiscale hors-ligne

### T18 — Scellement offline + plages de receiptNumber
`[C1.4/G1]` · **M** · `feat/v1-t18-offline-seal`
- **Modifier** : `src/domain/services/OfflineMasteryEngine.ts` (sceller localement via `CryptoService`, file ordonnée), `FiscalEngine.ts` (plages `receiptNumber` par `instanceId`).
- **AC** : vente hors-ligne scellée localement.
- **Merge** : après T16.

### T19 — Réconciliation à la reconnexion + indicateur d'état
`[C1.4]` · **M** · `feat/v1-t19-offline-resync`
- **Modifier** : `OfflineMasteryEngine.ts` (rejeu ordonné, résolution conflits, vérif intégrité chaîne) ; bandeau UI online/dégradé/resync (layout ops).
- **AC** : test de coupure réseau en plein service → réconciliation sans trou ni collision.
- **Merge** : après T18.

## C1.5 — Affichages FR + allergènes/nutri

### T20 — Champs produit réglementaires
`[C1.5/B5,B6]` · **S** · `feat/v1-t20-product-legal-fields`
- **Modifier** : `src/shared/nexus/contracts/settings/catalog.ts` (`faitMaison`, `meatOrigin?`, `nutrition?`, exposer `allergens`).
- **AC** : champs éditables `manager+` ; migration douce (optionnels).
- **Merge** : après vague 0.

### T21 — Doggy bag + don alimentaire à l'encaissement
`[C1.5]` · **S** · `feat/v1-t21-doggybag`
- **Modifier** : flux encaissement POS ; **Créer** journal don alimentaire (rattaché Registres/Compliance).
- **AC** : doggy bag proposable ; don journalisé.
- **Merge** : après T20. *(Affichage client → T27 parcours invité.)*

## C1.6 — Conformité RH

### T22 — Moteur de conformité planning (repos/amplitude)
`[C1.6/G15]` · **M** · `feat/v1-t22-labor-law`
- **Créer** : `src/modules/human/hr/services/scheduleCompliance.ts` (11 h repos, 6 j max, amplitude, coupures ; règles HCR configurables), tests.
- **Modifier** : `src/modules/human/hr/components/planning/PlanningWeekView.tsx` + `useSchedulePublish` (warnings à la publication).
- **AC** : planning non conforme → warning bloquant/non-bloquant paramétrable.
- **Merge** : après vague 0.

### T23 — Documents & certifs + registre unique + licences
`[C1.6/G17,G24]` · **M** · `feat/v1-t23-hr-docs`
- **Créer** : `src/domain/schemas/employeeDocument.ts`, `src/domain/schemas/license.ts`, `src/modules/human/hr/services/registreUnique.ts`.
- **Modifier** : `src/app/(client)/(ops)/staff/page.tsx` (onglet documents), alertes via T01.
- **AC** : certif à échéance → alerte ; registre unique exportable.
- **Merge** : après T22.

### T24 — Calendrier de conformité unifié
`[C1.6/G23]` · **S** · `feat/v1-t24-compliance-calendar`
- **Créer** : `src/modules/compliance/calendar/ComplianceCalendar.tsx` (agrège docs RH + licences + DUERP + certifs).
- **AC** : toutes les échéances en une vue, triées, avec alertes.
- **Merge** : après T23.

## C1.7 — Retrait-rappel

### T25 — Index inverse lot→plats→clients + écran de rappel
`[C1.7/G13]` · **M** · `feat/v1-t25-food-recall`
- **Créer** : `src/modules/compliance/recall/RecallService.ts` (index `lotId → preparations → orderLines → orders → subjectId`), `RecallView.tsx`.
- **Modifier** : traçabilité HACCP (haccp module) si granularité à compléter.
- **AC** : depuis un lot → liste préparations, plats et couverts impactés en une action ; clients via `PiiVault` (T14) ; procédure tracée.
- **Merge** : après T14.

---

# VAGUE 2 — Mobilité & parcours invité

## C2.1 — POS handheld

### T26 — Vue POS mobile + session serveur + ownership addition
`[C2.1/serveur]` · **L** · `feat/v2-t26-handheld`
- **Créer** : `src/app/(client)/(ops)/pos-mobile/page.tsx` (+ entrée `TaskContext.ts` : orders, tables, products, categories), composants tactiles réutilisant `src/modules/commerce/ui/pos/*`.
- **Modifier** : modèle commande → `ownerServerId` (prépare tronc/handoff).
- **AC** : commande complète depuis mobile → KDS ; allergène à la saisie (T20) ; statut plat poussé (T01) ; encaissement scellé identique borne.
- **Merge** : après vague 0 + T20.

## C2.2 — Parcours invité

### T27 — Menu QR client (catalogue + allergènes + dispo)
`[C2.2/invité,B5,B6]` · **M** · `feat/v2-t27-qr-menu`
- **Créer** : `src/app/(client)/(public)/menu/[tenantId]/[tableId]/page.tsx`, composants menu client (filtre allergènes, badge fait maison/origine, nutri — data T20).
- **AC** : menu public par table, filtrable ; respecte `availability`.
- **Merge** : après T20 (+ idéalement T11 pour l'affichage prix TTC juste).

### T28 — Commande + validation serveur → KDS
`[C2.2]` · **M** · `feat/v2-t28-guest-order`
- **Modifier** : file de validation serveur ; injection `orders`.
- **AC** : commande client validée puis produite ; anti-abus (validation obligatoire).
- **Merge** : après T27 + T26.

### T29 — Paiement à table + ticket dématérialisé NF525
`[C2.2]` · **M** · `feat/v2-t29-pay-at-table`
- **Modifier** : intégration Stripe (split), `FinancialNexusBridge` (TVA multi-taux T11), reçu numérique référant `JournalEntry`/`FiscalSeal`.
- **AC** : client paie et reçoit un ticket dématérialisé valide ; PCI via Stripe (jamais de CB côté app) ; aucune PII en clair scellée (T14).
- **Merge** : après T28 + T11 + T14.

## C2.3 — No-show

### T30 — Empreinte/acompte + capture sur no_show
`[C2.3/G5]` · **S** · `feat/v2-t30-noshow`
- **Modifier** : `src/app/api/widget/setup-intent/route.ts`, `src/components/widget/ReservationWidget.tsx`, `src/shared/nexus/contracts/settings/reservations.ts` (politique annulation).
- **AC** : empreinte à la résa ; `no_show` → capture + écriture (TVA acompte) ; politique paramétrable.
- **Merge** : après vague 0.

---

# VAGUE 3 — Revenu & rétention

## C3.1 — Fidélité + cartes cadeaux + passif

### T31 — Cartes cadeaux (émission/redemption) + passif
`[C3.1/G7,G22]` · **M** · `feat/v3-t31-giftcards`
- **Créer** : `src/domain/schemas/giftcard.ts` (`GiftCard { code(signé), balanceInMicrounits, status }`), `src/modules/commerce/loyalty/GiftCardService.ts`.
- **Modifier** : moyens de paiement (`src/domain/schemas/pos.ts`) — redemption ; compta passif (`src/shared/seeds/pcg-accounts.ts` compte 4191/dédié) via `FinancialNexusBridge`.
- **AC** : vente = passif ; redemption = solde du passif ; codes signés.
- **Merge** : après T14 (PII vault).

### T32 — Fidélité points/paliers + provision
`[C3.1/G6,G22]` · **M** · `feat/v3-t32-loyalty`
- **Créer** : `src/domain/schemas/loyalty.ts` (`LoyaltyAccount { subjectId, points, tier }`), `src/modules/commerce/loyalty/LoyaltyEngine.ts` (alimenté RFM).
- **Modifier** : POS (redemption points), compta (provision).
- **AC** : cumul/dépense de points ; provision comptable ; RGPD-compatible (subjectId).
- **Merge** : après T31.

## C3.2 — Ardoise / compte client

### T33 — Mode paiement on_account + relevé + plafond
`[C3.2/B4]` · **M** · `feat/v3-t33-house-account`
- **Modifier** : `src/domain/schemas/pos.ts` (mode `on_account`) ; **Créer** `src/domain/schemas/customerAccount.ts` (`{subjectId, creditLimit, balanceInMicrounits}`), service de relevé.
- **Modifier** : créance client (compte 411) ; rapprochement via `src/domain/finance/collection/CollectionService.ts`.
- **AC** : règlement « sur compte » ; relevé mensuel ; plafond respecté (override `manager+` seuil T09).
- **Merge** : après T09 + T14.

## C3.3 — 86-ing auto

### T34 — Propagation stock→availability temps réel
`[C3.3/G4]` · **S** · `feat/v3-t34-auto-86`
- **Modifier** : `src/lib/sync/pillarSyncRegistry.ts` / InventorySync (sous seuil critique → `availability=out_of_stock` des produits liés par recette) ; propagation POS + menu QR (T27).
- **AC** : épuiser un ingrédient bloquant retire les plats en temps réel ; réappro réactive ; 86 tracé (T06). Matrice de criticité par ingrédient.
- **Merge** : après T27.

## C3.4 — Boucle food-cost

### T35 — Recompute food-cost sur variation prix + alerte
`[C3.4/G11]` · **S** · `feat/v3-t35-foodcost`
- **Modifier** : `src/domain/services/NexusYieldEngine.ts` (écouteur prix ingrédient → recompute recettes), alerte chef (T01), surfaçage `menu-matrix` (analytics).
- **AC** : hausse prix ingrédient → recalcul + alerte marge ; suggestion reprix (non auto).
- **Merge** : après T01 ; idéalement après T40 (prix procurement).

## C3.5 — Tronc

### T36 — Répartition pourboires → bulletin
`[C3.5/G16,serveur]` · **M** · `feat/v3-t36-tips`
- **Créer** : `src/modules/human/hr/services/tipDistribution.ts` (règles pool/heures/rang).
- **Modifier** : `src/modules/human/hr/services/paySlipGenerator.ts` + `src/lib/payroll/PrepaieBuilder.ts` (intégration bulletin), compta 708500, ownership addition (T26).
- **AC** : pool réparti selon règle, visible sur bulletin + « mes pourboires » (T44).
- **Merge** : après T26.

---

# VAGUE 4 — Pilotage & contrôle

## C4.1 — Achats 3-way + AP + SEPA

### T37 — 3-way match (PO ↔ réception ↔ facture)
`[C4.1/G10]` · **M** · `feat/v4-t37-3way`
- **Modifier** : `src/domain/procurement/ProcurementBridge.ts`, `src/domain/services/ProcurementService.ts`, `src/domain/schemas/supplier-invoice.schemas.ts` (liaison + écarts bloquants) ; `ReceptionWizard` (haccp/quality).
- **AC** : facture sans BL correspondant bloquée ; écart quantité/prix signalé.
- **Merge** : après T08 (SoD).

### T38 — Seuils d'approbation achats
`[C4.1/G10]` · **S** · `feat/v4-t38-po-thresholds`
- **Modifier** : brancher T09 (seuils) sur la création de commande/validation facture.
- **AC** : achat au-dessus du seuil → approbation d'un rôle supérieur, tracée.
- **Merge** : après T37 + T09.

### T39 — AP aging + génération SEPA (pain.001)
`[C4.1/G20]` · **L** · `feat/v4-t39-ap-sepa`
- **Créer** : `src/modules/finance/ap/ApAgingService.ts`, `src/modules/finance/ap/SepaFileGenerator.ts` (pain.001).
- **Modifier** : rapprochement bancaire (OpenBanking Powens/Tink) + `AccountingMatchingService`.
- **AC** : échéancier fournisseurs ; fichier SEPA généré + rapproché ; jamais d'identifiants bancaires côté app.
- **Merge** : après T37.

## C4.2 — Caisse avancée

### T40 — Dénominations, skims, comptage aveugle
`[C4.2/G2]` · **S** · `feat/v4-t40-cash-advanced`
- **Modifier** : `src/modules/commerce/ui/pos/CashDrawerModal.tsx` (saisie par coupures, skim/drop, mode aveugle), écritures mouvement caisse, rattachement clôture Z.
- **AC** : comptage par coupures ; skims tracés (T06) ; écart en aveugle ; validation `manager+` (T09).
- **Merge** : après T03 + T06.

## C4.3 — Labor vs CA + prep

### T41 — Labor % vs CA prévu + prévision prep
`[C4.3/G14,G12]` · **M** · `feat/v4-t41-labor-prep`
- **Créer** : `src/modules/human/hr/services/laborCost.ts` (coût planning vs forecast Oracle), `src/modules/ops/prep/prepForecast.ts`.
- **AC** : labor % temps réel + alerte staffing ; liste de prep quantifiée J+1.
- **Merge** : après vague 0.

## C4.4 — Flash report

### T42 — Rapport quotidien consolidé + push mobile
`[C4.4/directeur]` · **M** · `feat/v4-t42-flash-report`
- **Créer** : `src/modules/intelligence/reports/DailyFlashReport.ts` (+ vue mobile), push T01.
- **AC** : couverts, addition moy., food %, labor %, écart caisse, incidents ; historique multi-jours ; dégrade proprement.
- **Merge** : après T40 (caisse) + T41 (labor).

## C4.5 — Détection fraude

### T43 — Détection d'anomalies sur audit + caisse
`[C4.5/G25]` · **M** · `feat/v4-t43-fraud`
- **Créer** : `src/modules/intelligence/anomaly/AnomalyDetector.ts` (voids/comps/remises/écarts anormaux depuis `AuditEvent` + caisse).
- **AC** : pic anormal → alerte tracée ; tableau des overrides suspects.
- **Merge** : après T07 + T40.

## C4.6 — Analytique + budget + attribution

### T44 — Compta analytique + budget + attribution
`[C4.6/G21,G19]` · **M** · `feat/v4-t44-analytics`
- **Créer** : axe analytique (food/bev/événementiel) sur écritures, `BudgetService`, attribution campagne→couvert (RFM + réservations).
- **AC** : P&L par flux ; budget vs réalisé ; ROI campagne mesurable ; NF525 non altéré.
- **Merge** : après vague 0.

---

# VAGUE 5 — Expérience & plateforme *(parallélisable)*

### T45 — a11y : parcours critiques (POS/KDS/résa)
`[C5.1/B2]` · **M** · `feat/v5-t45-a11y-core`
- **Modifier** : composants POS/KDS/réservations (rôles ARIA, labels, focus, clavier) ; **Créer** CI axe-core.
- **AC** : parcours critiques passent l'audit a11y ; CI verte.
- **Merge** : parallèle. *(Reste des écrans en tickets suivants T45b…)*

### T46 — « Mon espace » salarié + bulletin
`[C5.2/serveur]` · **M** · `feat/v5-t46-my-space`
- **Créer** : `src/app/(client)/(ops)/mon-espace/page.tsx` (+ `TaskContext`) agrégeant planning/pointage/congés/pourboires/bulletin/formations.
- **Modifier** : exposer bulletin individuel lecture seule depuis `paySlipGenerator` (distinguer estimation vs bulletin scellé) ; scoping renforcé.
- **AC** : employé consulte SES données uniquement ; aucun collègue visible.
- **Merge** : après T36 (pourboires).

### T47 — Waitlist + handoff + reconnaissance client
`[C5.3/G3,G8,hôtesse]` · **M** · `feat/v5-t47-host`
- **Créer** : `src/modules/commerce/reservations/Waitlist.ts` (+ vue), handoff addition (ownership T26 → tracé T06), reconnaissance client à l'arrivée (CRM via PiiVault T14).
- **AC** : file walk-in avec temps estimé + SMS (T01) ; addition transférable ; profil habitué à l'accueil.
- **Merge** : après T26 + T14.

### T48 — Flotte : benchmarking + rollout multi-sites
`[C5.4/super_admin]` · **M** · `feat/v5-t48-fleet`
- **Modifier** : `FleetCommander`/`FleetTelemetry` (benchmarking par agrégats — jamais de détail cross-tenant), rollout menu/config/template (T10).
- **AC** : comparaison à la médiane flotte ; déploiement multi-sites en une action ; isolation tenant stricte.
- **Merge** : après T10.

### T49 — Marketplaces (Uber/Deliveroo)
`[C5.5/G9]` · **L** · `feat/v5-t49-marketplaces`
- **Créer** : connecteurs `src/modules/commerce/delivery/aggregators/*` (commandes→KDS, sync catalogue, commissions), réconciliation versements.
- **AC** : commande plateforme → KDS + comptabilisée commission incluse ; vente scellée NF525.
- **Merge** : après T34 (86-ing).

### T50 — Maintenance prédictive (température HACCP)
`[C5.5/G26]` · **S** · `feat/v5-t50-predictive`
- **Créer** : `src/modules/compliance/haccp/tempTrend.ts` (dérive frigo → alerte T01).
- **AC** : dérive détectée avant panne → alerte.
- **Merge** : après T01.

### T51 — Résilience IA : circuit-breaker + fallback
`[C5.6/B9]` · **M** · `feat/v5-t51-ai-resilience`
- **Modifier** : `src/modules/intelligence/rag/LightRAGClient.ts` (circuit-breaker), fallback déterministe + bannière d'état sur écrans Oracle/analytics.
- **AC** : couper Gemini/LightRAG → écrans utilisables en dégradé + message clair.
- **Merge** : parallèle.

### T52 — i18n / multi-devise  ⛔ *différé — décision requise*
`[C5.7/B8]` · **XL** · `feat/v5-t52-i18n`
- **Bloqué** par CLAUDE.md : ne pas démarrer sans arbitrage stratégique d'expansion.
- **AC** : à définir à la décision.

---

## Ordre de merge (résumé DAG)

```
T00 ─┬─ T01 ─ T02
     ├─ T03 ─ T04           ├─ (T05 parallèle)
     ├─ T06 ─ T07 ─┬─ T08 ─ T09 ─ T10
     │             └─ (audit dispo pour T17/T40/T43)
     └─ (flags)

VAGUE 1 : T13 ⇒ T14 ⇒ T15 ; T11 ⇒ T12 ; T16 ⇒ {T17,T18⇒T19} ; T20 ⇒ T21 ; T22 ⇒ T23 ⇒ T24 ; T14 ⇒ T25
VAGUE 2 : (T20) ⇒ T26 ; T20 ⇒ T27 ⇒ T28 ⇒ T29(+T11,T14) ; T30
VAGUE 3 : T14 ⇒ T31 ⇒ T32 ; T09,T14 ⇒ T33 ; T27 ⇒ T34 ; T01 ⇒ T35 ; T26 ⇒ T36
VAGUE 4 : T08 ⇒ T37 ⇒ {T38(+T09), T39} ; T03,T06 ⇒ T40 ; T41 ; T40,T41 ⇒ T42 ; T07,T40 ⇒ T43 ; T44
VAGUE 5 : T45 ∥ ; T36 ⇒ T46 ; T26,T14 ⇒ T47 ; T10 ⇒ T48 ; T34 ⇒ T49 ; T01 ⇒ T50 ; T51 ∥ ; T52 (différé)
```

**Chemin critique global** : `T00 → T06 → T07 → T08 → T09` (socle contrôle) puis `T13 → T14` (RGPD, à trancher en //). Tout le reste s'ordonne derrière ces deux racines.

---

*53 tickets (T00–T52). Chaque ticket = 1 PR. Respecter §0 du plan à chaque merge.*
