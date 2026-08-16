import { describe, it, expect } from 'vitest';
import { EquipmentDiagnosticService } from '@/modules/facility/services/EquipmentDiagnosticService';
import { EquipmentAssetService } from '@/modules/facility/services/EquipmentAssetService';

describe('Pilier 8 Facility : EquipmentDiagnosticService (Arbre Décisionnel & Diagnostic)', () => {
  const tenantId = 'brasserie-paris-lux';

  it('devrait identifier immédiatement le code erreur exact Rational E12 avec gravité critique', () => {
    const diag = EquipmentDiagnosticService.diagnoseFault('COOKING', 'E12');

    expect(diag.confidence).toBe('EXACT_ERROR_CODE');
    expect(diag.severity).toBe('critical');
    expect(diag.technicianRequired).toBe(true);
    expect(diag.matchedRule?.errorCode).toBe('E12');
    expect(diag.recommendedActions.length).toBeGreaterThan(0);
    expect(diag.recommendedActions[0]).toContain('disjoncteur');
  });

  it('devrait matcher par symptôme textuel pour une panne de vidange de lave-vaisselle', () => {
    const diag = EquipmentDiagnosticService.diagnoseFault('WASHING', undefined, 'vidange impossible cuve pleine');

    expect(diag.confidence).toBe('SYMPTOM_MATCH');
    expect(diag.matchedRule?.errorCode).toBe('Err03');
    expect(diag.recommendedActions.some((a) => a.toLowerCase().includes('filtre'))).toBe(true);
  });

  it('devrait renvoyer les consignes générales de sécurité si le code ou symptôme est inconnu', () => {
    const diag = EquipmentDiagnosticService.diagnoseFault('OTHER', 'ERR_INCONNU_99', 'bruit bizarre');

    expect(diag.confidence).toBe('GENERAL_ADVICE');
    expect(diag.recommendedActions.length).toBeGreaterThan(0);
    expect(diag.technicianRequired).toBe(true);
  });

  it('devrait diagnostiquer et créer automatiquement un ticket d incident si demandé', async () => {
    const asset = await EquipmentAssetService.registerAsset(tenantId, {
      name: 'Chambre Froide Positive Légumes',
      category: 'COLD_STORAGE',
      brand: 'Foster',
      model: 'EcoPro G2',
      serialNumber: 'SN-FST-5544',
      location: 'Réserve',
      status: 'OPERATIONAL',
      maintenanceFrequencyDays: 90,
      nextMaintenanceDueAt: new Date().toISOString(),
    });

    const res = await EquipmentDiagnosticService.diagnoseAndReport(tenantId, asset.id, {
      category: 'COLD_STORAGE',
      errorCode: 'E01',
      symptom: 'Alarme haute température affichée à +12°C',
      operatorId: 'commis_paul',
      createBreakdownTicket: true,
    });

    expect(res.evaluation.confidence).toBe('EXACT_ERROR_CODE');
    expect(res.breakdownTicket).not.toBeNull();
    expect(res.breakdownTicket?.severity).toBe('critical');
    expect(res.breakdownTicket?.declaredBy).toBe('commis_paul');

    const updatedAsset = await EquipmentAssetService.getAssetById(tenantId, asset.id);
    expect(updatedAsset?.status).toBe('OUT_OF_ORDER');
  });
});
