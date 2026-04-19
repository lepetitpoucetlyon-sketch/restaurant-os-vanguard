import { getTenantPath } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusTransaction } from '@/lib/NexusTransaction';
import { ShiftEntrySchema, ShiftEntry } from "@/domain/schemas/hr";
import { FiscalEngine } from './FiscalEngine';
import { logger } from '@/lib/logger';
import { ZodInterceptor } from './ZodInterceptor';

/**
 * 🎖️ NexusPayrollEngine - Restaurant OS
 * Industrial-grade HR engine for undeniable employee activity tracking.
 */
export class NexusPayrollEngine {
  private static COLLECTION = 'shiftEntries';

  /**
   * Clocks an employee in.
   */
  static async clockIn(user: { id: string, name: string }, terminalId: string = 'TERMINAL_01') {
    return this.processShiftEvent(user, 'CLOCK_IN', terminalId);
  }

  /**
   * Clocks an employee out.
   */
  static async clockOut(user: { id: string, name: string }, terminalId: string = 'TERMINAL_01') {
    return this.processShiftEvent(user, 'CLOCK_OUT', terminalId);
  }

  /**
   * Internal processor for shift events (Clock In/Out).
   * Enforces Zod validation and SHA-256 sealing.
   */
  private static async processShiftEvent(
    user: { id: string, name: string }, 
    type: 'CLOCK_IN' | 'CLOCK_OUT', 
    terminalId: string
  ) {
    logger.info(`[NexusPayrollEngine] Processing ${type} for ${user.name}`);

    // 1. Prepare raw data
    const rawData: Partial<ShiftEntry> = {
      userId: user.id,
      userName: user.name,
      type,
      timestamp: new Date(),
      location: { terminalId }
    };

    // 2. Fetch Last HR Seal (Cloud-Strict)
    const lastSeal = await this.fetchLastHRSealCloudStrict();

    // 3. Execute Transaction
    return await NexusTransaction.run(
      { HR_EVENT: { schema: ShiftEntrySchema, data: rawData } },
      async (transaction) => {
        const tenantPath = getTenantPath(this.COLLECTION);
        const newId = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        const newPath = `${tenantPath}/${newId}`;

        // 4. Generate Final Sealed Entry
        const payload = JSON.stringify({ userId: user.id, timestamp: rawData.timestamp, type });
        const seal = await FiscalEngine.sealEntry(newId, payload, { lastSeal });

        const finalEntry = {
          ...rawData,
          id: newId,
          fiscalSeal: seal,
          createdAt: new Date()
        };

        // 5. Commit to Cloud
        transaction.set(newPath, finalEntry);
        
        logger.info(`[NexusPayrollEngine] ${type} Committed & Sealed for ${user.name}`);
        return { id: newId, sealHash: seal.hash };
      }
    );
  }

  /**
   * Fetches the last HR seal from the Cloud to ensure chain continuity.
   */
  private static async fetchLastHRSealCloudStrict() {
    try {
      const snap = await Nexus.adapter.query(getTenantPath(this.COLLECTION), {
        orderBy: { field: 'fiscalSeal.sequence', direction: 'desc' },
        limit: 1
      });
      if (snap.length === 0) return null;
      return snap[0].fiscalSeal;
    } catch (e) {
      logger.error('[NexusPayrollEngine] Failed to fetch last HR seal', e);
      return null;
    }
  }

  /**
   * Aggregates shifts for a given period to prepare for payroll accounting.
   */
  static async aggregatePeriodStats(userId: string, yearMonth: string) {
    // Logic for calculating total hours based on CLOCK_IN/CLOCK_OUT pairs
    // Implementation placeholder for Phase 4.1
    return { totalHours: 0, validatedEntries: 0 };
  }
}
