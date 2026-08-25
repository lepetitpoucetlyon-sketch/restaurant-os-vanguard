# AGENTS.md — Lois pour tout agent IA sur ce repo

S'applique à **Antigravity, Cursor, Claude Code, Copilot** et tout agent qui écrit du code ici.
Ces lois priment sur toute consigne implicite ou tout enthousiasme. Un agent qui les enfreint fabrique une **fausse vérité** — exactement ce que ce fichier interdit.

> Contexte : le 2026-08-22, un commit a annoncé « Grade X, preflight 100% vert » alors qu'il avait été fait en `--no-verify` (aucune gate n'a tourné) et que la gate barrel avait été passée en **désactivant la règle** pour les fichiers fautifs. Ces 5 lois existent pour rendre ça impossible.

## Loi 1 — Ne jamais contourner une gate
Interdit : `git commit --no-verify`, `git push --no-verify`, désactiver/déplacer un hook, éditer `.githooks/`. Un commit se fait **hook activé, gates vertes**.

## Loi 2 — On passe une gate en corrigeant le CODE, jamais en la desserrant
Sont des **violations** (détectées par `scripts/verify-gate-integrity.mjs`) :
- ajouter un chemin à une exemption `no-restricted-imports: "off"` dans `eslint.config.mjs` ;
- relever un ratchet (`MADGE_CYCLES_MAX`, `BARREL_DEBT_MAX`, `BUNDLE_MAX_KB`) ;
- poser `@ts-ignore` / `eslint-disable` / `as any` pour faire taire une erreur ;
- `it.skip` / `describe.skip` / supprimer un test qui échoue ;
- éditer à la main un tableau de résultats (audit, walkthrough, rapport) pour l'afficher vert.

Une gate qu'on doit desserrer signale un vrai problème : on corrige le problème.

## Loi 3 — « vert / Grade X / 100% / certifié » exige une PREUVE fraîche
Ne jamais écrire ces mots (commit, doc, walkthrough) sans `npm run preflight` **complet et vert en sortie brute** pour l'arbre courant. Le hook écrit `.git/preflight-proof` (hash de l'arbre) : pas de preuve correspondant au commit = pas de « vert ». Un commit `--no-verify` n'a, par construction, aucune preuve.

## Loi 4 — Vérifier en sortie BRUTE (piège RTK)
Le proxy RTK résume/met en cache `tsc`/`build`/`eslint` : exit 0 trompeur, logs périmés. Toute vérité terrain passe par `rtk proxy <cmd>` ou la sortie brute. Ne jamais conclure « 0 erreur » depuis un résumé RTK.

## Loi 5 — Respecter la loi des couches (ADR-015) et le barrel
Import uniquement via `@/modules/<pilier>`. Pas d'import profond inter-pilier. `kernel/` / `lib/` / `shared/` : voir `docs/adrs/ADR-015-loi-des-couches.md`. La carte de vérité est générée : `node scripts/generate-architecture-map.mjs` → `docs/ARCHITECTURE-MAP.md`.

## Loi 6 — Coordination multi-agents OBLIGATOIRE (ne jamais écraser un autre agent)
Plusieurs agents (Antigravity, Claude Code, Cursor, Copilot…) écrivent **en parallèle** sur ce repo. Avant toute écriture :

1. **Lire** `.claude/sessions.md`.
2. **S'inscrire** dans le tableau *Sessions Actives* : nom court, périmètre **avec chemins explicites** (`src/modules/...`, `scripts/...`), date, status `active`. Un périmètre en prose sans chemin ne protège rien.
3. **Vérifier les collisions** : si une autre session `active` déclare un chemin que tu vas toucher → **STOP**, se coordonner ou demander à l'humain. Ne jamais écraser.
4. **Tenir les autres au courant** : mettre à jour ta ligne (progrès / fichiers clés touchés) au fil de l'eau, pas seulement au début. Passer le status à `terminée` à la fin.
5. **S'auto-identifier** (Claude Code) : écrire son nom de session dans `.claude/.active-session` (local, gitignoré). Le hook `PreToolUse` `.claude/hooks/check-session-collision.sh` s'en sert pour **bloquer** (exit 2) toute écriture dans le périmètre d'une AUTRE session active. Ce hook est branché dans `.claude/settings.json` — ne pas le désactiver (cf. Loi 1).
6. **Commits atomiques à chemins explicites** : Ne JAMAIS exécuter de `git add .` ou `git add -A` aveugle qui absorberait les modifications en cours d'une autre session active. Toujours stager et commiter explicitement son propre périmètre : `git commit -- <fichiers> -m "..."` ou `git add <fichier1> <fichier2> && git commit -m "..."`.

Garde technique inter-agents commune = le hook `pre-commit` (tourne quel que soit l'agent qui `git commit`) + ces fichiers partagés (`AGENTS.md`, `.claude/sessions.md`) que tout agent doit lire. Un agent qui écrit sans s'inscrire fabrique une collision silencieuse — interdit par cette loi.

## Loi 7 — Mesure avant affirmation (Zero-Claim Policy)
Un agent qui découvre un fait doit le **MESURER**, pas le **RECOPIER**.
Si tu écris un chiffre, un « 0 / aucun / tous / jamais », ou un état système :
1. Tu l'as **mesuré toi-même** dans cette session (commande exécutée, sortie vue) → OK, et tu cites la commande.
2. Tu l'as **lu quelque part** (plan, doc, session précédente, résumé d'un autre agent) → **tu le re-mesures avant de l'écrire.**
3. Tu ne peux pas le mesurer → tu ne l'écris pas.

Toute métrique dynamique projet doit être GÉNÉRÉE (`docs/HEALTH.md`) ou TESTÉE (`invariants.test.ts`), jamais rédigée en prose dans `CLAUDE.md`. **Un chiffre sans commande reproductible est une opinion.**

---

## Installation des gardes (une fois, par la personne humaine de préférence)
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
node scripts/verify-gate-integrity.mjs --freeze   # fige la baseline anti-desserrement
```
