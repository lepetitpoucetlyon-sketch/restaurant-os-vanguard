import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface ProductRecord {
  id: string;
  available?: boolean;
}

/**
 * FridgeTempAlertHandler (Item R7)
 * Gère les anomalies de température des enceintes réfrigérées.
 * Enregistre chaque relevé dans le registre légal immuable HACCP (`haccpTemperatureLog`) et déclenche le protocole correctif.
 */
export function registerFridgeTempAlertHandler() {
  return NexusEventBus.on(
    'sensor.temperature_anomaly',
    async (payload) => {
      const { tenantId, sensorId, temperature, durationInMinutes } = payload;
      const logId = `temp_log_${sensorId}_${Date.now()}`;
      const isCritical = durationInMinutes > 30 || temperature > 10;

      // ── Item R7: Enregistrement dans le Registre Légal Immuable HACCP ──────
      await Nexus.adapter.set(`tenants/${tenantId}/haccpTemperatureLog/${logId}`, {
        id: logId,
        sensorId,
        temperature,
        durationInMinutes,
        isCritical,
        recordedAt: new Date().toISOString(),
      });

      // Si la température est anormale pendant plus de 30 minutes, risque de rupture de chaîne du froid
      if (isCritical) {
        logger.error(`[IoT] Rupture de la chaîne du froid détectée (Capteur: ${sensorId}, Temp: ${temperature}°C, Durée: ${durationInMinutes}min)`);
        
        empireAudit.log({
          module: 'inventory',
          action: 'COLD_CHAIN_BROKEN',
          details: { sensorId, temperature, durationInMinutes },
          severity: 'critical',
          timestamp: new Date(),
        });

        // Déclenchement de l'action corrective HACCP légale
        await NexusEventBus.emit('haccp.nonconform', {
          v: 1,
          tenantId,
          checkId: `sensor_${sensorId}`,
          correctionDeadline: Date.now() + 86400000,
        });
        
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `ALERTE SÉCURITÉ ALIMENTAIRE: Le capteur ${sensorId} affiche ${temperature}°C depuis ${durationInMinutes} minutes. Blocage préventif des stocks liés.`,
          // N2-b : ciblage par responsabilité (résolu via la table de routage du tenant
          // ou les défauts RESP_HYGIENE). `roles` conservé en repli de sécurité.
          responsibility: 'RESP_HYGIENE',
          roles: ['admin', 'manager', 'chef_cuisinier'],
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
