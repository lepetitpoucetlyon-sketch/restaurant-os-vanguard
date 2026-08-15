import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockEmit, mockEmitDurable, mockOn, capturedHandlers } =
  vi.hoisted(() => {
    const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
    const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
      capturedHandlers[event] = cb;
      return () => {};
    });
    return {
      mockGet: vi.fn(),
      mockSet: vi.fn(),
      mockUpdate: vi.fn(),
      mockQuery: vi.fn(),
      mockEmit: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/push/browserPush', () => ({
  browserPush: { sendToRole: vi.fn(async () => true), sendToUser: vi.fn(async () => true) },
}));
vi.mock('@/modules/human', () => ({
  PrepaieBuilder: {
    build: vi.fn(async () => ({
      rows: [{ employeeId: 'emp-1', brut: 2500 }],
      totalBrut: 2500,
    })),
  },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { AbsenceUnderstaffingHandler } from '@/shared/eventBus/handlers/AbsenceUnderstaffingHandler';
import { PayrollAutoCalcHandler } from '@/shared/eventBus/handlers/PayrollAutoCalcHandler';
import { registerPayrollComplianceHandler } from '@/shared/eventBus/handlers/PayrollComplianceHandler';
import { registerPayrollTimeclockHandler } from '@/shared/eventBus/handlers/PayrollTimeclockHandler';
import { registerOvertimeAlertHandler } from '@/shared/eventBus/handlers/OvertimeAlertHandler';
import { registerOvertimeJournalHandler } from '@/shared/eventBus/handlers/OvertimeJournalHandler';
import { registerLaborCostAnalyzerHandler } from '@/shared/eventBus/handlers/LaborCostAnalyzerHandler';
import { registerScheduleNotifierHandler } from '@/shared/eventBus/handlers/ScheduleNotifierHandler';
import { MedicalVisitAlertHandler } from '@/shared/eventBus/handlers/MedicalVisitAlertHandler';
import { ContractRenewalAlertHandler } from '@/shared/eventBus/handlers/ContractRenewalAlertHandler';
import { registerEndOfServiceActionHandler } from '@/shared/eventBus/handlers/EndOfServiceActionHandler';
import { RecruitmentRouterHandler } from '@/shared/eventBus/handlers/RecruitmentRouterHandler';
import { OnboardingProgressHandler } from '@/shared/eventBus/handlers/OnboardingProgressHandler';

const T = 'tenant-hr';

// ─── AbsenceUnderstaffingHandler ──────────────────────────────────────────────


// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

beforeEach(() => {
  vi.restoreAllMocks();
  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AbsenceUnderstaffingHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); AbsenceUnderstaffingHandler.register(); });

  it('décrémente le planning et alerte si sous-effectif', async () => {
    mockQuery.mockResolvedValue([{ id: 'sched-1', requiredHeadcount: 5, scheduledHeadcount: 5 }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['hr.absence_declared']({
      tenantId: T, userId: 'emp-1', absenceType: 'sick', startDate: '2026-09-01',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/hr/schedules/sched-1`, expect.objectContaining({ scheduledHeadcount: 4 }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['hr.absence_declared']({ tenantId: T, userId: 'x', absenceType: 'y', startDate: 'z', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── PayrollAutoCalcHandler ───────────────────────────────────────────────────

describe('PayrollAutoCalcHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); PayrollAutoCalcHandler.register(); });

  it('calcule et persiste la pré-paie pour la période', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['payroll.submitted']({
      tenantId: T, period: '2026-08', submissionId: 'sub-1', employeeCount: 3,
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/hr/payroll/202608`,
      expect.objectContaining({ status: 'calculated', submissionId: 'sub-1' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['payroll.submitted']({ tenantId: T, period: 'x', submissionId: 'y', employeeCount: 0, isSimulation: true });
    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── PayrollComplianceHandler ─────────────────────────────────────────────────

describe('PayrollComplianceHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerPayrollComplianceHandler(); });

  it('verrouille les shifts de la période exportée', async () => {
    const now = Date.now();
    mockQuery.mockResolvedValue([
      { id: 'shift-1', endedAt: now - 1000, locked: false },
      { id: 'shift-2', endedAt: now - 2000, locked: true },
    ]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['hr.payroll_exported']({
      tenantId: T, periodStart: now - 10000, periodEnd: now, exportedBy: 'admin',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/shifts/shift-1`, expect.objectContaining({ locked: true }),
    );
    expect(mockUpdate).not.toHaveBeenCalledWith(
      `tenants/${T}/shifts/shift-2`, expect.anything(),
    );
  });
});

// ─── PayrollTimeclockHandler ──────────────────────────────────────────────────

describe('PayrollTimeclockHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerPayrollTimeclockHandler(); });

  it('persiste un pointage clock_in dans le registre de paie', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['staff.clock_in']({
      tenantId: T, userId: 'emp-1', userName: 'Jean', terminalId: 'term-1', timestamp: '2026-09-01T08:00:00Z',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/timeclock/2026-09-01/`),
      expect.objectContaining({ type: 'clock_in', employeeId: 'emp-1' }),
    );
  });

  it('persiste un pointage clock_out', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['staff.clock_out']({
      tenantId: T, userId: 'emp-1', userName: 'Jean', terminalId: 'term-1', timestamp: '2026-09-01T17:00:00Z',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/timeclock/`),
      expect.objectContaining({ type: 'clock_out' }),
    );
  });
});

// ─── OvertimeAlertHandler ─────────────────────────────────────────────────────

describe('OvertimeAlertHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerOvertimeAlertHandler(); });

  it('crée une alerte RH si le shift dépasse 10h', async () => {
    const startedAt = Date.now() - 11 * 3600000;
    const endedAt = Date.now();
    mockGet.mockResolvedValue({ startedAt });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['hr.shift_ended']({ tenantId: T, shiftId: 'shift-1', employeeId: 'emp-1', endedAt });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/hrAlerts/shift-1`, expect.objectContaining({ employeeId: 'emp-1' }),
    );
  });

  it('ne crée pas d\'alerte si le shift est sous 10h', async () => {
    const startedAt = Date.now() - 8 * 3600000;
    mockGet.mockResolvedValue({ startedAt });

    await capturedHandlers['hr.shift_ended']({ tenantId: T, shiftId: 'shift-2', employeeId: 'emp-2', endedAt: Date.now() });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── OvertimeJournalHandler ───────────────────────────────────────────────────

describe('OvertimeJournalHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerOvertimeJournalHandler(); });

  it('crée une alerte et un flag de paie pour les heures sup', async () => {
    mockGet.mockResolvedValue({ name: 'Marie Dupont' });
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['overtime.threshold']({
      tenantId: T, employeeId: 'emp-1', hoursWorked: 42, hoursLimit: 35, periodStart: '2026-08-01', periodEnd: '2026-08-31',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/hr/`),
      expect.objectContaining({ employeeId: 'emp-1' }),
    );
  });
});

// ─── LaborCostAnalyzerHandler ─────────────────────────────────────────────────

describe('LaborCostAnalyzerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerLaborCostAnalyzerHandler(); });

  it('trace le début de shift sans erreur', async () => {
    const { logger } = await import('@/lib/logger');

    await capturedHandlers['hr.shift_started']({
      tenantId: T, shiftId: 'shift-1', employeeId: 'emp-1', startedAt: Date.now(),
    });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('shift-1'));
  });
});

// ─── ScheduleNotifierHandler ──────────────────────────────────────────────────

describe('ScheduleNotifierHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerScheduleNotifierHandler(); });

  it('notifie la brigade après publication du planning', async () => {
    mockQuery.mockResolvedValue([
      { employeeId: 'emp-1', date: '2026-09-01', startTime: '09:00', endTime: '17:00', weekStart: Date.now() },
    ]);
    const { browserPush } = await import('@/lib/push/browserPush');

    await capturedHandlers['hr.schedule_published']({
      tenantId: T, weekStart: new Date('2026-09-01').getTime(), publishedBy: 'manager',
    });

    expect(browserPush.sendToRole).toHaveBeenCalled();
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['hr.schedule_published']({ tenantId: T, weekStart: 0, publishedBy: 'x', isSimulation: true });
    const { browserPush } = await import('@/lib/push/browserPush');
    expect(browserPush.sendToUser).not.toHaveBeenCalled();
  });
});

// ─── MedicalVisitAlertHandler ─────────────────────────────────────────────────

describe('MedicalVisitAlertHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); MedicalVisitAlertHandler.register(); });

  it('pose le flag d\'alerte visite médicale sur l\'employé actif', async () => {
    mockQuery.mockResolvedValue([{ id: 'emp-1', status: 'active', employeeName: 'Jean' }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['hr.medical_visit_expired']({ tenantId: T, userId: 'emp-1', daysOverdue: 30 });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/hr/employees/emp-1`, expect.objectContaining({ medicalVisitAlertTriggered: true }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['hr.medical_visit_expired']({ tenantId: T, userId: 'x', daysOverdue: 5, isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── ContractRenewalAlertHandler ──────────────────────────────────────────────

describe('ContractRenewalAlertHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); ContractRenewalAlertHandler.register(); });

  it('pose l\'alerte renouvellement sur le contrat actif', async () => {
    mockQuery.mockResolvedValue([{ id: 'ctr-1', type: 'CDD', status: 'active' }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['hr.contract_expiring']({ tenantId: T, contractId: 'ctr-1', daysRemaining: 10, userId: 'emp-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/hr/contracts/ctr-1`, expect.objectContaining({ renewalAlertTriggered: true }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['hr.contract_expiring']({ tenantId: T, contractId: 'x', daysRemaining: 5, userId: 'y', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── EndOfServiceActionHandler ────────────────────────────────────────────────

describe('EndOfServiceActionHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerEndOfServiceActionHandler(); });

  it('émet les notifications de fin de service', async () => {
    await capturedHandlers['store.shift_ended']({ tenantId: T, shiftId: 'shift-1', endTime: '23:00' });

    expect(mockEmit).toHaveBeenCalledWith('notification.created', expect.objectContaining({ type: 'info' }));
  });
});

// ─── RecruitmentRouterHandler ─────────────────────────────────────────────────

describe('RecruitmentRouterHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); RecruitmentRouterHandler.register(); });

  it('sauvegarde la candidature et alerte le manager', async () => {
    mockQuery.mockResolvedValue([{ id: 'mgr-1', role: 'manager', name: 'Directeur' }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['hr.application_received']({
      tenantId: T, applicationId: 'app-1', role: 'serveur', applicantName: 'Paul Martin',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/hr/recruitment/applications/app-1`, expect.objectContaining({ status: 'new' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['hr.application_received']({
      tenantId: T, applicationId: 'x', role: 'y', applicantName: 'z', isSimulation: true,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── OnboardingProgressHandler ────────────────────────────────────────────────

describe('OnboardingProgressHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); OnboardingProgressHandler.register(); });

  it('marque l\'étape onboarding comme complétée', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['tenant.onboarding_step_completed']({
      tenantId: T, stepId: 'menu_setup',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/mcc/onboarding/menu_setup`, expect.objectContaining({ status: 'completed' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['tenant.onboarding_step_completed']({ tenantId: T, stepId: 'x', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
