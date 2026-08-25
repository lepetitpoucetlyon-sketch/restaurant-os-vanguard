# Reste à faire — état consolidé

> Établi le **2026-08-25** · mesuré sur `main@da10a5b59`
> Consolide les 5 plans et audits de la journée. **Chaque ligne a été re-mesurée**,
> pas reprise des rapports de session (Loi 7).

---

## Ce qui est terminé — pour ne pas le refaire

| Plan | État | Preuve |
|---|---|---|
| **PLAN-PARAMETRAGE-RBAC** (7 phases) | ✅ **Intégral** | 20 services lisent `getSetting` · `SettingsReader.ts` · cascade HACCP · DF-O1 délégué |
| **PLAN-DOCUMENTATION-VERIFIABLE** (4 chantiers) | ✅ **Intégral** | `CLAUDE.md` épuré · `HEALTH.md` 9 sections · `invariants.test.ts` · Loi 7 |
| Les 3 divergences du corpus | ✅ **Closes** | DF-E1 cascade · DF-O1 source unique · DF-K2 registre branché |
| Cycles d'import | ✅ **0** | `cycles-inspector` ratchet validé |
| Modules vides `appointments`/`consultation` | ✅ Supprimés | |
| Vague 0 (désamorçage) | ✅ Complète | bundle · 0 session fantôme · imports POS documentés · règle git |

---

# 🔴 PRIORITÉ 1 — Ce qui bloque un premier client

*Aucun de ces points n'a bougé de la journée. Ce sont pourtant les seuls qui empêchent
un restaurateur d'utiliser le produit.*

## 1.1 — `FISCAL_SIGNING_SECRET` posé *(30 min)* 🔴 **bloqueur légal**

**Mesuré :** absent de l'environnement.
**Conséquence :** aucune vente n'est scellable. Encaisser sans scellement NF525 est illégal.

Antigravity a livré la génération et la documentation dans `.env.example`. **Il reste à
générer la valeur et à la poser.** C'est de la configuration, pas du code.

*Critère :* `preflight-prod.sh` passe l'étape 1.

## 1.2 — Pages d'erreur *(1 session)* 🔴 **défaut le plus visible**

**Mesuré :** `error.tsx` + `global-error.tsx` + `not-found.tsx` = **0 fichier**.

Une exception sur `/pos` affiche l'écran générique de Next : écran blanc, message
technique, aucune action. En plein service, le serveur redémarre la tablette et **perd
le panier**.

```
src/app/global-error.tsx                 → filet ultime
src/app/not-found.tsx                    → 404 métier
src/app/(client)/(ops)/error.tsx         → erreur métier + « Réessayer »
src/app/(client)/(ops)/pos/error.tsx     → SPÉCIFIQUE : préserve le panier
src/app/(admin)/error.tsx
```

L'`error.tsx` du POS **lit** `activeCartAtom` (jamais n'écrit) et propose
« Reprendre la commande ».

*Critère :* provoquer une erreur sur `/pos` → écran métier, panier récupérable.

## 1.3 — Routes API sensibles *(1 session)* 🔴

**Mesuré :** **39 routes sur 210** sans garde détectée.

Beaucoup sont légitimement publiques. Quatre ne le sont pas :

| Ordre | Route | Risque |
|---|---|---|
| 1 | **`haccp/iot-push`** | Falsification de relevés de température. Le registre HACCP fait foi en contrôle sanitaire. |
| 2 | `cron/daily-backup` · `cron/weekly-report` | Déclenchables par quiconque |
| 3 | `widget/setup-intent` | Crée une intention de paiement |
| 4 | Les 6 webhooks | Vérifier que chacun valide sa signature |

*Critère :* un test qui échoue si une route hors liste blanche n'a aucun garde.
Cible : **39 → ≤ 20**.

## 1.4 — Résilience d'impression *(1 session)*

`PrinterFailoverManager` bascule bien vers une imprimante de secours. Ce qui manque :
- file d'attente persistée si **toutes** échouent
- alerte visible en caisse
- **DF-D3 tranché** : ticket scellé, impression échouée → que voit le client ?
  *(le réglage `on_print_failure` est prévu au plan RBAC — reste à le déclarer et brancher)*

## 1.5 — Sentry instrumenté *(0,5 session)*

Dépend de 1.2. Brancher `sentry.ts` sur les `error.tsx` + les routes critiques.
**Mesuré :** 4 fichiers seulement référencent l'observabilité aujourd'hui.

*Question opérationnelle :* ton client tombe en panne vendredi 20 h. Tu l'apprends par
une alerte, ou par lui ?

## 1.6 — Provisionner `_demo_restaurant` / `_ref_restaurant` *(0,5 session)*

Prérequis de toute démo commerciale **et** du test E2E de la priorité 3.
Le registre déclare 36 tenants système ; rien ne prouve qu'ils existent.

**Total priorité 1 : 4-4,5 sessions + 30 min de configuration.**

---

# 🟠 PRIORITÉ 2 — Connecteurs

*Le catalogue promet 40 connecteurs. 3 familles sur 13 se synchronisent réellement.*

