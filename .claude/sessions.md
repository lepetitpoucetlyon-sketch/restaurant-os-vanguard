# Sessions Claude Code Actives

> **Protocole automatique** — chaque session Claude Code doit :
> 1. Lire ce fichier AVANT toute action
> 2. Ajouter sa ligne au tableau ci-dessous
> 3. Vérifier qu'aucune session `active` ne couvre le même périmètre
> 4. Passer en `terminée` à la fin du travail
>
> Le hook `.claude/hooks/check-session-collision.sh` alerte en cas de collision sur Edit/Write.

## Sessions

| Session | Périmètre | Dernière activité | Status |
|---------|-----------|-------------------|--------|
| bible-tutos | `docs/BIBLE_TECHNIQUE.html` | 2026-07-24 | terminée |
| mcc-coord | `CLAUDE.md`, `.claude/` | 2026-07-24 | terminée |
| mobile-audit | MCC + client layouts, responsive CSS | 2026-07-24 | terminée |
| tech-debt | Dette technique : rapatriement, god files, tests POS/fiscal + Bible checklist | 2026-07-25 | terminée |
| mcc-patch-center | MCC Patch Center : ChangelogService, tenant-override, upgrade, changelog API + UI panels | 2026-07-25 | terminée |
| structural-5steps | God Files (step2), cents leaks (step3), context rapatriation (step4), duplicate filenames (step5) | 2026-07-25 | terminée |
| perf-audit-fix | Fixes perf : useBilling ICM, N+1 queries, bundle (use client, dynamic, Image) | 2026-07-25 | terminée |
| jotai-perf-audit | Audit lecture seule : src/store/, src/modules/*/store/, composants POS/KDS | 2026-07-25 | terminée |
| jotai-perf-fix | Fixes re-renders : updateNexusNode guard, floorHooks useMemo, opsCore useMemo, kitchenHooks useCallback, useInventory now, stockTransfer useState, currentDateAtom, useAtomValue×5, filteredCandidates useMemo | 2026-07-25 | terminée |
| sprint-10-vague-a | Vague A : PWA manifest+icons (mob-1), dynamic imports modales (perf-5), infinite scroll grilles (perf-6), img→Image Next.js (perf-7) | 2026-07-25 | terminée |
| sprint-10-vague-b | Vague B : MCCTreasury données réelles + portal Stripe (mcc-bill-1), Mosyle MDM routes + MDMPanel (mcc-deploy-adv-3) | 2026-07-25 | terminée |
| sprint-10-vague-c | Vague C : API Gateway clés externes (mcc-billing-adv-3), status page (mcc-growth-1), landing per-restaurant (res-arch-2), SAV L0 IA (mcc-support-ai-1) | 2026-07-25 | terminée |
| sprint-vague-d | Vague D : mob-2/3/4, mcc-mdm-1/3, res-arch-3, rh-9, goo-9/10, hac-6, mcc-growth-2 | 2026-07-25 | terminée |
