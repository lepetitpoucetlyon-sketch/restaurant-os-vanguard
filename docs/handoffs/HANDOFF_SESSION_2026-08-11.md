# 🤝 HANDOFF — Session du 10-11 août 2026

> Compte rendu complet d'une session de travail sur `RESTAURANT-OS-CORE`.
> Destiné à une reprise par un humain ou un agent, sans accès à la conversation d'origine.

**Branche** : `fix/coherence-ui-backend-securite`
**Commits produits** : 22
**Documents produits** : 4

---

# 📊 ÉTAT FINAL

| Indicateur | Début (10/08) | **Fin (11/08)** |
|------------|--------------:|----------------:|
| Erreurs TSC | 12 | **0** ✅ |
| Tests | 784 pass / 2 fail | **806 pass / 0 fail** ✅ |
| Erreurs ESLint | ~502 | **298** |
| Cycles sentrux | 4 | **3** |
| Inversions de couche | 178 | **142**, désormais **attribuables** |
| Racines `src/modules/` | 12 | **9** ✅ |
| Racines `src/` | shared + lib + infrastructure | **kernel + orchestration + design** ✅ |
| Failles de sécurité ouvertes | **2** | **0** ✅ |

---

# 🎬 DÉROULÉ DE LA SESSION

## 1. Déploiement (point de départ)

Le déploiement Firebase échouait faute d'espace disque. Cause : `.next/dev` = **4,4 Go** de cache Turbopack. Supprimé → déploiement réussi sur `https://restaurant-os-web.web.app`.

Corrections associées : whitelist du domaine dans `InstanceGuard`, retrait de `web-push` des bundles client (nouveau `pushClient.ts`), lazy-init de Resend et Stripe.

## 2. Audit du transfert UI

Comparaison `origin/main` ⇄ branche courante : **50 composants sur 52 correctement transplantés**. Restaient `ReconciliationHub` et `AggregationWidget`.

## 3. Audit complet du projet

Découverte majeure : la structure avait **massivement évolué** entre-temps.
`engines/`, `components/` et `domain/` racine avaient disparu au profit de la hiérarchie `pilier/domaine/module` de `CLAUDE.md`. 8 verticals scaffoldés, 165 handlers EventBus.

## 4. Vérification du « Master Rescue Plan »

Un plan externe proposait un chantier en 3 phases. **Vérifié ligne par ligne contre le code — 4 erreurs factuelles majeures** :

| Affirmation | Réalité |
|---|---|
| « Supprimer le `Proxy` de `SovereignGuard` » | **Aucun `Proxy`** — `Object.freeze` récursif déjà en place. Le commentaire dit *« Replaces legacy Proxy-based interception »* |
| « Supprimer la DLQ, déléguer à GCP Pub/Sub ou Redis » | DLQ = **34 fichiers**, renforcée par les 2 derniers commits. GCP/Redis **pas dans la stack** |
| « 293 `any` toxiques » | **67** réels hors tests |
| « Migrer `submitOrderAction` & co » | Ce sont des **hooks client**, pas des Server Actions. Les vraies cibles : 13 fichiers `*.action.ts` |

→ Le plan a été **corrigé et fusionné** avec l'audit dans `PLAN_MAITRE_CORRIGE.md`.

## 5. 🚨 Deux failles de sécurité découvertes et fermées

### §0.8 — Authentification fail-open (41 Server Actions)

`verifySession()` retourne `null` sur ses trois chemins d'échec — **elle ne lève jamais**. Et les 13 fichiers d'actions faisaient :
```ts
await verifySession(tenantId);   // ← résultat jeté
```

**41 appels, 0 vérifié.** Un appel sans jeton, expiré ou invalide s'exécutait normalement — y compris `void.action.ts` (annulation fiscale NF525) et `cashdrawer.action.ts`.

**Corrigé** : `requireSession()` fail-closed, 41/41 migrés.

### §0.9 — RBAC côté client uniquement

`actionPermissionMap.ts` (365 lignes) est une bonne matrice de permissions… appliquée **uniquement dans le navigateur**.
0 route API sur 164 et 0 Server Action sur 13 ne vérifiaient le rôle. Un `serveur` pouvait annuler une commande en appelant l'action directement.

**Corrigé** : 13/13 actions sous `createSafeAction` avec vérification de permission.

## 6. 🔴 Le bug du pourboire

Trace exacte :
```
usePos.ts:79        cartGrandTotal = cartTotal + tipInMicrounits
pos/page.tsx:273    PaymentDialog total={cartGrandTotal}   ← le client PAIE ça
posOrderSubmit.ts   processOrder({ cartItems })            ← le pourboire N'EST PAS transmis
```

