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

---

## Installation des gardes (une fois, par la personne humaine de préférence)
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
node scripts/verify-gate-integrity.mjs --freeze   # fige la baseline anti-desserrement
```
