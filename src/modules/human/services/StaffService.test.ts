import { describe, it, expect } from 'vitest';
import { StaffService } from './StaffService';
import type { Shift, LeaveRequest } from '@nexus/contracts';

describe('🧑‍🍳 StaffService — Provisions Comptables de Paie & Congés', () => {
  it('devrait calculer la provision comptable (Débit 641 / Crédit 421) pour un shift publié', () => {
    const shift: Shift = {
      id: 'shf_midi_01',
      userId: 'usr_pauline',
      userName: 'Pauline Dupont',
      date: '2026-08-20',
      startTime: '11:00:00',
      endTime: '15:00:00', // 4 heures
      status: 'published',
      position: 'serveur',
      role: 'serveur',
      updatedAt: new Date().toISOString(),
    };

    const provision = StaffService.calculateShiftProvision(shift);

    expect(provision).not.toBeNull();
    expect(provision?.status).toBe('draft');
    expect(provision?.referenceId).toBe('shf_midi_01');
    expect(provision?.metadata?.hours).toBe(4);

    // 4h * 18,00€ = 72,00€ (7200 cents = 72_000_000 microunits)
    expect(provision?.lines[0].accountId).toBe('acc_641');
    expect(provision?.lines[0].side).toBe('debit');
    expect(provision?.lines[0].amountInCents).toBe(7200);
    expect(provision?.lines[0].amountInMicrounits).toBe(72_000_000);

    expect(provision?.lines[1].accountId).toBe('acc_421');
    expect(provision?.lines[1].side).toBe('credit');
    expect(provision?.lines[1].amountInCents).toBe(7200);
  });

  it('devrait retourner null si le shift n\'est pas au statut published', () => {
    const draftShift: Shift = {
      id: 'shf_draft_01',
      userId: 'usr_pauline',
      userName: 'Pauline Dupont',
      date: '2026-08-20',
      startTime: '11:00:00',
      endTime: '15:00:00',
      status: 'scheduled',
      position: 'serveur',
      role: 'serveur',
      updatedAt: new Date().toISOString(),
    };

    const provision = StaffService.calculateShiftProvision(draftShift);
    expect(provision).toBeNull();
  });

  it('devrait valider une demande de congés future', () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 15);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 22);

    const validRequest: Partial<LeaveRequest> = {
      startDate: futureDate1.toISOString(),
      endDate: futureDate2.toISOString(),
      type: 'paid_leave',
    };

    const validation = StaffService.validateLeaveRequest(validRequest);
    expect(validation.valid).toBe(true);
  });

  it('devrait rejeter une demande de congés avec date de fin antérieure au début', () => {
    const invalidDates: Partial<LeaveRequest> = {
      startDate: '2026-09-10',
      endDate: '2026-09-05',
      type: 'paid_leave',
    };

    const validation = StaffService.validateLeaveRequest(invalidDates);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('End date cannot be before start date.');
  });

  it('devrait autoriser un arrêt maladie rétroactif mais bloquer un congé payé dans le passé', () => {
    const pastRequest: Partial<LeaveRequest> = {
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      type: 'paid_leave',
    };

    const invalidPast = StaffService.validateLeaveRequest(pastRequest);
    expect(invalidPast.valid).toBe(false);
    expect(invalidPast.error).toContain('sick leave');

    const validSickLeave: Partial<LeaveRequest> = {
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      type: 'sick_leave',
    };

    const validSick = StaffService.validateLeaveRequest(validSickLeave);
    expect(validSick.valid).toBe(true);
  });
});
