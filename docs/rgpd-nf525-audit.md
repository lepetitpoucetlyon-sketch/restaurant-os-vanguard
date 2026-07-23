# Audit RGPD × NF525 — PII dans les données scellées

> Généré le 2026-07-23

## 1. Inventaire des PII sérialisées en clair

### 1.1 dataSnapshot (FiscalSeal)

Le `dataSnapshot` scellé par `CryptoService.canonicalStringify()` contient :

| Source | Champ PII | Risque |
|--------|-----------|--------|
| `FinancialNexusBridge.processOrder()` | `operatorId` | Identifiant salarié — pseudonyme OK car UUID |
| `FinancialNexusBridge.processOrder()` | `tableId` | Non-PII |
| `FiscalAdapter.sealEntry()` | `data` (objet complet passé) | **Dépend de l'appelant** — risque si PII injectées |

**Constat** : le dataSnapshot du bridge ne contient PAS de PII nominatives directes (pas de nom, email, téléphone). Les `operatorId` et `tableId` sont des UUID.

### 1.2 JournalEntry (journalEntries/)

| Champ | PII ? | Localisation |
|-------|-------|-------------|
| `operatorId` | UUID — pseudonyme | `FinancialNexusBridge.ts:82` |
| `description` | Contient `Table X` — non-PII | `FinancialNexusBridge.ts:93` |
| `lines[].name` | Nom de produit — non-PII | `FinancialNexusBridge.ts:107` |

### 1.3 Contrats avec PII en clair (hors scellement, mais dans Firestore)

| Collection | Champs PII | Fichier type |
|------------|-----------|-------------|
| `customers` | `firstName`, `lastName`, `email`, `phone` | `customer.types.ts` |
| `orders` | `customerName` (dénormalisé) | `ops.types.ts:45` |
| `invoices` | `customerName` | `finance.types.ts:287` |
| `quotes` | `customerName` | `marketing.types.ts:95` |
| `reservations` | `customerName`, `email`, `phone` | `commerce.types.ts:14` |

### 1.4 Risk Assessment

- **Niveau critique** : `customerName` est dénormalisé dans `orders`, `invoices`, `quotes`, `reservations` — un effacement RGPD doit toucher toutes ces collections.
- **Scellement NF525** : Les `dataSnapshot` NE contiennent PAS de PII nominatives à ce stade. Seuls des UUID y figurent. C'est une bonne posture.
- **Risque futur** : Si un développeur passe l'objet `order` complet (avec `customerName`) à `FiscalAdapter.sealEntry()`, les PII seront scellées de façon irréversible.

## 2. Décision d'architecture

### Go : Pseudonymisation par `subjectId` + PII Vault

**Stratégie retenue** :

1. **PiiVault** (`tenants/{tenantId}/piiVault/{subjectId}`) :
   - Stocke les PII (nom, email, téléphone) chiffrées par clé sujet
   - Seul point de vérité pour les données nominatives

2. **Remplacement dans les collections opérationnelles** :
   - `orders.customerName` → `orders.subjectId` (+ résolution via PiiVault en lecture)
   - `invoices.customerName` → `invoices.subjectId`
   - `reservations.customerName` → `reservations.subjectId`
   - `quotes.customerName` → `quotes.subjectId`

3. **NF525 préservé** :
   - Les dataSnapshots restent intacts (déjà sans PII nominatives)
   - La chaîne de hash n'est pas affectée
   - Les journalEntries gardent les UUID (pas de nom en clair)

4. **Effacement RGPD** :
   - Destruction de la clé sujet → PII dans le vault deviennent illisibles
   - Les données opérationnelles avec `subjectId` restent (comptabilité intacte)
   - L'historique fiscal (journalEntries, fiscalSeals) n'est pas altéré

### Garde-fous à implémenter

- [ ] T14 : Créer PiiVault + schéma `pii.ts`
- [ ] T14 : Modifier les points de sérialisation pour n'émettre que `subjectId`
- [ ] T15 : ErasureService (destruction clé)
- [ ] Lint rule : interdire `customerName` dans tout nouveau code (préférer `subjectId` + résolution)
- [ ] Revue de code : vérifier que `FiscalAdapter.sealEntry(data)` ne reçoit jamais d'objet avec PII nominatives

## 3. Collections protégées NF525 (rappel)

Ces collections sont **append-only** — JAMAIS delete, JAMAIS update :
- `journalEntries`
- `fiscalSeals`
- `fiscalLedger`

L'effacement RGPD n'y touche pas. La pseudonymisation se fait en amont.