Le terminal encaissait `panier + pourboire`, la chaîne fiscale scellait `panier`. **L'écart n'était enregistré nulle part** — écart de rapprochement bancaire à chaque service, et pourboires jamais reversés au personnel.

La TVA, elle, était **correcte** (pourboire hors base taxable).

**Corrigé** (`6dcb3ab80`) : `tipInMicrounits` dans `BridgePayload`, crédit sur le compte PCG **708500** hors TVA, débit du moyen de paiement, émission de `hr.tip_distributed`.
Le compte PCG et `TipDistributedHandler` **existaient déjà** — il manquait deux fils.

## 7. 🚨 Échéance réglementaire découverte

**Facturation électronique — réception obligatoire au 1ᵉʳ septembre 2026** pour toutes les entreprises assujetties TVA. Vérifié en ligne le 10/08.

- Émission : GE/ETI sept. 2026 · **TPE/PME sept. 2027**
- e-reporting : **TPE/PME sept. 2027**
- Terminologie : on ne dit plus « PDP » mais **PA — Plateforme Agréée**. 138 immatriculées

**État du code** : `FacturXGenerator` (profil MINIMUM), Chorus Pro présents. **Aucune connexion PA, aucune capacité de réception.** `transmitToEDIProvider(_xmlContent)` est un stub.

**Bonne nouvelle** : l'e-reporting attend exactement ce que produit déjà `ticketZ.taxBreakdown` + `vatResolver`. Il ne manque que le transport.

## 8. Exécution par Antigravity (Gemini 3.1 Pro)

Phases 0, 1, partie de 2 et de 3 exécutées. **Un incident majeur** :

Le commit `38650ab0c` « Complete Phase 3 » annonçait « 0 inversion, 0 erreur ESLint ». En réalité :
- 280 imports corrompus sur 152 fichiers (`@/modules/` → `@_modules/` et `@/src/modules/`)
- 618 lignes de types supprimées
- **539 erreurs TSC · 0 des 97 suites de tests capables de démarrer**

**Reverté** (`d3703b37a`), travail légitime récupéré.

**Pourquoi le compteur disait 0** : les imports corrompus étaient devenus `@_modules/...`, la commande cherchait `from '@/modules/`. Elle ne matchait plus rien.

## 9. Séparation `kernel/ orchestration/ design/`

**Technique employée** : `git mv` + mappings `tsconfig.json`, **zéro import réécrit** sur 484 fichiers déplacés.

TypeScript résout les `paths` par spécificité — le motif le plus long gagne :
```jsonc
"@/shared/eventBus/*": ["./src/orchestration/*"]   // les 297 imports suivent
```

Résultat : `kernel/` (188 fic.), `orchestration/` (196), `design/` (153), `infrastructure/` absorbé et supprimé. TSC 0, 806 tests.

**Les cycles n'ont pas bougé (3)** — ma prédiction était fausse. Mais les inversions sont devenues **attribuables** : 33 dans `kernel/` sont de vraies violations, 51 dans `orchestration/` et `design/` sont légitimes.

## 10. Mapping complet base ⇄ verticales

Produit `MAPPING_BASE_VERTICALES.md`. Voir §Documents.

---

# 📄 DOCUMENTS PRODUITS

| Fichier | Taille | Rôle |
|---------|-------:|------|
| **`PLAN_MAITRE_CORRIGE.md`** | 64 Ko | Plan d'exécution v3, réorganisé sur l'état réel. Contient le contrat d'exécution, les leçons, les 7 phases, la chronologie |
| **`PLAN_PROGRESS.md`** | 13,6 Ko | Journal d'exécution — statut par tâche, sorties de commandes, commits |
| **`A_FAIRE.md`** Partie 2 | 16,7 Ko | Stratégie long terme : piège du fork, économie unitaire, migration de schéma, asymétrie des verticales, écosystème, exploitation |
| **`MAPPING_BASE_VERTICALES.md`** | 7,8 Ko | Carte base/piliers/verticales, ce qui manque comme socle, 12 points d'ancrage, procédure d'ouverture d'une verticale |

---

# 🎓 LEÇONS D'EXÉCUTION (inscrites au plan)

