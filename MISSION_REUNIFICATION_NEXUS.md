# MISSION HERMÈS : PROTOCOLE DE RÉUNIFICATION (GRADE X)

**Cible** : /Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE
**Objectif** : Résoudre la fracture entre le Master Navigation (35 modules) et le Runtime Nexus.

## 🛑 ÉTAT D'URGENCE : LE DIAGNOSTIC "CODEX"
Le projet est en "schizophrénie fonctionnelle". La navigation annonce un Empire (35 modules), mais le cœur (Nexus) ne possède pas les mappers pour les faire vivre. La priorité n'est pas le rangement, c'est la soudure.

### Les 3 Points de Rupture :
1. **Le Pont Brisé** : Le passage de `SovereignNode` (générique) vers les types métier (Table, Order, Product) est incomplet. Source des 170 erreurs TS.
2. **L'Identité Fantôme** : Des constantes vitales comme `OperationalIdentity.STAFF` ou `OperationalIdentity.LEDGER` sont appelées sans exister.
3. **La Pollution Spatiale** : Les dossiers `.staging-mcc`, `src_OLD_VIBE_BACKUP`, et `_ARCHIVES_` créent des interférences.

## 🗺️ LA ROADMAP DE SUTURE (6 PHASES)
- **P1 : Hémorragie TS** -> Créer les mappers : SovereignNode -> BusinessTypes.
- **P2 : Alignement Nexus** -> Réparer `nexus-contract.ts` (Identities & GuardedActions).
- **P3 : Suture des Façades** -> Restaurer les méthodes dans `NexusOpsProvider.tsx` (addRecipe, etc.).
- **P4 : Réconciliation UI** -> Aligner `navigation.ts` sur les routes réelles.
- **P5 : Unification** -> (Après compilation verte) 1 Module UI = 1 Dossier.
- **P6 : Grande Purge** -> Élimination physique des dossiers fantômes.

## 🛠️ INSTRUCTIONS D'EXÉCUTION IMMÉDIATE (SPRINT 1)
1. **Le Pont de Type (Priority Zero)** : Focus sur `src/shared/types/nexus-bridge.ts`. Créer des fonctions de narrowing.
2. **Restauration des Identités** : Injecter les énumérations manquantes dans `src/engines/ops/nexus-contract.ts`.
3. **Stabilisation de la Navigation** : Aligner `src/config/navigation.ts` (Redirection ComingSoon si non prêt).

## 🚨 ORDRE DE MARCHE POUR HERMÈS
"Hermès, soude le cœur avant de ranger la maison.
**INTERDICTION** de déplacer des fichiers de modules pour le moment.
**ACTION 1** : Répare `NexusOpsProvider.tsx` et les mappers de domaine. Objectif : < 50 erreurs TSC.
**ACTION 2** : Corrige `OperationalIdentity` et les permissions POWER_USER.
**ACTION 3** : Ignore totalement `.staging-mcc` et `src_OLD_VIBE_BACKUP`.
**RESTRUCTURATION INTERDITE** tant que le TypeCheck n'est pas VERT."
