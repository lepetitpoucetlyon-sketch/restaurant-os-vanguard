# Handoff Technique — Session Vanguard `03e6ea20`
> Branche `grade-x-vanguard` · 2026-07-21 · Sonnet 4.6  
> **Ne jamais push sur GitHub** — migration GitLab en cours, commits locaux uniquement

---

## État général

| Indicateur | Valeur |
|---|---|
| TypeScript `tsc --noEmit` | **0 erreurs** |
| Vitest | **386 / 387** (1 ignoré pré-existant) |
| Cascades auditées | **17 / 17** |
| Fichiers modifiés cette session | **11** |
| Nouveaux fichiers | **2** |

---

## §1 — Ce qui a été fait cette session (9 changements)

### P2 · Suture Kitchen `wasteLogs`
**Fichier :** `src/app/(client)/(ops)/kitchen/page.tsx`  
**Problème :** `wasteLogs` était déclaré comme cast mort `[] as RegulatoryWasteLog[]`. Le hook `useHACCP()` existait mais n'était pas importé.  
**Fix :** Importé `useHACCP` depuis `@modules/compliance`, remplacé le cast par `const { wasteLogs } = useHACCP()`.

---

### P3 · Bug Bar `totalCellarValue ÷100`
**Fichier :** `src/app/(client)/(ops)/bar/page.tsx`  
**Problème :** `totalCellarValue` était déjà en euros (`priceInMicrounits / 1_000_000 * stock`) mais divisé par 100 une 2e fois en prop. Valeur affichée = réalité ÷ 100.  
**Fix :** Supprimé `/100` dans le passage de prop à `StocksTab`.  
**Pattern à surveiller :** Chercher d'autres `/ 100` sur des variables déjà en euros dans la codebase.

---

### P4a · CRM RBAC `send_campaign`
**Fichier :** `src/components/crm/EmailCampaign.tsx`  
**Problème :** Aucun garde RBAC sur l'envoi de campagne — tout utilisateur connecté pouvait envoyer.  
**Fix :** `useActionPermission("crm", "send_campaign")` → early return dans `handleSend` + `disabled` + `title` sur le bouton.

---

### P4b · VisionScanner dans `StockReceptionModal`
**Fichier :** `src/modules/logistics/inventory/components/inventory/StockReceptionModal.tsx`  
**Problème :** `VisionScanner` + `ExtractedInvoice` existaient, jamais utilisés dans ce contexte.  
**Fix :** Ajouté `<VisionScanner onAnalysisComplete={handleInvoiceScanned} />` en tête de formulaire. `handleInvoiceScanned` pré-remplit : nom ingrédient (fuzzy match bidirectionnel), quantité, unité, coût HT, DLC, numéro de lot, fournisseur (match strict lowercase).

---

### P5a · DLC color-coding inventaire
**Fichier :** `src/app/(client)/(ops)/inventory/page.tsx`  
**Problème :** Tableau stocks sans signalisation visuelle des DLC.  
**Fix :** `computeDLCStatus(dlc)` → 5 rangs : 0=expiré (red-600), 1=aujourd'hui (red-500), 2=≤3j (orange-500), 3=≤7j (amber-500), 4=OK (muted). Tri par rank avant rendu. Colonne DLC ajoutée (colSpan 6→7).

---

### P5b · Tab Pointage `/staff`
**Fichier :** `src/app/(client)/(ops)/staff/page.tsx`  
**Problème :** `BadgeControl` et `shiftLogsAtom` existaient dans `@modules/human`, jamais rendus.  
**Fix :** Nouveau type tab `"timesheet"`, icône `Clock`. Vue : `BadgeControl` + historique 30 dernières entrées desc. RBAC : managers (level ≥ 60) voient tous les logs, autres = filtre `currentUser.id`.

---

### P6a · `MenuEngineeringMatrix` (nouveau fichier)
**Fichier :** `src/modules/intelligence/analytics/components/MenuEngineeringMatrix.tsx`  
**Problème :** `menuAnalysisSelector` calculait Star/Plowhorse/Puzzle/Dog mais aucun composant ne le consommait.  
**Fix :** Composant 4 quadrants (gold/red/blue/muted), tri `popularity × profitability`, 6 items max par quadrant. Exporté depuis `index.ts`. Wrappé autour de `ProfitabilityView` dans analytics tab "profitabilité".

---

### P6b · Hub `/intelligence` (nouveau fichier)
**Fichier :** `src/app/(client)/(ops)/intelligence/page.tsx`  
**Problème :** `MobileNavBar` pointait vers `/intelligence` → 404.  
**Fix :** Hub 4 cards : Intelligence Exécutive (`/admin/agent`), Analytics (`/analytics`), Cartographie 3D (`/system-map`), Registre & Prévisionnel (`/registre`).  
**Note :** Non encore dans `navConfig.ts` sidebar desktop (voir backlog).

