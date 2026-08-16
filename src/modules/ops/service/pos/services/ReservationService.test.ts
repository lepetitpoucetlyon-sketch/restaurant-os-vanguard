import { describe, it, expect } from 'vitest';
import { ReservationService } from './ReservationService';
import { Reservation } from '@nexus/contracts';

describe('📅 ReservationService — Validation & Préparation des Réservations', () => {
  it('devrait valider une réservation conforme pour une date future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const validPayload: Partial<Reservation> = {
      customerName: 'Jean Dupont',
      partySize: 4,
      date: futureDate.toISOString(),
      time: '19:30',
      status: 'confirmed',
    };

    const validation = ReservationService.validateReservation(validPayload);
    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('devrait rejeter un nom de client manquant ou trop court (< 2 caractères)', () => {
    const invalidName1 = ReservationService.validateReservation({ customerName: '', partySize: 2, date: '2026-09-01' });
    expect(invalidName1.valid).toBe(false);
    expect(invalidName1.error).toBe('Nom du client invalide.');

    const invalidName2 = ReservationService.validateReservation({ customerName: 'J', partySize: 2, date: '2026-09-01' });
    expect(invalidName2.valid).toBe(false);
    expect(invalidName2.error).toBe('Nom du client invalide.');
  });

  it('devrait rejeter un nombre de couverts nul ou négatif', () => {
    const invalidPartySize1 = ReservationService.validateReservation({ customerName: 'Alice Martin', partySize: 0, date: '2026-09-01' });
    expect(invalidPartySize1.valid).toBe(false);
    expect(invalidPartySize1.error).toBe('Nombre de couverts invalide.');

    const invalidPartySize2 = ReservationService.validateReservation({ customerName: 'Alice Martin', partySize: -2, date: '2026-09-01' });
    expect(invalidPartySize2.valid).toBe(false);
    expect(invalidPartySize2.error).toBe('Nombre de couverts invalide.');
  });

  it('devrait rejeter une date de réservation invalide', () => {
    const invalidDate = ReservationService.validateReservation({ customerName: 'Alice Martin', partySize: 2, date: 'invalid-date-string' });
    expect(invalidDate.valid).toBe(false);
    expect(invalidDate.error).toBe('Date de réservation invalide.');
  });

  it('devrait rejeter une réservation effectuée pour une date passée', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const invalidPast = ReservationService.validateReservation({
      customerName: 'Robert Paul',
      partySize: 2,
      date: pastDate.toISOString(),
    });
    expect(invalidPast.valid).toBe(false);
    expect(invalidPast.error).toBe('Impossible de réserver pour une date passée.');
  });

  it('devrait préparer correctement une réservation avec statut et timestamps standardisés', () => {
    const rawData: Partial<Reservation> = {
      customerName: 'Sophie Bernard',
      partySize: 6,
      date: '2026-10-15',
      time: '20:00',
    };

    const prepared = ReservationService.prepareReservation(rawData, 'res_auto_12345');
    expect(prepared.id).toBe('res_auto_12345');
    expect(prepared.status).toBe('pending');
    expect(prepared.customerName).toBe('Sophie Bernard');
    expect(typeof prepared.createdAt).toBe('number');
    expect(typeof prepared.updatedAt).toBe('number');
  });

  it('devrait conserver le statut et le createdAt s\'ils sont déjà fournis', () => {
    const existingCreatedAt = 1700000000000;
    const rawData: Partial<Reservation> = {
      customerName: 'Thomas Petit',
      partySize: 3,
      status: 'confirmed',
      createdAt: existingCreatedAt,
    } as Partial<Reservation>;

    const prepared = ReservationService.prepareReservation(rawData, 'res_custom_999');
    expect(prepared.status).toBe('confirmed');
    expect(prepared.createdAt).toBe(existingCreatedAt);
  });
});
