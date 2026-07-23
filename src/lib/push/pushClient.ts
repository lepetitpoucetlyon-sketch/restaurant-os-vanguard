type PushPayload = { title: string; body: string; url?: string };

function sendPush(data: Record<string, unknown>): void {
  fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function pushToUser(tenantId: string, userId: string, payload: PushPayload): void {
  sendPush({ tenantId, userId, ...payload });
}

export function pushToRole(tenantId: string, role: string, payload: PushPayload): void {
  sendPush({ tenantId, role, ...payload });
}
