# 🛡️ HACCP MODULE (Safety & Quality)

Le gardien de la sécurité alimentaire et de la conformité réglementaire de Restaurant OS.

## 1. Responsabilités & Objets (Domain)
- **Traçabilité (Hygiene Labels)** : Étiquetage et suivi de la DLC des produits.
- **Registres Sanitaires** : Logs d'hygiène, de réception des marchandises, de gestion des huiles et des déchets.
- **Maintenance** : Suivi technique des équipements (fours, chambres froides).
- **Capteurs (Sensors)** : Surveillance en temps réel des températures (réelles ou simulées).

## 2. Flux de Synchronisation (`haccp.sync.ts`)
- **Hygiene Labels Sync** : Limité aux 100 dernières étiquettes.
- **Maintenance Sync** : Limité aux 100 derniers logs.
- **Intégrité Transactionnelle** : Utilisation systématique de `useNexusMutation` avec le `moduleId: 'HACCP'` pour garantir que chaque relevé est infalsifiable et horodaté dans le Sovereign Ledger.

## 3. État Atomique (`complianceAtoms.ts`)
- **Aggregateur de Chargement** : `guardLoadingAtom` centralise l'état de 7 sous-domaines différents.
- **Simulation de Capteurs** : `sensorsAtom` permet de simuler des relevés (ex: `ROTISSERIE_CORE_TEMP`) en l'absence de hardware réel, assurant que les interfaces de monitoring restent fonctionnelles et "vivantes".

## 4. Règles de Conformité
- **Score de Santé** : Le système calcule un score de conformité basé sur la présence et la validité des logs. Un log manquant ou une température hors-norme déclenche immédiatement une alerte critique.
- **Chaîne de Responsabilité** : Chaque log est rattaché à un `userId` pour assurer une traçabilité totale en cas de contrôle sanitaire.

## 5. Points de Vigilance
- **Volume de Données** : La traçabilité peut générer des milliers de micro-transactions. Le limit à 100 sur la synchro exige une gestion d'archivage ou de pagination efficace dans l'UI.
- **Simulation vs Réalité** : Il est crucial de bien distinguer les données simulées des données réelles dans les rapports d'audit officiels.
