# 🔬 MISSION — Analyser, vérifier et approfondir le mapping

> Copier-coller intégralement.
> **Mission d'ANALYSE. Tu ne modifies aucun fichier de `src/`.**

---

## Contexte

`MAPPING_BASE_VERTICALES.md` cartographie ce qui est réutilisable entre les 8 verticales du projet. Il a été rédigé le 11/08/2026.

**Il a une faiblesse connue, et c'est le cœur de ta mission** : la classification « générique vs sectoriel » a été faite **par nom de module**, pas par lecture du code. `haccp` a été classé « restaurant » parce qu'il s'appelle `haccp`. `pos` a été classé « générique » parce qu'il s'appelle `pos`.

**C'est une approximation.** Ta mission est de la remplacer par une classification **fondée sur le code lu**.

L'enjeu : ce document décidera de ce qu'on écrit une fois pour les 8 industries, et de ce qu'on réécrit huit fois. Une erreur de classification coûte soit du travail dupliqué, soit une abstraction fausse.

---

## ⛔ Contrainte absolue

```
Tu ne modifies AUCUN fichier sous src/.
Tu produis et mets à jour UNIQUEMENT des documents .md à la racine.
```

Si tu constates un défaut dans le code, tu le **signales dans le document**. Tu ne le corriges pas.

---

## Vérification de départ (obligatoire)

```bash
git branch --show-current                            # fix/coherence-ui-backend-securite
git status --short | wc -l                           # 0 ou 1
npx tsc --noEmit 2>&1 | grep -c "error TS"           # 0
npx vitest run --reporter=dot 2>&1 | tail -5         # ≥ 806 passed
```