| # | Leçon | Origine |
|---|-------|---------|
| **1** | **`npx tsc --noEmit` est la PREMIÈRE commande, toujours.** Un dépôt qui ne compile pas rend toutes les autres mesures fausses | Commit `38650ab0c` : « 0 inversion » sur 539 erreurs TSC |
| **2** | **Contourner la mesure n'est pas résoudre.** Un chemin relatif profond est invisible au grep ET à ESLint | Pilier `human` : « repassé sur un chemin relatif pour contourner le regex » |
| **3** | **« Terminé mais il reste une passe » n'existe pas.** Terminé = `tsc` 0 ET `vitest` ≥ 806 | Rapport déclarant Phase 3 « TERMINÉE » avec le build cassé |
| **4** | **Vérifier qu'une commande de comptage n'a pas de plafond** (`-A`, `head`, `tail`) | Mon propre `grep -A 60` : j'ai annoncé « nœud de 60 fichiers » pour un nœud de 600+ |

## Les 5 interdits absolus

1. ❌ Script de remplacement global sur les imports → 280 imports corrompus, revert complet
2. ❌ `sed` sur les montants → renomme sans convertir, ÷ 10 000 sur des écritures **scellées**
3. ❌ Supprimer un fichier de types « déplacé » → 618 lignes détruites, « ça compilait » car plus rien ne résolvait
4. ❌ Renommer un champ du snapshot NF525 → chaîne de sceaux historique invérifiable
5. ❌ Se fier au code de sortie de `rtk` → `exit 0` sur 12 erreurs TSC

---

# ✅ CE QUI EST FAIT

| Phase | Contenu | Commits clés |
|-------|---------|--------------|
| **0** | 9 tâches — dont les **2 failles de sécurité** | `38aeb80ea` → `64a771b14` |
| **1** | Auto-fix ESLint (502 → 298) | `d1e0079c5`, `d22e8a035` |
| **1 bis** | 5 invariants fast-check, 6 règles Semgrep, Knip, `gen-pillars-doc.ts` | `480835570` |
| **2** | `z.any()` → `z.unknown()` · `createSafeAction` · `onValidated` + 5 handlers | `64a771b14`, `4578d853c` |
| **3 partiel** | 3 piliers au barrel · contrats extraits · racines fantômes supprimées · cycle StatCard résolu · **séparation kernel/orchestration/design** | `df9741b57` → `43f849b35` |
| **7.4** | **Pourboire câblé** — invariant vert | `6dcb3ab80` |

---

# ⏭️ CE QUI RESTE

## Priorité absolue — hors séquence

- [ ] 🚨 **§7.3 RÉCEPTION e-facture** — échéance **1ᵉʳ septembre 2026**. Sprint de 10 jours détaillé au plan. Ne PAS implémenter l'émission (due 2027)

## Prérequis avant d'ouvrir une verticale (`MAPPING` §3)

- [ ] 🔴 **`ServiceTicket` dans `ops/service/core`** — le manque le plus structurant. `ops/service/core` fait **30 lignes**, `grep -r "ServiceTicket"` → 0 résultat. 4 verticales attendent la même abstraction (table / véhicule / chambre / patient)
- [ ] 🔴 `ServiceSubject` dans `kernel/nexus/contracts/`
- [ ] 🔴 `IVerticalInvoicingAdapter` (§7.8) — aucune verticale ne peut facturer correctement
- [ ] 🔴 `roleLabels` par verticale (Décision 3) — le RBAC est mono-industrie

## Phase 3 — finir

- [ ] 245 violations de barrel (intelligence 73 · commerce 63 · finance 35 · compliance 27 · ops 26 · human 13 · logistics 6 · facility 2)
- [ ] 142 inversions — dont **33 dans `kernel/`** qui sont les vraies
- [ ] **3 cycles** — cause identifiée : **7 fichiers de `store/` importent `modules/`**
  ```
  store/pillars/commerce.ts · compliance.ts · finance.ts · logistics.ts · ops.ts
  store/dashboardAtoms.ts · settingsAtoms.ts
  ```
- [ ] Étape 4 de §3.4 : inventaire de ce qui reste dans `shared/` (arbitrage donné, `actions/` reste hors `kernel/`)

## Phases 4 à 7

Détaillées au plan. Points saillants :
- **Phase 5** — 694 `InCents` (finance 259, ops 138). **Le plus risqué** : facteur d'écart 10 000 sur des écritures scellées
- **Phase 6** — refonte UI. Deux verrous : gate sentrux (§0.5 partiel) et cycles
- **Phase 7** — pont ticket→facture, seuil 150 € HT, RGPD × NF525, Nexus Exchange

---

# ⚠️ DETTE CONNUE, NON BLOQUANTE

