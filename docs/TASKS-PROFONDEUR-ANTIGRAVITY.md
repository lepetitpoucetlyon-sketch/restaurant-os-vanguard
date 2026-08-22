# 🤖 Backlog exécutable — Profondeur (à donner à Antigravity)

> **État de départ (vérifié 2026-08-22)** : `npm run preflight` = **VERT** (exit 0). tsc 0 · barrel 0 sans exemption · cycles 0 · 1940 tests · build OK. Dette non bloquante restante : **169 inter-module**, **bundle 11,8 Mo**, profondeur MCC/verticales incomplète. Ce backlog finit tout ça **sans jamais casser le vert**.

---

## 📏 CONTRAT DE TRAVAIL (obligatoire — cf. `AGENTS.md`)
1. **Un seul périmètre à la fois.** S'inscrire dans `.claude/sessions.md`. Pas deux agents sur les mêmes fichiers.
2. **Après CHAQUE tâche : `npm run preflight` doit rester VERT.** Si rouge → corriger avant de passer à la suivante. Jamais avancer sur du rouge.
3. **Interdits absolus** : `git commit --no-verify` · desserrer une gate (exemption eslint, relever un ratchet, `@ts-ignore`, `eslint-disable`, `skip` un test) · éditer un tableau de résultats au vert. **On corrige le CODE.**
4. **« fini / vert / 100% » = uniquement avec preuve** : preflight vert en sortie brute pour l'arbre courant.
5. **Commits petits et fréquents** (1 tâche = 1 commit), hook activé.
6. Vérifier en **sortie brute** (`rtk proxy <cmd>`), jamais depuis un résumé RTK.

---

## 🟦 TRACK 1 — Durcir la base (pour vibecoder propre)
*Non bloquant mais c'est ce qui rend la base « nikel ». Le plus rentable en premier.*

### 1.1 — Casser les 169 `no-inter-module-imports` (god-services `lib/`)
- [ ] Pour chaque offender, router l'import cross-pilier via le **barrel** `@/modules/<pilier>` (ajouter l'export manquant dans le barrel si besoin) OU le passer en `import type` si c'est un type.
  - **Top offenders (ordre)** : `src/lib/sync/pillarSyncRegistry.ts` (6) · `src/lib/sovereign/firestoreHydrator.ts` (6) · `src/lib/nexus/NexusBridge.ts` (4) · `src/lib/BrandingService.ts` (4) · `src/lib/TenantSeeder.ts` (3) · `src/lib/ProvisioningEngine.ts` (3) · `src/lib/MaintenanceAgent.ts` · `src/lib/mcc/provisioning/*` · `src/modules/intelligence/services/VisionService.ts` (3)
- [ ] **Décision archi à trancher AVANT** (ADR-015) : `lib/` a-t-il le droit d'importer `modules/` ? Si NON → ces god-services descendent-ils dans `modules/` ou passent-ils par event-bus / injection ? Documenter la décision dans `docs/adrs/ADR-015-loi-des-couches.md`.
- **Vérif** : `rtk proxy npx eslint src 2>&1 | grep -c no-inter-module-imports` → doit **descendre à chaque passe**.
- **DoD** : compteur = 0, puis passer la règle en bloquante dans `preflight.sh` (grep `no-inter-module`) + re-freeze `verify-gate-integrity`.

