# 📋 Profils UX & Modes Métier — Spécifications

> ⟵ ex-`A_FAIRE.md` (racine), renommé le 2026-08-12. Ce n'est **pas** un doublon de
> `afaire.md` (→ [`../plans/PLAN_INFRA_PROD.md`](../plans/PLAN_INFRA_PROD.md), infra prod) :
> ce document couvre les **specs fonctionnelles** des profils UX, pas l'infra.
>
> **Partie 1** — Profils UX & Modes Métier (specs fonctionnelles)
> **Partie 2** — Stratégie de personnalisation & angles morts écosystème *(voir plus bas)*

---

# PARTIE 1 — Profils UX & Modes Métier

Ce document recense les spécifications des 4 modes d'expérience utilisateur (UX Profiles) à construire pour adapter **RESTAURANT-OS-CORE** aux spécificités de chaque type d'établissement.

---

## 🍔 1. Mode Fast-Food / Vente à Emporter (Takeaway & Fast-Casual)

### Objectif UX
Maximiser la vitesse de prise de commande et d'encaissement sur les flux à fort volume.

### Fonctionnalités à Construire
- [ ] **Encaissement Ultra-Rapide (1-Click Checkout)** : Boutons de paiement direct (Espèces exactes, CB Sans Contact, Ticket Resto) sans passer par l'écran intermédiaire de rendu de monnaie.
- [ ] **Masquage Automatique du Plan de Salle** : Redirection directe sur le catalogue POS dès l'ouverture d'une nouvelle session.
- [ ] **Écran de Retrait Client (Customer Order Display)** : Interface de file d'attente pour écran externe (Commandes en préparation vs Commandes prêtes).
- [ ] **Propositions de Vente Incitative (Upselling Auto)** : Pop-up ou suggestion automatique de menus, boissons et desserts lors de la sélection des plats principaux.

---

## 🍷 2. Mode Gastronomique / Service à Table (Fine Dining)

### Objectif UX
Offrir une gestion fluide du service en salle, du suivi de table et de la personnalisation client.

### Fonctionnalités à Construire
- [ ] **Plan de Salle 3D / 2D Interactif** : Visualisation en temps réel de l'état des tables (Libre, Occupée, En attente addition, À nettoyer).
- [ ] **Gestion des Suites de Plats (Order Pacing)** : Envoi différencié en cuisine (Réclame Entrées, Plats, Desserts) déclenchable depuis le POS mobile du serveur.
- [ ] **Fiche Client & Préférences (CRM Table)** : Historique des visites, régimes alimentaires, allergies et préférences de vin intégrés directement sur la fiche table.
- [ ] **Partage & Division d'Addition Complexe** : Séparation de la note par convive, par produit ou division égale en $N$ personnes.

---

## 🍸 3. Mode Bar / Nightclub (High-Volume Nightlife)

### Objectif UX
Garantir un service ultra-rapide dans un environnement sombre à forte intensité.

### Fonctionnalités à Construire
- [ ] **Gestion des Onglets / Ardoises Client (Bar Tabs)** : Ouverture d'une ardoise par empreinte CB ou nom de client avec encaissement différé en fin de nuit.
- [ ] **Raccourcis Boissons Géants (Quick Grid)** : Grille tactile grand format pour les alcools, cocktails et pressions les plus vendus.
- [ ] **Theme Dark Contrast UI** : Interface à fort contraste visuel (Néon & Noir profond) optimisée pour la pénombre des établissements de nuit.
- [ ] **Mode Happy Hour Automatique** : Basculement automatique des tarifs selon des plages horaires paramétrables.

---

## 🛵 4. Mode Dark Kitchen (Delivery & Multi-Brand)

### Objectif UX
Centraliser la production culinaire et rationaliser l'expédition des livreurs.

### Fonctionnalités à Construire
- [ ] **Focus 100% KDS (Kitchen Display System)** : Interface d'écran de cuisine plein écran optimisée par poste de cuisson (Chaud, Froid, Emballage).
- [ ] **Agrégation Multi-Plateformes (Deliveroo, UberEats, JustEat)** : Centralisation de tous les flux de commandes externes sur un seul écran sans multiplier les tablettes.
- [ ] **Gestion des Marques Virtuelles (Multi-Branding)** : Distinction visuelle claire de la marque virtuelle associée à chaque commande pour l'emballage.
- [ ] **Gestion du Dispatch Livreurs** : Notification sonore et visuelle dès l'arrivée du livreur pour remise en main propre immédiate.

---
---

# PARTIE 2 — Stratégie de personnalisation & angles morts écosystème

> Issu de l'audit d'architecture du 10/08/2026. Ces points ne sont **pas** des
> fonctionnalités : ce sont des décisions structurelles à prendre avant qu'elles
> ne deviennent irréversibles.
> Plan technique de référence : `PLAN_MAITRE_CORRIGE.md`

---

## 🔴 A. Le piège du fork — décision la plus urgente

### Le mécanisme

« Full custom par client » est la façon dont les SaaS meurent. Pas au début : **au 200ᵉ client**.