## 2.1 — Cesser de promettre ce qui n'existe pas *(0,5 session)* 🔴

**Mesuré :** `comingSoon` = **0 occurrence**. Les 7 connecteurs sans code sont toujours
affichés comme disponibles :

```
quickbooks · xero · shopify · google-shopping · mews-pms · treatwell · fresha
```

Un gérant peut les activer, saisir ses identifiants, voir « credentials sauvegardés » —
et rien ne remontera jamais.

**Le moins cher de tout ce document : il ne code rien, il arrête de mentir.**

## 2.2 — Registre d'intégrations *(1 session)*

`connectors/[id]/sync/route.ts` connaît **3 familles sur 13**. Au lieu d'un `switch` qui
grandit, faire que chaque factory s'enregistre.

> ⚠️ **Collision de nom mesurée :** un `ConnectorRegistry` **existe déjà**
> (`commerce/acquisition/onboarding/migration/connectors/`) pour les connecteurs de
> **migration** — Zenchef, TheFork, Zelty, L'Addition, Lightspeed, Tiller, Pennylane.
> Nommer le nouveau différemment : `IntegrationRegistry`.

## 2.3 — Brancher les 8 factories orphelines *(2 sessions)*

**Mesuré : 8 sur 8 toujours sans consommateur.** 11 providers écrits, testés, exportés,
que rien n'appelle.

| Ordre | Factory | Pourquoi | Cible |
|---|---|---|---|
| 1 | `AccountingProviderFactory` | Pennylane, le plus demandé en restauration | export comptable |
| 2 | `SupplierProviderFactory` | commandes fournisseurs = usage quotidien | `AutoProcurementEngine` |
| 3 | `WeatherProviderFactory` | **`PredictiveProcurementEngine:29` en a besoin et ne l'utilise pas** | prévision appro |
| 4 | `InvoiceProviderFactory` | rapprochement factures | OCR + `AccountingMatchingService` |
| 5 | `EmailMarketingProviderFactory` | campagnes CRM | |
| 6 | `TimeclockProviderFactory` · `RecruitmentProviderFactory` | RH | |
| 7 | `PaymentProviderFactory` | ⚠️ Stripe déjà branché ailleurs — vérifier la redondance |

## 2.4 — Unifier les webhooks *(0,5 session)*

**Mesuré : 12 webhooks, 3 conventions**, doublon confirmé entre
`connectors/delivery/webhook/[provider]` et `webhooks/delivery/[provider]`.

## 2.5 — Documenter les connecteurs hors arborescence *(0,5 session)*

Open banking (5 providers) et LLM (6 providers) sont excellents mais invisibles depuis
`modules/*/connectors/`. Un `README.md` suffit.

**Total priorité 2 : 4,5 sessions.**

---

# 🟠 PRIORITÉ 3 — Production sereine

*À faire **pendant** le pilote, pas avant : ces sujets gagnent énormément à être
calibrés sur du vrai usage.*

## 3.1 — Parcours client bout-en-bout *(1,5 session)* ⭐

Un test Playwright de l'inscription à la clôture de caisse. Dépend de 1.1 et 1.6.

> **Le test qui vaut le plus cher du projet** — le seul qui valide l'assemblage plutôt
> que les pièces.

## 3.2 — Offline / Outbox / DLQ *(2 sessions)*

83 fichiers concernés, ADR-005 et ADR-007. Scénarios à exercer :
coupure 4 h en plein service · DLQ pleine · conflit deux serveurs · rejeu désordonné
(**le hash NF525 chaîné tient-il ?**).

## 3.3 — Journée fiscale & timezone *(1 session)*

**Mesuré : 352 `new Date()` contre 16 fichiers TZ-aware.**
Un service 19 h → 1 h est-il clôturé sur la bonne journée fiscale ?

## 3.4 — `npm audit` en gate *(0,5 session)*

**Mesuré : 11 high · 21 moderate** en production, aucune gate.
Traiter les 11 `high`, poser un ratchet dans `preflight.sh`.

**Total priorité 3 : 5 sessions.**

---

# 🟡 PRIORITÉ 4 — Qualité & dette

## 4.1 — Accessibilité *(2 sessions)*

**Mesuré : 98 `aria-` sur 902 fichiers `.tsx`, 1 test.**
Périmètre : POS, KDS, plan de salle — les 3 écrans utilisés 8 h/jour.

## 4.2 — Brancher `useLexicon()` *(2 sessions)*

**Mesuré : 0 consommateur.** Le lexique par verticale (6 termes × N variantes) est du
code mort. Un garage voit « Table », « Recette », « Serveur ».

## 4.3 — Migration microunits *(8-10 sessions)*

**Mesuré : 818 occurrences** (baseline 821 — 3 traitées).
Découpage en 6 lots dans `PLAN-DETTE-TECHNIQUE`. `src/domain/` est déjà propre.

⚠️ **Contrainte NF525 :** les enregistrements scellés conservent leur `amountInCents`
historique. Modifier rétroactivement casserait la chaîne de hachage.

