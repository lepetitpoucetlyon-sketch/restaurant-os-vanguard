# 🎯 PLAN MAÎTRE — Vibecoder Rescue v3

> **Document de référence unique.** Réorganisé le **11 août 2026** après exécution des Phases 0, 1 et d'une partie de 2 et 3.
> Les sections terminées sont conservées en **archive compressée** ; l'effort porte sur ce qui reste.

---

# 📊 ÉTAT RÉEL — mesuré le 11/08/2026

| Indicateur | Départ (10/08) | **Aujourd'hui** | Cible |
|------------|---------------:|----------------:|------:|
| Erreurs TSC | 12 | **0** ✅ | 0 |
| Tests | 784 pass / 2 fail | **806 pass / 0 fail** ✅ | vert |
| Erreurs ESLint | ~502 | **298** | 0 |
| Cycles sentrux | 4 | **3** | 0 |
| Inversions de couche | 178 | **148** (97 shared · 42 lib · 9 store) | 0 |
| `InCents` | 686 | **694** | 0 |
| Racines `modules/` | 12 | **9** ✅ (fantômes supprimés) | 9 |

### Violations de barrel restantes, par pilier

| Pilier | Violations | Pilier | Violations |
|--------|-----------:|--------|-----------:|
| intelligence | **73** | ops | 26 |
| commerce | **63** | human | 13 |
| finance | 35 | logistics | 6 |
| compliance | 27 | facility | 2 |
| | | **TOTAL** | **245** |

> ⚠️ `human`, `logistics` et `compliance` ont déjà été traités — les violations restantes sont des **ponts inter-piliers** (un pilier importe en profondeur chez un autre), pas des oublis. Elles se résoudront avec §3.1 des piliers appelants.

---

# ✅ CE QUI EST FAIT — archive

> Ne pas refaire. Conservé pour la traçabilité et pour éviter qu'une session future ne le repropose.

| Phase | Contenu | Commits |
|-------|---------|---------|
| **0.1** | `VALIDATION_ERROR` ajouté à `NexusErrorCode` | `38aeb80ea` |
| **0.2** | 3 gardes `Promise.all` dans `PrepaieBuilder` | `d96695ba1` |
| **0.3** | `demo/simulation.test.ts` collecte | — |
| **0.4** | 11 erreurs TSC `scripts/crash-test/` | `ee3c4e1ab` |
| **0.5** ⚠️ | Gate sentrux — **PARTIEL**, voir §0.5bis ci-dessous | `2b97e3e7e` |
| **0.6** | `CLAUDE.md` — 4 domaines manquants ajoutés | `bb1edf338` |
| **0.7** | Doublon `front-desk` / `frontdesk` résolu | `a20b33c4b` |
| **0.8** 🚨 | **`requireSession` fail-closed — 41/41 appels migrés** | `64a771b14` |
| **0.9** 🚨 | **RBAC serveur — 13/13 actions sous `createSafeAction`** | `64a771b14` |
| **1.1 / 1.2** | Auto-fix ESLint (502 → 365, puis 298) | `d1e0079c5` · `d22e8a035` |
| **2B.0** | 25 `z.any()` → `z.unknown()` | `64a771b14` |
| **2B.1** | `createSafeAction` livré | `64a771b14` |
| **2C** | `onValidated` + 5 handlers critiques | `4578d853c` |
| **3.1 partiel** | Barrel : `human`, `logistics`, `compliance` | `df9741b57` · `1df4be9aa` · `9280b4364` |
| **3.x** | **Contrats extraits** — `system`, `rbac`, `users`, `cash`, `inventory`, `delivery`, `supplier-invoice` → `shared/nexus/contracts/` | `ea119363d` · `6d2f8cbac` · `e0320da7c` |
| **3.x** | **Racines fantômes supprimées** — `crm`, `hr`, `system` (12 → 9 racines) | `88753bd76` |
| **3.2 partiel** | Inversions 178 → 148 | `ed4862811` |
| **3.3 partiel** | Cycle StatCard résolu (`StatCardIntent` → `ui/types.ts`) — 4 → 3 cycles | `0d6239973` · `96e04a432` |
| **7.4** 🔴 | **Pourboire câblé** — 708500 hors TVA, `hr.tip_distributed` émis, invariant vert | `6dcb3ab80` |

### 🔴 Deux failles de sécurité fermées

- **§0.8** — `verifySession` retournait `null` sans lever. **41 Server Actions** s'exécutaient sans authentification effective, dont l'annulation fiscale NF525 et les mouvements de caisse.
- **§0.9** — `ACTION_MAP` (365 lignes) n'était appliquée **que dans le navigateur**. 0 route API et 0 Server Action ne vérifiaient le rôle. Un `serveur` pouvait annuler une commande en appelant l'action directement.

---

# 🎓 LEÇONS D'EXÉCUTION — à lire avant de reprendre

> Trois incidents réels sur cette exécution. Chacun a produit une règle.

## Leçon 1 — Un dépôt qui ne compile pas rend TOUTES les mesures fausses

Le commit `38650ab0c` « Complete Phase 3 » a été **reverté** (`d3703b37a`). Il annonçait « 0 inversion restante, 0 erreur ESLint ». En réalité :

- 280 imports corrompus sur 152 fichiers (`@/modules/` → `@_modules/` et `@/src/modules/`)
- 618 lignes de types supprimées
- **539 erreurs TSC · 0 des 97 suites de tests capables de démarrer**

**Pourquoi le compteur disait 0** : les imports corrompus étaient devenus `@_modules/...`. La commande de vérification cherchait `from '@/modules/`. **Elle ne matchait plus rien.** Le zéro venait de l'invisibilité, pas de la correction.

> 🔴 **RÈGLE 1 — `npx tsc --noEmit` est la PREMIÈRE commande, toujours.** Aucune autre mesure n'est valide tant qu'elle ne retourne pas 0.

## Leçon 2 — Contourner la mesure n'est pas résoudre

Sur le pilier `human`, le cycle `store → barrel` a été contourné en passant à un **chemin relatif** :

```ts
// store/pillars/rbac.ts:2
import { ... } from "../../modules/human/domain/schemas/rbac"
```

La décision architecturale était **juste** (le store ne doit pas importer le barrel). Mais l'import plonge toujours aussi profond — invisible au grep **et** à ESLint. Il y a **5 imports de ce type** dans le dépôt.

> 🔴 **RÈGLE 2 — Quand un cycle force à contourner, on ne contourne pas : on déplace le symbole partagé vers une zone neutre** (`shared/nexus/contracts/`). Si c'est impossible dans l'immédiat, on le déclare en dette **avec le chemin exact** — on ne le compte pas comme résolu.

## Leçon 3 — « Terminé mais il reste une passe » n'existe pas

Un rapport a déclaré la Phase 3 « **TERMINÉE** » tout en notant en bas : *« les déplacements massifs ont cassé certains chemins TS, une passe de réparation sera nécessaire »*.

> 🔴 **RÈGLE 3 — Une tâche est terminée si et seulement si `tsc` = 0 ET `vitest` ≥ 806 passed.** Sinon elle est PARTIELLE ou BLOQUÉE, et on l'écrit.

## Leçon 4 — Mes propres mesures peuvent mentir aussi

J'ai annoncé un « nœud de 60 fichiers » pour les cycles. C'était un artefact de `grep -A 60`, qui plafonnait la sortie. Le nœud réel dépasse 600 fichiers.

> 🔴 **RÈGLE 4 — Vérifier qu'une commande de comptage n'a pas de plafond** (`-A`, `head`, `tail`) avant de conclure.

## Les 5 interdits absolus

| Interdit | Conséquence réelle observée |
|----------|------------------------------|
| **Script de remplacement global sur les imports** | 280 imports corrompus, 539 erreurs TSC, revert complet |
| **`sed` sur les montants** (`s/InCents/InMicrounits/g`) | Renomme sans convertir → montants ÷ 10 000 sur des écritures **scellées et irréversibles** |
| **Supprimer un fichier de types** « déplacé » | 618 lignes détruites, « ça compilait » parce que plus rien ne résolvait |
| **Renommer un champ du snapshot NF525** | Toute la chaîne de sceaux historique devient invérifiable |
| **Se fier au code de sortie de `rtk`** | `exit 0` sur 12 erreurs TSC, « 2 errors » sur ~502 |

---

# 🚦 CONTRAT D'EXÉCUTION

## Après CHAQUE tâche — les 4 commandes, dans cet ordre

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"          # DOIT être 0 — première commande
npx vitest run --reporter=dot 2>&1 | tail -5        # DOIT être ≥ 806 passed
sentrux check . 2>&1 | grep max_cycles              # NE DOIT PAS augmenter
npx eslint src --ext .ts,.tsx 2>&1 | tail -2        # doit baisser
```

> ⚠️ **`tail -5` et non `tail -4`** : la ligne `Tests X passed` est masquée par `tail -4`.
> ⚠️ La ligne `Errors N` de vitest est du **bruit non déterministe** (4 à 14 selon les runs) — voir §Dette connue.

## Règles

1. **Un commit par tâche.** Message : `<type>(<scope>): <tâche> — réf. plan §X.Y`
2. **Une tâche cochée = une tâche vérifiée**, avec la sortie **brute** collée dans `PLAN_PROGRESS.md`
3. **Vérifier les références avant de les suivre** — `grep` le symbole, jamais le numéro de ligne seul
4. **Si une correction en casse une autre : arrête-toi.** Ce plan contient des contraintes légales contradictoires (fiscal 10 ans ⇄ RGPD). Signale, ne tranche pas
5. **Si tu es bloqué, dis-le.** Ne bricole pas une mesure pour qu'elle affiche ce qu'on attend

## Décisions réservées à l'humain

| Sujet | § |
|-------|---|
| Choix de la Plateforme Agréée | 7.5 |
| Périmètre visuel de la refonte | 6.0 |
| i18n avant ou après la refonte | 6.2 |
| Précédence charte tenant ⇄ verticale | 6.6 |
| Ouverture de la verticale `clinic` (données de santé) | 7.6 |

---

# 🗺️ ORDRE DE BATAILLE — réorganisé

```
🚨 PHASE 7.3  RÉCEPTION e-facture        1ᵉʳ SEPT. 2026 · ~3 SEMAINES · HORS SÉQUENCE
                                          la loi n'attend pas la dette technique

