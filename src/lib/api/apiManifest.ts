export type RouteAudience = 'public' | 'tenant' | 'mcc' | 'webhook';
export type TenantSource = 'header' | 'subdomain' | 'token' | 'query' | 'signature' | 'none';

export interface ApiRouteContract {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  audience: RouteAudience;
  minRole?: string;
  tenantSource: TenantSource;
  paginated?: boolean;
  rateLimited: boolean;
  idempotencyRequired?: boolean;
  summary: string;
  testFile?: string;
}

/**
 * 🗺️ API Route Manifest Exhaustif (Phase 4 Audit Remediation)
 *
 * Inventaire complet et opposable des 222 routes API (294 endpoints HTTP).
 * Auto-généré et vérifié par scripts/generate-api-manifest.mjs.
 */
export const API_MANIFEST: ApiRouteContract[] = [
  {
    "path": "/api/admin/brand/extract",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Prend l'URL du site du restaurant, capture un screenshot via Playwright,"
  },
  {
    "path": "/api/admin/compliance/chain-audit",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin compliance chain-audit"
  },
  {
    "path": "/api/admin/compliance/fiscal-archive-export",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🏛️ Route: Export Archive Fiscale Scellée NF525 en 1 Clic (MCC & Compliance)"
  },
  {
    "path": "/api/admin/compliance/fiscal-tenant-audit",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne les journalEntries + fiscalSeals d'un tenant pour un contrôle fiscal."
  },
  {
    "path": "/api/admin/compliance/nf525-certificate",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PDF Certificat NF525 téléchargeable — mcc-comp-3"
  },
  {
    "path": "/api/admin/dlq/export",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Export forensique de la DLQ pour audit externe."
  },
  {
    "path": "/api/admin/dlq/list",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Liste les événements en Dead Letter Queue (server-side, tous tenants)."
  },
  {
    "path": "/api/admin/dlq/replay-batch",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Rejoue en lot tous les événements DLQ d'un handler donné (post fix root cause)."
  },
  {
    "path": "/api/admin/dlq/replay",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Rejoue un événement depuis la Dead Letter Queue."
  },
  {
    "path": "/api/admin/finance/fec/export",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "🏛️ Route: Export FEC - Grade X+++"
  },
  {
    "path": "/api/admin/fleet/backup",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "body: { tenantIds?: string[] } (vide = toute la flotte)"
  },
  {
    "path": "/api/admin/fleet/backup",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "body: { tenantIds?: string[] } (vide = toute la flotte)"
  },
  {
    "path": "/api/admin/fleet/billing/feature-flags",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Active/désactive un module payant pour un tenant."
  },
  {
    "path": "/api/admin/fleet/billing/feature-flags",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Active/désactive un module payant pour un tenant."
  },
  {
    "path": "/api/admin/fleet/billing/portal-session",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Crée une Stripe Billing Portal Session pour un tenant."
  },
  {
    "path": "/api/admin/fleet/billing/treasury-report",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne le rapport financier réel de la flotte MCC."
  },
  {
    "path": "/api/admin/fleet/billing/treasury-report",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Retourne le rapport financier réel de la flotte MCC."
  },
  {
    "path": "/api/admin/fleet/billing/usage",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne le résumé d'usage (SMS, emails, IA) du mois courant pour un tenant."
  },
  {
    "path": "/api/admin/fleet/catalog",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin fleet catalog"
  },
  {
    "path": "/api/admin/fleet/catalog",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet catalog"
  },
  {
    "path": "/api/admin/fleet/catalog",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE admin fleet catalog"
  },
  {
    "path": "/api/admin/fleet/changelog",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Fleet Changelog — historique complet et catégorisé par tenant ou flotte."
  },
  {
    "path": "/api/admin/fleet/changelog",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Fleet Changelog — historique complet et catégorisé par tenant ou flotte."
  },
  {
    "path": "/api/admin/fleet/churn",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Churn Predictor IA — mcc-growth-3"
  },
  {
    "path": "/api/admin/fleet/command",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Envoi d'une commande opérationnelle sur une instance de la flotte."
  },
  {
    "path": "/api/admin/fleet/contracts",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Digital Contract Vault — mcc-crm-2"
  },
  {
    "path": "/api/admin/fleet/contracts",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Digital Contract Vault — mcc-crm-2"
  },
  {
    "path": "/api/admin/fleet/cron/nf525-audit",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin fleet cron nf525-audit"
  },
  {
    "path": "/api/admin/fleet/device-activation",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "QR Code Device Activation — mcc-deploy-adv-2"
  },
  {
    "path": "/api/admin/fleet/device-activation",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "QR Code Device Activation — mcc-deploy-adv-2"
  },
  {
    "path": "/api/admin/fleet/device-activation",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "QR Code Device Activation — mcc-deploy-adv-2"
  },
  {
    "path": "/api/admin/fleet/dns",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Auto-DNS : crée automatiquement le sous-domaine {slug}.restaurantos.app"
  },
  {
    "path": "/api/admin/fleet/drain-outbox",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🚀 Draine les outboxes de tous les tenants vers la vue globale MCC."
  },
  {
    "path": "/api/admin/fleet/health-score",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant Health Score — mcc-growth-4"
  },
  {
    "path": "/api/admin/fleet/health-score",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant Health Score — mcc-growth-4"
  },
  {
    "path": "/api/admin/fleet/hotspot",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Firestore Hotspot Radar — mcc-support-ai-4"
  },
  {
    "path": "/api/admin/fleet/migrate",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin fleet migrate"
  },
  {
    "path": "/api/admin/fleet/migrate",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet migrate"
  },
  {
    "path": "/api/admin/fleet/ota-broadcast",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "OTA Broadcast maintenanceMode — mcc-ota-3"
  },
  {
    "path": "/api/admin/fleet/owner-view",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Vue agrégée de la flotte d'un Owner B2B depuis le MCC."
  },
  {
    "path": "/api/admin/fleet/plugins",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Calcule le prorata en microunits pour un plugin activé/désactivé en cours de cycle."
  },
  {
    "path": "/api/admin/fleet/plugins",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Calcule le prorata en microunits pour un plugin activé/désactivé en cours de cycle."
  },
  {
    "path": "/api/admin/fleet/plugins",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Calcule le prorata en microunits pour un plugin activé/désactivé en cours de cycle."
  },
  {
    "path": "/api/admin/fleet/provision",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Provisionnement complet d'un nouveau tenant depuis le MCC."
  },
  {
    "path": "/api/admin/fleet/public-access",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Public Access Toggle — MCC kill-switch pour landing / signup public."
  },
  {
    "path": "/api/admin/fleet/public-access",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Public Access Toggle — MCC kill-switch pour landing / signup public."
  },
  {
    "path": "/api/admin/fleet/rag",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Gestion Sovereign RAG sur la flotte depuis le MCC."
  },
  {
    "path": "/api/admin/fleet/region",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Multi-Region Allocation — mcc-crm-4"
  },
  {
    "path": "/api/admin/fleet/region",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Multi-Region Allocation — mcc-crm-4"
  },
  {
    "path": "/api/admin/fleet/restore",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "1-Click Tenant Restore — mcc-support-ai-3"
  },
  {
    "path": "/api/admin/fleet/restore",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "1-Click Tenant Restore — mcc-support-ai-3"
  },
  {
    "path": "/api/admin/fleet/rgpd-export",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Export tenant — droit à la portabilité (Art. 20)"
  },
  {
    "path": "/api/admin/fleet/rgpd-export",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Export tenant — droit à la portabilité (Art. 20)"
  },
  {
    "path": "/api/admin/fleet/rgpd-purge",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Purge cryptographique — mcc-security-adv-4"
  },
  {
    "path": "/api/admin/fleet/rgpd-purge",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Purge cryptographique — mcc-security-adv-4"
  },
  {
    "path": "/api/admin/fleet/rollout",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Phased Rollout / Canary — mcc-deploy-adv-4"
  },
  {
    "path": "/api/admin/fleet/rollout",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Phased Rollout / Canary — mcc-deploy-adv-4"
  },
  {
    "path": "/api/admin/fleet/rollout",
    "method": "PATCH",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Phased Rollout / Canary — mcc-deploy-adv-4"
  },
  {
    "path": "/api/admin/fleet/seed-demo",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Écrit un document SiteTelemetry réaliste dans fleet-telemetry/{tenantId}"
  },
  {
    "path": "/api/admin/fleet/shadow-mode",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet shadow-mode"
  },
  {
    "path": "/api/admin/fleet/support-access",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Flow consentement support : demande MCC → approbation tenant → accès temporisé."
  },
  {
    "path": "/api/admin/fleet/support-ai/diagnose",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet support-ai diagnose"
  },
  {
    "path": "/api/admin/fleet/support-ai/drafts",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Support Drafts — review MCC des brouillons générés par l'agent IA."
  },
  {
    "path": "/api/admin/fleet/support-ai/drafts",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Support Drafts — review MCC des brouillons générés par l'agent IA."
  },
  {
    "path": "/api/admin/fleet/support-ai/provider-info",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne le provider IA MCC actif pour l'UI dynamique."
  },
  {
    "path": "/api/admin/fleet/support-gate",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Validation Gate human-in-the-loop — mcc-support-ai-2"
  },
  {
    "path": "/api/admin/fleet/support-gate",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Validation Gate human-in-the-loop — mcc-support-ai-2"
  },
  {
    "path": "/api/admin/fleet/support-gate",
    "method": "PATCH",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Validation Gate human-in-the-loop — mcc-support-ai-2"
  },
  {
    "path": "/api/admin/fleet/telemetry/crash-report",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet telemetry crash-report"
  },
  {
    "path": "/api/admin/fleet/telemetry/heartbeat",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin fleet telemetry heartbeat"
  },
  {
    "path": "/api/admin/fleet/tenant-ai-config",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant AI Config — édition MCC de la configuration IA d'un tenant."
  },
  {
    "path": "/api/admin/fleet/tenant-ai-config",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant AI Config — édition MCC de la configuration IA d'un tenant."
  },
  {
    "path": "/api/admin/fleet/tenant-billing",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne les infos de facturation Nexus d'un tenant."
  },
  {
    "path": "/api/admin/fleet/tenant-override",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant Override — MCC granular per-tenant config patches."
  },
  {
    "path": "/api/admin/fleet/tenant-override",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant Override — MCC granular per-tenant config patches."
  },
  {
    "path": "/api/admin/fleet/tenant-override",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Tenant Override — MCC granular per-tenant config patches."
  },
  {
    "path": "/api/admin/fleet/tenant-users",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Liste les utilisateurs d'un tenant donné pour la vue MCC."
  },
  {
    "path": "/api/admin/fleet/trusted-devices",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Routes MCC autorisées (vide = toutes, selon le rôle)."
  },
  {
    "path": "/api/admin/fleet/trusted-devices",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Routes MCC autorisées (vide = toutes, selon le rôle)."
  },
  {
    "path": "/api/admin/fleet/trusted-devices",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Routes MCC autorisées (vide = toutes, selon le rôle)."
  },
  {
    "path": "/api/admin/fleet/trusted-devices",
    "method": "PATCH",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Routes MCC autorisées (vide = toutes, selon le rôle)."
  },
  {
    "path": "/api/admin/fleet/universal-health",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne la santé de toute la flotte d'instances agrégée par verticale métier."
  },
  {
    "path": "/api/admin/fleet/universal-health",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne la santé de toute la flotte d'instances agrégée par verticale métier."
  },
  {
    "path": "/api/admin/fleet/upgrade",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Fleet Upgrade — pousse une version cible à toute la flotte ou une sélection."
  },
  {
    "path": "/api/admin/fleet/upgrade",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Fleet Upgrade — pousse une version cible à toute la flotte ou une sélection."
  },
  {
    "path": "/api/admin/fleet/users/impersonate",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Crée une session d'impersonation auditée : l'opérateur MCC voit"
  },
  {
    "path": "/api/admin/fleet/users/impersonate",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Crée une session d'impersonation auditée : l'opérateur MCC voit"
  },
  {
    "path": "/api/admin/fleet/users/reset-pin",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Réinitialise le PIN d'un utilisateur admin d'un tenant depuis le MCC."
  },
  {
    "path": "/api/admin/fleet/users/role",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Modifie le rôle d'un utilisateur tenant depuis le MCC."
  },
  {
    "path": "/api/admin/git/push",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Triggers a git push for deployment synchronization"
  },
  {
    "path": "/api/admin/git/status",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Returns current git status for deployment engine monitoring"
  },
  {
    "path": "/api/admin/hr/export/csv",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Exporte le pré-paie du mois en CSV compatible Excel FR (séparateur ;, BOM UTF-8)."
  },
  {
    "path": "/api/admin/hr/payroll/merge/exchange",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Reçoit le public_token après que le client a terminé le flow Merge Link,"
  },
  {
    "path": "/api/admin/hr/payroll/merge/link-token",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Génère un link_token Merge.dev pour ouvrir Merge Link dans le navigateur."
  },
  {
    "path": "/api/admin/hr/payroll/merge/sync",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Pousse le pré-paie d'une période vers le provider connecté via Merge.dev."
  },
  {
    "path": "/api/admin/hr/payroll/provider/connect",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Connecte un provider paie field-based (Silae, PayFit, ADP…)."
  },
  {
    "path": "/api/admin/hr/payroll/provider/sync",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Synchronise une période pré-paie via le provider configuré pour ce tenant."
  },
  {
    "path": "/api/admin/hr/payroll/settings",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne la configuration provider paie du tenant courant."
  },
  {
    "path": "/api/admin/hr/payroll/silae/connect",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Sauvegarde les credentials Silae du tenant et vérifie la connexion."
  },
  {
    "path": "/api/admin/hr/payroll/silae/sync",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Pousse le pré-paie d'une période vers Silae."
  },
  {
    "path": "/api/admin/intelligence/ai-toggle",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Toggles modules IA par restaurant — ai-toggle-1"
  },
  {
    "path": "/api/admin/intelligence/ai-toggle",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Toggles modules IA par restaurant — ai-toggle-1"
  },
  {
    "path": "/api/admin/intelligence/strategy-oracle",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "StrategyOracle API — mcc-ai-4"
  },
  {
    "path": "/api/admin/intelligence/strategy-oracle",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "StrategyOracle API — mcc-ai-4"
  },
  {
    "path": "/api/admin/intelligence/vision",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🛰️ Vision API Proxy - Grade X Sovereign Gateway"
  },
  {
    "path": "/api/admin/mcc/api-gateway/[tenantId]/[keyId]",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE admin mcc api-gateway [tenantId] [keyId]"
  },
  {
    "path": "/api/admin/mcc/fleet/devices/delivery",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin mcc fleet devices delivery"
  },
  {
    "path": "/api/admin/mcc/fleet/devices/lock",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Generates an APNs (Apple Push Notification service) JWT token for MDM commands."
  },
  {
    "path": "/api/admin/mcc/health",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin mcc health"
  },
  {
    "path": "/api/admin/mcc/notify-critical",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin mcc notify-critical"
  },
  {
    "path": "/api/admin/mcc/reseller/commissions",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Calcule et archive les commissions revendeur pour un mois donné."
  },
  {
    "path": "/api/admin/mcc/reseller",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PATCH /api/admin/mcc/reseller      — mettre à jour statut / commission"
  },
  {
    "path": "/api/admin/mcc/reseller",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PATCH /api/admin/mcc/reseller      — mettre à jour statut / commission"
  },
  {
    "path": "/api/admin/mcc/reseller",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PATCH /api/admin/mcc/reseller      — mettre à jour statut / commission"
  },
  {
    "path": "/api/admin/mcc/reseller",
    "method": "PATCH",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PATCH /api/admin/mcc/reseller      — mettre à jour statut / commission"
  },
  {
    "path": "/api/admin/mcc/system-tenants/promote",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Promotion TEST → REFERENCE pour une verticale donnée."
  },
  {
    "path": "/api/admin/mcc/system-tenants/reset-demo",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Réinitialise un tenant DEMO : purge données mutables + re-seed."
  },
  {
    "path": "/api/admin/mcc/system-tenants/reset-test",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Réinitialise un tenant TEST : purge toutes collections + re-seed depuis DNA REFERENCE."
  },
  {
    "path": "/api/admin/mcc/tenants/scrape-charter",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body : { websiteUrl: string, fallbackName?: string, siren?: string, forceVariant?: PlatformVariant }"
  },
  {
    "path": "/api/admin/mdm/devices",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Liste les appareils MDM gérés via Mosyle Business API."
  },
  {
    "path": "/api/admin/mdm/devices",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Liste les appareils MDM gérés via Mosyle Business API."
  },
  {
    "path": "/api/admin/mdm/erase",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Efface un appareil via Mosyle MDM (IRRÉVERSIBLE)."
  },
  {
    "path": "/api/admin/mdm/lock",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Verrouille un appareil via Mosyle MDM."
  },
  {
    "path": "/api/admin/nam/analyze",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin nam analyze"
  },
  {
    "path": "/api/admin/procurement/delivery/[id]/sign",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "🏛️ Route: Sign Delivery Note - Grade X+++"
  },
  {
    "path": "/api/admin/rag/workspace-stats",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RAG Stats Workspace + Purge Orphelins — mcc-ai-3"
  },
  {
    "path": "/api/admin/rag/workspace-stats",
    "method": "DELETE",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RAG Stats Workspace + Purge Orphelins — mcc-ai-3"
  },
  {
    "path": "/api/admin/rbac",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET admin rbac"
  },
  {
    "path": "/api/admin/rbac",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin rbac"
  },
  {
    "path": "/api/admin/system/health",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🏛️ Route: System Health - Grade X+++"
  },
  {
    "path": "/api/admin/system/simulate-event",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST admin system simulate-event"
  },
  {
    "path": "/api/admin/users/assign-role",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Assigne un rôle (standard ou custom) à un utilisateur du tenant."
  },
  {
    "path": "/api/agent/report",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Rapport Sentinel pour la page AgentIntelligence."
  },
  {
    "path": "/api/ai/review-response",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Génère une réponse professionnelle à un avis client via le moteur LLM universel."
  },
  {
    "path": "/api/auth/google/callback",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Chiffrement AES-GCM via Web Crypto API."
  },
  {
    "path": "/api/auth/google",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Redirige vers l'URL OAuth Google avec le scope business.manage."
  },
  {
    "path": "/api/auth/login-pin",
    "method": "POST",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Remplace la Cloud Function `loginWithPin` (firestore.md §12 Lot B2.b) —"
  },
  {
    "path": "/api/auth/login-profiles",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Remplace la Cloud Function `listLoginProfiles` (firestore.md §12 Lot B2.b) —"
  },
  {
    "path": "/api/billing/checkout",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Crée une Stripe Checkout Session pour le tenant authentifié."
  },
  {
    "path": "/api/billing/dunning",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Moteur de dunning progressif — à appeler par un cron Vercel (vercel.json crons)."
  },
  {
    "path": "/api/billing/portal",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Ouvre le portail de facturation Stripe pour le tenant AUTHENTIFIÉ."
  },
  {
    "path": "/api/billing/signup",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Cette route publique permettait à quiconque d'ouvrir une session Stripe"
  },
  {
    "path": "/api/billing/webhook",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Stripe sends events here. We verify the signature, then delegate to BillingService."
  },
  {
    "path": "/api/brand/extract",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST brand extract"
  },
  {
    "path": "/api/connectors/[id]/activate",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Active un connecteur pour le tenant."
  },
  {
    "path": "/api/connectors/[id]/activate",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Active un connecteur pour le tenant."
  },
  {
    "path": "/api/connectors/[id]/credentials",
    "method": "PUT",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Sauvegarde les credentials chiffrés pour un connecteur."
  },
  {
    "path": "/api/connectors/[id]/credentials",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Sauvegarde les credentials chiffrés pour un connecteur."
  },
  {
    "path": "/api/connectors/[id]",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Détail d'un connecteur (manifest + état). Sans credentials."
  },
  {
    "path": "/api/connectors/[id]/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Déclenche une synchronisation manuelle pour un connecteur actif."
  },
  {
    "path": "/api/connectors/[id]/test",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Teste la connexion avec les credentials stockés."
  },
  {
    "path": "/api/connectors/delivery/webhook/[provider]",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "Reçoit les commandes livraison entrantes (Uber Eats, Deliveroo…)."
  },
  {
    "path": "/api/connectors/iot/webhook/[provider]",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "Reçoit les relevés capteurs HACCP depuis les providers IoT (Lacroix, Monnit, webhook générique)."
  },
  {
    "path": "/api/connectors/reservations/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Déclenché par le cron toutes les 5 min pour synchroniser les réservations externes."
  },
  {
    "path": "/api/connectors/reservations/webhook/[provider]",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Reçoit les webhooks entrants des providers de réservation (Zenchef, TheFork…)."
  },
  {
    "path": "/api/connectors/reviews/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Cron quotidien : récupère les avis récents de toutes les plateformes configurées."
  },
  {
    "path": "/api/connectors",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Liste tous les connecteurs disponibles pour le tenant avec leur état Nexus."
  },
  {
    "path": "/api/crm/ab-test",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "A/B Testing Email — com-ab-1"
  },
  {
    "path": "/api/crm/ab-test",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "A/B Testing Email — com-ab-1"
  },
  {
    "path": "/api/crm/anti-spam",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Anti-Spam Rules — com-rules-1"
  },
  {
    "path": "/api/crm/anti-spam",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Anti-Spam Rules — com-rules-1"
  },
  {
    "path": "/api/crm/automations/run",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST crm automations run"
  },
  {
    "path": "/api/crm/campaign-analytics",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Analytics campagne — com-analytics-1"
  },
  {
    "path": "/api/crm/campaign-analytics",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Analytics campagne — com-analytics-1"
  },
  {
    "path": "/api/crm/campaign",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST crm campaign"
  },
  {
    "path": "/api/crm/consent",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Opt-in par canal — com-consent-1"
  },
  {
    "path": "/api/crm/consent",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Opt-in par canal — com-consent-1"
  },
  {
    "path": "/api/crm/consent",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "RGPD Opt-in par canal — com-consent-1"
  },
  {
    "path": "/api/crm/customers",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST crm customers"
  },
  {
    "path": "/api/cron/daily-backup",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Déclencheur automatique de sauvegarde quotidienne (Vercel Cron: '0 2 * * *')."
  },
  {
    "path": "/api/cron/tick",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Déclencheur DURABLE du moteur Cron central (audit S1 : `CronScheduler` n'avait"
  },
  {
    "path": "/api/cron/weekly-report",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Protected by Vercel's `Authorization: Bearer $CRON_SECRET` contract."
  },
  {
    "path": "/api/delivery/oauth/connect",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🔗 API: Mock OAuth 2.0 pour la connexion UberEats / Deliveroo"
  },
  {
    "path": "/api/delivery/rush-mode",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🚀 API: Basculer le mode Rush (Pause Livraison)"
  },
  {
    "path": "/api/einvoicing/configure",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Configure la Plateforme Agréée pour un tenant (override) ou pour la"
  },
  {
    "path": "/api/einvoicing/configure",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Configure la Plateforme Agréée pour un tenant (override) ou pour la"
  },
  {
    "path": "/api/einvoicing/inbound",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST einvoicing inbound"
  },
  {
    "path": "/api/einvoicing/inbound",
    "method": "PUT",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "PUT einvoicing inbound"
  },
  {
    "path": "/api/einvoicing/lifecycle",
    "method": "GET",
    "audience": "tenant",
    "minRole": "comptable",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET einvoicing lifecycle"
  },
  {
    "path": "/api/einvoicing/lifecycle",
    "method": "POST",
    "audience": "tenant",
    "minRole": "comptable",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST einvoicing lifecycle"
  },
  {
    "path": "/api/einvoicing/outbound",
    "method": "GET",
    "audience": "tenant",
    "minRole": "comptable",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET einvoicing outbound"
  },
  {
    "path": "/api/einvoicing/outbound",
    "method": "POST",
    "audience": "tenant",
    "minRole": "comptable",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST einvoicing outbound"
  },
  {
    "path": "/api/email/reservation-confirm",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Vrai si l'appel provient d'un service interne (ex : /api/widget/book côté"
  },
  {
    "path": "/api/facility/equipment/[id]/guides",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET facility equipment [id] guides"
  },
  {
    "path": "/api/facility/equipment/[id]/guides",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST facility equipment [id] guides"
  },
  {
    "path": "/api/facility/equipment/[id]",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET facility equipment [id]"
  },
  {
    "path": "/api/facility/equipment/[id]",
    "method": "PUT",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PUT facility equipment [id]"
  },
  {
    "path": "/api/facility/equipment/[id]",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE facility equipment [id]"
  },
  {
    "path": "/api/facility/equipment/[id]/troubleshoot",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST facility equipment [id] troubleshoot"
  },
  {
    "path": "/api/facility/equipment",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET facility equipment"
  },
  {
    "path": "/api/facility/equipment",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST facility equipment"
  },
  {
    "path": "/api/facility/hardware/diagnostics",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET facility hardware diagnostics"
  },
  {
    "path": "/api/facility/hardware/diagnostics",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST facility hardware diagnostics"
  },
  {
    "path": "/api/facility/settings/maintenance",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET facility settings maintenance"
  },
  {
    "path": "/api/facility/settings/maintenance",
    "method": "PUT",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PUT facility settings maintenance"
  },
  {
    "path": "/api/facility/settings/maintenance/test-alert",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST facility settings maintenance test-alert"
  },
  {
    "path": "/api/finance/accounting-portal/pack",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Génère et retourne l'ensemble des fichiers du pack comptable mensuel"
  },
  {
    "path": "/api/finance/accounting-portal/summary",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Récupère le résumé financier, TVA, NF525 et anomalies pour l'Expert-Comptable"
  },
  {
    "path": "/api/finance/accounting-portal/transmit",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Déclenche la télétransmission directe vers le logiciel comptable cible (Pennylane, Silae, Sage, Cegi"
  },
  {
    "path": "/api/finance/bank/callback",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Point de retour de la webview de connexion bancaire (navigation top-level, pas de Bearer token)."
  },
  {
    "path": "/api/finance/bank/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Déclenche une synchronisation bancaire pour le tenant authentifié."
  },
  {
    "path": "/api/finance/bank/test-demo",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Valide la chaîne GoCardlessProvider → PCG heuristics → signature"
  },
  {
    "path": "/api/finance/bank/webhook",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Reçoit les notifications de synchronisation de l'agrégateur bancaire"
  },
  {
    "path": "/api/finance/bank/webview",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Retourne l'URL de connexion bancaire (webview de l'agrégateur configuré pour le tenant)."
  },
  {
    "path": "/api/finance/cash-count",
    "method": "POST",
    "audience": "tenant",
    "minRole": "comptable",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST finance cash-count"
  },
  {
    "path": "/api/finance/jet/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "serveur",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "🛰️ API Backend de Synchro Hors-Ligne pour le JET (NF525)"
  },
  {
    "path": "/api/finance/sync",
    "method": "POST",
    "audience": "tenant",
    "minRole": "serveur",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "🛰️ API Backend de Synchro Hors-Ligne (Grade X)"
  },
  {
    "path": "/api/fleet/assign-vehicle",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST fleet assign-vehicle"
  },
  {
    "path": "/api/gemini-live",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Session init pour useGeminiLive — retourne la config système (instruction + tools)"
  },
  {
    "path": "/api/google/reserve/availability",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Feed Reserve with Google — disponibilités temps réel."
  },
  {
    "path": "/api/google/reserve/bookings",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/google/reserve/bookings?booking_id=X&merchant_id=Y — Google annule"
  },
  {
    "path": "/api/google/reserve/bookings",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/google/reserve/bookings?booking_id=X&merchant_id=Y — Google annule"
  },
  {
    "path": "/api/google/reserve/bookings",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/google/reserve/bookings?booking_id=X&merchant_id=Y — Google annule"
  },
  {
    "path": "/api/google/reserve/merchants",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Feed Reserve with Google — liste des marchands (restaurants inscrits)."
  },
  {
    "path": "/api/google/reserve/services",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Feed Reserve with Google — services (créneaux / types de réservation) par restaurant."
  },
  {
    "path": "/api/google/sync-hours",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Lit les horaires d'ouverture du tenant depuis Nexus tenant settings"
  },
  {
    "path": "/api/haccp/iot-push",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Webhook pour capteurs IoT WiFi (push mode)."
  },
  {
    "path": "/api/haccp/log-temp",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST haccp log-temp"
  },
  {
    "path": "/api/health/rag",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Endpoint léger sans authentification — chaque instance Vassal l'appelle depuis"
  },
  {
    "path": "/api/health",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET health"
  },
  {
    "path": "/api/hr/clock-in",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST hr clock-in"
  },
  {
    "path": "/api/hr/dsn",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body POST : { period: '2026-07' }"
  },
  {
    "path": "/api/hr/dsn",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body POST : { period: '2026-07' }"
  },
  {
    "path": "/api/hr/employees",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DPAE automatique à la création d'un employé — rh-5"
  },
  {
    "path": "/api/hr/employees",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DPAE automatique à la création d'un employé — rh-5"
  },
  {
    "path": "/api/inventory/adjust",
    "method": "POST",
    "audience": "tenant",
    "minRole": "chef_cuisinier",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST inventory adjust"
  },
  {
    "path": "/api/mcc/contracts",
    "method": "GET",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET mcc contracts"
  },
  {
    "path": "/api/mcc/contracts",
    "method": "POST",
    "audience": "mcc",
    "minRole": "mcc_support",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST mcc contracts"
  },
  {
    "path": "/api/menu.json",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Public endpoint — returns the restaurant menu as JSON, suitable for"
  },
  {
    "path": "/api/onboarding/audit",
    "method": "GET",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET onboarding audit"
  },
  {
    "path": "/api/ops/incident-webhook",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Alert types that are safe for auto-remediation"
  },
  {
    "path": "/api/oracle/index",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Indexe un document dans le Sovereign RAG du tenant."
  },
  {
    "path": "/api/oracle",
    "method": "POST",
    "audience": "tenant",
    "minRole": "serveur",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST oracle"
  },
  {
    "path": "/api/print/network",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Proxy TCP brut pour imprimantes/tiroirs réseau (ESC/POS sur port 9100 & co)."
  },
  {
    "path": "/api/promotions",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST promotions"
  },
  {
    "path": "/api/push/internal",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Route interne pour les handlers NexusEventBus (navigateur → serveur push)."
  },
  {
    "path": "/api/push/send",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST push send"
  },
  {
    "path": "/api/push/subscribe",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST push subscribe"
  },
  {
    "path": "/api/reservations/card-imprint",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "POST reservations card-imprint"
  },
  {
    "path": "/api/reservations/deposit",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Acompte privatisation/groupe — res-14"
  },
  {
    "path": "/api/reservations",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Reservations API — res-arch-1 : Architecture biface"
  },
  {
    "path": "/api/reservations",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Reservations API — res-arch-1 : Architecture biface"
  },
  {
    "path": "/api/reservations",
    "method": "PATCH",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Reservations API — res-arch-1 : Architecture biface"
  },
  {
    "path": "/api/resolve-domain",
    "method": "GET",
    "audience": "public",
    "tenantSource": "query",
    "rateLimited": true,
    "summary": "Route interne utilisée par le middleware pour résoudre un domaine custom → slug."
  },
  {
    "path": "/api/share-target",
    "method": "POST",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Endpoint PWA Web Share Target"
  },
  {
    "path": "/api/signup",
    "method": "POST",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Résout un tenantId LIBRE. Un slug déjà pris ne doit JAMAIS être réutilisé :"
  },
  {
    "path": "/api/status/db",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET status db"
  },
  {
    "path": "/api/status/nexus",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET status nexus"
  },
  {
    "path": "/api/status",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET status"
  },
  {
    "path": "/api/tenant/api-keys/[keyId]",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE tenant api-keys [keyId]"
  },
  {
    "path": "/api/tenant/api-keys",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET tenant api-keys"
  },
  {
    "path": "/api/tenant/api-keys",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant api-keys"
  },
  {
    "path": "/api/tenant/api-keys/validate",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant api-keys validate"
  },
  {
    "path": "/api/tenant/compliance/inspection-mode",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "L25 + T30 — Bouton 'Contrôle Fiscal / Sanitaire Inopiné' en 1 clic"
  },
  {
    "path": "/api/tenant/contracts/[contractId]/sign",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant contracts [contractId] sign"
  },
  {
    "path": "/api/tenant/contracts/dispatch",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant contracts dispatch"
  },
  {
    "path": "/api/tenant/contracts",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET tenant contracts"
  },
  {
    "path": "/api/tenant/custom-domain",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/tenant/custom-domain — supprimer le domaine personnalisé"
  },
  {
    "path": "/api/tenant/custom-domain",
    "method": "POST",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/tenant/custom-domain — supprimer le domaine personnalisé"
  },
  {
    "path": "/api/tenant/custom-domain",
    "method": "DELETE",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "DELETE /api/tenant/custom-domain — supprimer le domaine personnalisé"
  },
  {
    "path": "/api/tenant/domain/check",
    "method": "GET",
    "audience": "tenant",
    "minRole": "admin",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET tenant domain check"
  },
  {
    "path": "/api/tenant/franchise/overview",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Synthèse réseau & consolidation multi-restaurants pour l'Admin / Propriétaire connecté."
  },
  {
    "path": "/api/tenant/franchise/transfers",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Gestion et exécution des transferts de stock inter-sites."
  },
  {
    "path": "/api/tenant/franchise/transfers",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Gestion et exécution des transferts de stock inter-sites."
  },
  {
    "path": "/api/tenant/onboarding/auto-morphogenesis",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body: { websiteUrl?: string, businessName?: string, siren?: string, forceVariant?: PlatformVariant }"
  },
  {
    "path": "/api/tenant/onboarding/connector/pull",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body: { provider: ConnectorId, category: ImportCategory, credentials: ConnectorCredentials }"
  },
  {
    "path": "/api/tenant/onboarding/connector/test",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body: { provider: ConnectorId, credentials: ConnectorCredentials }"
  },
  {
    "path": "/api/tenant/onboarding/ocr",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Body: FormData { file: File, category: ImportCategory, context?: string }"
  },
  {
    "path": "/api/tenant/onboarding/rollback",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET tenant onboarding rollback"
  },
  {
    "path": "/api/tenant/onboarding/rollback",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant onboarding rollback"
  },
  {
    "path": "/api/tenant/onboarding/status",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET tenant onboarding status"
  },
  {
    "path": "/api/tenant/onboarding/status",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "POST tenant onboarding status"
  },
  {
    "path": "/api/tenant/rgpd",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Registre RGPD tenant — Art. 30"
  },
  {
    "path": "/api/tenant/rgpd",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Registre RGPD tenant — Art. 30"
  },
  {
    "path": "/api/tenant/support-access",
    "method": "PATCH",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "PATCH /api/tenant/support-access"
  },
  {
    "path": "/api/tenant/support/tickets",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Support Tickets — soumission self-service depuis la plateforme du tenant."
  },
  {
    "path": "/api/tenant/support/tickets",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Support Tickets — soumission self-service depuis la plateforme du tenant."
  },
  {
    "path": "/api/timeclock/verify-pin",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Vérifie le PIN staff côté serveur (PBKDF2-SHA256) avec rate limiting persistant."
  },
  {
    "path": "/api/v1/menu",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "GET v1 menu"
  },
  {
    "path": "/api/v1/openapi.json",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET v1 openapi.json"
  },
  {
    "path": "/api/v1/orders/[id]",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "Statut d'une commande pour le suivi en direct (LiveOrderTracker)."
  },
  {
    "path": "/api/v1/orders/[id]/split-bill",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Enregistre l'intention de partage d'addition émise depuis le smartphone du"
  },
  {
    "path": "/api/v1/orders",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "Deux modes :"
  },
  {
    "path": "/api/v1/orders/service-request",
    "method": "POST",
    "audience": "tenant",
    "minRole": "manager",
    "tenantSource": "header",
    "rateLimited": true,
    "idempotencyRequired": true,
    "summary": "🔔 POST /api/v1/orders/service-request"
  },
  {
    "path": "/api/v1/tables",
    "method": "GET",
    "audience": "tenant",
    "minRole": "employee",
    "tenantSource": "header",
    "rateLimited": true,
    "summary": "🪑 GET /api/v1/tables"
  },
  {
    "path": "/api/webhooks/delivery/[provider]",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "POST webhooks delivery [provider]"
  },
  {
    "path": "/api/webhooks/docuseal",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "🦭 Webhook Récepteur DocuSeal — HMAC-vérifié"
  },
  {
    "path": "/api/webhooks/google-reserve",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "POST webhooks google-reserve"
  },
  {
    "path": "/api/webhooks/sms/inbound",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "📲 Inbound SMS Webhook (Twilio / Webhook Bidirectionnel)"
  },
  {
    "path": "/api/webhooks/stripe",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "Reçoit les events Stripe, valide HMAC et délègue aux handlers spécialisés."
  },
  {
    "path": "/api/webhooks/thefork",
    "method": "POST",
    "audience": "webhook",
    "tenantSource": "signature",
    "rateLimited": true,
    "summary": "POST webhooks thefork"
  },
  {
    "path": "/api/widget/availability",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "Generate time slots for a day: 12:00–14:30 and 19:00–22:30 every 30 min"
  },
  {
    "path": "/api/widget/book",
    "method": "POST",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "POST widget book"
  },
  {
    "path": "/api/widget/setup-intent",
    "method": "GET",
    "audience": "public",
    "tenantSource": "none",
    "rateLimited": true,
    "summary": "GET widget setup-intent"
  }
];

/**
 * Utilitaires de validation et consultation du contrat d'API
 */
export function getRouteContract(path: string, method: string): ApiRouteContract | undefined {
  return API_MANIFEST.find(
    (r) => r.path === path && r.method.toUpperCase() === method.toUpperCase(),
  );
}

export function listRoutesByAudience(audience: RouteAudience): ApiRouteContract[] {
  return API_MANIFEST.filter((r) => r.audience === audience);
}

export function validateApiRouteManifest(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const routeSet = new Set<string>();

  for (const route of API_MANIFEST) {
    const key = `${route.method} ${route.path}`;
    if (routeSet.has(key)) {
      errors.push(`Route dupliquée dans le manifeste : ${key}`);
    }
    routeSet.add(key);

    if (route.audience === 'tenant' && route.tenantSource === 'none') {
      errors.push(`Route tenant sans source tenant spécifiée : ${key}`);
    }

    if (route.audience === 'mcc' && !route.minRole) {
      errors.push(`Route MCC sans rôle minimum déclaré : ${key}`);
    }

    if (route.idempotencyRequired && route.method === 'GET') {
      errors.push(`Route GET avec exigence d idempotence invalide : ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