### 1.2 — Bundle 11,8 Mo → réduire (perf de chargement)
- [ ] `ANALYZE=true npm run build` → identifier les gros chunks.
- [ ] Lazy-load les gros modules (dashboards, konva, jspdf, xlsx, d3) via `next/dynamic` / `import()`.
- [ ] Vérifier qu'aucun barrel ne tire tout un pilier côté client (les barrels type-only aident déjà).
- **Vérif** : `du -sk .next/static/chunks` après build.
- **DoD** : bundle sous un seuil réaliste (viser < 4-5 Mo d'abord), puis abaisser `BUNDLE_MAX_KB` dans `preflight.sh`.

### 1.3 — Dissoudre `common.events.ts` (1064 L)
- [ ] Déplacer les définitions d'events par pilier (`human.events.ts`, `compliance.events.ts`, `commerce.events.ts`, `logistics.events.ts`…), ré-exporter depuis `catalog.ts`.
- **DoD** : `common.events.ts` supprimé, aucun fichier events > ~300 L, tests bus verts.

---

## 🟩 TRACK 2 — Profondeur MCC (boucler le coverage-theater)
*Preuve : 11 events `fleet.*`/`mcc.*` orphelins (emit=11, on=0). Ça calcule → émet dans le vide.*

### 2.1 — Wire les 11 events orphelins (handlers de persistance)
- [ ] `fleet.saas_billing_invoiced` → `SaaSInvoicePersistHandler.ts` : écrit `tenants/{tenantId}/saasInvoices/{invoiceId}` via `Nexus.adapter.set`.
- [ ] `fleet.sla_breach_detected` → `SlaBreachHandler.ts` : persiste + déclenche `GlobalAlertEscalationMatrixService`.
- [ ] `fleet.merchant_provisioned`, `fleet.benchmark_computed`, `mcc.*` ×4 → handler de persistance OU inscrire dans `EXPECTED_UNCONSUMED_EVENTS` **avec commentaire justifiant** (pas d'orphelin silencieux).
- **Vérif** : `grep -rn "\.on('fleet\." src | wc -l` ≥ nb d'emit. **DoD** : plus aucun `fleet.*`/`mcc.*` orphelin non documenté.

### 2.2 — `SlaMonitoringFleetService.ts:47` : uptime réel
- [ ] Remplacer `uptimePct: isBreach ? 99.85 : 100.0` (en dur) par une **agrégation réelle** sur fenêtre glissante de samples (persistés).
- **DoD** : uptime calculé depuis des données, pas un chiffre magique.

### 2.3 — `MultiTenantBillingEngineService.ts` : persister la facture
- [ ] Après le calcul, écrire la facture (`Nexus.adapter.set`) — ne pas juste `return` + `emit`.
- [ ] Remplacer `ipAddress: '127.0.0.1'` en dur par la vraie IP admin (headers req).

### 2.4 — Supprimer le code mort
- [ ] `src/modules/fleet/services/MerchantProvisioningService.ts` (0 appelant, doublon creux) → supprimer OU thin-wrapper vers `TenantProvisioningService`.
- **Vérif** : `grep -rn "MerchantProvisioningService" src | grep -v "class\|\.test\."` = 0.

---

## 🟨 TRACK 3 — Profondeur des verticales (les 4 nouvelles)
*Preuve : `gym`/`coworking`/`florist`/`veterinary` = 4 fichiers (déclaratif) vs `restaurant` = 19. `adapters/index.ts` VIDE.*

### 3.1 — Générer les adapters manquants (par verticale)
- [ ] Pour **chacune** (gym, coworking, florist, veterinary) : créer les 9 adapters sur le modèle `src/verticals/restaurant/adapters/Restaurant*Adapter.ts` : `*OpsAdapter`, `*FinanceAdapter`, `*ComplianceAdapter`, `*LogisticsAdapter`, `*HumanAdapter`, `*FacilityAdapter`, `*CommerceAdapter`, `*IntelligenceAdapter`, `*MccAdapter`.
- [ ] **Utiliser le skill `vertical-forge`** (c'est son job : scaffolder + câbler + certifier) plutôt que copier-coller.
- [ ] Ajouter `ui.ts` (skin) + `presentation/` (dashboards) + `domain/types.ts` par verticale.
- **DoD** : chaque nouvelle verticale ≥ ~15 fichiers, parité structurelle avec `restaurant`.

### 3.2 — Câblage public des démos (le trou trouvé)
- [ ] `src/lib/mcc/SystemTenantRegistry.ts:70` — ajouter dans `DEMO_SUBDOMAIN_MAP` : `demo-gym`, `demo-coworking`, `demo-florist`, `demo-veterinary`.
- [ ] **Typer la map** `Record<PlatformVariant, string>` (au lieu de `Record<string,string>`) → tsc bloquera tout futur oubli.
- [ ] Corriger le commentaire « 24 tenants système » → **36** (l.3 et l.81).
- **DoD** : les 4 démos joignables par sous-domaine, map type-safe.

---

## 🟪 TRACK 4 — Doc + verrouillage final
- [ ] Rafraîchir `CLAUDE.md` + `~/.nexuscoder/domain-facts.yml` sur les chemins RÉELS (12 piliers, emplacement Nexus, pas d'`orchestration/` fantôme).
- [ ] `npm run map` (régénère `docs/ARCHITECTURE-MAP.md`).
- [ ] Verrouiller : ratchets à 0 (inter-module, bundle), `node scripts/verify-gate-integrity.mjs --freeze`.
- **DoD** : `preflight` complet vert, aucun chemin mort cité en doc.

---

## 🔁 Boucle à répéter pour CHAQUE tâche
```
1. S'inscrire dans .claude/sessions.md (périmètre)
2. Coder la tâche
3. rtk proxy npm run preflight   → doit être VERT
4. git commit (hook activé, JAMAIS --no-verify)
5. Tâche suivante
```

> **Rappel** : la base est déjà verte et vérifiée. Ce backlog ajoute de la **profondeur** sans jamais casser le vert. Si une tâche fait passer preflight au rouge et que tu es tenté de desserrer une gate → **c'est le signal qu'il faut corriger le code, pas la gate.**
