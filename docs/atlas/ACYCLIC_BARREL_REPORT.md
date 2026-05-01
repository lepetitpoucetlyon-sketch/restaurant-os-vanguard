# 🏛️ RAPPORT D'ARCHITECTURE : ACYCLIC & BARREL FILES [GRADE X]

**Protocole de Souveraineté : Étanchéité des Dépendances**

## 1. ÉTAT DES LIEUX : BARREL FILES (`index.ts`)
Les "Barrel files" centralisent les exports d'un module. S'ils simplifient les imports, ils sont la source numéro un des dépendances circulaires (Circular Dependencies).
- **Problématique Actuelle** : L'utilisation de `export * from './module'` sans discernement crée des graphes de dépendances opaques au sein de l'empire.
- **Risque** : Les composants React et les services métier s'entremêlent, causant des erreurs `undefined` au runtime (lors du chargement des modules) et dégradant les performances de Tree-Shaking.

## 2. RÈGLE DES DÉPENDANCES ACYCLIQUES (DAG)
Le graphe de dépendance de Restaurant-OS doit être un **Directed Acyclic Graph (DAG)** absolu.
- **Le cœur métier (Domain)** ne dépend de rien.
- **L'infrastructure (Adapters/Firebase)** dépend du cœur métier.
- **L'UI (React/Next.js)** dépend de l'infrastructure et du cœur métier.

## 3. DIRECTIVES IMPÉRIALES (RÉSOLUTIONS)
1. **Zéro `export *` aveugle** : Tous les exports dans les Barrel Files doivent être nommés explicitement (`export { SovereignMath } from './SovereignMath'`).
2. **Suture des Cycles par Typage** : Utilisation stricte de l'import de types purs (`import type { INexusNode } from './types'`) pour briser instantanément les cycles liés au TypeScript.
3. **Isolation des Couches** : Un composant UI ne doit jamais être exporté par le même Barrel File qu'un service métier critique ou qu'un Atome d'état.

## 4. VERDICT ET ACTION REQUISE
Le scan de l'infrastructure montre des faiblesses potentielles autour des points de ralliement centraux (`src/shared/`).
**Prochaine étape (Suture Structurelle)** : Appliquer une règle stricte `eslint-plugin-import` (`no-cycle`) et démanteler les Barrel files transversaux entre les modules isolés de la `Nexus Fleet`.