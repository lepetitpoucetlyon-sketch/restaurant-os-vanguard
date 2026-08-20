# MCC_VALIDATION_CHECKLIST.md (Mission Control Center)

## Liste de Contrôle Suture & Isolation (Grade X)

- [x] **Hubs Découplés** : `NexusInternalMapper` et `FleetTelemetryService` opèrent strictement comme des Facades.
- [x] **Zéro Any** : Les flux Firestore (ex: `FirestoreAdapter`) n'utilisent plus `any` (Remplacé par `unknown` et casting strict via imports).
- [x] **Zéro Cast Frontend** : Les composants ne manipulent plus `as any`.
- [x] **Mathématiques Souveraines** : `SovereignMath.ts` validé pour les calculs de microunits.
- [x] **Ratio Cible Atteint** : Ratio mesuré post-suture <= 1.3.
- [x] **Atlas Bridge Sync** : Le `GRAPH_REPORT.md` a été généré et mis à jour après la suture.

## Liste de Contrôle Audit Multi-Dimensionnel (2026-07-28)

- [x] **ICM-lite — routes HR couvertes** : `planning`, `timeclock`, `recruitment` déclarés dans `TASK_MAPS` avec `staff: 'HIGH'` — fini le chargement LAZY sur les pages RH.
- [x] **Tests TicketZHandler** : 7 cas dans `src/__tests__/infrastructure/TicketZHandler.test.ts` — post-clôture, idempotence, format Z_YYYYMMDD.
- [x] **Tests SovereignGuard.requiresSignedWrite** : Cas `orders` (signé) et `products`/`reservations` (non signé) vérifiés.
- [x] **0 cycles architecturaux** : 3 cycles circulaires supprimés (crmImporter, reservationsImporter, NewQuoteDialog) — sentrux green.
- [x] **Observabilité FEC/bank/oracle** : `logger.error` en catch sur les 3 routes ; suppression des `String(err)` exposés au client.
- [x] **HMAC webhooks** : `verifySignature` sur IDeliveryProvider / IReservationProvider / IIoTProvider ; UberEats + Zenchef implémentés ; 3 routes delivery/reservations/iot sécurisées avec fallback Bearer.
- [x] **Fail-closed Google Reserve** : 4 routes refusent si marchand/service introuvable (plus de `fail-open`).
- [x] **Validation Zod API** : `/api/reservations` et `/api/hr/employees` — schémas Zod stricts, suppression des `body spread` non validés.
- [x] **Microunits stricts** : StripePaymentProvider, finance/sync, Quotes, Campaign migrés — plus de `BigInt` unsafe ni de `priceInCents` dans le nouveau code.
- [x] **tenantId depuis token** : `finance/sync` extrait `tenantId` du token Firebase uniquement — vecteur d'escalade body-tenantId éliminé.
