# 🤝 HANDOFF — 2026-08-11 (soir) · Symbiose Antigravity ⇄ Claude

> **But de ce document** : qu'une session fraîche (Claude auditeur **ou** Antigravity exécutant) reprenne
> sans rien re-découvrir. Il double le contrat `PLAN_COMPLET.md` §0 ; en cas de doute, **le plan fait foi**.
> Écrit après l'audit CONFIRMÉ de la série §3.1/§3.4b et un **incident de collision** (working tree partagé).

---

## 0. TL;DR — où on en est

- **Branche** : `agent/antigravity-exec`. **HEAD** : `c2a357307`. **Build VERT** : `tsc=0`, `cycles=0`, `barrel=0`.
- **Antigravity a livré proprement** §3.1 (barrel résidu→0), §3.4b (kernel→modules 0, 3 cycles→0) → **audité CONFIRMÉ**.
- Il vient de commiter **§2B.2** (schémas Zod stricts, 13 Server Actions) → **à auditer** (pré-check OK, voir §5).
- **INCIDENT** : deux agents sur **un seul working tree** → mon audit a percuté son WIP, `PLAN_COMPLET.md` a failli
  être perdu. **Correctif** : `PLAN_COMPLET.md` §0.9 **Règle 0 — isolation worktree**. **À appliquer maintenant** (→ §2).

---

## 1. Le modèle de travail (rappel court)

| | **Antigravity** (exécutant) | **Claude** (auditeur) |
|---|---|---|
| Code | ✅ dans **son worktree** | seulement pour réparer un build cassé livré |
| Journal `§3` | ✅ ancre avant vérif | entrées `[AUDIT]` seulement |
| `agent-gate.sh` | ✅ après chaque commit | ✅ re-mesure sur le hash, en **worktree jetable** |
| Registre `§2` | ❌ | ✅ coche exclusivement |

**Preuve infalsifiable** : après chaque commit, `./scripts/agent-gate.sh` imprime un bloc lié au **hash**. `tsc`
DOIT être 0, arbre propre. Ce bloc entier se colle dans `JOURNAL_AGENT.md`. Claude re-mesure sur le même hash.

---

## 2. ⚙️ SETUP WORKTREE — à faire AVANT la prochaine tâche (la leçon de l'incident)

L'arbre est **propre** (2B.2 commitée), donc le déplacement est sans risque. **Antigravity exécute ce bloc**, une
fois, depuis le répertoire principal actuel :

```bash
# 1. Libère la branche du répertoire principal (il reste au même commit, en HEAD détaché — Claude/humain y lisent)
git switch --detach

# 2. Crée TON worktree isolé sur la branche agent (répertoire séparé, à toi seul)
git worktree add ../rescue-antigravity agent/antigravity-exec

# 3. Va y travailler — désormais tu ne codes/commites QUE depuis ici
cd ../rescue-antigravity
./scripts/agent-gate.sh          # baseline dans ton worktree — colle le bloc dans le journal
```

**Règles worktree (non négociables) :**
- Antigravity code/commite **uniquement** depuis `../rescue-antigravity`.
- Claude/humain restent dans le répertoire principal (HEAD détaché, lecture). Pour auditer un hash, Claude fait
  `git worktree add ../audit-<hash> <hash>` → gate → `git worktree remove ../audit-<hash>`. **Jamais** de
  `git checkout`/`git stash` dans le répertoire de l'autre.
- `git worktree list` pour voir qui est où. `git worktree remove` pour nettoyer.

---

## 3. État vérifié (gate `c2a357307`, 2026-08-11 soir)

| Indicateur | Valeur | Cible | Note |
|---|:---:|:---:|---|
| TSC | **0** ✅ | 0 | |
| cycles (madge) | **0** ✅ | 0 | 3 cassés par extraction de types (Antigravity, confirmé) |
| kernel→modules | **0** ✅ | 0 | shims morts supprimés + `ProductSchema` promu au kernel |
| barrel (8 piliers) | **0** ✅ | 0 | résidu `commerce=1` résorbé |
| store→modules | **0** ✅ | 0 | acquis (6 pillars canonicalisés) |
| shared→modules | **7** 🟠 | 0 | inversions infra — §3.2, à résorber |
| lib→modules | **12** 🟠 | 0 | idem |
| InCents | **694** 🔴 | 0 | Phase 5 (non commencée) |
| as Microunits (direct) | **7** 🔴 | 0 | Phase 5 |
| invariants PBT | **7/7** ✅ | 7 | Semgrep `no-cents` actif |
| vitest `--full` | 764 pass · **5 fichiers échec pré-existants** | 0 échec | mock `logger`/timeout LLM — §5.1-bis du plan |

---

## 4. Ce qui a été fait (avec verdicts d'audit)

