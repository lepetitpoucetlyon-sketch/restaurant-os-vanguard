import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DepositAndPrivatizationService } from '@/modules/commerce/services/DepositAndPrivatizationService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('Commerce & Réservations : Pré-Autorisation & Caution No-Show Groupe', () => {
  const tenantId = 'bistro-champs-elysees';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer une demande d acompte / caution de 25€/couvert pour un groupe de 10 personnes', async () => {
    const deposit = await DepositAndPrivatizationService.createGroupDepositRequest(
      tenantId,
      'resa-group-77',
      'cust-marc-dupont',
      'Marc Dupont (Privatisation Anniversaire)',
      10,
      25000000 // 25 € / couvert
    );

    expect(deposit.id).toBeDefined();
    expect(deposit.partySize).toBe(10);
    expect(deposit.totalDepositInMicrounits).toBe(250000000); // 250.00 €
    expect(deposit.status).toBe('AUTHORIZED');
  });

  it('devrait libérer l empreinte bancaire lorsque le groupe arrive au restaurant', async () => {
    const deposit = await DepositAndPrivatizationService.createGroupDepositRequest(
      tenantId,
      'resa-group-88',
      'cust-alice',
      'Alice V.',
      6
    );

    const released = await DepositAndPrivatizationService.releaseDepositOnArrival(
      tenantId,
      deposit.id
    );

    expect(released.status).toBe('RELEASED');
    expect(released.resolutionReason).toBe('guest_checked_in');
  });

  it('devrait capturer la caution et émettre l écriture financière en cas de No-Show', async () => {
    const eventSpy = vi.fn();
    NexusEventBus.on('finance.refund_issued', eventSpy, { id: 'test-no-show-capture' });

    const deposit = await DepositAndPrivatizationService.createGroupDepositRequest(
      tenantId,
      'resa-group-99',
      'cust-no-show',
      'Jean Sans-Nouvelle',
      8,
      20000000 // 160 €
    );

    const captured = await DepositAndPrivatizationService.captureDepositOnNoShow(
      tenantId,
      deposit.id,
      'Table non honorée après 45min de retard'
    );

    expect(captured.status).toBe('CAPTURED');
    expect(captured.resolutionReason).toContain('Table non honorée');
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });
});
