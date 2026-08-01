/**
 * browserPush — wrapper client-safe pour les notifications push.
 * Les handlers NexusEventBus tournent dans le navigateur et ne peuvent pas
 * importer web-push (Node.js uniquement). Ce module délègue à la route
 * /api/push/internal, authentifiée par cookie de session.
 *
 * Usage : await browserPush.sendToRole(tenantId, 'manager', { title, body })
 */

interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

async function send(params: {
    tenantId: string;
    role?: string;
    userId?: string;
    payload: PushPayload;
}): Promise<void> {
    try {
        await fetch('/api/push/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',   // envoie le cookie de session
            body: JSON.stringify({
                tenantId: params.tenantId,
                role:     params.role,
                userId:   params.userId,
                title:    params.payload.title,
                body:     params.payload.body,
                url:      params.payload.url,
            }),
        });
    } catch {
        // Push non-critique — ne pas faire planter le handler
    }
}

export const browserPush = {
    sendToRole(tenantId: string, role: string, payload: PushPayload): Promise<void> {
        return send({ tenantId, role, payload });
    },
    sendToUser(tenantId: string, userId: string, payload: PushPayload): Promise<void> {
        return send({ tenantId, userId, payload });
    },
};