## 4.4 — Barrel violations *(1 session)*

**Mesuré : 45.** Dont ~7 obligatoires (règle sentrux n° 4) et ~20 bloquées par la
migration des schémas. Restent ~9 vraies.

## 4.5 — Tests flaky *(1 session)*

2 identifiés le 2026-08-25, dont `PosFiscalSealE2EPipeline` — **sur le chemin fiscal**.
Les deux passent en isolation.

## 4.6 — Ratchet bundle · PRA · RGPD allergènes *(2,5 sessions)*

- Gate 9 annoncée dans `next.config.ts`, jamais implémentée
- Restaurer une sauvegarde dans un environnement vierge — jamais testé
- Allergènes = **donnée de santé** (art. 9 RGPD) : rétention, effacement, journal d'accès

**Total priorité 4 : 16-18 sessions.**

---

# 🔵 PRIORITÉ 5 — Décisions, pas exécution

*Ce ne sont pas des tâches. Ce sont des arbitrages dont découleront des chantiers.*

| Décision | Enjeu | Coût si « oui » |
|---|---|---|
| **Plafonds de coût par tenant** | *Combien te coûte un client par mois ?* Le code ne permet pas de répondre. | 2 sessions |
| **Multi-pays** | 129 `EUR` · 209 TVA · 177 `fr-FR` en dur. `TaxRateGuard` est verrouillé sur la France. | 5-8 sessions |
| **Auth agnostique** | 17 fichiers Firebase, aucune `IAuthProvider`. Un client exigeant du SSO ? | 3-4 sessions |
| **Audit des 11 autres verticales** | Le restaurant a révélé 5 écarts ; les autres sont moins exercées. | 3-4 sessions |
| **Zone RH réglable ou figée** | Le registre déclare `max_hours_day`/`week`/`min_rest_hours` alors que ce sont des plafonds légaux. | Arbitrage expert-paie |
| **Les 45 arbitrages métier restants** | `DECISIONS-FIGEES` — désormais tous paramétrables. Reste à choisir les **bons défauts**. | 1 h d'entretien restaurateur |

---

# 📋 PRIORITÉ 6 — Administratif *(hors code)*

Détail complet dans `docs/CHECKLIST-ADMIN.md`. Les délais sont longs — **à lancer en parallèle du code, dès maintenant.**

| Bloc | Points clés |
|---|---|
| **Société** | Immatriculation · SIRET · compte pro. **Prérequis de l'attestation NF525** (5 variables d'env). |
| **Assurances** | **RC Pro** couvrant l'édition de logiciel et la perte de données. Un bug de TVA = redressement chez le client. |
| **Contractuel** | CGV · **DPA (art. 28 RGPD, obligatoire)** · clause de réversibilité |
| **Support** | **Astreinte** — un restaurant tombe samedi 20 h, jamais mardi 10 h. |
| **PI** | Cession de droits signée par tout contributeur externe |

---

# Séquencement recommandé

```
AUJOURD'HUI
├── Sauvegarde distante        ← 83 commits sur une seule machine
├── Société · RC Pro           ← délais administratifs longs
└── FISCAL_SIGNING_SECRET      ← 30 min, débloque le scellement

SPRINT 1  4-4,5 sess.  Priorité 1 — prêt pour un pilote
          └── error.tsx · routes API · impression · Sentry · _demo_

SPRINT 2  4,5 sess.    Priorité 2 — connecteurs
          └── commencer par 2.1 (0,5 sess.) : arrêter de promettre

── ⭐ METTRE UN CLIENT DESSUS ──────────────────────────────

SPRINT 3  5 sess.      Priorité 3 — PENDANT le pilote
          └── E2E · offline/DLQ · timezone · npm audit

SPRINT 4  16-18 sess.  Priorité 4 — dette, au fil de l'eau

ARBITRAGE Priorité 5   Décisions produit, pas exécution
```

**Avant un client : 8,5-9 sessions.** Le reste peut et devrait attendre le terrain.

---

# Le point qui n'a pas bougé de la journée

**83 commits ne sont sauvegardés nulle part.** Dernier push : 23 août.
Le bundle local est sur le même disque que le dépôt — il protège d'une erreur `git`,
pas d'une panne matérielle.

```bash
git bundle create ~/Desktop/restaurant-os-backup-$(date +%Y%m%d).bundle --all
```

C'est la seule chose de ce document qui peut **tout** effacer, et la moins chère à régler.

---

# Observation de fin de journée

Le travail livré a porté sur ce qui était **le mieux spécifié** : le plan RBAC, très
détaillé, a été exécuté en entier — 48 décisions métier sont désormais réglables par
la bonne personne.

Mais les **trois lignes rouges de la priorité 1 n'ont pas bougé**. Un restaurateur
aujourd'hui ne pourrait ni encaisser légalement (secret fiscal absent), ni récupérer
sa commande après une erreur d'écran.

**La spécification attire le travail. La priorité devrait l'attirer davantage.**

---

*Mesuré le 2026-08-25 sur `main@da10a5b59`. Chaque chiffre est reproductible par commande.*
