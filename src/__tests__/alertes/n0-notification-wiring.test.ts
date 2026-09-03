import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Lot N0 — régressions de câblage du système de notifications.
 *
 * Ces tests couvrent exactement ce que la suite d'Antigravity ne vérifiait pas :
 * non pas l'ÉMISSION d'un événement, mais la LIVRAISON réelle —
 *  - N0-3 : les rôles sont normalisés au dispatch (sinon sendToRole ne résout personne) ;
 *  - N0-5 : deux notifications de même sujet fusionnent (occurrences++), pas de doublon.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const sendToRole = vi.fn().mockResolvedValue(undefined);
const sendToUser = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/push/browserPush', () => ({
  browserPush: {
    sendToRole: (...args: unknown[]) => sendToRole(...args),
    sendToUser: (...args: unknown[]) => sendToUser(...args),
  },
}));

// Adapter Nexus en mémoire pour observer la déduplication.
const store = new Map<string, Record<string, unknown>>();
vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(async (path: string) => store.get(path) ?? null),
      set: vi.fn(async (path: string, data: Record<string, unknown>) => { store.set(path, { ...data }); }),
      update: vi.fn(async (path: string, patch: Record<string, unknown>) => {
        store.set(path, { ...(store.get(path) ?? {}), ...patch });
      }),
    },
  },
}));

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';
import { registerNotificationUrgentDispatchHandler } from '@/shared/eventBus/handlers/NotificationUrgentDispatchHandler';
import { registerNotificationCreatedHandler } from '@/shared/eventBus/handlers/NotificationCreatedHandler';
import { registerFlexibilityNotificationHandler } from '@/shared/eventBus/handlers/FlexibilityNotificationHandler';

describe('Lot N0 — câblage notifications (livraison, pas seulement émission)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('N0-3 : les rôles non canoniques sont normalisés avant dispatch (ADMIN, kitchen_chef → admin, chef_cuisinier)', async () => {
    registerNotificationUrgentDispatchHandler();

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: ['ADMIN', 'kitchen_chef', 'manager'],
      message: 'Chambre froide +8°C',
      priority: 'CRITICAL',
    });

    const dispatched = sendToRole.mock.calls.map((c) => c[1]);
    expect(dispatched).toContain('admin');
    expect(dispatched).toContain('chef_cuisinier'); // 'kitchen_chef' résolu → alerte atteint le chef
    expect(dispatched).toContain('manager');
    // Aucun rôle non canonique ne fuit vers WebPushService.
    expect(dispatched).not.toContain('ADMIN');
    expect(dispatched).not.toContain('kitchen_chef');
  });

  it('N0-3 : un tableau de rôles entièrement non résolus ne dispatche rien (au lieu d\'envoyer à personne en silence)', async () => {
    registerNotificationUrgentDispatchHandler();

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: ['role_bidon_inexistant'],
      message: 'test',
      priority: 'HIGH',
    });

    expect(sendToRole).not.toHaveBeenCalled();
  });

  it('N2-a : une alerte HAUTE est différée quand le mode silencieux est actif (pas de push)', async () => {
    registerNotificationUrgentDispatchHandler();
    store.set('tenants/t1/settings/global', { notifications: { doNotDisturb: true } });

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: ['manager'],
      message: 'Rapport prêt',
      priority: 'HIGH',
    });

    expect(sendToRole).not.toHaveBeenCalled(); // différée — reste au centre, pas de push
  });

  it('N2-a : une alerte CRITIQUE traverse le mode silencieux', async () => {
    registerNotificationUrgentDispatchHandler();
    store.set('tenants/t1/settings/global', { notifications: { doNotDisturb: true } });

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: ['manager'],
      message: 'Chambre froide +8°C',
      priority: 'CRITICAL',
    });

    expect(sendToRole).toHaveBeenCalled(); // critique : jamais bâillonnée
  });

  it('N2-b : une alerte ciblant une responsabilité résout les rôles (RESP_HYGIENE → chef_cuisinier)', async () => {
    registerNotificationUrgentDispatchHandler();
    // pas de table de routage configurée → défauts de la responsabilité

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: [],
      responsibility: 'RESP_HYGIENE',
      message: 'Chambre froide +8°C',
      priority: 'CRITICAL',
    });

    const dispatchedRoles = sendToRole.mock.calls.map((c) => c[1]);
    expect(dispatchedRoles).toContain('chef_cuisinier'); // le chef reçoit l'alerte hygiène
    expect(dispatchedRoles).toContain('manager');
  });

  it('N2-b : les destinataires nommés de la table de routage reçoivent un push ciblé', async () => {
    registerNotificationUrgentDispatchHandler();
    store.set('tenants/t1/settings/global', {
      notificationRoutings: [
        { responsibility: 'RESP_FISCAL', recipients: ['u_claire'], enabled: true },
      ],
    });

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: 't1',
      roles: [],
      responsibility: 'RESP_FISCAL',
      message: 'Écart de caisse',
      priority: 'CRITICAL',
    });

    const targetedUsers = sendToUser.mock.calls.map((c) => c[1]);
    expect(targetedUsers).toContain('u_claire');
  });

  it('N3 : une alerte de flexibilité est actionnable — la notification persistée porte un lien de traitement', async () => {
    registerFlexibilityNotificationHandler();
    registerNotificationCreatedHandler();

    await NexusEventBus.emit('stock.negative_alert', {
      v: 1,
      tenantId: 't1',
      itemId: 'sku_42',
      itemName: 'Cèpes séchés',
      deficit: 3,
      currentQuantity: -3,
    });

    const doc = store.get('tenants/t1/notifications/notif_neg_stock_sku_42');
    expect(doc).toBeDefined();
    expect((doc?.action as { href?: string } | undefined)?.href).toBe('/inventory');
    expect((doc?.action as { label?: string } | undefined)?.label).toBe('Voir le stock');
  });

  it('N0-5 : deux notifications de même sujet fusionnent (une ligne, occurrences=2)', async () => {
    registerNotificationCreatedHandler();

    const base = {
      v: 1 as const,
      tenantId: 't1',
      id: 'notif_neg_stock_sku_42',
      type: 'alert' as const,
      title: 'Alerte Rupture de Stock',
      message: 'Stock négatif',
      priority: 'high' as const,
      read: false,
      timestamp: '2026-09-03T10:00:00.000Z',
    };

    await NexusEventBus.emit('notification.created', base);
    await NexusEventBus.emit('notification.created', { ...base, timestamp: '2026-09-03T12:00:00.000Z' });

    const notifKeys = [...store.keys()].filter((k) => k.includes('/notifications/'));
    expect(notifKeys).toHaveLength(1); // une seule ligne, pas deux

    const doc = store.get('tenants/t1/notifications/notif_neg_stock_sku_42');
    expect(doc?.occurrences).toBe(2);
    expect(doc?.read).toBe(false); // la condition toujours vraie refait surface
    expect(doc?.lastSeenAt).toBe('2026-09-03T12:00:00.000Z');
    expect(doc?.firstSeenAt).toBe('2026-09-03T10:00:00.000Z');
  });
});
