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
| audit-360-fix | Vérif + correction remédiations commit b17b4e20c : NF525 double-entrée (FinancialNexusBridge), rules fiscalMeta/immutable, SovereignGuard client-signing, offline sync, tenant-billing Stripe TSC | 2026-07-26 | terminée |
| tier-a-hardening | Tier A FAIT : bug période FEC, chaînage FEC SHA-256 réel, backdoor PIN 9999 supprimé, lockout PIN serveur (functions), + bootstrap adapter Nexus serveur (FirestoreServerAdapter firebase-admin + registerServerAdapter + ensureServerNexus + instrumentation.ts, 7 tests). Activation runtime = poser FIREBASE_SERVICE_ACCOUNT_JSON en env | 2026-07-26 | terminée |
| tier-b | Tier B FAIT : split payment persistant, unification déduction stock, lint 15→0, backend HACCP (HACCPLogService : iotHistory immuable + haccpLogs + nonConformities auto sur seuil IoT, +test), cookie banner mort supprimé. FAIT aussi : .firebase/ dé-tracké (66930 fichiers, staged non commité) + supprimé du disque + gitignoré → sentrux propre (0 cycle réel ; restent 2 violations dette préexistante : 10 fns cc>20, 3 god-files Providers). Server-adapter livré (voir tier-a) | 2026-07-26 | terminée |
| finale | Horodatage NF525 autoritaire serveur (serverRecordedAt/serverTimestamp sur sceau+écriture, FiscalSealer) + doc : chapitre 25 « Audit 360 & Remédiations » ajouté à docs/BIBLE_TECHNIQUE.html (+ meta charset utf-8 manquant). 454/454 tests, TSC 0, ESLint 0 | 2026-07-26 | terminée |
| mcc-audit | Analyse structure MCC (lecture seule) : shared/nexus/guards/admin/mcc/, shared/nexus/engines/mcc/, lib/mcc/, app/(admin)/admin/mcc/ | 2026-07-27 | terminée |
| support-ai-flow | Support self-service : supportTicket schema, tickets route, SupportTicketAnalysisHandler, drafts route, SupportDraftsPanel, MCC page.tsx | 2026-07-27 | terminée |
| mcc-support-drafts | Implémentation : requêtes tenant self-service → agent IA (Gemini) → brouillon évolution/bug dans MCC (approve/correct/reject). Fichiers : domain/schemas/supportTicket.ts, api/tenant/support/tickets, shared/eventBus/handlers/SupportTicketAnalysisHandler.ts, api/admin/fleet/support-ai/drafts, shared/nexus/guards/admin/mcc/SupportDraftsPanel.tsx + wiring page.tsx/index.ts. Suppression SupportEngine.ts (mort/cassé) | 2026-07-27 | active |