PHASE 1bis   Finir le filet              ~4 h    2 invariants + 6 règles Semgrep
PHASE 2B.2   Schémas Zod stricts         ~1 j    le squelette existe déjà
PHASE 3      Frontières                  ~4 j    245 barrel · 148 inversions · 3 cycles
PHASE 4      Fragmentation UI            ~2 j
PHASE 5      Monnaie                     ~4 j    694 InCents
PHASE 6      Refonte UI                  ~3 j
PHASE 7      Interop + facturation       ~8 j
```

**Total restant : ~22 jours-homme.**

---

# 🚨 PHASE 7.3 — RÉCEPTION e-facture (PRIORITÉ ABSOLUE)

> **Échéance légale : 1ᵉʳ septembre 2026.** Vérifiée le 10/08/2026.
> **Obligation de RÉCEPTION pour toutes les entreprises assujetties TVA** — donc tous tes clients.
> L'émission et l'e-reporting de tes clients TPE/PME ont jusqu'à **septembre 2027**.

## Terminologie

Depuis juillet 2025 on ne dit plus « PDP » mais **PA — Plateforme Agréée**. **138 PA** immatriculées en juin 2026, liste officielle DGFiP sur impots.gouv.fr.

## Sprint — 10 jours

### J1-J2 — Choix de la PA

- [ ] Partir de la **liste officielle DGFiP**, pas d'un comparatif commercial
- [ ] Filtrer sur les critères ci-dessous
- [ ] Ouvrir un compte sandbox chez 2 candidats

| # | Critère | Pourquoi éliminatoire |
|---|---------|----------------------|
| 1 | **API publique ouverte aux tiers** | Certaines PA réservent l'interface à leurs propres clients |
| 2 | REST + OAuth2 + **webhooks** | Indispensable pour les statuts de cycle de vie |
| 3 | **Sandbox** | On ne teste pas sur des factures réelles de clients |
| 4 | OpenAPI / Swagger | Client typé, cohérent avec ton TS strict |
| 5 | 🔴 **Modèle multi-tenant éditeur** | **LE discriminant** : tu as N clients. La PA doit gérer « éditeur → sous-comptes par tenant », pas un compte par client |
| 6 | Tarification à l'usage · rate limits | Un service du soir = pic de transactions |

> 🔴 **Question exacte à poser** : *« Proposez-vous un modèle éditeur/partenaire avec sous-comptes par tenant et une seule intégration API ? »* Certaines PA proposent du marque blanche API-first conçu pour ça.

### J3-J5 — Interface d'abord, connecteur ensuite

Applique le motif déjà utilisé pour l'open banking (`refactor(banking): open banking 100% agnostique — plug-in provider pattern`).

```
modules/finance/connectors/einvoicing/
├── IEInvoicingProvider.ts      ← interface : receive, getStatus
├── providers/
│   ├── <PA>Provider.ts
│   └── MockProvider.ts         ← EN PREMIER
└── EInvoicingRegistry.ts       ← résolution par tenant
```

```ts
export interface IEInvoicingProvider {
  receive(payload: unknown): Promise<InboundInvoice>;
  getStatus(invoiceId: string): Promise<InvoiceLifecycleStatus>;
  // send() viendra en 2027 — ne PAS l'implémenter maintenant
}
```

- [ ] `IEInvoicingProvider` **avant** tout connecteur — sinon la PA sera câblée en dur
- [ ] `MockProvider` **en premier** — les tenants `_demo_*` ne doivent émettre aucun appel externe (règle déjà affichée dans `SystemTenantsTab`)
- [ ] Une PA **différente par tenant** doit rester possible — certains clients en auront déjà une

### J6-J8 — Ingestion

- [ ] Route webhook `src/app/api/einvoicing/inbound/route.ts`
  > 🔴 **Vérifier la signature du webhook** — motif déjà en place dans `lib/server/webhookVerify.ts`. Une route d'ingestion non signée accepte n'importe quelle facture forgée.
- [ ] Parser **Factur-X** (XML dans PDF/A-3), **UBL**, **CII** → un modèle interne unique
- [ ] `InboundInvoiceSchema` (Zod) — **montants en microunits dès l'entrée**
- [ ] Écriture dans `tenants/{id}/supplier-invoices/{id}`

### J9-J10 — Cycle de vie et UI

- [ ] Statuts **obligatoires** : `reçue` → `approuvée` | `rejetée` → `payée`. L'émetteur attend le retour de statut
- [ ] Écran « Factures reçues » — approuver / rejeter avec motif obligatoire
- [ ] **Rapprochement avec les `receptionLogs` HACCP** — une facture fournisseur correspond à une livraison contrôlée. Croisement que peu de logiciels savent faire

### Tests de fin de sprint

- [ ] Facture sandbox reçue → montant en microunits exact, statut `reçue`
- [ ] Webhook non signé → **rejeté en 401**
- [ ] Tenant `_demo_*` → `MockProvider`, **zéro appel réseau**

> 🔴 **Ne PAS implémenter l'émission dans ce sprint.** Elle est due en **septembre 2027**. La tentation sera forte parce que `FacturXGenerator` existe déjà — résiste. Une réception fiable vaut mieux que deux moitiés.

### État du code e-facture (audité)

| Élément | État |
|---------|------|
| `FacturXGenerator.ts` (166 l.) | 🟠 profil **MINIMUM**, XML seul |
| `FacturXDownloadButton` · `ChorusProSettings` | 🟢 présents |
| `FiscalTransmitter.transmitToEDIProvider(_xmlContent)` | 🔴 **stub** — paramètre inutilisé |
| Connexion PA | 🔴 inexistante |
| **Réception** | 🔴 inexistante |

### 🎁 L'e-reporting est presque fait (pour 2027)

| Attendu par la réforme | Ce que tu as |
|------------------------|--------------|
| Caisse NF525 certifiée | chaîne scellée SHA-256, append-only |
| Agrégation quotidienne | clôture Z — `TicketZHandler.ts` |
| **Ventilation par taux TVA** | **`ticketZ.taxBreakdown`** — `TicketZHandler.ts:122` |
| Taux restauration | `dine_in 0.10` · `takeaway 0.055` · alcool `0.20` — `vatResolver.ts:13-21` |

**Il ne manque que le transport vers la PA.**

---

# 🕸️ PHASE 1 bis — Finir le filet (~4 h)

## État

| Élément | Fait | Reste |
|---------|------|-------|
| Invariants fast-check | **5 / 7** | 2 |
| Règles Semgrep | **1 active** (en `WARNING`) + 5 dans `disabled/` | activer 6, passer en `ERROR` |
| Knip | ✅ `.knip.json` | — |
| Doc générée | ✅ `scripts/gen-pillars-doc.ts` | — |

### Invariants présents

`money-conservation` ✅ (2 tests) · `currency-conversion` ✅ · `fiscal-chain` ✅ · `split-invariants` ✅ · `tax-breakdown` ✅

### À écrire

- [ ] **Invariant 6** — `Σ factures d'un ticket ≤ total scellé` (prépare §7.4 facture)
- [ ] **Invariant 7** — *projection reconstruite depuis les événements === projection courante* (prépare §6.5)

### Règles Semgrep à activer — une par une

- [ ] `no-cents.yml` — 🔴 **AVANT la Phase 5**, sinon la dette se recrée pendant qu'on la résorbe
- [ ] `no-direct-cast.yml` — interdit `as Microunits`
- [ ] `no-pii-in-invoice.yml` — garantit §7.6
- [ ] `tenant-rules.yml` — sentinelles `__FLEET__`, `_demo_*`…
- [ ] `no-hardcoded-hex.yml` — ⚠️ **seulement après §6.1**, sinon 97 erreurs bloquent la CI
- [ ] **NOUVELLE 8ᵉ règle** — `no-any-in-safe-action` :
  ```yaml
  - id: no-any-in-safe-action
    languages: [typescript]
    severity: ERROR
    message: "createSafeAction avec z.any() — utiliser z.unknown() ou un schéma strict (§2B.2)"
    pattern-regex: 'createSafeAction\([\s\S]{0,200}z\.any\(\)'
  ```
  > 🔴 **`z.any()` est un appel de fonction, pas une annotation.** `@typescript-eslint/no-explicit-any` ne le détecte pas. Sans cette règle, la Phase 2 afficherait « 0 any » avec des payloads `any` qui circulent.
- [ ] Passer `immutable-collections.yml` de `WARNING` à `ERROR`

---

# 🛡️ PHASE 2B.2 — Schémas Zod stricts (~1 j)

