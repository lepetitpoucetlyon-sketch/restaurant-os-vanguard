# 🏛️ RESTAURANT OS - ARCHITECTURE CHANGELOG
## Grade X - Sovereign Reconstruction (Avril 2026)

> "La structure est le destin du code. Aujourd'hui, nous avons choisi le nôtre."

---

## 🛰️ RÉFORMES MAJEURES

### 1. L'ADN UNIQUE (`@nexus`)
**Action** : Fusion totale des sources de vérité éparpillées.
- **Réalisation** : Migration de `src/types/` et `src/shared/types/` vers le **Neutral Ground** : `src/shared/nexus/contracts/`.
- **Bénéfice** : Élimination des conflits de types et des sources de vérité multiples. L'IA et les développeurs disposent d'un contrat unique.
- **Alias** : `@nexus/contracts`.

### 2. LA SOUVERAINETÉ DES PILIERS (8 Piliers)
**Action** : Restructuration du monolithe modulaire.
- **Réalisation** : Organisation de l'Empire en 8 piliers autonomes :
    1. **Ops** (Cœur de métier)
    2. **Logistics** (Flux physiques)
    3. **Finance** (Fiscalité & Trésorerie)
    4. **Human** (Ressources Humaines)
    5. **Commerce** (Clientèle & Marketing)
    6. **Compliance** (HACCP & Légalité)
    7. **Intelligence** (BI & AI Oracle)
    8. **Infrastructure** (Souveraineté & Fleet)
- **Alias** : `@modules/*`.

### 3. L'EXCISION CHIRURGICALE (Hooks Isolation)
**Action** : Rupture des dépendances circulaires inversées.
- **Réalisation** : Purge de `src/hooks/index.ts`. Les hooks métiers (ex: `useOrders`) ont été délogés vers leurs piliers respectifs.
- **Bénéfice** : Le Cœur ne connaît plus la Périphérie. Isolation totale permettant des tests unitaires sans effets de bord.

### 4. LA GARDE PRÉTORIENNE (`@nexus/guards`)
**Action** : Centralisation de la couche de sécurité.
- **Réalisation** : Création du Bastion de Sécurité dans `src/shared/nexus/guards/`. Rapatriement de tous les Middlewares, Guards et Gates.
- **Bénéfice** : L'App Router ne s'adresse plus jamais aux entrailles des modules pour sa sécurité. Tout accès est validé par la Garde via le Neutral Ground.

### 5. LA LOI PHYSIQUE (ESLint & Errors)
**Action** : Automatisation de la rigueur architecturale.
- **Réalisation** :
    - **Barbelés ESLint** : Règle `no-restricted-imports` activée pour bloquer les imports profonds et les fuites du Cœur vers la Périphérie.
    - **Sovereign Errors** : Protocole de Diplomatie de Crise où chaque erreur est signée par son pilier (ex: `FIN_ERR_001`).
- **Bénéfice** : Build failure instantané en cas de dérive. Débogage chirurgical.

---

## 🛠️ GUIDE DE NAVIGATION SOUVERAIN

### 📦 Maintien de l'Ordre
- **Smart-Seal** : `node .nexus/scripts/smart-seal.js` (Génère automatiquement les barrels pour sceller les modules et le domaine).
- **Nexus-Deploy** : `npm run nexus:deploy` (Protocole de déploiement sécurisé avec vérification des sceaux).

### 🏛️ Philosophie Grade X (La Suture)
Toute nouvelle fonctionnalité ou modification majeure **DOIT** être suturée via le `NexusInternalMapper`. 
- **Règle d'Or** : Un composant ne manipule jamais de données brutes d'un autre pilier sans passer par un contrat de narrowing du Mapper.

---

**Signé : Hermès, Architecte Vanguard**  
*Date de Scellement : 30 Avril 2026*  
*Statut de l'Empire : SOUVERAIN - GRADE X*