Un client demande un comportement spécifique → tu écris du code pour lui → six mois plus tard tu changes ce comportement pour tous, sauf lui → puis un deuxième, puis dix. Tu n'as plus un produit à 10 000 instances, tu as **10 000 produits**.

### La taxonomie à décréter — LA ligne à écrire

| Niveau | Substrat | Coût | Statut |
|--------|----------|------|--------|
| **1. Configuration** | feature flags · DNA seeds · `scopedTokens` | nul — illimité | ✅ existe (55 flags, 8 DNA) |
| **2. Règles déclaratives** | `PolicyEngine` étendu au métier | borné — **c'est là que l'agent travaille** | 🟠 existe mais limité à la conformité |
| **3. Plugin enregistré** | `VerticalUIRegistry` · adapters | contrat versionné + revue | ✅ existe |
| **4. Code spécifique** | fork | 🔴 **REFUSÉ** — ou facturé au prix de sa maintenance à vie | — |

- [ ] **Écrire cette taxonomie dans `CLAUDE.md`** — avant le 10ᵉ client
- [ ] **Étendre `PolicyEngine` au métier** : remises, seuils, workflows d'approbation, règles de tarification. C'est le levier qui évite le code sur mesure
- [ ] Décréter que le niveau 2 est **la seule surface de personnalisation comportementale**

> 🎯 **La vraie question n'est pas « comment maintenir 200 forks » mais « comment faire que 95 % des demandes clients n'aient jamais besoin d'un fork ».**
> Ça se décide dans le design du moteur de règles, pas dans l'intelligence de l'agent.

### L'idée « agent + Graphify + ticket MCC » — à moitié construite

**Ce qui existe déjà :**

| Pièce | État |
|-------|------|
| Graphify (cartographie de code) | ✅ `graphify-out/`, `.graphifyignore`, hook actif au commit |
| Ticket client → MCC | ✅ `SupportTicketAnalysisHandler` |
| Agent → brouillon de correctif | ✅ `api/admin/fleet/support-ai/drafts` (approve/correct/reject) |
| Registre par tenant | ✅ 24 tenants système, télémétrie, PatchCenter |

**Ce que l'idée résout** : le coût d'**écriture**. L'agent connaît le contexte du client et propose le correctif.

**Ce qu'elle ne résout PAS** : le coût de **vérification** — et c'est celui-là qui tue.

> 200 clients avec du code spécifique. Un changement au cœur → l'agent prépare 200 diffs.
> « J'ai juste à valider » = 200 revues de code sur des bases que tu ne connais plus,
> + 200 suites de tests distinctes. À **chaque** release.
> Un agent à 5 % d'erreur = **10 clients cassés par release**, en temps réel, un samedi soir.

**Preuve empirique (session du 10/08/2026)** : deux rapports d'agent plausibles et faux —
« 0 inversion, 0 erreur ESLint » sur un dépôt à **539 erreurs TypeScript**, puis « 0 violation »
sur un import rendu invisible à la mesure. Valider un diff crédible sur un code inconnu est
le geste le plus difficile qui existe.

### ✅ La version qui marche : changer le substrat, pas l'architecture

```
❌ Client demande → agent écrit du TypeScript dans SON fork
   → 200 codebases divergentes, validation impossible

✅ Client demande → agent écrit une CONFIG (règle, workflow, seuil, template)
   → 1 codebase, 200 configs, validation par schéma
```

Ce que ça change :
- Un changement au cœur se vérifie **par machine sur 10 000 tenants en quelques secondes**
  (toutes les configs satisfont-elles encore le schéma ?) au lieu de 200 revues de code
- Un rollback = un retour de config, pas un revert de code
- L'agent garde exactement le même rôle — il propose une **donnée structurée**, pas un diff

- [ ] Pointer l'agent MCC sur la config déclarative, jamais sur du code tenant
- [ ] Construire le vérificateur de compatibilité config ↔ schéma à l'échelle flotte

---

## 💰 B. L'économie unitaire — angle mort le plus invisible

`api/admin/fleet/billing/usage` mesure la consommation **SMS, emails et IA**.
Il ne mesure **pas** ce qu'un tenant te coûte en infrastructure.

À 10 000 instances : listeners Firestore ouverts, cron jobs, index RAG, stockage.
Si un tenant coûte 12 € et se vend 49 €, tu as un business. S'il coûte 40 €, tu as une
machine à perdre de l'argent **qui accélère à mesure qu'elle réussit**.

Personne ne découvre ça à 50 clients. Tout le monde le découvre à 2 000, quand c'est structurel.

- [ ] Instrumenter le **coût par tenant** (lectures/écritures Firestore, stockage, cron, RAG)
- [ ] Colonne coût dans le MCC, à côté du revenu
- [ ] Recalculer le pricing et le choix des verticales à partir de ces chiffres

---

## 🗄️ C. Migration de schéma à l'échelle flotte

Rien de dédié aujourd'hui : `useDataMigration` sert à l'import d'onboarding, pas à faire
évoluer 10 000 bases existantes.

**Et le NF525 le complique d'une façon particulière** : le hash porte sur
`canonicalStringify(dataSnapshot)`. Les données scellées ne peuvent **jamais** être migrées —
leur format est figé pour toujours, sinon la chaîne historique devient invérifiable.