Si un chiffre diffère : signale-le et continue (ta mission est en lecture seule, elle n'est pas bloquée).

---

# MISSION A — Vérifier chaque chiffre du document

`MAPPING_BASE_VERTICALES.md` contient une quarantaine de mesures. **Aucune ne doit être reprise sans re-mesure.**

Pour chaque chiffre, exécute la commande, note la sortie réelle, et marque :
- ✅ conforme
- ⚠️ dérive (écart < 10 %)
- ❌ faux (écart ≥ 10 % ou nature différente)

### Chiffres à re-vérifier

| § | Affirmation | Commande |
|---|-------------|----------|
| 1 | Socle : 878 fic. / 75 399 l. | `for d in kernel orchestration design shared lib store config; do find src/$d -name "*.ts*" \| wc -l; done` |
| 2 | Piliers : 1 099 fichiers | `find src/modules -name "*.ts" -o -name "*.tsx" \| wc -l` |
| 2 | 965 génériques / 134 sectoriels | à recalculer avec ta classification (Mission B) |
| 2 | Tailles des modules sectoriels | `find src/modules -type d -name "<module>" \| xargs wc -l` |
| 3.1 | `ops/service/core` = 30 l. · `ops/workflow/core` = 23 l. | `find src/modules/ops/service/core -name "*.ts*" \| xargs wc -l` |
| 3.1 | `ServiceTicket` absent | `grep -rn "ServiceTicket" src/` |
| 4 | 9 adapters par verticale | `ls src/verticals/restaurant/adapters/` |
| 4 | 72 événements verticales | `grep -cE "^\s+'[a-z_]+\.[a-z_.]+'" src/orchestration/events/vertical.events.ts` |
| 4 | 241 événements totaux | `grep -rhE "^\s+'[a-z_]+\.[a-z_.]+':" src/orchestration/events/*.ts \| wc -l` |
| 4 | 166 handlers, 137 génériques | `ls src/orchestration/handlers/*.ts \| wc -l` |
| 4 | 38 capabilities nav | `grep -c 'requiredCapability' src/config/navConfig.ts` |
| 5 | État de remplissage par verticale | par module, `wc -l` |

**Livrable A** : une section `## Vérification du <date>` en tête du document, avec le tableau des écarts constatés.

---

# MISSION B — Reclasser par LECTURE du code

> C'est le cœur de la mission. Remplace une classification par nom par une classification par preuve.

## B.1 — Établir les marqueurs de restauration

Un module est **sectoriel restaurant** s'il manipule des concepts qui n'existent pas ailleurs. Construis d'abord la liste des marqueurs en lisant `modules/ops/production/kitchen` et `modules/ops/service/pos` — les deux modules restaurant les plus denses.

Marqueurs attendus (à confirmer et compléter par ta lecture) :
```
table · couvert · convive · plat · menu · carte · recette · cuisine · service
allergène · DLC · température · chambre froide · pourboire · addition
```

## B.2 — Classer chaque module

Pour **chacun des ~120 modules** de `src/modules/<pilier>/<domaine>/<module>/` :

```bash
# 1. Compter les marqueurs sectoriels
grep -rniE "<marqueurs>" <module>/ --include="*.ts*" | wc -l

# 2. Compter les imports vers des modules sectoriels
grep -rn "from '@/modules/" <module>/ | grep -E "kitchen|recipes|kds|haccp|bar"

# 3. Lire l'index.ts et les types du domaine
```

**Classification à produire** :

| Classe | Critère | Conséquence |
|--------|---------|-------------|
| **GÉNÉRIQUE PUR** | 0 marqueur, 0 import sectoriel | ✅ réutilisable tel quel |
| **GÉNÉRIQUE TEINTÉ** | marqueurs présents mais concept transposable | 🟠 à généraliser — **c'est la catégorie la plus importante** |
| **SECTORIEL** | concept qui n'existe que dans une industrie | ❌ à réécrire par verticale |
| **COQUILLE** | ≤ 5 lignes, `export {}` | 🔴 à remplir |

> 🎯 **La catégorie « GÉNÉRIQUE TEINTÉ » est le vrai livrable.** Elle contient ce qui *semble* réutilisable mais porte des présupposés restaurant. Exemple probable : `ops/service/pos` raisonne en tables et convives. Un garage a un POS, mais il raisonne en véhicules et ordres de réparation.
>
> Pour chaque module teinté, **écris précisément quel présupposé le teinte** et ce qu'il faudrait généraliser.

## B.3 — Recalculer le ratio

Le document annonce **88 % de générique**. Ce chiffre est très probablement optimiste puisqu'il ne compte pas le teinté.

Produis le vrai ratio en quatre classes, et **explique l'écart** avec les 88 % annoncés.

**Livrable B** : la section §2 du document, réécrite avec la classification en 4 classes, et une sous-section `### Modules teintés — présupposés à lever`.

---

# MISSION C — Produire les spécifications manquantes

## C.1 — 🔴 Spécifier `ServiceTicket` (le plus important)

Le document affirme que ces 4 opérations sont la même :

| Verticale | Opération | Module |
|-----------|-----------|--------|
| restaurant | ouverture de table | `ops/service/pos` |
| garage | prise en charge véhicule | `ops/service/repair-intake` 🔴 |
| hôtel | check-in | `ops/service/front-desk` 🟠 |
| clinique | accueil patient | `ops/service/consultation` 🔴 |

**Ta mission : vérifier cette affirmation, puis spécifier l'abstraction.**

### Méthode
1. **Lire `ops/service/pos` en entier** — c'est la seule implémentation réelle
2. En extraire le **cycle de vie effectif** : quels états, quelles transitions, quels événements émis, quelles données portées
3. Confronter ce cycle aux 3 autres métiers via leurs **événements déjà déclarés** dans `vertical.events.ts`
   ```
   auto.vehicle_checked_in → auto.repair_started → auto.vehicle_released
   ```
4. Identifier ce qui est **commun** et ce qui est **propre à chaque verticale**

### Livrable C.1 — un document `SPEC_SERVICE_TICKET.md`

Il doit contenir :
- L'entité `ServiceTicket` : champs communs, champs délégués à la verticale
- La machine à états : états et transitions, avec pour chacun l'équivalent dans les 4 métiers
- Les événements génériques et leur correspondance avec les 72 déjà déclarés
- Le lien vers la facturation (`sourceEntryId`, NF525)
- **Le test de validité** : montrer, en pseudo-code, à quoi ressemblerait `repair-intake` écrit par-dessus cette abstraction. **S'il dépasse 100 lignes, l'abstraction est mauvaise — dis-le et propose autre chose.**

> ⚠️ **Si ta lecture montre que les 4 opérations ne sont PAS la même**, dis-le clairement et argumente. C'est une conclusion valable et plus utile qu'une abstraction forcée.

## C.2 — La table d'équivalence complète

Pour **chacun des 18 modules sectoriels en coquille**, produis :

| Module coquille | Verticale | Module GÉNÉRIQUE dont il hérite | Module RESTAURANT de référence | Événements déjà déclarés | Handlers réutilisables |
|-----------------|-----------|--------------------------------|-------------------------------|-------------------------|----------------------|
| `repair-intake` | garage | `ops/service/core` | `ops/service/pos` | `auto.vehicle_checked_in`… | ? |
| `spare-parts` | garage | `commerce/catalog/core` | `logistics/stock/inventory` | `auto.part_consumed`… | ? |
| … | | | | | |

**C'est la table qui rendra l'ouverture d'une verticale mécanique.**

## C.3 — 🎯 Mapper les 72 événements verticales aux handlers existants

C'est l'analyse à plus forte valeur. Pour **chacun des 72 événements** de `vertical.events.ts` :

1. Est-il **abonné** par un handler aujourd'hui ? (`grep` dans `orchestration/handlers/` et `registerHandlers/`)
2. Sinon, **quel handler générique existant** ferait le travail ?
3. Sinon, **quel handler restaurant** est son équivalent structurel ?

**Exemple attendu** :
```
auto.repair_completed
  ├─ abonné aujourd'hui : NON
  ├─ équivalent restaurant : order.paid
  ├─ cascade restaurant : StockDeductionHandler · LoyaltyHandler
  │                       CRMHandler · MarginWarningHandler
  ├─ réutilisables tels quels : 4/4  ✅
  └─ à écrire : 0 — il suffit d'abonner
```

**Livrable C.3** : un tableau des 72 événements avec, en bas, le **taux de couverture** :
*« sur 72 événements verticales, N sont déjà couverts par un handler générique, M demandent un handler neuf. »*

C'est **le chiffre qui dira vraiment** combien de travail représente l'ouverture d'une verticale.

## C.4 — Vérifier les 4 manques de base

Le document liste 4 manques (§3.1 à §3.4). **Confirme ou infirme chacun**, avec la commande :

- [ ] `ServiceTicket` absent → `grep -rn "ServiceTicket" src/`
- [ ] `ServiceSubject` absent → `grep -rniE "ServiceSubject|serviceSubject" src/`
- [ ] `IVerticalInvoicingAdapter` absent → `find src -name "*InvoicingAdapter*"`
- [ ] `roleLabels` absent → `grep -rn "roleLabels" src/`

Et cherche s'il en **manque d'autres** que le document n'a pas vus. Piste : ce qu'une verticale doit déclarer et qui n'a aucun point d'ancrage aujourd'hui.

---

# 📏 RÈGLES DE LA MISSION

1. **Aucune affirmation sans commande.** Chaque chiffre du document final doit être accompagné de la commande qui le produit. Un lecteur doit pouvoir tout re-vérifier.

2. **Cite les chemins exacts.** `ops/service/pos/hooks/usePos.ts:79`, pas « le hook du POS ».

3. **Vérifie qu'une commande de comptage n'a pas de plafond.** `grep -A 60`, `head`, `tail` tronquent. Compte sans plafond, puis affiche.

4. **Si tu contredis le document, dis-le explicitement.** Un mapping corrigé vaut mieux qu'un mapping confirmé à tort. Les erreurs trouvées sont le livrable le plus précieux.

5. **Ne modifie aucun fichier de `src/`.** Mission d'analyse.

6. **Si une analyse est trop longue, découpe-la et signale-le** plutôt que de l'échantillonner en silence. Un échantillon annoncé comme exhaustif est pire qu'une analyse partielle assumée.

---

# 📦 LIVRABLES

| # | Fichier | Contenu |
|---|---------|---------|
| **1** | `MAPPING_BASE_VERTICALES.md` **mis à jour** | Vérification en tête · §2 reclassé en 4 classes · §3 confirmé/infirmé · table d'équivalence C.2 |
| **2** | `SPEC_SERVICE_TICKET.md` **nouveau** | L'abstraction spécifiée, ou l'argumentaire montrant qu'elle n'est pas fondée |
| **3** | `MAPPING_EVENEMENTS_VERTICALES.md` **nouveau** | Les 72 événements ⇄ handlers, avec le taux de couverture |

## Format de rapport final

```markdown
### MISSION MAPPING — <TERMINÉE | PARTIELLE>

**A — Vérification** : X mesures re-vérifiées · ✅ N conformes · ⚠️ N dérives · ❌ N fausses
<tableau des écarts>

**B — Reclassification** : N modules analysés
  GÉNÉRIQUE PUR    : N  (X %)
  GÉNÉRIQUE TEINTÉ : N  (X %)   ← les présupposés à lever
  SECTORIEL        : N  (X %)
  COQUILLE         : N  (X %)
Écart avec les 88 % annoncés : <explication>

**C — Spécifications**
  ServiceTicket   : <spécifié | infirmé> — repair-intake tiendrait en ~N lignes
  Table C.2       : 18/18 modules mappés
  Événements C.3  : N/72 couverts par un handler générique

**Erreurs trouvées dans le document d'origine** :
<liste>

**Manques de base NON identifiés par le document** :
<liste>

**Sorties brutes** :
<coller, pas résumer>
```

---

# 🎯 CE QUI FERA LA VALEUR DE CETTE MISSION

Trois questions. Si le document final y répond avec des preuves, la mission est réussie :

1. **Quels modules semblent génériques mais portent des présupposés restaurant ?**
   → c'est ce qui cassera à l'ouverture du garage

2. **Sur les 72 événements verticales, combien sont déjà servis par un handler générique ?**
   → c'est le vrai coût d'ouverture d'une verticale

3. **Les 4 « prises en charge » sont-elles réellement la même opération ?**
   → si oui, une abstraction économise 4 implémentations ; si non, la forcer coûterait plus cher que 4 modules distincts

---

*Documents de référence : `MAPPING_BASE_VERTICALES.md` · `PLAN_MAITRE_CORRIGE.md` · `HANDOFF_SESSION_2026-08-11.md`*
