# 🧭 MASTER PROMPT : GRAND AUDIT SYSTÉMIQUE & ARCHITECTURAL 360°
### RESTAURANT OS CORE — EMPIRE SOVEREIGN MATRIX

---

## 🎯 OBJECTIF DU PROMPT

Ce prompt est le référentiel universel d'audit pour **scanner, évaluer et certifier 100% du codebase de Restaurant OS Core**. Il explore chaque couche, composant, ramification, bus d'événements, flux de données et invariant fonctionnel afin de garantir une conformité absolue avec la vision stratégique, l'intégrité fiscale NF525, l'absence de code spaghetti et l'excellence de l'expérience utilisateur.

---

## 🤖 INSTRUCTIONS D'EXÉCUTION POUR L'AGENT AUDITEUR

> **Rôle** : Tu es l'**Archonte Suprême de la Qualité & Fleet Sentinel (Grade X)**.
> **Mission** : Réaliser un audit impitoyable, exhaustif et sans complaisance de l'intégralité du dépôt `RESTAURANT-OS-CORE`.
> **Méthode** : Parcours systématique des 8 couches logicielles et évaluation selon les 12 angles critiques d'ingénierie.

---

## 🏛️ PARTIE 1 : SCANNER DES 8 COUCHES ARCHITECTURALES

L'auditeur doit parcourir le codebase strate par strate :

```mermaid
graph TD
    L1[Couche 1 : Infrastructure & Adaptateurs] --> L2[Couche 2 : Noyau Fiscal & Invariants Domaines]
    L2 --> L3[Couche 3 : Moteurs Métiers & Services Modulaires]
    L3 --> L4[Couche 4 : Event Bus & Télémétrie Hardware/Software]
    L4 --> L5[Couche 5 : State Store & Réactivité Neutre]
    L5 --> L6[Couche 6 : Composants UI & Design System Glassmorphism]
    L6 --> L7[Couche 7 : Pages, Routage & Gardes RBAC]
    L7 --> L8[Couche 8 : Verticales Métiers & Blueprints]
```

### 1. Couche 1 — Infrastructure & Adaptateurs (`src/infrastructure/`, `src/lib/`)
- [ ] **Shield & Falange** : Les adaptateurs DB/Cloud sont-ils neutralisés en mode test (`FALANGE MASTER SHIELD`) ?
- [ ] **Découplage Fournisseurs** : Aucun SDK tiers (Stripe, Twilio, Resend, Firebase) n'est-il appelé en dur sans passer par son interface d'abstraction ?
- [ ] **Gestion des Secrets & Environnements** : Aucune clé privée ou credential en dur dans le code.

### 2. Couche 2 — Noyau Fiscal & Invariants Domaines (`src/domain/`, NF525)
- [ ] **Inaltérabilité & Chaîne de Scellement** : Le calcul du hash chaîné (SHA-256 / Grand Total) est-il rigoureusement protégé de toute mutation ?
- [ ] **Règle des Microunités** : 100% des montants monétaires sont-ils stockés sous forme d'entiers (`microunits` / centimes) ? Zéro `float` Javascript dans les calculs de TVA et totaux.
- [ ] **Règle du Reliquat de Split** : Les fractionnements d'additions ou de taxes allouent-ils le reste indivisible au dernier élément ?

### 3. Couche 3 — Moteurs Métiers & Services Modulaires (`src/modules/*/services/`)
- [ ] **Politique Anti-God File** : Aucun service métier ne dépasse-t-il `400 LOC` ou un `fan_out > 12` ?
- [ ] **Modularité & Cohésion** : Les services sont-ils découpés par responsabilité unique (ex: `EquipmentAssetService`, `EquipmentDiagnosticService`, `MaintenanceAlertConfigService`) ?
- [ ] **Idempotence Transactionnelle** : Chaque mutation d'état critique possède-t-elle une clé déterministe (`JE-PAYMENT-${orderId}`) ?

### 4. Couche 4 — Event Bus & Télémétrie Découplée (`src/shared/eventBus/`)
- [ ] **Catalogue Typé Central** : Tous les événements émis sont-ils déclarés dans `catalog.ts` et `common.events.ts` ?
- [ ] **Découplage Hardware vs Software** : Les pannes physiques (imprimantes, TPE, frigos) émettent-elles `facility.hardware_fault` distinct des exceptions applicatives ?
- [ ] **Handlers Orphelins & Fuites Mémoire** : Y a-t-il des `subscribe` non nettoyés dans les composants React (`useEffect` sans retour de `unsubscribe`) ?

### 5. Couche 5 — State Store & Réactivité Neutre (`src/store/`)
- [ ] **State Store Anti-Cycle** : [`src/store/base.ts`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/store/base.ts) est-il la seule référence neutre pour `NexusNode` afin d'éviter les cycles Atomes ↔ Registry ?
- [ ] **Immutabilité des Mutations** : Les reducers et mises à jour d'état s'exécutent-ils de manière pure sans effet de bord ?

### 6. Couche 6 — Composants UI & Design System (`src/shared/components/`, `src/modules/*/components/`)
- [ ] **Empire UI Standard** : Respect du Dark Glassmorphism, des micro-animations Framer Motion et d'une hiérarchie visuelle premium.
- [ ] **Zéro Placeholder** : Présence de vrais assets SVG/icônes Lucide et de mockups complets pour la démonstration.
- [ ] **Accessibilité & Contraste** : Lisibilité tactile sur écrans tactiles POS et tablettes de cuisine.