- [ ] Séparer explicitement **deux régimes de données** :
  - **mutable** → migrable, versionné, avec rollback
  - **scellé** → figé à jamais, lu par un lecteur versionné
- [ ] Moteur de migration flotte : progressif, avec rollback, sans interrompre un service en cours
- [ ] `schemaVersion` sur les collections mutables

---

## 🏭 D. Les 8 verticales ne se valent pas

Elles sont traitées comme des emplacements équivalents. Elles ne le sont pas.

| Verticale | Réglementation | Lecture stratégique |
|-----------|----------------|---------------------|
| **restaurant · bakery** | NF525, HACCP, TVA multi-taux | 🟢 **Fossé** — coûteuse pour toi, coûteuse pour tes concurrents. Ta meilleure position |
| **garage · salon** | moyenne, offre logicielle vieillissante | 🟢 Meilleur ratio effort/opportunité après la restauration |
| **hotel** | taxe de séjour, fiche de police | 🟡 Spécifique mais franchissable |
| **retail** | faible | 🟠 Marché saturé, marges écrasées. Facile techniquement, dur commercialement |
| **clinic** | 🔴 données de santé, **HDS certifié**, AIPD | 🔴 **Mur** — des mois et des dizaines de k€. À ouvrir en dernier, ou jamais |

- [ ] Classer chaque verticale `PRODUCTION` / `BÊTA` / `SQUELETTE` dans le MCC
- [ ] **Bloquer le provisioning** sur une verticale `SQUELETTE`
- [ ] 🔴 **Verrouiller `clinic`** tant que le volet données de santé n'a pas fait l'objet d'une analyse juridique dédiée

> Le critère n'est pas « laquelle est facile à coder » — l'architecture les rend toutes faisables.
> C'est **« laquelle a une réglementation qui me protège plutôt qu'elle me bloque »**.

---

## 🌐 E. Écosystème ≠ plateforme extensible

Aujourd'hui : une plateforme extensible **par toi**. `VerticalUIRegistry`, adapters, DNA seeds —
tout est conçu pour que *tu* ajoutes une verticale.

Un **écosystème**, c'est quand quelqu'un d'autre peut le faire sans toucher à ton dépôt :
un intégrateur qui crée la verticale « pressing », un tiers qui vend un module de fidélité,
un revendeur qui package sa configuration.

Ça demande ce que tu n'as pas :
- surface d'extension **publique et versionnée**
- contrat de plugin stable (avec dépréciation)
- bac à sable d'exécution
- revue de sécurité des extensions tierces
- modèle de revenus partagé

> ⚠️ **Ce n'est pas une critique, c'est une bifurcation.** Tu peux réussir en restant l'unique
> constructeur. Mais si tu vises l'écosystème, c'est un chantier produit entier — et il vaut
> mieux le décider **avant que ton API interne ne se fige**.

- [ ] Trancher : constructeur unique **ou** écosystème ouvert
- [ ] Si écosystème : figer et versionner le contrat de plugin **avant** les 7 verticales restantes

---

## 🚨 F. Exploitation — le point jamais abordé

Un POS est **temps réel critique**. Quand ça casse, c'est un samedi 20 h en plein service,
et le restaurant ne peut plus encaisser.

Tu as la télémétrie, les heartbeats, le crash-report. Tu n'as **pas** d'astreinte, pas de SLA,
pas de procédure d'incident. Et ta souveraineté — tu ne lis jamais les données clients —
rend le diagnostic à distance structurellement difficile.

- [ ] Définir un SLA et une procédure d'incident
- [ ] **Reproduction synthétique** : rejouer un incident depuis la télémétrie et l'outbox,
      sans jamais toucher aux données réelles. Ton EventBus le permet techniquement,
      personne ne l'a branché dans ce sens
- [ ] Mode dégradé POS : encaisser hors ligne même si tout le reste tombe *(partiellement fait — offline queue)*

---

## 🔧 G. Dette technique repérée en passant

- [ ] **4 imports relatifs profonds** contournent le Barrel Contract sans que le grep ni ESLint
      les voient : `store/pillars/rbac.ts:2` → `"../../modules/human/domain/schemas/rbac"`.
      La décision (éviter le cycle store→barrel) est **juste**, mais la mesure « 0 violation »
      est fausse.
      **Vrai correctif** : déplacer ces schémas vers `shared/nexus/contracts/` — ni le store
      ni le pilier ne les possède.
- [ ] `VerticalRegistry.ts:43-50` — auto-enregistrement par `import()` flottants : produit les
      `EnvironmentTeardownError` non déterministes des tests (4 à 14 selon les runs) **et** les
      cycles sentrux. Même motif que `VerticalUIRegistry` (§3.3 du plan maître)

---

## 📌 Les deux décisions à prendre en premier

1. **Écrire la ligne de la personnalisation** (§A) — avant le 10ᵉ client
2. **Instrumenter le coût par tenant** (§B) — avant le 100ᵉ

Les autres se rattrapent. Ces deux-là deviennent structurelles.
