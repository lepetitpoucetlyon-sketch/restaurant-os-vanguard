/**
 * 🛡️ ActionParameterValidator
 * Valide et assainit les paramètres de function calling par vertical / action.
 */

export interface ParamValidationResult {
    valid: boolean;
    sanitizedParams: Record<string, unknown>;
    error?: string;
}

type ToolParamValidator = (params: Record<string, unknown>) => ParamValidationResult | null;

const toolValidators: Record<string, ToolParamValidator> = {
    fire_course_sequence: (params) => {
        const tableId = String(params.tableId || '').trim();
        if (!tableId || tableId === 'undefined' || tableId === 'null') {
            return { valid: false, sanitizedParams: params, error: 'Numéro de table invalide ou manquant.' };
        }
        params.tableId = tableId;
        return null;
    },

    schedule_baking_batch: (params) => {
        const qty = Number(params.quantity);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            return { valid: false, sanitizedParams: params, error: 'La quantité à enfourner doit être un entier strictement positif (> 0).' };
        }
        params.quantity = Math.floor(qty);
        return null;
    },

    publish_tgtg_basket: (params) => {
        const qty = Number(params.quantity);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            return { valid: false, sanitizedParams: params, error: 'Le nombre de paniers TooGoodToGo doit être un entier strictement positif (> 0).' };
        }
        if (params.priceCents !== undefined) {
            const price = Number(params.priceCents);
            if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
                return { valid: false, sanitizedParams: params, error: 'Le prix du panier en centimes doit être un entier positif ou nul (>= 0).' };
            }
            params.priceCents = Math.floor(price);
        }
        params.quantity = Math.floor(qty);
        return null;
    },

    track_waste_bsdd: (params) => {
        const vol = Number(params.volume);
        if (!Number.isFinite(vol) || vol <= 0) {
            return { valid: false, sanitizedParams: params, error: 'Le volume de déchets dangereux doit être un nombre strictement positif (> 0).' };
        }
        params.volume = vol;
        return null;
    },

    trigger_stock_reorder: (params) => {
        const qty = Number(params.quantity);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            return { valid: false, sanitizedParams: params, error: 'La quantité de réassort doit être un entier strictement positif (> 0).' };
        }
        params.quantity = Math.floor(qty);
        return null;
    },

    trigger_boutique_restock: (params) => {
        const qty = Number(params.quantity);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            return { valid: false, sanitizedParams: params, error: 'La quantité de réassort doit être un entier strictement positif (> 0).' };
        }
        params.quantity = Math.floor(qty);
        return null;
    },

    create_maintenance_ticket: (params) => {
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        const severity = String(params.severity || 'medium').toLowerCase();
        params.severity = validSeverities.includes(severity) ? severity : 'medium';
        return null;
    },
};

export class ActionParameterValidator {
    static sanitizeAndValidate(
        toolId: string,
        rawParams: Record<string, unknown>
    ): ParamValidationResult {
        const sanitized: Record<string, unknown> = {};

        // 1. Assainissement anti-XSS
        for (const [key, value] of Object.entries(rawParams)) {
            if (typeof value === 'string') {
                sanitized[key] = value.replace(/<[^>]*>?/gm, '').trim();
            } else {
                sanitized[key] = value;
            }
        }

        // 2. Règle spécifique par outil
        const validator = toolValidators[toolId];
        if (validator) {
            const result = validator(sanitized);
            if (result) return result;
        }

        return { valid: true, sanitizedParams: sanitized };
    }
}