---

### P7 · Cascade `useStockDeduction` wired (hook orphelin)
**Fichier :** `src/modules/ops/pos/hooks/usePos.ts`  
**Problème :** `useStockDeduction` dans `src/modules/logistics/hooks/useStockDeduction.ts` n'était **jamais importé** dans le codebase entier. Cascade POS→Stock silencieusement morte.  
**Fix :** Câblé dans `handlePaymentComplete` **après** `FinancialNexusBridge.processOrder()`. Pattern fire-and-log : un échec de déduction ne doit jamais annuler un paiement NF525 scellé (immuable).

```typescript
// pos-4: fire-and-log — stock deduction must not block a sealed NF525 payment
const orderLines = cartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
})) as unknown as OrderLine[];
deductForOrder(orderLines).catch(err => {
    showToast("Stock non déduit — voir console", "error");
    console.error("[usePOS] stock deduction failed", err);
});
```

---

## §2 — Audit des cascades (17 edges)

| Edge | Statut | Note |
|---|---|---|
| POS → NF525 seal | ✅ LIVE | `FinancialNexusBridge.processOrder()` → JournalEntry + FiscalSeal immuable |
| POS → Stock deduction | ✅ WIRED ✦ | Câblé cette session, fire-and-log |
| FloorPlan ↔ Réservations | ✅ LIVE | Sync statut table bidirectionnel |
| Kitchen → WasteTab | ✅ FIXED ✦ | Cast mort remplacé par `useHACCP()` |
| Orders → menuAnalysisSelector | ✅ LIVE | Calcul quadrants Jotai |
| menuAnalysisSelector → UI | ✅ WIRED ✦ | MenuEngineeringMatrix créé cette session |
| VisionScanner → StockModal | ✅ WIRED ✦ | Câblé cette session |
| BadgeControl → ShiftLogs | ✅ LIVE | Pointage → historique tab Timesheet |
| POS → Analytics | ✅ LIVE | Dérivé via Jotai selectors |
| OpenBanking → Finance | ✅ LIVE | TinkProvider / PowensProvider non modifiés |
| Stripe → CronosBilling | ✅ LIVE | Non modifié |
| **KDS → WebPush** | ⚠️ NO-OP | `sendToRole()` = TODO log, pas de lib web-push, pas de VAPID |
| **HACCP temp → WebPush** | ⚠️ NO-OP | Même cause |
| **Planning → WebPush** | ⚠️ NO-OP | Même cause |
| **StockItems → OraclePredictor** | ❌ MISSING | `inventoryMovementsAtom` non créé |
| **ShiftLogs → Paie** | ❌ MISSING | Tab Paie non créée |
| **Finance → buildPnL** | 🐛 BUG | `debitInCents * 1000` doit être `* 10_000` |

---

## §3 — Notes d'architecture découvertes

**Pattern "hook orphelin" :** `useStockDeduction` était le seul cas identifié. Commande de détection pour les futures sessions :
```bash
grep -rn "export.*function use" src/modules/*/hooks/ --include="*.ts" | \
  grep -oP "use[A-Z]\w+" | sort -u | while read fn; do
    count=$(grep -rln "$fn" src/ | grep -v "hooks/" | wc -l)
    [ "$count" -eq 0 ] && echo "ORPHAN: $fn"
  done
```

**`useFiscal` — fausse alarme :** Grep le montrait absent mais il est défini dans `catalogHooks.tsx` et ré-exporté depuis `NexusOpsProvider.tsx`. Ne pas supprimer.

**Convention microunits incomplète :** Le bug Bar (`/ 100`) est un symptôme. Chercher `/ 100` associé à des variables `*InMicrounits` ou déjà converties en euros.

**Serveur de dev :** `npx next dev` bloqué par sentrux (`max_cc = 20`). Toujours utiliser :
```bash
node_modules/.bin/next dev -p 3455
```

---

## §4 — Backlog complet (issu de BIBLE_TECHNIQUE.html + session)

### 4.1 Ajouts découverts cette session (5 items)

