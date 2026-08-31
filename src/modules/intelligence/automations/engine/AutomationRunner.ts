/**
 * AutomationRunner — moteur d'exécution des règles gérant.
 *
 * Comportement :
 *  1. À chaque événement whitelisté (AUTOMATION_TRIGGER_WHITELIST), lit les
 *     règles actives pour le tenant, évalue les conditions, exécute les
 *     actions matching.
 *  2. Actions supportées : notify (bus), email (via /api/email/generic),
 *     webhook (POST/PUT avec HMAC optionnel).
 *  3. Incrémente executionCount + met à jour lastExecutedAt sur chaque
 *     règle déclenchée. Log erreur dans lastError si action échoue.
 *
 * Isolation stricte : lit uniquement `tenants/{tenantId}/automations` de
 * l'événement source. Aucune fuite cross-tenant.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { SharedKernel } from '@/lib/shared-kernel';
import {
    type AutomationRule,
    type AutomationAction,
    AUTOMATION_TRIGGER_WHITELIST,
    evaluateCondition,
    resolveTokens,
} from '../domain/AutomationRule';

const AUTOMATION_COLLECTION = 'automations';

async function getRulesForEvent(tenantId: string, eventName: string): Promise<AutomationRule[]> {
    try {
        const all = await Nexus.adapter.query<AutomationRule>(
            `tenants/${tenantId}/${AUTOMATION_COLLECTION}`,
            { where: [{ field: 'enabled', operator: '==', value: true }] }
        );
        return all.filter(r => r.trigger?.event === eventName);
    } catch (err) {
        logger.warn(`[AutomationRunner] lecture règles tenant=${tenantId} échouée`, { err });
        return [];
    }
}

async function executeAction(action: AutomationAction, tenantId: string, payload: Record<string, unknown>): Promise<void> {
    switch (action.type) {
        case 'notify': {
            const title = resolveTokens(action.title, payload);
            const message = resolveTokens(action.message, payload);
            await NexusEventBus.emit('notification.created', {
                v: 1,
                tenantId,
                id: SharedKernel.generateId('auto_notif'),
                type: 'info',
                title,
                message,
                priority: action.priority,
                read: false,
                timestamp: new Date().toISOString(),
                targetRole: action.role,
            } as never);
            return;
        }
        case 'email': {
            const to = resolveTokens(action.to, payload);
            const subject = resolveTokens(action.subject, payload);
            const body = resolveTokens(action.body, payload);
            if (!to.includes('@')) return; // résolution vide → skip silencieux
            // Le POST /api/email/generic est protégé côté serveur (adminAuthGuard),
            // les automatisations tournent server-side (via crons/handlers) donc
            // l'appel se fait depuis un contexte déjà authentifié.
            try {
                await fetch('/api/email/generic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, subject, body, tenantId }),
                });
            } catch (err) {
                logger.warn('[AutomationRunner] email envoi échoué', { err });
            }
            return;
        }
        case 'webhook': {
            const body = JSON.stringify({ event: 'automation', tenantId, payload });
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (action.secret) {
                // HMAC-SHA256 signature pour vérification côté récepteur
                try {
                    const enc = new TextEncoder();
                    const key = await crypto.subtle.importKey(
                        'raw', enc.encode(action.secret),
                        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                    );
                    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
                    headers['X-Signature'] = Array.from(new Uint8Array(sig))
                        .map(b => b.toString(16).padStart(2, '0')).join('');
                } catch { /* runtime crypto absent → skip signature */ }
            }
            try {
                await fetch(action.url, { method: action.method, headers, body });
            } catch (err) {
                logger.warn('[AutomationRunner] webhook échoué', { err, url: action.url });
            }
            return;
        }
    }
}

async function handleTrigger(eventName: string, payload: Record<string, unknown>): Promise<void> {
    const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId : null;
    if (!tenantId) return;

    const rules = await getRulesForEvent(tenantId, eventName);
    for (const rule of rules) {
        const passes = rule.conditions.every(c => evaluateCondition(c, payload));
        if (!passes) continue;

        let ranSuccessfully = true;
        for (const action of rule.actions) {
            try {
                await executeAction(action, tenantId, payload);
            } catch (err) {
                ranSuccessfully = false;
                logger.error(`[AutomationRunner] action ${action.type} échouée pour règle ${rule.id}`, { err });
                try {
                    await Nexus.adapter.update(`tenants/${tenantId}/${AUTOMATION_COLLECTION}/${rule.id}`, {
                        lastError: err instanceof Error ? err.message : 'unknown',
                        lastExecutedAt: new Date().toISOString(),
                    });
                } catch { /* silencieux — l'important est d'avoir tenté */ }
                break;
            }
        }
        if (ranSuccessfully) {
            try {
                await Nexus.adapter.update(`tenants/${tenantId}/${AUTOMATION_COLLECTION}/${rule.id}`, {
                    executionCount: (rule.executionCount ?? 0) + 1,
                    lastExecutedAt: new Date().toISOString(),
                    lastError: undefined,
                });
            } catch { /* idem */ }
        }
    }
}

/**
 * Enregistre les listeners sur les événements whitelistés. À appeler une fois
 * au bootstrap serveur (via registerHandlers/automations.ts).
 */
export function registerAutomationRunner(): Array<() => void> {
    const unsubscribes: Array<() => void> = [];
    for (const trigger of AUTOMATION_TRIGGER_WHITELIST) {
        const unsub = NexusEventBus.on(
            trigger.event as never,
            (payload: unknown) => handleTrigger(trigger.event, payload as Record<string, unknown>),
            { id: `automation-runner-${trigger.event}`, priority: 'BACKGROUND' }
        );
        unsubscribes.push(unsub);
    }
    logger.info(`[AutomationRunner] ${AUTOMATION_TRIGGER_WHITELIST.length} triggers listeners activés`);
    return unsubscribes;
}