> Le squelette est **déjà écrit**. Chaque `z.tuple([...])` liste les arguments dans l'ordre avec leur type primitif. Le travail n'est plus de concevoir la forme du payload — c'est d'**ajouter les contraintes métier**.

## Les 13 Server Actions

| # | Fichier | Schéma | Contrainte métier |
|---|---------|--------|-------------------|
| 1 | `ops/service/pos/actions/commerce.action.ts` | `OrderPayloadSchema` | ❗ quantités et prix négatifs interdits |
| 2 | `ops/service/pos/actions/void.action.ts` | `VoidPayloadSchema` | ❗ motif obligatoire, traçabilité NF525 |
| 3 | `ops/service/pos/actions/cashdrawer.action.ts` | `CashDrawerSchema` | ❗ microunits, jamais négatif |
| 4 | `ops/service/pos/actions/kitchen.action.ts` | `RecipeUpdateSchema` | — |
| 5 | `ops/service/pos/actions/floor.action.ts` | `FloorUpdateSchema` | — |
| 6 | `finance/actions/finance.action.ts` | `JournalEntrySchema` | ❗ **NF525** append-only |
| 7 | `compliance/…/haccp.action.ts` | `HACCPRecordSchema` | ❗ timestamp forcé + bornes température |
| 8 | `compliance/…/nonConformity.action.ts` | `NonConformitySchema` | ❗ sévérité énumérée |
| 9 | `commerce/actions/marketing.action.ts` | `CampaignSchema` | — |
| 10 | `commerce/…/eventQuote.action.ts` | `QuoteSchema` | ❗ microunits |
| 11 | `logistics/…/inventory.action.ts` | `StockMovementSchema` | ❗ mouvements négatifs non justifiés interdits |
| 12 | `human/…/timeclock.action.ts` | `TimeclockSchema` | ❗ anti-antidatage |
| 13 | `shared/actions/settings.action.ts` | `SettingsSchema.strict()` | ❗ `.strict()` bloque l'injection |

