/**
 * 🛡️ Isolation multi-tenant — barrières structurelles
 *
 * Verrouille deux défauts corrigés le 2026-08-09 :
 *
 *  1. `Nexus.tenantOverride` était écrit depuis une route API. Le singleton `Nexus`
 *     étant partagé par toutes les requêtes concurrentes d'un process Node, deux
 *     tenants en parallèle s'écrasaient mutuellement l'ancrage — une restauration
 *     pouvait écrire dans les données d'un autre client.
 *
 *  2. `ImportSnapshotService.restore()` ne vérifiait pas la propriété du snapshot :
 *     connaître un identifiant suffisait à recopier les données d'un autre tenant.
 *
 * Si un test d'ici échoue, l'isolation entre clients est compromise.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ImportSnapshotService } from '@/modules/commerce/acquisition/onboarding/migration/ImportSnapshotService';

describe('🛡️ Isolation multi-tenant', () => {
  // ── Barrière 1 : tenantOverride interdit côté serveur ───────────────────────

  describe('Nexus.tenantOverride', () => {
    const realWindow = globalThis.window;

    afterEach(() => {
      if (realWindow === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
      } else {
        (globalThis as { window?: unknown }).window = realWindow;
      }
    });

    it('LÈVE côté serveur — le singleton est partagé entre requêtes concurrentes', () => {
      Reflect.deleteProperty(globalThis, 'window');

      expect(() => {
        Nexus.tenantOverride = 'tenant-a';
      }).toThrow(/interdit côté serveur/i);
    });

    it("mentionne l'alternative (NexusContext.vassalId) dans le message", () => {
      Reflect.deleteProperty(globalThis, 'window');

      expect(() => {
        Nexus.tenantOverride = 'tenant-a';
      }).toThrow(/vassalId/);
    });

    it('reste autorisé côté navigateur (un seul tenant par session)', () => {
      (globalThis as { window?: unknown }).window = {};

      expect(() => {
        Nexus.tenantOverride = 'tenant-a';
      }).not.toThrow();
      expect(Nexus.activeTenant).toBe('tenant-a');
    });
  });

  // ── Barrière 2 : propriété des snapshots ───────────────────────────────────

  describe('ImportSnapshotService — propriété du snapshot', () => {
    const OWNER = 'tenant-proprietaire';
    const INTRUDER = 'tenant-intrus';

    const snapshotOfOwner = {
      id: 'snap_menu_1',
      category: 'menu',
      tenantId: OWNER,
      createdAt: 1_700_000_000_000,
      collections: ['products'],
      docs: { 'products/p1': { id: 'p1', name: 'Secret commercial' } },
    };

    let get: ReturnType<typeof vi.fn>;
    let del: ReturnType<typeof vi.fn>;
    let batchCommit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      get = vi.fn().mockResolvedValue(snapshotOfOwner);
      del = vi.fn().mockResolvedValue(undefined);
      batchCommit = vi.fn().mockResolvedValue(undefined);

      Nexus.adapter = {
        get,
        delete: del,
        query: vi.fn().mockResolvedValue([]),
        set: vi.fn().mockResolvedValue(undefined),
        batch: vi.fn(() => ({ set: vi.fn(), delete: vi.fn(), commit: batchCommit })),
      } as unknown as typeof Nexus.adapter;
    });

    it("REFUSE de restaurer le snapshot d'un autre tenant", async () => {
      await expect(
        ImportSnapshotService.restore('snap_menu_1', INTRUDER)
      ).rejects.toThrow(/appartient à un autre tenant/i);

      // Rien ne doit avoir été écrit.
      expect(batchCommit).not.toHaveBeenCalled();
    });

    it("REFUSE de supprimer le snapshot d'un autre tenant", async () => {
      await expect(
        ImportSnapshotService.delete('snap_menu_1', INTRUDER)
      ).rejects.toThrow(/appartient à un autre tenant/i);

      expect(del).not.toHaveBeenCalled();
    });

    it('AUTORISE le propriétaire à restaurer son propre snapshot', async () => {
      await expect(
        ImportSnapshotService.restore('snap_menu_1', OWNER)
      ).resolves.toBeUndefined();

      expect(batchCommit).toHaveBeenCalledTimes(1);
    });

    it('ancre chaque lecture sur le tenant appelant (chemin scopé)', async () => {
      await ImportSnapshotService.restore('snap_menu_1', OWNER);

      // NexusInterceptor consomme le NexusContext pour préfixer le chemin :
      // c'est le chemin résolu qui prouve l'ancrage, pas le contexte transmis.
      const path = get.mock.calls[0]?.[0] as string;
      expect(path).toContain(OWNER);
      expect(path).not.toContain(INTRUDER);
    });

    it("filtre les snapshots d'autrui hors de la liste", async () => {
      Nexus.adapter.query = vi.fn().mockResolvedValue([
        snapshotOfOwner,
        { ...snapshotOfOwner, id: 'snap_autre', tenantId: INTRUDER },
      ]) as unknown as typeof Nexus.adapter.query;

      const result = await ImportSnapshotService.list(OWNER);

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(OWNER);
    });
  });
});
