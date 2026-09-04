import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

// Transport d'alertes plate-forme (ops/oncall) — pas de Nexus, pas de tenant.
// Cible : Slack / Discord / webhook générique JSON.
// Config env :
//   OPS_ALERT_WEBHOOK_URL   — URL du webhook (obligatoire pour envoyer)
//   OPS_ALERT_WEBHOOK_KIND  — 'slack' | 'discord' | 'generic' (défaut: auto-détect)
//   OPS_ALERT_MIN_SEVERITY  — 'info' | 'warning' | 'critical' (défaut: 'warning')

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface OpsAlert {
    title: string;
    message: string;
    severity: AlertSeverity;
    source: string; // ex: 'dlq-quarantine', 'sovereign-breach'
    context?: Record<string, unknown>;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
    info: 0,
    warning: 1,
    critical: 2,
};

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
};

function detectKind(url: string, override?: string): 'slack' | 'discord' | 'generic' {
    if (override === 'slack' || override === 'discord' || override === 'generic') return override;
    if (url.includes('hooks.slack.com')) return 'slack';
    if (url.includes('discord.com/api/webhooks') || url.includes('discordapp.com')) return 'discord';
    return 'generic';
}

function buildBody(kind: 'slack' | 'discord' | 'generic', alert: OpsAlert): string {
    const emoji = SEVERITY_EMOJI[alert.severity];
    const header = `${emoji} *[${alert.severity.toUpperCase()}] ${alert.title}*`;
    const contextBlock = alert.context
        ? '\n```' + JSON.stringify(alert.context, null, 2).slice(0, 1800) + '```'
        : '';

    if (kind === 'slack') {
        return JSON.stringify({
            text: `${header}\nsource: \`${alert.source}\`\n${alert.message}${contextBlock}`,
        });
    }
    if (kind === 'discord') {
        return JSON.stringify({
            content: `${header}\nsource: \`${alert.source}\`\n${alert.message}${contextBlock}`,
        });
    }
    // Generic JSON — pour n'importe quel consommateur maison / PagerDuty adaptateur
    return JSON.stringify({
        title: alert.title,
        severity: alert.severity,
        source: alert.source,
        message: alert.message,
        context: alert.context ?? {},
        timestamp: new Date().toISOString(),
    });
}

export class OpsAlertGateway {
    /**
     * Envoie une alerte vers le canal ops configuré.
     * Retourne true si envoyé, false si dropped (pas de webhook / severity insuffisante / erreur).
     * Ne throw JAMAIS : une alerte cassée ne doit pas casser le handler qui l'émet.
     */
    static async send(alert: OpsAlert): Promise<boolean> {
        const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL;
        if (!webhookUrl) {
            logger.warn(
                `[OpsAlertGateway] Aucun OPS_ALERT_WEBHOOK_URL configuré — alerte "${alert.title}" non transmise (mode dégradé)`,
            );
            return false;
        }

        const minSeverity = (process.env.OPS_ALERT_MIN_SEVERITY as AlertSeverity) || 'warning';
        if (SEVERITY_RANK[alert.severity] < SEVERITY_RANK[minSeverity]) {
            return false;
        }

        const kind = detectKind(webhookUrl, process.env.OPS_ALERT_WEBHOOK_KIND);
        const body = buildBody(kind, alert);

        try {
            const res = await fetchWithTimeout(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            }, 8_000);
            if (!res.ok) {
                logger.error(
                    `[OpsAlertGateway] Webhook HTTP ${res.status} pour alerte "${alert.title}"`,
                );
                return false;
            }
            return true;
        } catch (error) {
            logger.error(
                `[OpsAlertGateway] Échec envoi alerte "${alert.title}"`,
                toError(error).message,
            );
            return false;
        }
    }
}