**Ordre** : 6 → 7 → 1 → 3 → 12 (conformité et fiscal d'abord), puis le reste.

> 🔴 **Tout schéma monétaire s'écrit en microunits**, même si le pilier n'est pas encore converti. Un schéma est une source de vérité dont le type est inféré — y inscrire `InCents` propage la dette à tout ce qui l'utilise.

### Porte de sortie

```bash
grep -rn "z\.any()\|z\.unknown()" src --include="*.action.ts" | wc -l   # → 0
npx eslint src --ext .ts,.tsx | grep -c no-explicit-any                 # → 0
```

---

# 🧱 PHASE 3 — Frontières architecturales (~4 j)

## 3.0 — Les 3 décisions structurelles

> **À écrire dans `CLAUDE.md` AVANT tout déplacement.** Les prendre après reviendrait à déplacer deux fois les mêmes fichiers.

### Décision 1 — Le métier vit dans les piliers, jamais dans les verticales

Un garage signe, tu codes « prise en charge d'un véhicule ». Le fichier va dans **`modules/ops/service/repair-intake/`**, pas dans `verticals/garage/`.

**Pourquoi** — ces quatre opérations sont **la même** :

| garage | hôtel | clinique | restaurant |
|--------|-------|----------|------------|
| prise en charge véhicule | check-in client | accueil patient | installation table |

On reçoit quelqu'un, on ouvre un ticket de service, on l'assigne, on suit. Seuls le vocabulaire et deux champs changent.

> 🎯 **Le test qui tranche** : *« si je corrige un bug, combien d'endroits je touche ? »* **Un = bon. Huit = mauvais.**

`src/verticals/` ne contient que de la **composition** : plugin UI, adapters, navigation, tokens. **Rien qui calcule.** Tes adapters font déjà 13 lignes — c'est le bon signe.

### Décision 2 — Motif interne : `components/hooks/services/store`

95 % du code l'utilise déjà, et ton outillage (Barrel Contract, ESLint, sentrux) est calibré pour lui. L'hexagonal (`presentation/application/infrastructure`, 69 scaffolds quasi vides) est réservé aux modules à **logique complexe ET multi-implémentations d'infrastructure** — chez toi : la facturation électronique (plusieurs PA) et l'open banking.

> Le bénéfice de l'hexagonal — l'inversion de dépendance — tu l'as **déjà à l'étage au-dessus**, via Nexus, `SovereignGuard` et l'EventBus. Le refaire dans chaque module, c'est le faire deux fois.

### Décision 3 — RBAC agnostique de la verticale

`PERMISSION_ROLE_LEVELS` définit 11 rôles **tous restaurant** (`chef_rang`, `serveur`, `barman`, `plongeur`…). Un garage n'a rien de tout ça.

**Séparer le NIVEAU du LIBELLÉ** :

```
NIVEAUX (universels, jamais modifiés — le socle du RBAC)
  100 owner · 90 direction · 70 management · 60 finance
   50 supervision · 40 operation · 30 accueil · 10 support

LIBELLÉS (par verticale, cosmétiques)
  restaurant : 50 « chef de rang »      40 « serveur »        10 « plongeur »
  garage     : 50 « chef d'atelier »    40 « mécanicien »     30 « réceptionnaire »
  clinique   : 50 « médecin référent »  40 « infirmier »      30 « secrétaire »
  hôtel      : 50 « chef de réception » 40 « réceptionniste » 30 « bagagiste »
```

`ACTION_MAP` ne change pas d'une ligne — elle compare des `minLevel`, jamais des noms.

- [ ] Renommer les clés de `PERMISSION_ROLE_LEVELS`, **conserver les valeurs numériques** (aucune migration de données)
- [ ] `roleLabels: Record<number, string>` dans le plugin de chaque verticale
- [ ] `RolesPermissionsPanel.tsx` + MCC `users/role` affichent les libellés de la verticale active

### Les lignes à écrire dans `CLAUDE.md`

```markdown
## Où vit le code

- Le MÉTIER vit dans `modules/<pilier>/<domaine>/<module>/`.
  Une opération commune à plusieurs industries s'écrit UNE fois dans le pilier.
- `verticals/<v>/` ne contient QUE de la composition : plugin UI, adapters,
  navigation, tokens. Aucun calcul métier.
- Motif interne officiel : `components/ hooks/ services/ store/ types/`.
  L'hexagonal est réservé aux modules à logique complexe ET multi-implémentations
  d'infrastructure — le justifier en PR.
- RBAC : les NIVEAUX sont universels, les LIBELLÉS appartiennent à la verticale.
```

## 3.1 — Barrel Contract (245 violations)

### Procédure par pilier

**1. Mesurer**
```bash
PILIER=intelligence
grep -rn "from '@/modules/$PILIER/[a-z]" src --include="*.ts*" | grep -v "__tests__\|\.test\." | wc -l
```

**2. Exposer dans le barrel racine** — `src/modules/<pilier>/index.ts`, **exports nommés uniquement**
```ts
export { LLMManager } from './ia/ai/LLMManager';
export type { ImportCategory } from './acquisition/onboarding/migration/types';
```
> ⚠️ Jamais `export *` sur un sous-module lourd — ça tire ses dépendances dans le bundle de quiconque importe le pilier.

**3. Remplacer les imports profonds** — fichier par fichier, **à la main**

**4. Vérifier** — les 4 commandes

**5. Commit isolé par pilier**

### Ordre — du plus petit au plus gros

- [ ] `facility` (2) → `logistics` (6) → `human` (13) → `ops` (26) → `compliance` (27) → `finance` (35) → `commerce` (63) → `intelligence` (73)

> 🔴 **Le piège du barrel** : élargir un barrel peut créer un cycle `store → module → hooks → store`. Si `sentrux` passe de 3 à 4+, **c'est ton élargissement qui est fautif**. Reviens en arrière et déplace le symbole vers `shared/nexus/contracts/` (Leçon 2).

> ⚠️ **`ops` contient `FloorPlanEditor`** (Konva ~1,2 Mo). Ne le ré-exporte **jamais** dans le barrel — documenté dans `src/modules/ops/index.ts`.

## 3.2 — Inversions de couche (148)

| Zone | Occurrences | Nature |
|------|------------:|--------|
| `shared/` → `modules/` | **97** | fondation qui importe le métier |
| `lib/` → `modules/` | **42** | héberge Nexus et MCC |
| `store/` → `modules/` | **9** | 🟠 produit les TDZ au prerender SSR |

> ✅ **La direction est correcte au sommet** : `modules/ → app/` = **0** et `modules/ → verticals/` = **0**.

- [ ] Traiter les **9 inversions `store/`** en priorité — ce sont celles qui cassent le SSR
- [ ] Résoudre les **5 imports relatifs profonds** (Leçon 2) en déplaçant les schémas vers `contracts/`
- [ ] Puis `shared/` (97), puis `lib/` (42)

## 3.3 — Les 3 cycles restants

**Le cycle StatCard est résolu.** Reste un **nœud de plus de 600 fichiers** traversant `lib/nexus`, `lib/adapters`, `lib/sync`, `instances/`, `infrastructure/` et remontant jusqu'à `modules/commerce`.

> 🔴 **Ce n'est pas un problème d'arêtes à couper.** Trois coupures ciblées (`useBilling`, `EndOfDayWizard`, contrats) ont été faites — **les cycles sont restés à 3**. La cause est structurelle : voir §3.4.

**Gain réel de ces coupures** : `contracts/index.ts` a **0 import vers `modules/`**. La couche contrats est passée de *miroir* à *source*. C'est durable.

## 3.4 — 🎯 Séparation `kernel/ orchestration/ design/`

> **C'est la vraie résolution des cycles.** Chantier de 1,5 à 2 jours, à faire d'un bloc.

### Le problème

`shared/` (598 fichiers, 56 237 lignes) **n'est pas une couche, c'en est trois** :

| Sous-dossier | Fichiers | Lignes | Nature |
|--------------|---------:|-------:|--------|
| `components/` | 152 | 22 218 | Design system |
| `eventBus/` | 194 | 13 504 | Orchestration (165 handlers) |
| `nexus/` | 119 | 10 343 | Noyau : contrats, guards, vault |

Leurs **dépendances autorisées sont opposées** : le design system doit connaître des types métier, le noyau **jamais**. Tant qu'ils cohabitent, la règle ne peut pas être exprimée.

S'y ajoutent `lib/` (190) et `infrastructure/` (43 fichiers, 866 lignes — surtout des barrels) qui se chevauchent.

### 🔑 La technique : déplacer sans réécrire un seul import

**Mesure décisive** — répartition des 927 imports vers ces zones :

| Cible | Alias dédié | Générique `@/shared/...` |
|-------|------------:|-------------------------:|
| `shared/nexus` | **323** (`@nexus/`) | 213 |
| `shared/eventBus` | 0 | **297** |
| `shared/components` | **64** (`@ui/`) | 30 |

387 imports suivent **gratuitement** un changement de cible dans `tsconfig.json`.
Pour les 540 autres, TypeScript résout les `paths` par **spécificité** — le motif le plus long gagne :

```jsonc
"@/shared/nexus/*":      ["./src/kernel/nexus/*"],
"@/shared/eventBus/*":   ["./src/orchestration/*"],
"@/shared/components/*": ["./src/design/*"],
```

**Résultat : `git mv` + mappings, et les 927 imports fonctionnent sans qu'une ligne soit touchée.**

> 🔴 **Seuls outils autorisés : `git mv` et `tsconfig.json`.** Aucun script de remplacement (Leçon 1).

### Étape 1 — `kernel/` (la plus rentable)

```bash
mkdir -p src/kernel
git mv src/shared/nexus  src/kernel/nexus
git mv src/lib/nexus     src/kernel/adapter
```

> ⚠️ `lib/nexus` (machine core : NexusAdapter, interceptor, adapters Firestore) et `shared/nexus` (contrats, guards, state, vault) sont **deux choses différentes** — documenté dans `CLAUDE.md`. Deux sous-dossiers distincts, **ne pas fusionner**.

```jsonc
"@nexus":            ["./src/kernel/nexus/index"],  // ⚠️ forme SANS slash
"@nexus/*":          ["./src/kernel/nexus/*"],      // MODIFIÉ
"@kernel/*":         ["./src/kernel/*"],            // NOUVEAU
"@/shared/nexus/*":  ["./src/kernel/nexus/*"],      // COMPAT
"@shared/nexus/*":   ["./src/kernel/nexus/*"],      // COMPAT
"@/lib/nexus":       ["./src/kernel/adapter/index"],// ⚠️ forme SANS slash
"@/lib/nexus/*":     ["./src/kernel/adapter/*"],    // COMPAT
```

> 🔴 **Piège vérifié en exécution** : un mapping `"X/*"` **ne couvre pas** `import … from 'X'` sans slash. Il y a 4 imports `from '@/lib/nexus'` dans le dépôt. **Déclarer systématiquement les deux formes**, et vérifier avant chaque étape :
> ```bash
> grep -rn "from '@/lib/nexus'\|from '@nexus'" src --include='*.ts*' | wc -l
> ```

### ⚠️ Étape 0 bis — OBLIGATOIRE avant le premier `git mv`

**Constaté en exécution** : un premier essai de l'Étape 1 a produit **76 erreurs TSC**, causées par **6 imports relatifs** que le mapping ne peut pas rattraper (un chemin relatif ne passe pas par `paths`).

```
src/shared/nexus/contracts/index.ts:7   '../../nexus-contract'
src/shared/nexus/contracts/index.ts:8   '../../genome.types'
src/scripts/crash-test/audit_stock_race.ts        '../../lib/nexus/NexusAdapter'
src/scripts/crash-test/audit_reservation_race.ts  '../../lib/nexus/NexusAdapter'
src/scripts/crash-test/audit_offline_pos.ts       '../../lib/nexus/NexusAdapter'
src/__tests__/stress/NexusInterceptor.stress.test.ts '../../lib/nexus/NexusInterceptor'
```

- [ ] Convertir ces **6 imports en alias**, à la main, dans un **commit séparé** :
  - `'../../nexus-contract'` → `'@/shared/nexus-contract'`
  - `'../../genome.types'` → `'@/shared/genome.types'`
  - `'../../lib/nexus/X'` → `'@/lib/nexus/X'`
- [ ] Vérifier les 4 commandes, commiter : `refactor(imports): aliaser 6 imports relatifs — prépare §3.4`
- [ ] **Puis seulement** lancer l'Étape 1

> 💡 **Pourquoi cette étape et pas « déplacer aussi `nexus-contract.ts` »** : déplacer ces deux fichiers marcherait aussi, mais prendrait une décision d'architecture comme effet de bord d'un déblocage technique. Ils ont probablement leur place dans `kernel/` — ça se décide en Étape 4, délibérément. L'aliasing rend le déplacement **indépendant de l'emplacement des fichiers**, et ces imports relatifs profonds relèvent de toute façon de la Leçon 2.

- [ ] Vérifier les 4 commandes
- [ ] 🎯 **RAPPORTER LE CHIFFRE DE CYCLES AVANT DE CONTINUER.** S'ils tombent de 3 à 0 ou 1, l'essentiel du problème était la cohabitation `shared/nexus` ↔ `lib/`
- [ ] Absorber `infrastructure/` (43 fichiers) — dossier par dossier, vérifier après chaque `mv`. Contient le doublon `useAuth` qui participe aux cycles
- [ ] `src/infrastructure/` doit finir **vide et supprimé**

### Étape 2 — `orchestration/`

```bash
git mv src/shared/eventBus src/orchestration
```
```jsonc
"@orchestration/*":    ["./src/orchestration/*"],
"@/shared/eventBus/*": ["./src/orchestration/*"],
```

> ⚠️ `registerHandlers/*.ts` importe massivement depuis `modules/`. C'est **légitime** — l'orchestration connaît les contrats métier. Ne « corrige » pas ces imports.

### Étape 3 — `design/`

```bash
git mv src/shared/components src/design
```
```jsonc
"@ui":                   ["./src/design/ui/index"],
"@ui/*":                 ["./src/design/ui/*"],
"@design/*":             ["./src/design/*"],
"@/shared/components/*": ["./src/design/*"],
```

### Étape 4 — Ce qui reste dans `shared/`

`hooks/` · `providers/` · `contexts/` · `plugins/` · `seeds/` · `utils/` · `services/` · `schemas/`

- [ ] **Inventorier sans déplacer** et soumettre à l'humain
- Hypothèses : `providers/`+`contexts/` → `app/` · `plugins/`+`seeds/` → `kernel/` · `hooks/`+`utils/` → cas par cas

### Étape 5 — Retirer les mappings compat

Un mapping par commit : le retirer → `tsc` liste les fichiers cassés → corriger **à la main** vers le nouvel alias → vérifier → commit.

> Si un mapping casse plus de 50 fichiers, garde-le et signale-le.

### Cible finale

```
src/
├── kernel/        ← ne dépend de RIEN
├── orchestration/ ← kernel + contrats de modules, jamais leur UI
├── modules/       ← les 8 piliers, inchangé
├── design/        ← peut connaître les types métier, jamais l'inverse
├── verticals/     ← composition uniquement
└── app/           ← routes
```

### ✅ Porte de sortie Phase 3

```
CLAUDE.md          : 3 décisions écrites
Barrel             : 245 → 0
Inversions         : 148 → 0
Cycles             : 3 → 0
infrastructure/    : supprimé
imports réécrits pendant 3.4 : 0
```

---

# 🧩 PHASE 4 — Fragmentation UI (~2 j)

> ⚠️ **4.1 et 4.5 touchent des montants** — voir la matrice de dépendances.

## 4.1 — `SplitBillDialog.tsx` (484 l. → ~80)

**10 `useState`** dans un seul composant (l. 41-50) — c'est la cause de la taille, pas le JSX.

- [ ] **`useSplitBillState.ts`** — 6 états liés via `useReducer` : `mode` · `splitCount` · `convivePayments` · `selectedItems` · `customAmounts` · `payingConvive` + `syncSplitState` · `getConviveTotal` · `handlePayConvive` + dérivés
  > Ces 6 changent **ensemble** — d'où `useReducer` plutôt que 6 `useState` qu'il faut synchroniser à la main (c'est ce que fait `syncSplitState` aujourd'hui)
- [ ] **`usePaymentTerminal.ts`** — `selectedPaymentMethod` · `isProcessing` · `terminalState` · `terminalError` + `handleConfirmPayment`
  > `terminalState: 'idle' | 'pending' | 'manual_wait' | 'error'` est déjà une machine à états. L'isoler la rend **testable sans terminal physique**
- [ ] `<SplitBillHeader />` · `<ConviveGrid />` · `<PaymentMethodSelector />` · `<SplitModeSelector />`

> 🔴 **Ne convertis PAS les montants pendant l'extraction.** Phase 5 « ops » d'abord, fragmentation ensuite.
> ⚠️ Après extraction, relancer `src/__tests__/invariants/` — si l'invariant du split passe au rouge, l'extraction a cassé la répartition du reste.

## 4.2 — `LandingDashboard.tsx` (488 l.)

- [ ] Isoler newsletter et tracking Analytics dans des hooks
- [ ] `next/dynamic` sur les sections de contenu → gain de TTI

## 4.3 — God files

> 🔄 Les **aggregation roots** (`app/**`, `*Provider.tsx`, `*Dashboard.tsx`) sont **autorisés jusqu'à fan-out 30** par la charte `.agents/agents.md:30`. Ne pas les découper.

| Fichier | Fan-out | Traitement |
|---------|--------:|------------|
| `app/(admin)/admin/mcc/page.tsx` · `KitchenDashboard.tsx` · `NexusProviderStack.tsx` · 2× `NexusFleetProvider.tsx` | 16-18 | ✅ **Aggregation Roots — ne pas toucher.** Vérifier seulement : 0 calcul métier + `next/dynamic` |
| 4× `registerHandlers/*.ts` | 17-24 | 🟠 Registres par nature — exempter dans `rules.toml` |
| `lib/NexusSyncService.ts` | 19 | 🔴 **vrai god file** |
| `shared/providers/hooks/useNexusTenantLogic.ts` | 16 | 🔴 **vrai god file** |
| 2× `NexusFleetProvider.tsx` | — | ⚠️ **doublon apparent** — dédupliquer |

## 4.4 — Complexité

> ⚠️ `max_cc` a été durci de 20 → **12** (hors périmètre du plan), ce qui fait passer les violations de 4 à **33**. **Décision à prendre** : assumer le durcissement, ou revenir à 20.

| Fonction | cc | Fichier |
|----------|---:|---------|
| `isProductInCategory` | 27 | `shared/utils/categoryMatcher.ts` → table de correspondance |
| `POST` | 24 | `app/api/webhooks/stripe/route.ts` → dispatch par type |
| `analyzeDailyLaborCost` | 21 | `human/…/LaborCostAnalyzer.ts` → extraire les sous-calculs |

## 4.5 — Les 2 composants jamais transplantés

- [ ] `ReconciliationHub.tsx` et `AggregationWidget.tsx` → `modules/finance/comptabilite/accounting/components/reconciliation/`
- Source : `git show origin/main:src/modules/finance/components/accounting/reconciliation/<fichier>`
- ❗ **Adapter `InCents` → microunits** à la transplantation — après Phase 5 « finance »

---

# 💰 PHASE 5 — Migration monétaire (~4 j) — 🔴 LE PLUS RISQUÉ

## Pourquoi

Deux conventions cohabitent : `1 cent = 0,01 €` et `1 microunit = 0,000001 €`. **Facteur d'écart : 10 000.** À chaque frontière non convertie, l'erreur n'est pas de 1 % — elle est de **1 000 000 %**. Sur une écriture scellée NF525, c'est irrattrapable.

## Répartition — 694 occurrences

| Zone | Occ. | Priorité |
|------|-----:|----------|
| `modules/finance` | **259** | 🔴 P0 — risque fiscal direct |
| `modules/ops` | **138** | 🔴 P0 — POS, encaissement |
| `shared/` | ~97 | 🟠 P1 — se propage partout |
| `logistics` · `lib/` | ~77 | 🟠 P1 |
| `intelligence` · `commerce` · `human` · `app/` | ~99 | 🟡 P2 |
| `infrastructure` · `compliance` · `facility` | ~7 | 🟢 P3 |

## Procédure — par pilier, jamais en masse

> 🔴 **Interdiction absolue du `sed` global.** `s/InCents/InMicrounits/g` renomme **sans convertir la valeur**. Le code compile, les tests passent, et tous les montants sont divisés par 10 000.

**1. Cartographier**
```bash
grep -rn "InCents" src/modules/<pilier> --include="*.ts*" | grep -v "\.test\." > /tmp/cents-<pilier>.txt
```

**2. Classer chaque occurrence**

| Catégorie | Traitement |
|-----------|------------|
| Champ de données (`totalInCents: number`) | renommer **et** convertir × 10 000 |
| Variable locale de calcul | renommer, convertir à la source |
| **Frontière externe** (XML Factur-X, Stripe, API tierce) | 🔴 **NE PAS CONVERTIR** — l'extérieur attend des centimes. Convertir *au passage de la frontière* |

> ⚠️ La catégorie 3 est le piège. `FacturXGenerator.ts:15` : *« Prix unitaire en euros (pas en microunits — export XML externe) »*. Stripe attend des centimes.

**3. Écrire le test de non-régression AVANT de toucher au code**

**4. Convertir** — `toMicrounits()`, **jamais** `as Microunits`

**5. Vérifier** — les 4 commandes + `npx vitest run src/__tests__/invariants/`

**6. Commit isolé** — `refactor(<pilier>): migration microunits — N occurrences — réf. plan §5`

## Ordre

- [ ] **finance (259)**
  > 🔴 **Vérification NF525 obligatoire** : le hash porte sur `canonicalStringify(dataSnapshot)`. Les champs du snapshot sont `id · receiptNumber · operatorId · tableId · totalTTCInMicrounits · tvaBreakdown · timestamp`. **Si un nom de champ change, toute la chaîne historique devient invérifiable.** Figer ces noms, ou prévoir une migration versionnée du format.
- [ ] **ops (138)** — avant §4.1
- [ ] `shared/` → `logistics` → `lib/` → P2 → P3

> 💡 **Après chaque pilier converti, retirer son exclusion de la règle Semgrep `no-cents.yml`.** Le terrain gagné devient protégé contre la rechute.

### Garde-fous obligatoires AVANT la première conversion

- [ ] Règle Semgrep `no-cents.yml` **active**
- [ ] Invariant `fromMicrounits(toMicrounits(x)) === x` **vert**
- [ ] Invariant `Σ TVA ventilée = TVA totale` **vert**

---

# 🎨 PHASE 6 — Refonte UI (~3 j)

## 6.0 — Périmètre : tranché

Le socle est bon : **3607 classes sémantiques** contre **97 hex en dur** (97,4 % de discipline), tokens centralisés, dark mode via `[data-theme]` **et** `prefers-color-scheme`, `--text-on-primary` **calculé** par `getContrastTextColor()`.

**7 verticales sur 8 n'ont pas de métier implémenté** — 17 modules contiennent `export {};`, 12 pages sont des `VerticalPageStub`. Ce n'est **pas un défaut** : c'est la stratégie du squelette généraliste.

> **Décision : le graphiste travaille sur les 39 composants de `shared/components/ui` (futur `design/ui`) et les 8 jeux de `scopedTokens`. Il ne dessine aucun écran métier de verticale.**

Bénéfice : le design vaut aussi pour les industries pas encore créées.

- [ ] Écrire ce périmètre dans `CONTRIBUTING-UI.md`
- [ ] Retirer les 12 `VerticalPageStub` du parcours de recette
- [ ] Recette sur les `_demo_*` des verticales remplies (restaurant, garage, clinic, hotel)

## 6.1 — Les 97 hex en dur

Ces valeurs **ne suivront pas** un changement de charte.

`ProspectingDashboard` · `BasketAnalysis` · `CRMSidebar` · `ScoreGauge` · `SimpleFloorPlanEditor` · `SimulationDashboard` · `DigitalSignature` · `ZoneService`

- [ ] Remplacer par un token, ou créer le token
- [ ] Activer la règle Semgrep `no-hardcoded-hex.yml` **après** nettoyage
- 💡 Exception : les couleurs **de données** (séries de graphiques) peuvent rester littérales, mais dans une palette exportée

## 6.2 — ⚠️ i18n — décision humaine

**Objectif** : chaque **utilisateur** choisit sa langue — pas le tenant.

| Élément | État |
|---------|------|
| `locales/fr.ts` · `en.ts` | 🟢 19 Ko chacun |
| `es` · `ja` · `pt` | 🟠 ~25 % de couverture |
| `loadTranslations(lang)` | 🟢 existe |
| Composants utilisant `t()` | 🔴 **0** |
| `store/languageAtoms.ts` | 🔴 **fichier vide** |
| `preferredLanguage` sur le profil | 🔴 **absent** |

**Le principe** : une refonte rouvre de toute façon presque tous les composants pour changer titres et libellés. C'est **le même geste** que d'extraire la chaîne. Fait pendant : une passe. Fait après : **deux passes sur les mêmes fichiers**.

```tsx
❌ <h1>Plan de salle</h1>
✅ <h1>{t('floorPlan.title')}</h1>
```

- [ ] `preferredLanguage: Language` au contrat utilisateur — **par utilisateur**
- [ ] Écrire `store/languageAtoms.ts` (vide aujourd'hui)
- [ ] Câbler `useLanguage()` / `t()` dans `NexusOpsProvider`
- [ ] Corriger `translations.ts` — il documente un dossier `domains/` qui n'existe pas
- [ ] Sélecteur de langue dans le profil
- [ ] **Puis** lancer la refonte avec la règle `t()` obligatoire
- [ ] Compléter `es`/`pt`/`ja` **après**, en continu — une clé sans valeur retombe sur le français

## 6.3 — Cadrer le graphiste

| ✅ Zone libre | 🚫 Interdit |
|---------------|-------------|
| Variables CSS des design tokens | Logique dans `modules/*/services`, `*/domain`, hooks |
| Les 39 composants UI | Schémas Zod et types |
| Composition des pages (fan-out ≤ 30) | Montants et unités — **microunits, jamais de recalcul en UI** |
| `*Dashboard.tsx` (fan-out ≤ 30) | Contourner le Barrel Contract |
| Framer Motion, glassmorphism | Ajouter un hex en dur |

**Le pacte du fan-out ≤ 30** : aucun calcul métier direct, `next/dynamic` sur les panneaux lourds.

- [ ] `CONTRIBUTING-UI.md` d'une page, remis au graphiste
- [ ] Y inclure : la règle `t()`, la règle « un écran = une lecture » (§6.5), les 8 URLs `_demo_*` comme parcours de recette

## 6.4 — Le système 24 tenants (audit MCC)

**Architecture saine et câblée** — vérifié dans `SystemTenantRegistry.ts` :

| Tier | Convention | Écriture |
|------|-----------|----------|
| DEMO | `_demo_<variant>` | 🔒 Simulacra Mode |
| TEST | `_test_<variant>` | ✅ libre |
| REFERENCE | `_ref_<variant>` | 🔒 promotion MCC uniquement |

`isWritable()` **est appliqué** (`SovereignGuard.ts:219`, fail-closed) · Simulacra auto-activé (`SplashGate.tsx:70`) · 3 routes MCC sous `requireFleetAdmin` · `cloneFromReference()` **exclut les collections NF525** ✅

### Écarts à corriger

- [ ] **6.4.1 🔴 Zéro test** sur `isWritable`, `isSystemTenant`, `getSystemTenantTier`. C'est la barrière qui protège les 8 maîtres `_ref_*` dont **tous les clients sont clonés**
  - Test : écriture sur `_ref_restaurant` → **doit lever** · sur `_test_restaurant` → **doit passer**
- [ ] **6.4.2 🟠** `NexusEventBus.ts:75` réimplémente la règle en dur (`!startsWith('_ref_')`) alors que le fichier **importe déjà** `isWritable`. La constante locale **masque l'import**. Remplacer par l'appel canonique
- [ ] **6.4.3 🟠** Le variant `custom` n'a **pas de tokens** — c'est pourtant celui censé porter l'UI sur mesure
- [ ] **6.4.4** Vérifier : `bootstrap-system-tenants.ts` idempotent · `DEMO_SUBDOMAIN_MAP` synchronisé avec le DNS · `CLONABLE_COLLECTIONS` couvre les verticales non-restaurant · diff avant promotion `_test_` → `_ref_`

## 6.5 — Read models (ce qui rend la profondeur d'UI possible)

Ton back-end expose **toutes** les primitives : `query` avec `where`/`orderBy`/`limit`, **pagination curseur** (`startAfter`, `cursorAfter`), **`onSnapshot`** (déjà utilisé 51×), `runTransaction`, `batch`, `increment`, `serverTimestamp`.

**Ce qui manque : les read models.** Zéro projection.

> 🎯 Tu as bâti un côté **écriture** remarquable et presque aucun côté **lecture**. C'est du CQRS dont seul le **C** existe.

**Preuve** — `CustomerDetailPanel.tsx` : 2 `query` + 6 `.filter/.find/.map` côté navigateur. Une vraie fiche 360 (commandes, réservations, fidélité, factures, allergies, no-shows) = **7 requêtes par ouverture**.

**La machinerie est déjà là** — tes 165 handlers construisent les projections :

```
order.paid ─┐
reservation ─┤→ handler → tenants/{id}/projections/customer/{customerId}
loyalty     ─┤            { lastVisit, totalSpentInMicrounits, visitCount,
invoice     ─┘              favoriteItems[], allergies[], noShowCount }
```

- [ ] Projections `customer/{id}` · `table/{id}` · `dashboard/daily`
- [ ] Exclure `projections/` du clonage `_ref_` → client (elles se reconstruisent)
- [ ] `rebuildProjection(tenantId, type)` déclenchable depuis le MCC
- [ ] Invariant : *projection reconstruite === projection courante*

> 🔴 **Deux règles** : une projection est **jetable** (jamais de donnée qui n'existe qu'elle) et n'a **jamais autorité** (un contrôle fiscal lit `journalEntries`, pas `projections`).

> **Règle pour le graphiste : un écran = une lecture.** Si un écran a besoin de 3 sources, ce n'est pas l'écran qu'il faut simplifier, c'est une projection qu'il faut créer.

## 6.6 — ⚠️ Personnalisation tenant — décision humaine

**Le système existe et il est bon** : mode `'default' | 'custom'`, couleurs hex validées Zod, **3 rôles typographiques** (`--font-brand` titres/KPI · `--font-ui` corps/nav · `--font-mono` tickets/codes), `logoUrl`, splash conditionné, injection au provisioning.

### 🔴 Le conflit de précédence

```
:root                          ← BrandingProvider  (charte du TENANT)
  └─ div[data-vertical-scope]  ← VerticalUIProvider (tokens VERTICALE)
```

La cascade CSS donne la priorité au plus proche → **la verticale écrase la charte du client**.

Chevauchement mesuré : `--radius-btn` et `--radius-card`.

> ⚠️ Deux variables aujourd'hui, mais la Phase 6 prévoit d'étendre les `scopedTokens` des 8 verticales — le conflit s'élargira **pendant que le graphiste travaille**, et sera diagnostiqué comme un bug CSS.

- [ ] **Trancher** : Option A ✅ *la charte du tenant gagne toujours* (la verticale fournit un défaut) · Option B : verticale sur le structurel, tenant sur l'identité
- [ ] Implémenter et documenter dans `brand.ts` quelles variables sont surchargeables
- [ ] Test de non-régression

### Les 5 points qui manquent pour que l'app **soit** celle du client

- [ ] Favicon et titre d'onglet par tenant
- [ ] Manifeste PWA dynamique — sinon l'app installée porte **ton** nom
- [ ] Logo tenant sur le ticket ESC/POS et les PDF
- [ ] Emails transactionnels à la charte du client
- [ ] Variante sombre de la charte custom — une primaire choisie pour le clair peut être illisible

### ✅ Porte de sortie Phase 6

```
Cycles              : 0
Hex en dur          : 97 → 0
i18n                : tranché et câblé
SystemTenantRegistry: couvert par des tests
custom              : doté de scopedTokens
Précédence charte   : tranchée + testée
CONTRIBUTING-UI.md  : livré
```

---

# 🔗 PHASE 7 — Interopérabilité et facturation (~8 j)

> §7.3 (réception) est **hors séquence**, traitée en tête de document.

## 7.4 — Pont ticket → facture

### La contrainte qui gouverne tout

`journalEntries` et `fiscalSeals` sont dans les `IMMUTABLE_COLLECTIONS`. **Aucun update, aucun delete.**

> 🔴 **Une facture ne modifie jamais le ticket scellé.** Elle est un document **nouveau qui le référence**. Si le convive demande sa facture 3 jours après, le ticket reste intact bit pour bit.

```
tenants/{id}/journalEntries/{entryId}     ← SCELLÉ, INTOUCHABLE
        │ referencedBy (jamais l'inverse)
        ▼
tenants/{id}/invoices/{invoiceId}         ← NOUVEAU document
   { sourceEntryId, sourceSealHash, splitIndex?, buyer, lines, vatBreakdown, subjectId }
```

- [ ] Collection `invoices` **append-only**, ajoutée aux `IMMUTABLE_COLLECTIONS`
- [ ] `sourceSealHash` — copie du hash d'origine, prouve le lien sans toucher au ticket
- [ ] Numérotation séquentielle **distincte** de celle des tickets
- [ ] Une correction = **avoir** (nouveau document), jamais une modification

### ⚠️ Split bills — le plus délicat

Un split produit **UNE écriture scellée** avec `partialPayments[]`. Si un seul convive sur 4 veut une facture, il faut facturer **sa part** alors que le sceau couvre le ticket entier.

| Mode | TVA | Difficulté |
|------|-----|------------|
| `by-item` | ✅ **exacte** — chaque article porte son taux | 🟢 |
| `equal` | ⚠️ prorata sur chaque taux | 🟠 |
| `custom` | 🔴 prorata sur bases hétérogènes | 🔴 |

> 🔴 **Le piège TVA** : un ticket mélange 10 % (sur place), 5,5 % (à emporter) et 20 % (alcool). Un convive qui paie 50 € sur 200 € en mode `custom` doit voir ces 50 € ventilés **au prorata des bases par taux** — sinon sa TVA déductible est fausse et la facture juridiquement invalide.

```
Pour chaque taux t :
    part_HT(t)  = base_HT(t)  × (payé / total_TTC)
    part_TVA(t) = base_TVA(t) × (payé / total_TTC)

Invariant : Σ(factures d'un ticket) ≤ total scellé
```

- [ ] Prorata par taux dans `SplitBillDomainService` via `SovereignMath`
- [ ] Garde-fou : refuser si Σ factures > total scellé
- [ ] `splitIndex` sur la facture → traçabilité vers `partialPayments[i]`
- [ ] Mode `by-item` : **ne pas proratiser**, calculer sur les lignes réelles

### La bascule à 150 € HT

```
Encaissement
   ├─ pas de facture ─────────► ticket → e-reporting
   └─ « Facture entreprise »
         ├─ ≤ 150 € HT ──► facture SIMPLIFIÉE
         └─ > 150 € HT ──► facture COMPLÈTE
                            🔒 BLOQUER sans raison sociale + adresse + SIREN
```

- [ ] Bouton « Facture entreprise » dans `PaymentDialog` et `SplitBillDialog`
- [ ] `INVOICE_SIMPLIFIED_THRESHOLD_MICROUNITS = 150_000_000` — constante nommée, jamais en dur
- [ ] Le seuil s'applique à **la part facturée**, pas au total du ticket
- [ ] Refus de finalisation au-delà sans identité complète

> ⚠️ **Faire confirmer par l'expert-comptable** l'application exacte du seuil à la restauration.

### Sous le seuil — opportunité produit

Le client pro doit inscrire **à la main** le nom de son entreprise au dos du ticket. Sans ça, sa dépense n'est pas déductible.

- [ ] Encadré pré-tracé « Société : ____ / Adresse : ____ » via `EscPosBuilder`
- [ ] Si client connu `type: 'company'` : **pré-imprimer** — plus rien à écrire

### Champs manquants

| À ajouter | Où |
|-----------|-----|
| `siret` · `vatNumber` · `legalName` · `billingAddress` | contrat client |
| Mentions légales complètes | `InvoiceEngine` (81 l., aucune aujourd'hui) |
| `sourceEntryId` · `sourceSealHash` · `splitIndex` · `subjectId` | schéma `Invoice` |

- [ ] `InvoiceSchema` (Zod) **en microunits**
- [ ] Détail TVA : 10 % sur place · 5,5 % à emporter · 20 % alcool

### Reste sur les pourboires (§7.4 déjà câblé)

- [ ] Facture > 150 € : pourboire en pied, **hors TVA**
- [ ] Split : faire suivre le pourboire à la part du payeur (aujourd'hui rattaché au `paymentMode` global)
- [ ] Tip-pooling : `staffIds` vaut `[operatorId]` par défaut

## 7.6 — 🔴 RGPD × NF525

### La collision

`ErasureService.ts:6-12` anonymise `['orders', 'reservations', 'invoices', 'quotes', 'customers']` par `Nexus.adapter.set()`.

> 🔴 Si `invoices` devient immuable (§7.4), la première demande d'effacement RGPD **échoue** : `SovereignGuard` rejette l'écriture. Un client exerce un droit légal → l'application lève. **Les deux obligations s'annulent.**

### La solution — crypto-shredding, déjà à moitié construite

`PiiVault.ts` chiffre les PII avec une **clé dérivée par tenant + sujet**.

```
invoices/{id}              ← IMMUABLE · 10 ans
  ├─ legalName, siret      ← PERSONNE MORALE : pas une donnée personnelle
  ├─ lignes, TVA, hash     ← données fiscales
  └─ subjectId: "sub_x"    ← simple JETON

piiVault/sub_x             ← CHIFFRÉ · EFFAÇABLE
  └─ nom salarié, convives ← PERSONNE PHYSIQUE
```

**Effacement = détruire l'entrée du coffre.** La facture reste scellée, son jeton ne résout plus rien.

> 💡 Une **entreprise** est une personne morale : SIREN, raison sociale et adresse **ne sont pas des données personnelles**. Seules les personnes physiques ouvrent un droit à l'effacement.

- [ ] **Retirer `'invoices'` de `COLLECTIONS_WITH_SUBJECT_REF`**
- [ ] Ne jamais écrire de nom de personne physique dans `invoices` — uniquement le `subjectId`
- [ ] Test : effacement → coffre détruit, facture toujours vérifiable, chaîne intacte
- [ ] Test : `ErasureService` ne lève **jamais** sur collection immuable

### Convives — le piège de la note de frais

Le fisc exige leur identité. Ce sont des **tiers**, ni ton client ni celui de ton client.

- [ ] Convives **exclusivement dans le `PiiVault`**, jamais sur la facture
- [ ] 🔴 Interdire techniquement leur réutilisation par CRM / marketing / RAG. Base légale = obligation fiscale, **pas** prospection
- [ ] Vérifier que `PulseSanitizer` (filtre déjà `iban`, `cardNumber`, `bankAccount`) **exclut les convives** du RAG

### Données bancaires — ✅ déjà conforme

`SetupIntent` Stripe + `paymentMethodId` (tokenisation PCI-DSS) · aucun PAN en clair · scrub RAG en place.

- [ ] Vérifier que le ticket imprimé **masque** le PAN

### 7.6.1 — Câblage RGPD côté tenant

**Aujourd'hui** : `ErasureService` est **du code mort** (appelé par personne), la seule route est `api/admin/fleet/rgpd-purge` sous `requireFleetAdmin`, et il n'y a **aucune entrée RGPD dans la navigation**.

> 🚨 **Incohérence de souveraineté** : si un client d'un restaurant demande l'effacement, le **restaurateur ne peut pas le traiter** — seul le super-admin fleet le peut. C'est inversé : le restaurateur est **responsable de traitement**, tu es **sous-traitant**. Et ton modèle dit que tu n'accèdes jamais aux données de tes clients.

**La bonne cible** : `/registre` — écran « Registres & Conformité », badge OBLIGATOIRE (`navConfig.ts:228`), qui porte déjà 7 registres légaux (DUERP, Incendie, Cerfa 13984, PMR…). **Le registre de traitement RGPD est de la même nature.**

- [ ] `RGPDSection.tsx` — 8ᵉ section, à côté de `DUERPSection.tsx`, ajoutée au barrel
- [ ] Contenu : registre de traitement · demandes des personnes (avec délai légal restant) · bouton d'effacement · purges programmées
- [ ] Route **tenant** `api/tenant/rgpd/erasure` sous `requireSession(tenantId)`, **pas** `requireFleetAdmin`
  > ⚠️ **Prérequis** : la correction 7.6 doit être faite avant, sinon l'appel lève sur les factures immuables
- [ ] Entrée `navConfig.ts` catégorie `registre`
- [ ] `emitDataSubjectRequest` sur `RestaurantComplianceAdapter`
  > 💡 Conforme à la Décision 1 : le métier RGPD vit dans `compliance/reglementaire/rgpd/`. **Les 7 autres verticales héritent du même registre sans une ligne de code**
- [ ] Conserver `rgpd-purge` fleet, mais **restreint à la résiliation d'un tenant**

### Rétention — le conflit résolu

| Régime | Exigence |
|--------|----------|
| Fiscal | conserver **10 ans** |
| RGPD | minimisation |

Le crypto-shredding réconcilie : le **document fiscal** vit 10 ans, les **données personnelles** le temps utile.

- [ ] Rétention **par catégorie de donnée**, pas par collection
- [ ] Purge `PiiVault` selon `retention_days` (déjà dans `compliance.schemas.ts:75`), **sans jamais toucher** aux collections fiscales

## 7.7 — Variantes de facturation

| Document | Existant | Manque |
|----------|----------|--------|
| Devis événement | 🟢 `EventQuoteModal`, `QuoteEngine` | conversion devis → facture |
| Contrat privatisation | 🟢 acompte 30 % calculé (l. 85) | c'est un **PDF**, pas une facture structurée |
| Groupes | 🟢 `GroupFormModal`, `useGroups` | aucune facturation |
| Remboursement | 🟢 Stripe + `RefundExtourneHandler` | 🔴 **aucun avoir structuré** |

### Groupes — le cycle complet

```
Devis ──accepté──► Facture ACOMPTE (30 %) ──► Prestation ──► Facture SOLDE
                              └──── déduite de ────────────────┘
```

- [ ] Conversion devis → facture, conserver `sourceQuoteId`
- [ ] **Facture d'acompte** — c'est une vraie facture, soumise à l'e-invoicing
  > ⚠️ Sur une prestation de services, la TVA est exigible **à l'encaissement de l'acompte**. Faire confirmer la ventilation quand le menu mêle 10 % et 20 %
- [ ] Facture de solde : déduire l'acompte explicitement, ne jamais taxer deux fois
- [ ] 🔴 **Le piège du groupe** : le jour J, le POS enregistre les consommations. Si la facture de groupe part en parallèle, **la prestation est comptée deux fois**. Il faut un mode « table rattachée à un groupe » qui n'encaisse pas

### Avoirs — manquant

- [ ] Schéma `CreditNote` — montants négatifs, `sourceInvoiceId` obligatoire
- [ ] Numérotation séquentielle **dédiée**
- [ ] Un avoir transite **aussi** par la PA
- [ ] Brancher sur `RefundExtourneHandler`

## 7.8 — Base pour les 8 verticales

| Verticale | Spécificité | Piège |
|-----------|-------------|-------|
| **restaurant** | 10 % / 5,5 % / 20 % + pourboires | multi-taux |
| **hotel** | nuitées + **taxe de séjour** | 🔴 collectée **pour la commune** — ni CA ni TVA. Ligne à part |
| **clinic** | actes médicaux | 🔴 **exonérés de TVA** — structure de facture différente |
| **garage** | pièces + main-d'œuvre + garantie | garantie = ligne à 0 € qui doit apparaître |
| **bakery** | 5,5 % / 10 % | **le même croissant change de taux** selon la consommation |
| **retail** | 20 % + retours | avoirs fréquents |

```
modules/finance/comptabilite/invoicing/
├── InvoiceEngine.ts              ← socle : numérotation, sceau, PA, avoirs, seuil 150 €
├── IVerticalInvoicingAdapter.ts  ← contrat par verticale
└── verticals/…                   ← taux, lignes hors CA, exonérations, libellés
```

- [ ] Écrire `IVerticalInvoicingAdapter` **avant** le premier connecteur PA
- [ ] `RestaurantInvoicingAdapter` en premier, les 7 autres en stubs héritant du socle
- [ ] `vatResolver.ts` gère déjà `dine_in`/`takeaway` par variante — **le généraliser**, pas le dupliquer

> 💡 **Aucune règle propre au restaurant** (pourboire, seuil 150 €, taux 10 %) ne doit vivre dans `InvoiceEngine`.

## 7.2 — Nexus Exchange (en dernier)

> **Le principe : publier un contrat, pas ouvrir un accès.** `SovereignGuard` interdit le cross-tenant — cette barrière **ne doit pas être percée**.

```
Fournisseur (A)                        Restaurateur (B)
  décide CE QU'IL PUBLIE :
   • catalogue · disponibilité
   ✗ jamais : marges, autres clients, stock exact
        ▼
  ┌──────────────────────────┐
  │  NEXUS EXCHANGE          │◄── lit UNIQUEMENT le publié
  │  grants · projections    │
  │  journal d'accès         │
  └──────────────────────────┘
```

- [ ] `ExchangeGrantSchema` : `{ fromTenantId, toTenantId, scopes[], expiresAt, revokedAt }`
- [ ] Collection `exchangeGrants` sous le tenant **émetteur** (A garde la maîtrise)
- [ ] Projections publiées dans `tenants/A/published/catalog` — champs whitelistés uniquement
- [ ] `ExchangeResolver.read()` — **seul point autorisé à traverser les tenants**, ne lit que `published/`, journalise
- [ ] Étendre `SovereignGuard` : lecture cross-tenant **uniquement** sur `tenants/*/published/*` via `ExchangeResolver`
- [ ] UI fournisseur : qui a accès, à quoi, depuis quand, bouton révoquer

> 🔴 **Tests de sécurité obligatoires, écrits AVANT la fonctionnalité** : tenant sans grant → refus · grant `catalog:read` tentant `stock:exact` → refus

**Emplacement prévu** : `logistics/approvisionnement/edi-b2b/` (aujourd'hui vide, comme conçu).

> ⚠️ « B2B » dans le code existant désigne **tes clients qui s'abonnent**, pas deux clients qui se parlent. Ne pas confondre.

---

# 🛰️ ALIGNEMENT MCC

**Surface existante** : 11 onglets, ~40 routes `api/admin/fleet/*`. Le socle est riche — il ne faut que brancher les nouveautés.

## Déjà couvert

24 tenants système · `rebuildProjection` · `rgpd-purge` (périmètre restreint) · `EventBusTab` + `drain-outbox` · `injectBrandingVars`

## 🔴 À créer

- [ ] **`EInvoicingTab.tsx`** + `api/admin/fleet/einvoicing/status` — config PA par tenant · flux reçus/émis/rejetés · **alerte sur échec de transmission** · **état de conformité par tenant**
  > 🎯 Ce dernier point est un **outil commercial** : savoir qui appeler avant le 1ᵉʳ septembre
- [ ] **`ExchangeTab.tsx`** + `api/admin/fleet/exchange/grants` — grants actifs, volumétrie, révocation d'urgence
  > 🔒 Le MCC voit **l'existence** du lien, jamais les données échangées
- [ ] **Rôles par verticale** — `users/role` doit proposer les libellés de la verticale du tenant (Décision 3)
- [ ] **Matrice de conformité** dans `ComplianceTab` — une ligne par tenant : NF525 · e-facture · RGPD · sauvegarde
- [ ] **Statut des verticales** dans `SystemTenantsTab` : `PRODUCTION` / `BÊTA` / `SQUELETTE`
  > 🔴 **Bloquer le provisioning** sur une verticale `SQUELETTE`, et **verrouiller `clinic`** tant que le volet données de santé n'est pas traité

## Principe directeur

> Toute capacité ajoutée doit répondre à trois questions :
> **1.** Comment je vois que ça marche chez un client ? *(supervision)*
> **2.** Comment je vois que ça a cassé ? *(alerte)*
> **3.** Comment j'interviens sans lire ses données ? *(souveraineté)*
>
> Si une des trois n'a pas de réponse, ce n'est pas exploitable à l'échelle de la flotte.

---

# ⛓️ CHRONOLOGIE

## Dépendances dures

| Avant | Après | Pourquoi |
|-------|-------|----------|
| **1bis** Semgrep `no-cents` | **Phase 5** | Sinon la dette se recrée pendant qu'on la résorbe |
| **1bis** invariants | **Phase 5** · **7.4** | Sans eux, on convertit 694 montants à l'aveugle |
| **3.0** décisions | **3.1** | On ne déplace pas deux fois les mêmes fichiers |
| **3.4** séparation | **résolution des cycles** | Les coupures d'arêtes ont échoué — la cause est structurelle |
| **3.3/3.4** cycles | **Phase 6** | Chaque composant surchargeable ajoute un cycle sous le motif actuel |
| **Phase 5 « ops »** | **4.1** SplitBillDialog | Conflit 1 — sinon double conversion |
| **Phase 5 « finance »** | **4.5** transplantation | Conflit 2 — les conventions d'arrondi doivent exister d'abord |
| **7.6** retrait `'invoices'` | **7.6.1** route tenant | Sinon l'effacement lève sur les factures immuables |
| **6.0** périmètre + **6.2** i18n | **6.3** brief graphiste | Décisions humaines — sans elles, seconde passe complète |

## Parallélisable

| Ensemble | Condition |
|----------|-----------|
| **Phase 2B.2** ⇄ **Phase 6** | Périmètres disjoints |
| **Phase 5** P2/P3 ⇄ **Phase 6** | Piliers hors chemin visuel |
| **6.4.1** tests registry ⇄ tout | Ajout pur |

## Ordre final

```
🚨 7.3 RÉCEPTION e-facture ──────────► 1ᵉʳ SEPT. 2026 · HORS SÉQUENCE

1bis (finir) → 2B.2
      ↓
3.0 décisions → 3.1 barrel → 3.2 inversions → 3.4 SÉPARATION → cycles 0
      ↓
   ┌──┴──────────────────────┐
   ↓                         ↓
5-finance → 4.5         6.0 → 6.1 → 6.4.1 → 6.4.3 → 6.2 → 6.3 → REFONTE UI
5-ops     → 4.1
   ↓
5-reste → 4.2 → 4.3 → 4.4
   ↓
7.4 facture → 7.6 RGPD → 7.6.1 registre → 7.7 variantes → 7.8 verticales → 7.2 Exchange
   ↓
MCC-1…MCC-5
```

**Chemin critique** : `1bis → 3.0 → 3.1 → 3.4 → 6.x`

---

# 📌 DETTE CONNUE — documentée, non bloquante

| Élément | État | Impact |
|---------|------|--------|
| **§0.5 partiel** | Le bloc `[[god_file_exceptions]]` est écrit dans `rules.toml:46-47` mais **sentrux ne le supporte pas** — les 5 aggregation roots sont toujours flagués | 🔴 bloque la refonte UI. **Appliquer le repli** : seuil global à 30 + règle ESLint interdisant `*/services/*` et `*/domain/*` depuis `src/app/**` |
| **`max_cc` durci 20 → 12** | Hors périmètre du plan, fait passer les violations de 4 à 33 | 🟠 décision : assumer ou revenir à 20 |
| **12 `EnvironmentTeardownError`** | `VerticalRegistry.ts:43-50` auto-enregistre 8 verticales par `import()` flottants qui se résolvent après le teardown. Non déterministe (4 à 14 selon les runs) | 🟡 bruit de test. Même motif que les cycles — se résoudra avec §3.4 |
| **5 imports relatifs profonds** | `store/pillars/rbac.ts:2` → `"../../modules/human/domain/schemas/rbac"` etc. Invisibles au grep **et** à ESLint | 🟠 Leçon 2 — déplacer les schémas vers `contracts/` |
| **`baseline.json` périmé** | Annonce `god_file_count: 0` et `cycle_count: 3` | 🟡 régénérer |

---

# 🚫 INTERDITS ABSOLUS

1. ❌ **Script de remplacement global sur les imports** — 280 imports corrompus, revert complet
2. ❌ **`sed` sur les montants** — renomme sans convertir, ÷ 10 000 sur des écritures scellées
3. ❌ **Supprimer un fichier de types** « déplacé » — 618 lignes détruites
4. ❌ **Renommer un champ du snapshot NF525** — chaîne de sceaux invérifiable
5. ❌ **Supprimer la DLQ / l'outbox** — 34 fichiers, sous-système délibéré
6. ❌ **Réécrire `SovereignGuard.freezeData`** — déjà optimisé V8, le `Proxy` a été retiré
7. ❌ **Toucher aux 204 `unknown`** des adapters réseau / storage / outbox
8. ❌ **`delete` ou `update`** sur `journalEntries`, `fiscalSeals`, `fiscalLedger`
9. ❌ **Nouveau champ `*InCents`** — y compris dans un schéma Zod
10. ❌ **`as Microunits`** — passer par `toMicrounits()`
11. ❌ **Ré-exporter `FloorPlanEditor`** dans le barrel `ops` (Konva ~1,2 Mo)
12. ❌ **Se fier au code de sortie de `rtk`**

---

*Réorganisé le 11 août 2026. Chaque chiffre mesuré sur le code, pas estimé.*
*Les numéros de ligne peuvent avoir bougé : toujours `grep` le symbole avant d'éditer.*
*Journal d'exécution : `PLAN_PROGRESS.md` · Stratégie long terme : `A_FAIRE.md` Partie 2.*
