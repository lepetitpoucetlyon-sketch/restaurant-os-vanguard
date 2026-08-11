import { SovereignError, PillarId, CoreErrorCode } from './errors.types';

/**
 * 🏛️ Error Translation Protocol
 * Converts raw technical exceptions into structed SovereignErrors.
 */
export function translateError(error: unknown, pillar: PillarId = 'CORE'): SovereignError {
    const baseError: SovereignError = {
        code: CoreErrorCode.INTERNAL_CRASH,
        pillar,
        message: error instanceof Error ? error.message : 'An unknown Imperial error occurred',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
    };

    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        baseError.code = 'NOT_FOUND_ERR'; // Generic for now, but following the pillar prefix
    }

    return baseError;
}
