import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaintenanceAlertConfigService } from '@/modules/facility/services/MaintenanceAlertConfigService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('MaintenanceAlertConfigService — Configuration des Alertes & Zones Restaurant', () => {
  const tenantId = 'bistrot-etoile-lyon';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait générer la configuration d alertes par défaut complète', () => {
    const config = MaintenanceAlertConfigService.getDefaultConfig(tenantId);

    expect(config.tenantId).toBe(tenantId);
    expect(config.rules.length).toBeGreaterThanOrEqual(6);
    expect(config.externalProviders.length).toBeGreaterThanOrEqual(2);

    const alertTypes = config.rules.map((r) => r.alertType);
    expect(alertTypes).toContain('EQUIPMENT_BREAKDOWN');
    expect(alertTypes).toContain('PREVENTIVE_OVERDUE');
    expect(alertTypes).toContain('WARRANTY_EXPIRING');
    expect(alertTypes).toContain('TEMPERATURE_ANOMALY');
    expect(alertTypes).toContain('HARDWARE_FAULT');
    expect(alertTypes).toContain('CLEANING_HACCP_OVERDUE');
  });

  it('devrait récupérer la configuration et initialiser les valeurs par défaut si vide', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(null);
    const setSpy = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);

    const config = await MaintenanceAlertConfigService.getConfig(tenantId);

    expect(config.tenantId).toBe(tenantId);
    expect(setSpy).toHaveBeenCalledWith(
      `tenants/${tenantId}/settings/maintenance_alerts`,
      expect.objectContaining({ tenantId })
    );
  });

  it('devrait router l alerte aux destinataires qualifiés pour une panne critique en cuisine chaude', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(MaintenanceAlertConfigService.getDefaultConfig(tenantId));
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);

    const result = await MaintenanceAlertConfigService.dispatchAlert({
      tenantId,
      alertType: 'EQUIPMENT_BREAKDOWN',
      severity: 'critical',
      zone: 'KITCHEN_HOT',
      equipmentName: 'Four Mixte Rational iCombi Pro',
      message: 'Erreur E12 : Sonde de température de chambre défectueuse',
    });

    expect(result.dispatched).toBe(true);
    expect(result.recipientsNotified).toBeGreaterThanOrEqual(2); // Directeur + Manager
    expect(result.channelsUsed).toContain('IN_APP');

    // Vérifier l'émission de la notification In-App
    expect(emitSpy).toHaveBeenCalledWith(
      'notification.created',
      expect.objectContaining({
        tenantId,
        type: 'alert',
        priority: 'critical',
      })
    );
  });

  it('devrait filtrer les alertes si la zone ne correspond pas aux zones applicables de la règle', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(MaintenanceAlertConfigService.getDefaultConfig(tenantId));
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);

    // La règle TEMPERATURE_ANOMALY s'applique à KITCHEN_COLD et STORAGE_CELLAR, pas DINING_ROOM_POS
    const result = await MaintenanceAlertConfigService.dispatchAlert({
      tenantId,
      alertType: 'TEMPERATURE_ANOMALY',
      severity: 'critical',
      zone: 'DINING_ROOM_POS',
      equipmentName: 'Sonde Salle',
      message: 'Température anormale',
    });

    expect(result.dispatched).toBe(false);
    expect(result.recipientsNotified).toBe(0);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('devrait persister les modifications de configuration avec mise à jour de l opérateur', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(MaintenanceAlertConfigService.getDefaultConfig(tenantId));
    const setSpy = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);

    const updated = await MaintenanceAlertConfigService.updateConfig(
      tenantId,
      { defaultPreventiveIntervalDays: 60 },
      'directeur_philippe'
    );

    expect(updated.defaultPreventiveIntervalDays).toBe(60);
    expect(updated.updatedBy).toBe('directeur_philippe');
    expect(setSpy).toHaveBeenCalled();
  });
});
