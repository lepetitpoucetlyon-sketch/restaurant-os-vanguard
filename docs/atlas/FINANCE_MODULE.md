# 🏛️ FINANCE MODULE (Ledger & Compliance)

Le bastion fiscal de Restaurant OS qui gère la comptabilité, le scellement NF525 et les flux financiers.

## 1. Responsabilités & Objets (Domain)
- **Journal Ledger** : Enregistrement de toutes les écritures comptables (PCG).
- **Scellement Fiscal (NF525)** : Signature numérique immuable de chaque vente.
- **Plan Comptable (Accounts)** : Structure des comptes de l'instance.
- **Rapprochement Bancaire** : Synchronisation des transactions et notes de frais.

## 2. Flux de Synchronisation (`finance.sync.ts`)
- **Fiscal Ledger Sync** : Limité aux 50 derniers scellements pour la performance, avec tri par `timestamp`.
- **Hydratation Dexie** : Utilise `db.fiscalSeals` pour garantir que l'historique de scellement reste accessible même sans connexion.
- **Intégrité Binaire** : Chaque mouvement est enregistré via `NexusForge` pour maintenir une cohérence d'audit parfaite.

## 3. État Atomique (`accountingAtoms.ts`)
- **Proxy Domains** : Utilisation de `createProxyDomain` pour `journalEntries`, `accounts`, `bankTransactions`, et `expenseClaims`.
- **Vue Contextuelle** : `accountingViewModeAtom` permet de basculer entre une interface simplifiée et une vue comptable experte.
- **Loading Orchestrator** : `accountingLoadingAtom` agrège l'état de chargement de tous les sous-domaines financiers.

## 4. Règles d'Immuabilité
- **Scellement NF525** : Une fois une vente validée et scellée, aucune modification n'est autorisée. Toute correction doit passer par une écriture d'annulation (avoir).
- **Signature Digitale** : Chaque seal contient un hash SHA-256 chaîné au seal précédent pour garantir l'absence de manipulation.

## 5. Points de Vigilance
- **Synchronisation Partielle** : Le limit à 50 sur le ledger fiscal signifie que pour un audit complet (FEC), une procédure d'exportation spécifique est nécessaire.
- **Liaison Ops** : La clôture d'une commande dans le module Ops est le déclencheur critique pour le service de scellement NF525.
