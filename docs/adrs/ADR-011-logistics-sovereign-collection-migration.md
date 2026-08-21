# ADR-011 — Migration du pilier logistics vers useSovereignCollection

- **Statut** : Adopté (Phase 3 — 2026-08-21)
- **Contexte** : Plan Master P4.3, suite d'ADR-009 (finance) et ADR-010 (ops)

## Décision

Migrer deux collections mutables critiques du pilier logistics :

| Collection | Adapter | Cas d'usage |
|---|---|---|
| `stocks` | `useSovereignStocks` | Chef qui ajuste le stock en cave sans wifi (casse, perte), réassort après vente |
| `supplierInvoices` | `useSovereignSupplierInvoices` | Facture fournisseur photographiée en livraison (sans wifi), extraction/validation offline |

### Implémentation

**Adapters** — `src/modules/logistics/hooks/`
- `useSovereignStocks.ts` : `create / adjustQuantity / setQuantity / setThresholds / updatePrice / stampAudit / remove`
  - Filtres : `supplierId`, `onlyBelowThreshold`
  - `adjustQuantity` clampe à 0 pour éviter les stocks négatifs
- `useSovereignSupplierInvoices.ts` : `create / attachExtraction / validate / reject / markPosted / remove`
  - Cycle status : `draft → extracted → validated → posted | rejected`
  - `markPosted` trace l'`id` du journal entry côté finance (pour la piste d'audit)

**Composant preuve** — `StockLowLevelBoard.tsx`
- Liste des articles sous le seuil (rouge/jaune/vert selon niveau)
- Ajustement inline ±1, stamp audit
- Optimistic UI + indicateur isSyncing

**Tests** — 11 tests bloquants :
- `useSovereignStocks.test.ts` (6) : create default 0, clamp adjust, refus négatif, filtre threshold, audit
- `useSovereignSupplierInvoices.test.ts` (5) : cycle complet, reject, filtre status
- +2 non-régression NF525

### Ne PAS migrer
- `procurement/purchaseOrders` : workflow multi-approbations, cas séparé
- `inventoryTransactions` : logs immuables (append-only), à traiter comme événements

## Conséquences
- Résilience terrain pour l'inventaire (cas d'usage offline le plus critique du produit)
- Le chef peut prendre 40 kg de viande en réception sans réseau, tout est capturé
- L'extraction IA d'une facture (via `InvoiceExtractionService`) peut s'attacher à un draft créé offline

Voir [[ADR-009]] et [[ADR-010]] pour le pattern général.
