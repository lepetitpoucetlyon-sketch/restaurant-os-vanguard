import { describe, it, expect } from 'vitest';
import { ReservationTemplateFormatter, DEFAULT_RESERVATION_TEMPLATES } from '@/lib/templates/ReservationTemplateFormatter';
import { ReservationTokenSigner } from '@/lib/security/ReservationTokenSigner';
import { AvailabilityEngine } from '@/modules/commerce/relation/reservations/domain/AvailabilityEngine';
import { GlobalSettings, Reservation, Table } from '@nexus/contracts';

describe('Studio Réservations & Notifications Personnalisées (Zenchef Parity)', () => {
  describe('ReservationTemplateFormatter', () => {
    it('devrait extraire correctement le prénom et le nom d un client', () => {
      const { firstName, lastName } = ReservationTemplateFormatter.splitName('Jean-Pierre De La Tour');
      expect(firstName).toBe('Jean-Pierre');
      expect(lastName).toBe('De La Tour');
    });

    it('devrait formater une date ISO en français élégant', () => {
      const formatted = ReservationTemplateFormatter.formatDateReadable('2026-08-20');
      expect(formatted.toLowerCase()).toContain('août 2026');
    });

    it('devrait interpoler toutes les balises dynamiques dans le SMS de confirmation', () => {
      const template = 'Bonjour {prenom} {nom}, table pour {couverts} pers. chez {restaurant} le {date} à {heure}. Modif: {lien_modification}';
      const output = ReservationTemplateFormatter.interpolate(template, {
        customerName: 'Alexandre Dubois',
        restaurantName: 'Ombellule',
        date: '2026-08-20',
        time: '20h00',
        covers: 4,
        modifyLink: 'https://ombellule.fr/r/1234?token=abc',
      });

      expect(output).toContain('Alexandre');
      expect(output).toContain('Dubois');
      expect(output).toContain('4 pers.');
      expect(output).toContain('Ombellule');
      expect(output).toContain('20h00');
      expect(output).toContain('https://ombellule.fr/r/1234?token=abc');
    });

    it('devrait fournir les templates par défaut non vides', () => {
      expect(DEFAULT_RESERVATION_TEMPLATES.confirmationSms).toBeDefined();
      expect(DEFAULT_RESERVATION_TEMPLATES.reminderSms).toBeDefined();
      expect(DEFAULT_RESERVATION_TEMPLATES.cancellationSms).toBeDefined();
      expect(DEFAULT_RESERVATION_TEMPLATES.waitlistSms).toBeDefined();
    });
  });

  describe('ReservationTokenSigner (Sécurité Cryptographique HMAC)', () => {
    const resId = 'resa-778899';
    const tenantId = 'ombellule-lyon';

    it('devrait générer un token déterministe et le valider avec succès', () => {
      const token = ReservationTokenSigner.generateToken(resId, tenantId);
      expect(token).toBeDefined();
      expect(token.length).toBe(32);

      const isValid = ReservationTokenSigner.verifyToken(resId, tenantId, token);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un token falsifié ou provenant d un autre tenant', () => {
      const token = ReservationTokenSigner.generateToken(resId, tenantId);
      const isFakeValid = ReservationTokenSigner.verifyToken(resId, 'autre-restaurant', token);
      expect(isFakeValid).toBe(false);

      const isTamperedValid = ReservationTokenSigner.verifyToken(resId, tenantId, 'bad-token-12345');
      expect(isTamperedValid).toBe(false);
    });

    it('devrait construire une URL autonome complète avec paramètre token', () => {
      const url = ReservationTokenSigner.buildSecureModifyUrl('https://ombellule.fr', resId, tenantId);
      expect(url).toContain('https://ombellule.fr/reservation/resa-778899?token=');
    });
  });

  describe('AvailabilityEngine : Cadencement & Pacing des Flux (Angle Mort #101)', () => {
    const mockSettings: GlobalSettings = {
      schedule: [
        { day: 'thursday', isOpen: true, dinnerOpen: '19:00', dinnerClose: '22:00' } as any
      ],
      reservationSlots: {
        slotDuration: 15,
        intervalBetweenSlots: 15,
        maxCoversPerSlot: 20
      },
      reservationConfig: {
        pacingEnabled: true,
        maxCoversPerPacingSlot: 8, // Max 8 personnes à la même heure
      } as any,
    } as any;

    const mockTables: Table[] = [
      { id: 'T1', label: '1', seats: 4, minSeats: 2, isActive: true } as any,
      { id: 'T2', label: '2', seats: 4, minSeats: 2, isActive: true } as any,
      { id: 'T3', label: '3', seats: 6, minSeats: 4, isActive: true } as any,
      { id: 'T4', label: '4', seats: 6, minSeats: 4, isActive: true } as any,
    ];

    it('devrait autoriser une réservation quand le flux d arrivée est inférieur au quota de pacing', () => {
      const existingReservations: Reservation[] = [
        { id: 'r1', date: '2026-08-20', time: '20:00', covers: 4, duration: 120, status: 'confirmed' } as any
      ];

      const targetDate = new Date('2026-08-20T12:00:00Z');
      const canFit2 = AvailabilityEngine.canAccommodate(targetDate, '20:00', 2, mockSettings, existingReservations, mockTables);
      expect(canFit2).toBe(true); // 4 existants + 2 = 6 <= 8
    });

    it('devrait bloquer une réservation à 20:00 si le quota de pacing (8 couverts) est atteint, mais l autoriser à 20:15', () => {
      const existingReservations: Reservation[] = [
        { id: 'r1', date: '2026-08-20', time: '20:00', covers: 6, duration: 120, status: 'confirmed' } as any,
        { id: 'r2', date: '2026-08-20', time: '20:00', covers: 2, duration: 120, status: 'confirmed' } as any
      ]; // Total 8 couverts arrivant pile à 20:00

      const targetDate = new Date('2026-08-20T12:00:00Z');
      
      // Tentative de réserver 2 personnes supplémentaires à 20:00
      const canFitMoreAt2000 = AvailabilityEngine.canAccommodate(targetDate, '20:00', 2, mockSettings, existingReservations, mockTables);
      expect(canFitMoreAt2000).toBe(false); // Bloqué par le pacing !

      // Mais disponible au créneau suivant à 20:15
      const canFitAt2015 = AvailabilityEngine.canAccommodate(targetDate, '20:15', 2, mockSettings, existingReservations, mockTables);
      expect(canFitAt2015).toBe(true);
    });
  });
});
