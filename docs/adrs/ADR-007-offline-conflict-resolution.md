# ADR-007 : Résolution de Conflits Offline et Priorités Fiscale & Métier

## Contexte
En cas de coupure réseau prolongée, plusieurs caisses (POS 1, POS 2, serveurs mobiles) peuvent enregistrer des opérations concurrentes hors-ligne.
À la reconnexion, la synchronisation vers le cloud Firestore / Nexus doit réconcilier les données sans perte, sans doublon, et dans le respect absolu de la norme NF525.

## Matrice de Décision par Collection

| Collection | Stratégie de Résolution | Règle Métier Invariante |
| :--- | :--- | :--- |
| **`journalEntries` / `fiscalSeals`** | **WORM Immuable (Append-Only)** | Jamais de merge ni d'écrasement. Chaque caisse scelle sa propre chaîne locale, puis fusionne chronologiquement. |
| **`orders` (Commandes soldées)** | **Immuable après paiement** | Une commande encaissée ne peut être modifiée. Tout ajustement passe par un avoir / extourne. |
| **`orders` (En cours de service)** | **Merge par Item (CRDT-like)** | Si 2 serveurs ajoutent des plats sur la même table, les items s'additionnent. |
| **`stockMovements`** | **Mouvements Delta Relatifs** | Ne jamais écraser le stock absolu ; appliquer la somme des déductions d'ingrédients. |
| **`reservations` / `customers`** | **Last-Write-Wins (`updatedAt`)** | Le champ `updatedAt` le plus récent fait foi. |

## Règle de l'Outbox
Toute mutation locale passe par l'**`OutboxService`** avec un `eventId` unique déterministe pour garantir l'idempotence stricte à la reconnexion.
