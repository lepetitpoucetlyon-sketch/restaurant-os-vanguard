# Sprint Final — 52 items codables (un par un)

## VAGUE 1 — Quick wins UI (4 items) ✅
- [x] mcc-bill-5  : boutons morts masqués + badge "Bientôt"
- [x] mcc-debt-2  : tendances hardcodées remplacées par "—" (neutre)
- [x] mcc-core-5  : 4 sondes câblées sur /api/admin/mcc/health (env vars réelles)
- [x] mcc-core-6  : avatar "AD" → initiales depuis currentUser.name

## VAGUE 2 — MCC Users (3 items) ✅
- [x] mcc-users-2 : TenantUsersPanel — liste users, reset PIN, changement rôle
- [x] mcc-users-5 : /api/admin/fleet/users/impersonate + ImpersonationBanner (bannière jaune)
- [x] mcc-users-7 : Email RGPD notifyTenantAccess() dans support-access/route.ts

## VAGUE 3 — MCC Billing (5 items) ✅
- [x] mcc-bill-2      : TenantBillingPanel + /api/admin/fleet/tenant-billing
- [x] mcc-bill-3      : DunningEngine cron /api/billing/dunning (J+3/J+7/J+14)
- [x] mcc-bill-4      : fleet/command écrit tenantConfig.status.licenceStatus LOCKED
- [x] mcc-billing-adv-1 : /api/admin/fleet/billing/feature-flags (PAID_MODULES)
- [x] mcc-billing-adv-2 : UsageTracker.ts + /api/admin/fleet/billing/usage

## VAGUE 4 — MCC Provisioning (4 items) ✅
- [x] mcc-prov-1  : sendAdminPinEmail() après createRootAdmin (Resend)
- [x] mcc-prov-4  : decommissionTenant() — archive NF525 + LOCKED + rgpdPurgeAt J+90
- [x] mcc-prov-9  : Stripe.customers.create() réel (fallback mock si clé absente)
- [x] mcc-prov-10 : LightRAGClient({ workspace: ragWorkspaceId }).insert() bootstrap

## VAGUE 5 — MCC CRM + Security (4 items) ✅
- [x] mcc-crm-1  : Auto-DNS Vercel/Cloudflare à la création tenant
- [x] mcc-crm-2  : Digital Contract Vault (CGV signées + gate blocage)
- [x] mcc-crm-4  : Multi-Region Allocation (choix Firestore region)
- [x] mcc-security-adv-4 : RGPD Purge cryptographique + certificat effacement

## VAGUE 6 — MCC Growth + Health (4 items) ✅
- [x] mcc-growth-3 : Churn Predictor IA (baisse activité → alerte)
- [x] mcc-growth-4 : Tenant Health Score (uptime + sync + HACCP + tickets)
- [x] mcc-deploy-adv-2 : QR Code Device Activation (onboard iPad en 30s)
- [x] mcc-deploy-adv-4 : Phased Rollout / Canary (1 tenant pilote avant flotte)

## VAGUE 7 — MCC Support IA + Comp (6 items)
- [ ] mcc-support-ai-2 : Validation Gate human-in-the-loop
- [ ] mcc-support-ai-3 : 1-Click Tenant Restore UI (PITR Firestore)
- [ ] mcc-support-ai-4 : Firestore Hotspot Radar (détection loops)
- [ ] mcc-comp-2 : Audit intégrité chaîne auto hebdomadaire
- [ ] mcc-comp-3 : PDF certificat NF525 téléchargeable
- [ ] mcc-ai-3  : RAG stats workspace + purge orphelins

## VAGUE 8 — AI + OTA (4 items)
- [ ] ai-fallback-1 : Provider IA fallback (Gemini → Claude auto)
- [ ] ai-toggle-1  : Toggles modules IA par restaurant
- [ ] mcc-ota-3   : Test broadcast maintenanceMode → bannière tenant
- [ ] mcc-ai-4    : StrategyOracle sur vraies données géo/santé

## VAGUE 9 — CRM Marketing (4 items)
- [ ] com-analytics-1 : Analytics campagne (open rate, clics, CA)
- [ ] com-consent-1   : RGPD opt-in par canal (email ≠ SMS ≠ WhatsApp)
- [ ] com-rules-1     : Anti-spam rules (délai 7j, quota mensuel)
- [ ] com-ab-1        : A/B testing email (20% sample → winner → 80%)

## VAGUE 10 — Finance Powens (4 items)
- [ ] fin-4 : Powens OAuth réel createConnectionToken()
- [ ] fin-5 : getAccounts() → PowensAccount[]
- [ ] fin-6 : getTransactions() → PCG → JournalEntry → scellement
- [ ] fin-7 : Webhook HMAC-SHA256 sync temps réel

## VAGUE 11 — Réservations + Infra (4 items)
- [ ] res-arch-1 : Architecture biface (backoffice / widget public)
- [ ] res-14     : Acompte privatisation Stripe Checkout + NF525
- [ ] inf-7      : Rate limiter Redis/Upstash (remplace Map() RAM)
- [ ] rh-5       : DPAE automatique à la création d'un employé