| Tâche | Commit(s) | Verdict Claude |
|---|---|---|
| §3.2 store 8→0 | `…`→`cb410b9ee` | ✅ CONFIRMÉ (livré cassé, réparé §AUDIT-2-FIX) |
| §3.0 3 décisions CLAUDE.md | `bb7f9a07f` | ✅ (acquis) |
| §1bis 7 invariants + Semgrep | `49e749f59`,`248b6470b`,`bc6baeb32` | ✅ (acquis) |
| §3.1 barrel + §3.4b kernel/cycles | `e82a3d346` (HEAD `08a5c25d9`) | ✅ **CONFIRMÉ** — 1ʳᵉ série propre, 0 triche, 0 régression |
| §2B.2 Zod strict 13 actions | `c2a357307` | ⏳ **À AUDITER** (pré-check §5) |
| Réparation build 74→0 (Claude) | `c67ea237d`,`939ae9062` | ✅ CONFIRMÉ |
| Plan v4.1 + Symbiose (Claude) | `eb1c614ae`,`acc26313b` | — |

Détail complet : `JOURNAL_AGENT.md` §2 (registre) + §3 (entrées + `[AUDIT]`).

---

## 5. §2B.2 — pré-check auditeur (audit complet à finir en worktree jetable)

- `grep "z.any(\|z.unknown(" src/**/*.action.ts` = **1** (pas 0 comme annoncé) :
  `src/shared/actions/settings.action.ts:9` → `z.record(z.string(), z.unknown())`.
  **Verdict provisoire : ACCEPTABLE** — `z.unknown()` est l'alternative **sanctionnée** par §0.4 (interdit = `z.any()`),
  et un sac de settings est légitimement hétérogène. Formulation « 0 any/unknown » juste imprécise, pas une triche.
- **Reste à faire pour clore l'audit** : `git worktree add ../audit-c2a357307 c2a357307` → `agent-gate.sh --full`
  → vérifier que les 13 schémas portent de **vraies contraintes métier** (pas juste `z.string()`), montants en
  **microunits**, et 0 régression test. Puis cocher §2.

---

## 6. Prochaines actions (ordre du plan §11)

1. **Finir l'audit §2B.2** (Claude, worktree jetable) → cocher §2.
2. **§3.2 — résorber `shared→modules 7` puis `lib→modules 12`** (Antigravity) : déplacer les symboles vers
   `kernel/nexus/contracts/`, une couche = un commit. Cible **0**.
3. **§3.4 Étape 4/5** — inventorier le `shared/` résiduel + retirer les mappings compat `@/shared/nexus/*`.
4. **Phase 5 — monnaie** : `InCents 694 → 0` + `as Microunits 7 → 0` (finance → ops → reste). Semgrep `no-cents` déjà actif.
5. **Hors chemin critique** : assainir les 5 fichiers de tests pré-existants (§5.1-bis du plan).

> 🚨 **7.3 e-facture (légal, échéance 1ᵉʳ sept.)** = prioritaire en ressources **mais bloquée par une décision
> humaine** (choix de la Plateforme d'Agrément). Voir §10 du plan. Tant qu'elle n'est pas tranchée, avancer sur la dette.
>
> 🧬 **Avant toute nouvelle verticale** : Phase 8 (ServiceTicket + VerticalEventBridge + IVerticalInvoicingAdapter +
> roleLabels). Le restaurant est le **gabarit** — chaque raccourci y est copié ×7.

---

## 7. Risques ouverts & décisions humaines

- **Décision #1 (bloquante e-facture)** : choix de la PA (Plateforme d'Agrément) — cf. plan §10.
- **5 fichiers de tests pré-existants** en échec : polluent le signal `vitest --full` (mock `logger`/timeout). Non bloquant.
- **`stash` de sécurité** : plus aucun (`git stash list` vide) — Antigravity a nettoyé, WIP 2B.2 commité.
- **HANDOFF antérieur** : `HANDOFF_SESSION_2026-08-11.md` (293 l., non lu par cette session) coexiste — ne pas écraser.

---

## 8. Fichiers clés

| Fichier | Rôle |
|---|---|
| `PLAN_COMPLET.md` | plan de marche + **contrat §0** (dont §0.9 Symbiose + Règle 0 worktree) |
| `JOURNAL_AGENT.md` | registre partagé : §0 tableau de bord · §2 verdicts Claude · §3 entrées + `[AUDIT]` |
| `scripts/agent-gate.sh` | gate de preuve lié au hash (à lancer après chaque commit) |
| `SPEC_SERVICE_TICKET.md` · `MAPPING_*_VERTICALES.md` | couche multi-verticale (Phase 8) |

---

*Handoff rédigé par Claude (auditeur) le 2026-08-11 (soir). État = `agent-gate.sh` @ `c2a357307`, mesuré non estimé.*