| Priorité | Item | Fichier | Notes |
|---|---|---|---|
| 🔴 P1 | Bug `buildPnL ×10` | `AccountingReportService` (chercher via grep) | `debitInCents * 1000` → `* 10_000`. 1 cent = 10 000 µ. Rapport P&L affiché ÷10. |
| 🔴 P1 | WebPush livraison | `src/app/api/push/subscribe/route.ts`, `webPushService.ts` | `npm install web-push` → VAPID keys → signer `sendToRole/sendToUser`. 3 cascades mortes débloquées. |
| 🟡 P2 | `/intelligence` dans sidebar | `src/config/navConfig.ts` | 5 min de config. Icône `Sparkles` ou `Brain`. |
| 🟡 P2 | OraclePredictor | `src/modules/logistics/hooks/`, `src/store/pillars/logistics.ts` | Créer `inventoryMovementsAtom` + hook `useOraclePrediction(itemId, currentQty)` + OracleModal + bouton Sparkles inventory. |
| 🟡 P2 | Staff Paie / Compétences / CV | `src/app/(client)/(ops)/staff/page.tsx` | Tab Paie : shiftLogs × taux horaire. Compétences : skill matrix. CV/Dossiers : PDF upload Nexus. |

---

### 4.2 Backlog BIBLE_TECHNIQUE — items non cochés

#### 🔴 P1 — Critique (21 items)

| ID | Titre | Contexte |
|---|---|---|
| `res-2` | Lien "Réserver" dans la fiche Google Business Profile | L'URL du widget public doit être renseignée manuellement dans GBP par le restaurateur — aucune automatisation requise à ce stade |
| `fin-3` | Powens Step 1 — Inscription sandbox biapi.pro | Récupérer `POWENS_CLIENT_ID` et `POWENS_CLIENT_SECRET` réels. Actuellement `restaurant-os-master` hardcodé. |
| `mdm-1` | Apple Business Manager — créer le compte Organisation | abm.apple.com. Prérequis pour gérer les iPads clients en MDM. |
| `mdm-2` | Mosyle MDM — créer le compte et lier à ABM | mosyle.com. Enrôler les iPads des restaurants bêta. |
| `mcc-core-2` | Définir `APP_MODE=mcc` sur le déploiement console | 2 déploiements séparés : `APP_MODE=tenant` (restaurants) + `APP_MODE=mcc` (console admin). Le code le prévoit déjà. |
| `mcc-core-3` | 2FA obligatoire pour les comptes `fleet_admin` | Un compte admin compromis = accès à TOUS les restaurants. Firebase Auth MFA. |
| `mcc-bill-1` | Remplacer données mockées `MCCTreasury` par vraies données Stripe | MRR trend +12.4%, marge 28.4%, procurement rows — tout inventé. Brancher Stripe Dashboard API. |
| `mcc-mdm-1` | Kill switch billing → `Mosyle.lockDevice()` | `subscription.deleted` Stripe → iPads du restaurant verrouillés. Lié à `rbac-6` (déjà fait côté app). |
| `mcc-ota-2` | Sécuriser `DeploymentEngine` : retirer le push git de l'UI | Bouton "Engage Global Sync" = `git push` depuis un dashboard web. Bloqué en prod mais dangereux en dev partagé. |
| `mcc-deploy-adv-3` | Remote Device Wipe via Mosyle API | En cas de vol d'un iPad, effacement complet depuis le MCC. Données fiscales et clients exposées sinon. |
| `mcc-support-ai-1` | Agent SAV L0 — IA analyse captures d'écran + brouillon diagnostic | Support 100% manuel actuellement. L1 = 70% des tickets. L'agent décharge le dev. |

---

#### 🟡 P2 — Important (13 items)

| ID | Titre | Contexte |
|---|---|---|
| `res-arch-2` | Site vitrine pré-buildé livré avec le SaaS | Template Next.js personnalisable depuis `/settings` (couleurs, nom, horaires). URL : `bistro.restaurant-os.app`. |
| `com-sms-1` | SMS marketing via Brevo / Vonage | `customer.smsConsent = true` requis. Taux d'ouverture 95% vs 20% email. `CommunicationLog` à brancher. |
| `ai-3` | Google Business Profile API — sync horaires + réponse avis Gemini | `SEOAction: connect_google` typée. OAuth GBP + posts automatiques. Différenciateur fort. |
| `mdm-4` | Mode Kiosk iPads (plein écran au démarrage) | Mosyle → Supervised mode → Single App Mode → bundleId app. |
| `mdm-5` | Kill switch MDM : abonnement résilié → iPad verrouillé | Mosyle API disponible mais non câblé côté MCC. |
| `mdm-6` | TeamViewer QuickSupport sur iPads bêta | Support à distance immédiat. Zéro code requis. |
| `goo-7` | Demander l'accès avancé à GBP API (quota request) | `console.cloud.google.com` → Business Profile API → "Demander un accès avancé". Délai ~2 semaines. |
| `leg-5` | Dossier Prêt d'Honneur Initiative Lyon | Financement 0%. Réseau Init'ialis Lyon. Délai ~2 mois — à lancer maintenant. |
| `leg-6` | Évaluation dossier JEI + CIR avec comptable | Jeune Entreprise Innovante — éligible si < 8 ans et 15% dépenses R&D. Potentiel ~5k€. |
| `mcc-mdm-2` | Brancher API Mosyle réelle dans MDMPanel | `MDMPanel.tsx:227,251` — 2 TODO, données mock. Structure API documentée. |
| `mcc-mdm-3` | Inventaire flotte devices par tenant dans le MCC | Vue croisée : quel restaurant a quels iPads, dernier check-in, version OS. |
| `mcc-billing-adv-3` | External API Gateway — clés API par tenant | Le restaurateur génère ses propres clés pour connecter son ERP. Révocation possible depuis MCC. |
| `mcc-growth-1` | Page statut `status.restaurantos.com` auto-updatée | En panne, les clients appellent sans savoir si c'est chez eux. Réduit ~60% des tickets support. |

