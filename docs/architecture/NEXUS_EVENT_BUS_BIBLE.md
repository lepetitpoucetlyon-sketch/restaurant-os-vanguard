# 🧠 Nexus Event Bus — Bible Technique (Grade X)

## 1. Philosophie Neuro-Réactive
Restaurant OS n'est pas qu'un logiciel de caisse, c'est un ERP neuro-réactif. Le `NexusEventBus` est son système nerveux central.
- **Résilience absolue** : Les événements vitaux sont persistés en IndexedDB (Outbox) avant même d'atteindre le réseau, garantissant 0 perte de données (même en cas de crash navigateur).
- **Dead Letter Queue (DLQ)** : Tout handler en erreur est mis en quarantaine pour être rejoué plus tard (backoff exponentiel), sans faire planter le reste de la cascade.
- **Souveraineté (Grade X)** : Isolation stricte inter-tenants gérée par le `SovereignGuard` couplé au Bus.

## 2. Architecture 3-Tiers (Priorités)
- **CRITICAL** : Exécution séquentielle stricte. Si ça plante, l'événement part en DLQ et la chaîne s'arrête (ex: Sécurité tiroir, Validation Fiscale).
- **HIGH** : Exécution en parallèle (Promise.allSettled). Si l'un échoue, il part en DLQ, mais les autres terminent (ex: Déduction stock, Recalcul marge).
- **BACKGROUND** : Fire-and-forget, non bloquant (microtask). Parfait pour l'analytique et l'IA (ex: RAG, VIP Check).

## 3. Les Cascades Métier Déployées

| Déclencheur | Handler | Priorité | Effet Métier |
| --- | --- | --- | --- |
| `order.paid` | `CRMVipHandler` | BACKGROUND | Analyse de fidélité, attribution statut VIP |
| `order.paid` | `StockDeductionHandler` | HIGH | Déduction recette (BOM) -> `stock.low` |
| `haccp.alert` | `QuarantineHandler` | CRITICAL | Isolement produit (Bloque la vente) |
| `supplier.invoice_processed`| `FoodCostRecomputer` | HIGH | Recalcule les marges globales de la carte |
| `waste.logged` | `WasteToFoodCostHandler` | BACKGROUND | Cumul sur 7j -> déclenche `margin_warning` |
| `hr.transfer_offer` | `RainStaffingHandler` | HIGH | Renfort RH d'urgence (intempéries / affluence) |
| `cash_drawer.opened_unauthorized` | `CashDrawerAnomalyHandler` | CRITICAL | Anti-fraude & `sovereign.breach` |

## 4. Règle d'or : Isolation (Sentrux)
Aucun composant de présentation (UI) ne doit embarquer de logique métier (ex: "si telle marge, alors faire ça"). Les composants émettent des événements (via `emitDurable`), et les handlers isolés dans `src/orchestration/handlers/` orchestrent les cascades.
