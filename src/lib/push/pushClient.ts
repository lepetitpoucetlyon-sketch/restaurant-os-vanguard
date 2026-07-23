// Client-safe push helper — delegates to /api/push/send (web-push is server-only)
type PushPayload = { title: string; body: string; url?: string };

function sendPush(data: Record<string, unknown>): void {
  fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function pushToUser(userId: string, payload: PushPayload): void {
  sendPush({ userId, ...payload });
}

export function pushToRole(role: string, payload: PushPayload): void {
  sendPush({ role, ...payload });
}
