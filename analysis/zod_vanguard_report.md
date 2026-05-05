# VERDICT : ÉTAT DE LA FORTERESSE ZOD — SUPERFICIEL ⚠️

L'audit de densité révèle un système qui utilise Zod comme une "étiquette de sécurité" plutôt que comme un blindage actif. Bien que les schémas existent (82 définitions), ils ne sont pas connectés aux organes vitaux du système.

---

## 1. ANALYSE DES FRONTIÈRES (THE BORDER SCAN)

| Frontière | État | Diagnostic |
|---|---|---|
| **API Routes (POST/PUT)** | **CORRECT** (90%) | Utilisation de `.parse()`. C'est sûr, mais brutal : une donnée malformée fait crasher la route au lieu de renvoyer une erreur métier propre. |
| **LocalStorage** | **NUE** (0%) | **DANGER**. 30 occurrences d'accès direct. Si un utilisateur (ou un script malveillant) modifie le cache, le Store injectera des données corrompues sans broncher. |
| **Adapters (Firestore)** | **PARTIEL** (30%) | Le `FirestoreHydrator` ne protège que les Users, Orders et Modules. L'Inventory, le Staff et le CRM circulent sans "Smart Seal". |

---

## 2. AUDIT DE COMPLEXITÉ (SCHEMA DEPTH)

**Score de Sûreté : 2/10**

- **Refine()** : **0%**. Aucune règle métier n'est validée au niveau Zod (ex: vérifier qu'un prix TTC est cohérent avec le HT, ou qu'une date de livraison est future).
- **Transform()** : **2 usages**. Aucune sanitization globale. Les espaces en trop dans les noms ou les injections `<script>` potentielles ne sont pas nettoyés à la source.
- **Coerce** : **0 usage**. La gestion des dates Firestore vs ISO reste manuelle et fragile dans les adaptateurs.

---

## 3. VÉRIFICATION DE L'INFÉRENCE (SOURCE OF TRUTH)

**Verdict : DÉSÉQUILIBRE D'ADN 🧬**

Nous avons des **Doublons de Vérité** majeurs.
- `src/shared/nexus/contracts/ops.types.ts` définit `interface Order`.
- `src/domain/schemas/orders.ts` définit `ValidatedOrder` via `z.infer`.

**Risque** : Une modification du schéma Zod n'impactera pas l'interface manuelle, créant des "Type-Lies" (mensonges de types) invisibles à la compilation mais fatals au runtime.

---

## 🛰️ RECOMMANDATIONS : LES 3 SUTURES PRIORITAIRES

### Suture 1 : Le Protocole "Single Source"
**Action** : Supprimer les interfaces manuelles dans `src/shared/nexus/contracts/` et les remplacer par des exports `z.infer` issus de `src/domain/schemas/`.
**Objectif** : Unifier l'ADN. Si le schéma change, tout le système "saigne" immédiatement à la compilation.

### Suture 2 : L'Atomic Hydrator (Grade X)
**Action** : Étendre le `FirestoreHydrator` à TOUTES les entités (Inventory, Staff, Accounting) et l'injecter systématiquement dans `Nexus.adapter.get` et `query`.
**Objectif** : Garantir qu'aucune donnée ne sort de la base de données sans être certifiée conforme au schéma en vigueur.

### Suture 3 : Le Bouclier de Persistance
**Action** : Créer un wrapper `SovereignStorage` qui remplace `localStorage` et impose un `safeParse()` à chaque lecture.
**Objectif** : Sécuriser la mémoire locale contre les corruptions et les injections.

---

**VERDICT FINAL : SUPERFICIEL.**
La Forteresse a des murs en carton-pâte peints en acier. Nous devons passer au **Grade X Souverain** en injectant la logique Zod au cœur des Adapters.
