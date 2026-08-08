import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * PayrollTimeclockHandler (P1)
 * Consomme les événements de pointage (staff.clock_in / staff.clock_out)
 * et les persiste dans le registre officiel de paie (timeclock).
 */
export function registerPayrollTimeclockHandler(): () => void {
  const handleClockEvent = async (
    eventName: 'staff.clock_in' | 'staff.clock_out',
    payload: {
      tenantId: string;
      userId: string;
      userName: string;
      terminalId: string;
      timestamp: string;
    }
  ) => {
    const { tenantId, userId, userName, terminalId, timestamp } = payload;
    const dateStr = timestamp.slice(0, 10);
    const path = `tenants/${tenantId}/timeclock/${dateStr}`;
    
    // On génère un ID unique pour le pointage
    const entryId = Nexus.adapter.generateId(path);
    
    const clockType = eventName === 'staff.clock_in' ? 'clock_in' : 'clock_out';

    // On persiste l'entrée dans l'objet quotidien
    await Nexus.adapter.set(`${path}/${entryId}`, {
      id: entryId,
      employeeId: userId,
      type: clockType,
      timestamp,
      source: 'kiosk', // ou terminalId
      metadata: {
        userName,
        terminalId
      }
    });

    logger.info(`[PayrollTimeclock] Pointage enregistré: ${userName} (${clockType}) à ${timestamp}`);

    empireAudit.log({
      module: 'human',
      action: 'TIMECLOCK_ENTRY',
      details: { userId, userName, type: clockType, timestamp, terminalId },
      severity: 'low',
      timestamp: new Date(),
    });
  };

  const unsubIn = NexusEventBus.on('staff.clock_in', (p) => handleClockEvent('staff.clock_in', p), { id: 'payroll-clock-in', priority: 'HIGH' });
  const unsubOut = NexusEventBus.on('staff.clock_out', (p) => handleClockEvent('staff.clock_out', p), { id: 'payroll-clock-out', priority: 'HIGH' });

  // Bridge: l'API route /api/hr/clock-in émet hr.clock_in (payload avec timestamp: number)
  // On le traduit vers le même format que staff.clock_in pour le persister en registre de paie
  const unsubHrClockIn = NexusEventBus.on(
    'hr.clock_in',
    async (p) => {
      await handleClockEvent('staff.clock_in', {
        tenantId: p.tenantId,
        userId: p.userId,
        userName: p.userId, // hr.clock_in n'a pas de userName — on utilise l'ID
        terminalId: 'api',
        timestamp: new Date(p.timestamp).toISOString(),
      });
    },
    { id: 'payroll-hr-clock-in', priority: 'HIGH' }
  );

  return () => {
    unsubIn();
    unsubOut();
    unsubHrClockIn();
  };
}