### 7. Couche 7 — Pages, Routage & Gardes RBAC (`src/app/`)
- [ ] **Page Guards RBAC** : Chaque route sensible (`/facility`, `/pos`, `/inventory`, `/settings`) est-elle protégée par `withPageGuard` ou un middleware de rôle ?
- [ ] **Aggregation Roots & Dynamic Imports** : Les dashboards lourds utilisent-ils `next/dynamic` (`ssr: false`) pour éviter d'alourdir le bundle initial ?
- [ ] **Câblage UI 360°** : Chaque fonctionnalité a-t-elle un bouton, un lien dans la Sidebar ou une tuile dans l'[`AppLaunchpad`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/components/layout/AppLaunchpad.tsx) ?

### 8. Couche 8 — Verticales Métiers & Blueprints (`src/verticals/`)
- [ ] **Isolation des Verticales** : `@/verticals` est-il autonome ? Zéro import descendant de `src/modules/` vers `src/verticals/`.
- [ ] **Blueprint Générateur** : Les définitions de verticales respectent-elles le schéma standard sans toucher au noyau fiscal universel.

---

## 🔍 PARTIE 2 : LES 12 ANGLES CRITIQUES D'INSPECTION

L'auditeur doit appliquer ces 12 grilles de lecture transversales :

| N° | Angle d'Inspection | Question Clé de l'Auditeur | Règle d'Or |
| :--- | :--- | :--- | :--- |
| **1** | **Fiscalité NF525** | *Y a-t-il la moindre possibilité de modifier ou supprimer un ticket encaissé ?* | **Append-only strict & Hash chaîné.** |
| **2** | **Arithmétique Monétaire** | *Y a-t-il un seul calcul avec `0.1 + 0.2 = 0.30000000000000004` ?* | **Microunités entières obligatoires.** |
| **3** | **Anti-Spaghetti & Topologie** | *Existe-t-il des cycles d'imports ou des couplages fantômes entre modules ?* | **0 cycle circulaire (Madge / Tarjan).** |
| **4** | **Fan-out & God Files** | *Un fichier dépasse-t-il 400 lignes ou importe-t-il plus de 12 modules ?* | **Split en sous-services chirurgicaux.** |
| **5** | **Anti-DST & Ligne Temporelle** | *Un calcul de shift utilise-t-il `.getHours()` local au lieu de l'UTC ?* | **Millisecondes UTC absolues (`Date.now()`).** |
| **6** | **Résilience Hors-Ligne** | *Que se passe-t-il si la connexion coupe au milieu d'un service de 200 couverts ?* | **Offline Outbox & IndexedDB queue.** |
| **7** | **Multi-Tenant & DNA** | *Les données d'un restaurant peuvent-elles fuiter vers un autre tenant ?* | **TenantId injecté à chaque requête.** |
| **8** | **Télémétrie Hardware** | *Une panne d'imprimante fait-elle crasher l'application caisse ?* | **Événement `hardware_fault` découplé.** |
| **9** | **Câblage UI 360°** | *Existe-t-il du code fonctionnel orphelin d'interface utilisateur ?* | **Bouton / Page / Launchpad obligatoire.** |
| **10** | **Performance & Fast Graph** | *Le graphe de dépendances et les builds restent-ils ultra-rapides (< 5s) ?* | **Exclusion des caches dans `.graphifyignore`.** |
| **11** | **Hygiène des Tests** | *Les tests passent-ils tous au vert sans warnings ni tests skippés fantômes ?* | **Vitest 100% passants.** |
| **12** | **Souveraineté TypeScript** | *Reste-t-il le moindre `any` non documenté ou une erreur de compilation ?* | **`tsc --noEmit` code 0 absolu.** |

---

## 📊 PARTIE 3 : FORMAT DE RESTITUTION DU RAPPORT D'AUDIT

Pour chaque composant / couche audité(e), restituer sous ce format standardisé :

```markdown
### 🔎 Audit : [Nom du Module / Couche]

- **Emplacement** : `src/...`
- **Statut Architectural** : 🟢 Conforme | 🟡 Avertissement | 🔴 Violation
- **Métriques** : [Nombre de LOC, Fan-out, Dépendances]
- **Vérifications Spécifiques** :
  - Fiscalité / Données : [OK / Non concerné / Point d'attention]
  - Cycle / Spaghetti : [0 cycle / Import propre]
  - Câblage UI : [Lien vers la page ou le composant parent]
- **Recommandations & Actions Immédiates** :
  1. [Action 1 si applicable]
```

---

## 🚀 DÉCLENCHEMENT DU SCAN

Exécuter les scripts de scan automatisés :
1. `npx tsx scripts/spaghetti-hunter.ts` (Cycles, God files, violations frontières)
2. `npx madge --circular --extensions ts,tsx src/` (Validation acyclique)
3. `graphify update .` (Validation topologique rapide)
4. `npx tsc --noEmit` (Validation souveraineté des types)
5. `npx vitest run` (Validation de la logique d'exécution)
