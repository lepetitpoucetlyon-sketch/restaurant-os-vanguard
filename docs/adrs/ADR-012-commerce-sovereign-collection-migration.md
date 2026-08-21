# ADR-012 — Migration du pilier commerce vers useSovereignCollection

- **Statut** : Adopté (Phase 4 — 2026-08-21)
- **Contexte** : Plan Master P4.3, suite d'ADR-009 → ADR-011

## Décision

Migrer trois collections mutables du pilier commerce :

| Collection | Adapter | Cas d'usage |
|---|---|---|
| `customers` | `useSovereignCustomers` | Créer/éditer une fiche client au comptoir, en tournée traiteur |
| `quotes` | `useSovereignQuotes` | Édition d'un devis chez un client (offline complet) |
| `loyaltyAccounts` | `useSovereignLoyalty` | Solde de points fiable même sans réseau |

### Implémentation

**Adapters** — `src/modules/commerce/hooks/`
- `useSovereignCustomers` : `create / updateContact / addTag / removeTag / setSegment / recordVisit`
  - `recordVisit` recalcule automatiquement moyenne et total
  - `addTag` idempotent (pas de doublons)
  - Filtres : `segment`, `search` (matche nom+téléphone+email)
- `useSovereignQuotes` : cycle `draft → sent → accepted/rejected → converted`
  - `convert(id, orderId)` lie au bon `Order` créé via `useSovereignOrders`
- `useSovereignLoyalty` : `earn / redeem / setTier`
  - `earn` bump points ET lifetimePoints
  - `redeem` bump points uniquement (préserve lifetime)
  - Refus si solde insuffisant OU points <= 0

**Composant preuve** — `CustomersDirectory.tsx`
- Annuaire CRM avec recherche + filtres segments
- Création inline, tags inline (VIP en un clic), suppression tag
- Optimistic UI + indicateur isSyncing

**Tests** — 14 tests bloquants :
- `useSovereignCustomers.test.ts` (5) : create defaults, recordVisit, addTag idempotent, search filter
- `useSovereignQuotes.test.ts` (5) : cycle draft→sent→converted, reject, customerId filter
- `useSovereignLoyalty.test.ts` (5) : earn/redeem semantics, refus solde insuffisant / points invalides

### Ne PAS migrer
- `loyaltyTransactions` : log immuable (append-only)
- `campaigns` marketing : lifecycle complexe (drafts, planifiées, envoyées) — cas séparé

## Conséquences
- La CRM reste propre même en zone mal couverte
- Le commercial peut éditer un devis chez un client, envoyer offline (queued), sync au retour
- Le solde de fidélité est optimistique — le client voit immédiatement ses points
