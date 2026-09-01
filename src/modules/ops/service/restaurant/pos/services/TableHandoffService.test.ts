import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableHandoffService } from './TableHandoffService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

describe('🤝 TableHandoffService — Transfert de Propriété de Table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait transférer la commande avec succès si l\'opérateur est le propriétaire actuel', async () => {
    const mockOrder = {
      id: 'ord_123',
      operatorId: 'srv_lucas',
      tableId: 'tbl_12',
      totalInMicrounits: 45000000,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(mockOrder);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    const spyAudit = vi.spyOn(empireAudit, 'log');

    await TableHandoffService.transferOwnership('tenant_lyon_01', 'ord_123', 'srv_lucas', 'srv_camille');

    expect(spySet).toHaveBeenCalledWith(
      'tenants/tenant_lyon_01/ops_flows/ord_123',
      expect.objectContaining({
        operatorId: 'srv_camille',
      })
    );

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'ops',
        action: 'TABLE_HANDOFF',
        details: expect.objectContaining({
          from: 'srv_lucas',
          to: 'srv_camille',
        }),
      })
    );
  });

  it('devrait autoriser le transfert par un manager même si fromOperatorId ne correspond pas', async () => {
    const mockOrder = {
      id: 'ord_456',
      operatorId: 'srv_lucas',
      tableId: 'tbl_14',
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(mockOrder);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);

    await TableHandoffService.transferOwnership(
      'tenant_lyon_01',
      'ord_456',
      'srv_autre',
      'srv_camille',
      'mgr_directeur'
    );

    expect(spySet).toHaveBeenCalledWith(
      'tenants/tenant_lyon_01/ops_flows/ord_456',
      expect.objectContaining({
        operatorId: 'srv_camille',
      })
    );
  });

  it('devrait rejeter le transfert si la commande n\'existe pas', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(null);

    await expect(
      TableHandoffService.transferOwnership('tenant_lyon_01', 'ord_nonexistent', 'srv_lucas', 'srv_camille')
    ).rejects.toThrow('Commande ord_nonexistent introuvable.');
  });

  it('devrait rejeter le transfert si l\'opérateur n\'est pas propriétaire et aucun manager n\'approuve', async () => {
    const mockOrder = {
      id: 'ord_789',
      operatorId: 'srv_autre_serveur',
      tableId: 'tbl_15',
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(mockOrder);

    await expect(
      TableHandoffService.transferOwnership('tenant_lyon_01', 'ord_789', 'srv_lucas', 'srv_camille')
    ).rejects.toThrow(/Seul le propriétaire actuel/);
  });
});