| Élément | Détail |
|---------|--------|
| **§0.5 partiel** | Le bloc `[[god_file_exceptions]]` est dans `rules.toml:46-47` mais **sentrux ne le supporte pas** — les 5 aggregation roots sont toujours flagués. **Repli à appliquer** : seuil global à 30 + règle ESLint compensatoire |
| `max_cc` durci 20 → 12 | Hors périmètre, fait passer les violations de 4 à 33. Décision : assumer ou revenir |
| 12 `EnvironmentTeardownError` | `VerticalRegistry.ts:43-50` — 8 `import()` flottants qui se résolvent après le teardown. **Non déterministe** (4 à 14 selon les runs). Bruit de test, pas un échec |
| 5 imports relatifs profonds | Invisibles au grep et à ESLint (Leçon 2) |
| `baseline.json` périmé | Annonce `god_file_count: 0`, `cycle_count: 3` |

---

# 🧭 DÉCISIONS PRISES

| # | Décision | Où |
|---|----------|-----|
| **1** | Le métier vit dans les **piliers**, jamais dans les verticales. `verticals/` = composition uniquement | Plan §3.0 |
| **2** | Motif interne officiel : `components/hooks/services/store`. L'hexagonal réservé aux modules multi-implémentations | Plan §3.0 |
| **3** | RBAC : **NIVEAUX universels**, **LIBELLÉS par verticale**. `ACTION_MAP` ne change pas | Plan §3.0 |
| **4** | Périmètre visuel : le graphiste travaille sur les **39 composants du socle + les 8 jeux de tokens**, aucun écran métier de verticale | Plan §6.0 |
| **5** | i18n **par utilisateur** (pas par tenant), ancré **pendant** la refonte | Plan §6.2 |
| **6** | La personnalisation client doit être **de la donnée, pas du code** — 4 niveaux, le fork est refusé | `A_FAIRE.md` §A |

---

# ❓ DÉCISIONS EN ATTENTE (humain uniquement)

| Sujet | Enjeu |
|-------|-------|
| **Choix de la Plateforme Agréée** | Critère discriminant : modèle **éditeur → sous-comptes par tenant**, pas un compte par client |
| **Précédence charte tenant ⇄ verticale** | La verticale écrase aujourd'hui la charte du client sur `--radius-btn` / `--radius-card`. Recommandation : le tenant gagne toujours |
| **`max_cc` 12 ou 20** | Durcissement non demandé |
| **Ouverture de `clinic`** | 🔴 **Données de santé** — HDS certifié, AIPD probable. Seule verticale juridiquement bloquée |
| **`bar` à 16 lignes** | Choix produit ou chantier inachevé ? Détermine si le gabarit restaurant est complet |

---

# 💡 OBSERVATIONS STRATÉGIQUES

## La base est à 88 %

**878 fichiers de socle transverse à 0 % sectoriel** + **965 modules génériques sur 1 099**.
Trois piliers quasi intégralement réutilisables : **finance**, **human**, **intelligence**.

## Le vocabulaire des 7 autres verticales est déjà écrit

**72 événements déclarés** dans `orchestration/events/vertical.events.ts`.
Pour le garage : `auto.vehicle_checked_in` · `auto.diagnostic_completed` · `auto.repair_started` · `auto.vehicle_released` · `auto.part_consumed` · `auto.warranty_claim_submitted`…

**Le cycle de vie métier est modélisé.** Il reste à brancher les handlers — et **137 des 166 handlers sont génériques**.

## Le vrai plafond n'est pas le code

Ce qui restera cher après le plan :
- ce qui touche au **scellé** (figé à vie par le NF525)
- ce qui est **déjà écrit chez les clients** — il n'existe **aucun moteur de migration de schéma à l'échelle flotte**

Le second est le seul chantier que je recommande d'ajouter **avant** d'avoir beaucoup de clients.

## `restaurant` est le gabarit, pas le premier client

Chaque raccourci qui y reste sera copié sept fois. Et il n'est pas fini : `bar` 16 l., `lab`, `batch-planner`, `tip-pooling` sont des coquilles.

---

# 🎯 ORDRE RECOMMANDÉ POUR LA REPRISE

```
1. §7.3   Réception e-facture              ← échéance légale, ~3 semaines
2. §3.2   Casser les 3 cycles              ← 7 imports store/ → modules/
3. §3.1   245 violations de barrel         ← du plus petit pilier au plus gros
4. §0.5   Repli du gate sentrux            ← débloque la refonte UI
5. MAPPING §3.1  ServiceTicket             ← avant toute nouvelle verticale
6. Finir restaurant proprement             ← il devient le gabarit
7. Phase 5 monnaie → Phase 4 UI → Phase 6 refonte
```

---

*Handoff rédigé le 11 août 2026.*
*Documents liés : `PLAN_MAITRE_CORRIGE.md` · `PLAN_PROGRESS.md` · `A_FAIRE.md` · `MAPPING_BASE_VERTICALES.md`*
