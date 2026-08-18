# ADR-003 : Scellement Fiscal Inaltérable NF525 & Archives WORM

- **Statut** : ACCEPTÉ
- **Date** : 2026-08-18
- **Auteurs** : Fleet Vanguard & Fiscal Compliance Sentinel

## 1. Contexte & Problématique
La réglementation fiscale française (NF525 / Code Général des Impôts article 286-I-3° bis) impose des conditions strictes d'inaltérabilité, de sécurisation, de conservation et d'archivage des données d'encaissement et de clôture (Z de caisse, Grand Total perpétuel).

## 2. Décision Architecturale
1. **Collections Immuables (Write-Once Append-Only)** :
   - Les collections `fiscalLedger`, `fiscalSeals`, `journalEntries`, `haccpLogs`, `auditTrails` et `wormArchives` sont marquées immuables dans `SovereignGuard.IMMUTABLE_COLLECTIONS`.
   - Les opérations `DELETE` et `UPDATE` (y compris en batch et transactions) sur ces chemins sont interceptées et levées en erreur `NF525_VIOLATION`.
2. **Chaîne de Scellement HMAC-SHA256 & Grand Total** :
   - Chaque écriture fiscale génère un scellement chaîné incorporant le hash du scellement précédent (`previousSealHash`), le cumul perpétuel en microunités (`grandTotalInMicrounits`) et l'horodatage UTC absolu.
   - Les tickets imprimés (`usePrintReceipt`) portent obligatoirement le numéro de ticket, le numéro SIRET de l'établissement, l'horodatage de certification et l'empreinte cryptographique `nf525Hash`.

## 3. Conséquences
- Conformité fiscale garantie au niveau architectural sans possibilité d'altération accidentelle ou frauduleuse.
