import { logger } from '@/lib/logger';
import { Reservation } from '@nexus/contracts';

/**
 * 📅 ReservationService - Restaurant OS
 * Centralized Domain Logic for Table Management and Bookings.
 * Grade X: Industrialized Omnichannel Orchestration.
 */
export class ReservationService {

    /**
     * Validates a reservation payload.
     * Ensures strict compliance with the CCR (Client-Couverts-Réservation) model.
     */
    static validateReservation(data: Partial<Reservation>): { valid: boolean; error?: string } {
        const customerName = data.customerName;
        if (!customerName || customerName.length < 2) {
            return { valid: false, error: "Nom du client invalide." };
        }

        const partySize = data.partySize || 0;
        if (partySize <= 0) {
            return { valid: false, error: "Nombre de couverts invalide." };
        }

        const bookingDate = new Date(data.date || '');
        if (isNaN(bookingDate.getTime())) {
            return { valid: false, error: "Date de réservation invalide." };
        }

        // Logic check: Cannot book in the past
        if (bookingDate < new Date()) {
          const today = new Date();
          today.setHours(0,0,0,0);
          if (bookingDate < today) {
            return { valid: false, error: "Impossible de réserver pour une date passée." };
          }
        }

        return { valid: true };
    }

    /**
     * Prepares a standardized reservation object for persistence.
     */
    static prepareReservation(data: Partial<Reservation>, generatedId: string): Reservation {
        return {
            ...data,
            id: generatedId,
            status: data.status || 'pending',
            updatedAt: Date.now(),
            createdAt: (data as { createdAt?: number }).createdAt || Date.now(),
        } as Reservation;
    }
}
