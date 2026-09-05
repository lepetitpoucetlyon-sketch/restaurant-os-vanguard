import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export type ExternalErrorCategory =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'UNKNOWN';

export class ExternalIntegrationError extends Error {
  constructor(
    public readonly provider: string,
    public readonly operation: string,
    public readonly category: ExternalErrorCategory,
    public readonly statusCode?: number,
    message?: string,
    public readonly originalError?: unknown,
  ) {
    super(`[${provider}:${operation}] ${category}${statusCode ? ` (${statusCode})` : ''}: ${message ?? ''}`);
    this.name = 'ExternalIntegrationError';
  }
}

export interface ExternalRequestOptions {
  providerName: string;
  operationName: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxRetries?: number;
  isMutation?: boolean;
  idempotencyKey?: string;
  fetcher?: typeof fetch;
}

/**
 * 🛡️ IntegrationPolicy (Phase 5 Audit Remediation)
 *
 * Politique unifiée pour tous les appels tiers (Open Banking, Pennylane, Stripe, Gmail, e-Invoicing) :
 *  - Timeout borné strict (défaut: 8000ms)
 *  - Classification d'erreur standardisée
 *  - Rédaction des secrets / tokens d'authentification
 *  - Règle Zéro-Retry sur les mutations sans clé d'idempotence vérifiée
 */
export class IntegrationPolicy {
  private static readonly DEFAULT_TIMEOUT_MS = 8000;

  static sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    const sanitized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (/auth|key|secret|token/i.test(k)) {
        sanitized[k] = v.length > 8 ? `${v.slice(0, 4)}...[REDACTED]` : '[REDACTED]';
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  static async execute<T>(options: ExternalRequestOptions): Promise<T> {
    const {
      providerName,
      operationName,
      url,
      method = 'GET',
      headers = {},
      body,
      timeoutMs = this.DEFAULT_TIMEOUT_MS,
      maxRetries = 0,
      isMutation = method !== 'GET',
      idempotencyKey,
      fetcher = globalThis.fetch,
    } = options;

    // Règle d'inviolabilité financière : interdiction de rejouer une mutation sans clé d'idempotence
    if (isMutation && maxRetries > 0 && !idempotencyKey) {
      throw new Error(
        `[IntegrationPolicy] Invariant violé : Tentative de retry sur mutation externe (${providerName}:${operationName}) sans clé d idempotence fournisseur.`,
      );
    }

    const effectiveHeaders = { ...headers };
    if (idempotencyKey && isMutation) {
      effectiveHeaders['Idempotency-Key'] = idempotencyKey;
    }

    let attempts = 0;
    const totalAllowedAttempts = Math.max(1, 1 + maxRetries);

    while (attempts < totalAllowedAttempts) {
      attempts++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetcher(url, {
          method,
          headers: effectiveHeaders,
          body,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const status = response.status;
          let category: ExternalErrorCategory = 'UNKNOWN';

          if (status === 401 || status === 403) category = 'AUTH_ERROR';
          else if (status === 429) category = 'RATE_LIMIT';
          else if (status >= 400 && status < 500) category = 'CLIENT_ERROR';
          else if (status >= 500) category = 'SERVER_ERROR';

          // Les erreurs 4xx (hors 429) ne doivent jamais être réessayées
          if (category === 'CLIENT_ERROR' || category === 'AUTH_ERROR') {
            throw new ExternalIntegrationError(
              providerName,
              operationName,
              category,
              status,
              `Réponse HTTP ${status}`,
            );
          }

          // Si on peut réessayer (5xx ou 429) et qu'il reste des tentatives
          if (attempts < totalAllowedAttempts) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }

          throw new ExternalIntegrationError(
            providerName,
            operationName,
            category,
            status,
            `Échec final HTTP ${status}`,
          );
        }

        const data = (await response.json()) as T;
        return data;
      } catch (error) {
        clearTimeout(timer);

        if (error instanceof ExternalIntegrationError) {
          throw error;
        }

        const err = toError(error);
        const isTimeout = err.name === 'AbortError' || err.message.includes('timeout') || controller.signal.aborted;
        const category: ExternalErrorCategory = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';

        if (attempts < totalAllowedAttempts) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        logger.error(`[IntegrationPolicy] Erreur ${providerName}:${operationName}`, {
          category,
          message: err.message,
          sanitizedHeaders: this.sanitizeHeaders(headers),
        });

        throw new ExternalIntegrationError(
          providerName,
          operationName,
          category,
          undefined,
          err.message,
          error,
        );
      }
    }

    throw new ExternalIntegrationError(providerName, operationName, 'UNKNOWN', undefined, 'Max retries exceeded');
  }
}
