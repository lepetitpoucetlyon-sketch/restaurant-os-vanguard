/**
 * AutomationRule — schéma d'une automatisation créée par le gérant.
 *
 * Modèle simple WHEN / IF / THEN :
 *   - WHEN : événement bus qui déclenche (ex: 'order.paid')
 *   - IF   : conditions optionnelles sur le payload (opérateurs simples)
 *   - THEN : 1..N actions (notification interne, email, webhook)
 *
 * Le gérant compose la règle depuis AutomationBuilder. Le AutomationRunner
 * écoute tous les événements référencés, évalue les conditions et exécute
 * les actions. Aucun code n'est écrit par le gérant — c'est de la
 * configuration typée validée par Zod.
 */
import { z } from 'zod';

export const AutomationTriggerSchema = z.object({
    event: z.string().min(1).describe("Nom d'événement du bus (ex: 'order.paid', 'reservation.matched')"),
});

export const AutomationConditionSchema = z.object({
    field: z.string().min(1).describe("Chemin dans le payload (ex: 'totalInMicrounits', 'covers')"),
    op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'includes']),
    value: z.union([z.string(), z.number(), z.boolean()]),
});

export const AutomationActionSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('notify'),
        title: z.string().min(1).max(120),
        message: z.string().min(1).max(500).describe("Support des tokens {{payload.field}}"),
        role: z.enum(['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse']).optional().describe("Rôle destinataire (omis = tenant broadcast)"),
        priority: z.enum(['low', 'normal', 'high']).default('normal'),
    }),
    z.object({
        type: z.literal('email'),
        to: z.string().email().describe("Destinataire (peut être un token {{payload.customerEmail}})"),
        subject: z.string().min(1).max(200),
        body: z.string().min(1),
    }),
    z.object({
        type: z.literal('webhook'),
        url: z.string().url().describe("Endpoint HTTPS externe"),
        method: z.enum(['POST', 'PUT']).default('POST'),
        secret: z.string().optional().describe("HMAC signature header X-Signature"),
    }),
]);

export const AutomationRuleSchema = z.object({
    id: z.string().min(1),
    tenantId: z.string().min(1),
    name: z.string().min(1).max(120).describe("Nom lisible par le gérant"),
    description: z.string().max(500).optional(),
    enabled: z.boolean().default(true),
    trigger: AutomationTriggerSchema,
    conditions: z.array(AutomationConditionSchema).default([]),
    actions: z.array(AutomationActionSchema).min(1).max(5),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string().describe("userId"),
    executionCount: z.number().int().min(0).default(0),
    lastExecutedAt: z.string().datetime().optional(),
    lastError: z.string().optional(),
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type AutomationTrigger = z.infer<typeof AutomationTriggerSchema>;
export type AutomationCondition = z.infer<typeof AutomationConditionSchema>;
export type AutomationAction = z.infer<typeof AutomationActionSchema>;

/**
 * Évalue une condition sur un payload dot-path (field='totalInMicrounits' →
 * payload.totalInMicrounits). Renvoie true si passe, false sinon.
 */
export function evaluateCondition(cond: AutomationCondition, payload: Record<string, unknown>): boolean {
    const parts = cond.field.split('.');
    let v: unknown = payload;
    for (const p of parts) {
        if (v && typeof v === 'object' && p in v) v = (v as Record<string, unknown>)[p];
        else return false;
    }
    switch (cond.op) {
        case 'eq': return v === cond.value;
        case 'neq': return v !== cond.value;
        case 'gt': return typeof v === 'number' && typeof cond.value === 'number' && v > cond.value;
        case 'gte': return typeof v === 'number' && typeof cond.value === 'number' && v >= cond.value;
        case 'lt': return typeof v === 'number' && typeof cond.value === 'number' && v < cond.value;
        case 'lte': return typeof v === 'number' && typeof cond.value === 'number' && v <= cond.value;
        case 'includes': return typeof v === 'string' && typeof cond.value === 'string' && v.includes(cond.value);
    }
}

/**
 * Résout les tokens {{payload.field}} dans une string.
 */
export function resolveTokens(template: string, payload: Record<string, unknown>): string {
    return template.replace(/\{\{\s*payload\.([^\s}]+)\s*\}\}/g, (_, field) => {
        const parts = String(field).split('.');
        let v: unknown = payload;
        for (const p of parts) {
            if (v && typeof v === 'object' && p in v) v = (v as Record<string, unknown>)[p];
            else return '';
        }
        return String(v ?? '');
    });
}

/**
 * Liste des événements bus autorisés comme triggers d'automatisation
 * (whitelist stricte — pas d'événements internes système).
 */
export const AUTOMATION_TRIGGER_WHITELIST: ReadonlyArray<{ event: string; label: string; example: string }> = [
    { event: 'order.paid',            label: 'Commande encaissée',    example: 'Alerter si totalInMicrounits > 100000000 (100€)' },
    { event: 'order.cancelled',       label: 'Commande annulée',      example: 'Envoyer email au gérant si reason includes "erreur"' },
    { event: 'order.comp',            label: 'Commande offerte',      example: 'Log si totalValueInMicrounits > 20000000 (20€)' },
    { event: 'reservation.confirmed', label: 'Réservation confirmée', example: 'Notifier la cuisine si covers >= 8' },
    { event: 'reservation.matched',   label: 'Client arrivé',         example: 'Notifier le sommelier si tableId = "tbl_carte"' },
    { event: 'table.released',        label: 'Table libérée',         example: 'Notifier hôtesse si liste attente > 0' },
    { event: 'dlc.expired',           label: 'DLC produit expirée',   example: 'Email au chef si productId includes "poisson"' },
    { event: 'hr.overtime_alert',     label: 'Heures supplémentaires', example: 'Notifier RH si extraMinutes > 60' },
    { event: 'stock.received',        label: 'Livraison reçue',       example: 'Webhook comptable sur chaque réception' },
];
