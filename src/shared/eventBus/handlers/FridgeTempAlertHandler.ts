import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

interface ProductRecord {
  id: string;
  available?: boolean;
}

export function registerFridgeTempAlertHandler() {
  return NexusEventBus.on(
    'sensor.temperature_anomaly',
    async (payload) => {
      const { tenantId, sensorId, temperature, durationInMinutes } = payload;
      
      // Si la température est anormale pendant plus de 30 minutes, risque de rupture de chaîne du froid
      if (durationInMinutes > 30) {
        logger.error(`[IoT] Rupture de la chaîne du froid détectée (Capteur: ${sensorId}, Temp: ${temperature}°C, Durée: ${durationInMinutes}min)`);
        
        empireAudit.log({
          module: 'inventory',
          action: 'COLD_CHAIN_BROKEN',
          details: { sensorId, temperature, durationInMinutes },
          severity: 'critical',
          timestamp: new Date(),
        });
        
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `ALERTE SÉCURITÉ ALIMENTAIRE: Le capteur ${sensorId} affiche ${temperature}°C depuis ${durationInMinutes} minutes. Blocage préventif des stocks liés.`,
          roles: ['admin', 'manager', 'kitchen_chef'],
          priority: 'CRITICAL',
        });
        
        // Trouver tous les produits stockés dans ce frigo (storageLocation) et les désactiver
        const products = await Nexus.adapter.query<ProductRecord>(`tenants/${tenantId}/products`, {
          where: [{ field: 'storageLocationId', operator: '==', value: sensorId }],
        }) || [];
        
        for (const product of products) {
          await Nexus.adapter.update(`tenants/${tenantId}/products/${product.id}`, { available: false });
          logger.warn(`[IoT] Produit ${product.id} désactivé préventivement.`);
        }
      }
    },
    { id: 'fridge-temp-alert-handler', priority: 'HIGH' }
  );
}
