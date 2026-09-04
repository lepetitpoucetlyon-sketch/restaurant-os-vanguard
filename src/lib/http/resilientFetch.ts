/**
 * fetchWithTimeout — `fetch` avec timeout dur (audit S10 : résilience des appels externes).
 *
 * Sans timeout, un `fetch` vers un service externe lent/indisponible peut bloquer
 * très longtemps (aucun timeout par défaut côté Node). `AbortSignal.timeout(ms)`
 * annule automatiquement la requête → « échouer vite » plutôt que pendre un thread.
 *
 * Respecte un `signal` déjà fourni par l'appelant (on ne l'écrase pas).
 */
export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 10_000,
): Promise<Response> {
    const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
    return fetch(input, { ...init, signal });
}
