import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EquipmentMaintenanceService } from '@/modules/facility/maintenance/services/EquipmentMaintenanceService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('Zone 9 Facility : Maintenance Préventive & Registre Matériel', () => {
  const tenantId = 'brasserie-bordeaux';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait enregistrer un équipement et gérer son cycle de maintenance préventive', async () => {
    // 1. Enregistrement d'une chambre froide
    const equipment = await EquipmentMaintenanceService.registerEquipment(tenantId, {
      name: 'Chambre Froide Négative Cuisine',
      category: 'COLD_STORAGE',
      brand: 'Liebherr Pro',
      serialNumber: 'SN-LH-889922',
      location: 'Cuisine Arrière',
      installedAt: Date.now() - 365 * 24 * 3600 * 1000,
      nextMaintenanceDueAt: Date.now() - 5000, // En retard
    });

    expect(equipment.id).toBeDefined();
    expect(equipment.status).toBe('OPERATIONAL');

    // 2. Enregistrement de l'intervention de révision
    const intervention = await EquipmentMaintenanceService.logIntervention(
      tenantId,
      {
        equipmentId: equipment.id,
        type: 'PREVENTIVE',
        technicianName: 'Jean Froid',
        technicianCompany: 'Clim & Froid Pro',
        costInMicrounits: 180000000, // 180 €
        description: 'Nettoyage condenseur, contrôle étanchéité circuit frigorifique R452A',
        cerfaDocUrl: 'https://storage.empire.fr/cerfa/13984-05.pdf',
        partsReplaced: ['Joint de porte', 'Filtre déshydrateur'],
      },
      90 // Prochaine dans 90 jours
    );

    expect(intervention.id).toBeDefined();
    expect(intervention.type).toBe('PREVENTIVE');
    expect(intervention.costInMicrounits).toBe(180000000);
  });

  it('devrait déclarer une panne matérielle et émettre l événement télémétrique de faute', async () => {
    const faultSpy = vi.fn();
    NexusEventBus.on('facility.hardware_fault', faultSpy, { id: 'test-facility-fault' });

    const equipment = await EquipmentMaintenanceService.registerEquipment(tenantId, {
      name: 'Friteuse Double Bac Gaz',
      category: 'COOKING',
      brand: 'Frymaster',
      serialNumber: 'SN-FM-4421',
      location: 'Zone Chaud',
      installedAt: Date.now(),
      nextMaintenanceDueAt: Date.now() + 180 * 24 * 3600 * 1000,
    });

    const updated = await EquipmentMaintenanceService.flagBreakdown(
      tenantId,
      equipment.id,
      'Fuite vanne gaz thermocouple',
      'critical'
    );

    expect(updated.status).toBe('OUT_OF_ORDER');
    expect(faultSpy).toHaveBeenCalledTimes(1);
  });
});
