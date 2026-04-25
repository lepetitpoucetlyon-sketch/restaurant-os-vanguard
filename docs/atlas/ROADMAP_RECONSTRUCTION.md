# 🛡️ PLAN D'IMPLÉMENTATION : RECONSTRUCTION AGENTIQUE (GRADE X)

Ce plan définit la méthode de travail entre Antigravity (Conseiller) et Hermes (Exécuteur) dans une zone isolée.

## 🚧 STRATÉGIE DE "SAFE STAGING"
Pour garantir la souveraineté totale et éliminer tout risque de régression sur le code original :
- **RESTAURANT-OS-VANGUARD** (Original) : Géré par **Antigravity**. Aucune modification majeure sans validation du Staging.
- **RESTAURANT-OS-STAGING** (Copie) : Géré par **Hermes Agent**. Zone de test pour la restructuration profonde.

## 🔬 PHASES D'EXÉCUTION SUR LE STAGING

### PHASE 1 : AUDIT GÉNOMIQUE (HERMES)
- Hermes scanne l'intégralité du Staging pour identifier les incohérences de typage, les dettes techniques et les dérives par rapport à l'Atlas.
- Livraison d'un rapport d'audit détaillé.

### PHASE 2 : LA SUTURE ATOMIQUE & CHÂSSIS MODULAIRE
- Hermes implémente l'unification des atomes Jotai dans le Staging.
- Création de la structure du Monolithe Modulaire (Hégémonies).

### PHASE 3 : VALIDATION & TRANSPLANTATION
- Audit du code produit par Hermes par Antigravity et le Souverain.
- Suture manuelle du code validé vers le dossier VANGUARD (Original).

## 🚀 ÉTAPES IMMÉDIATES
1. [x] Création du dossier `RESTAURANT-OS-STAGING`.
2. [ ] Initialisation de Hermes dans le Staging.
3. [ ] Lancement de l'Audit Global par Hermes.

---

## 🏛️ MILESTONE 1 : LA SUTURE ATOMIQUE
**Focus** : Intégrité de l'état global et de l'UI.
- **Action** : Unifier `masterAtoms`, `operationalAtoms` et `fleetAtoms` dans un `SovereignStore` unique.
- **Raison** : Éliminer les bugs de "Split-Brain" (doubles menus, décalages UI).
- **Critère de succès** : Une UI stable à 100% sur toutes les instances.

## ⚙️ MILESTONE 2 : LA SCISSION DU BACKEND
**Focus** : Modularisation des Cloud Functions.
- **Action** : Éclater `functions/src/index.ts` en services isolés par domaine (`finance.ts`, `hr.ts`, `ops.ts`).
- **Raison** : Isolation des pannes et facilité de maintenance.
- **Critère de succès** : Déploiement indépendant des services métiers.

## 🛡️ MILESTONE 3 : L'HÉGÉMONIE DES DOMAINES
**Focus** : Isolation stricte du code (Domain-Driven Design).
- **Action** : Enforcer les frontières entre les modules. Utilisation de `shared-kernel` pour les types communs uniquement.
- **Raison** : Éviter le "plat de spaghettis" technique.
- **Règle Hermes (Isolation)** : Aucun import direct entre domaines autorisés. Tout doit passer par le `shared-kernel` ou des interfaces injectées.
- **Critère de succès** : Zéro dépendance croisée illégale entre les domaines.

## 🌉 MILESTONE 4 : LE PONT SOUVERAIN
**Focus** : Abstraction de la couche de données (Indépendance Cloud).
- **Action** : Implémenter le pattern Repository. Séparer la logique métier de la syntaxe Firebase.
- **Raison** : Ne plus être prisonnier d'un seul fournisseur Cloud (Google).
- **Critère de succès** : Possibilité de switcher d'adaptateur de données sans modifier le code métier.

## 💎 MILESTONE 5 : LE DURCISSEMENT GRADE X
**Focus** : Sécurité, Résilience et Certification.
- **Action** : Déploiement du `MonkeyChaosAgent` et signature cryptographique systématique des mutations.
- **Raison** : Atteindre le niveau de confiance industrielle maximale.
- **Critère de succès** : Système résilient aux pannes simulées et auditable fiscalement (NF525).