---

#### ⚪ P3 — Faible priorité (2 items non-optionnels)

| ID | Titre | Contexte |
|---|---|---|
| `rh-9` | DSN mensuelle (Déclaration Sociale Nominative) | Obligation légale si paie internalisée. Sinon l'export Silae/PayFit (déjà fait) couvre. |
| `mcc-growth-2` | Reseller Portal — gestion commerciaux indépendants | Codes affiliation + suivi commissions 10%. Croissance canal partenaires. |

---

#### 🔵 Options (ne pas implémenter sans décision explicite)

| ID | Titre |
|---|---|
| `res-4` | Rappel SMS 24h avant réservation (Twilio/Vonage) |
| `res-11` | Reserve with Google (Actions Center — 10+ restaurants actifs requis) |
| `res-arch-3` | Domaine personnalisé pour site vitrine (CNAME Vercel/Cloudflare) |
| `hac-6` | Capteurs IoT physiques température (Rotronic/Testo BLE/WiFi) |
| `com-5` | Campagnes SMS client (Twilio/Vonage) |
| `com-social-1` | WhatsApp Business API (Meta Cloud API) |
| `com-social-2` | LinkedIn Ads B2B (privatisations entreprise) |
| `goo-6` | Candidature Reserve with Google |
| `goo-9` | 3 feeds Reserve with Google (merchants/services/availability) |
| `goo-10` | Booking Server REST pour Reserve with Google |

---

## §5 — Comment reprendre

```bash
# Vérifier l'état TypeScript
npx tsc --noEmit
# Attendu : 0 errors

# Lancer les tests
npx vitest run
# Attendu : 386 passed, 1 skipped

# Lancer le dev server (JAMAIS npx next dev — bloqué sentrux)
node_modules/.bin/next dev -p 3455
```

### Ordre recommandé des prochaines tâches

| Ordre | Item | Durée est. | Risque |
|---|---|---|---|
| 1 | Bug `buildPnL ×10` (AccountingReportService) | 15 min | Finance — critique |
| 2 | `/intelligence` dans `navConfig.ts` sidebar | 5 min | Nul |
| 3 | WebPush infra complète | 1–2 h | Env vars + ServiceWorker |
| 4 | OraclePredictor (`inventoryMovementsAtom`) | 2–3 h | Faible |
| 5 | Staff Paie / Compétences / CV | 3–4 h | Faible |
| 6 | MDM — Apple Business Manager + Mosyle | Externe | Compte à créer |
| 7 | `mcc-core-2` APP_MODE=mcc | 30 min | Config déploiement |
| 8 | `mcc-core-3` 2FA fleet_admin | 1 h | Firebase MFA |

---

## §6 — Règles permanentes du projet

- **NF525 immuable :** `journalEntries`, `fiscalSeals`, `fiscalLedger` → jamais `delete`, jamais `update`
- **Microunits :** 1 µ = 0.000001 € · `1 € = 1 000 000 µ` · `1 cent = 10 000 µ` · helper `toMicrounits()` obligatoire
- **SovereignGuard :** tout path Nexus = `tenants/{tenantId}/{collection}/{id}` — ne jamais contourner
- **i18n dormant :** Ne pas câbler i18n dans de nouveaux composants — décision explicite requise
- **Rapatriement progressif :** Tout nouveau code d'un pilier → `src/modules/<pilier>/` — ne plus créer dans `src/components/`
- **Git push :** Jamais sur GitHub — migration GitLab en cours

---

*Généré le 2026-07-21 · Session `03e6ea20` · Restaurant OS `grade-x-vanguard`*
