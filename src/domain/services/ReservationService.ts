import { logger } from '@/lib/logger';
import { Reservation } from '@/types';

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
        if (!data.customerName || data.customerName.length < 2) {
            return { valid: false, error: "Nom du client invalide." };
        }

        if (!data.covers || data.covers <= 0) {
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
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
        } as Reservation;
    }
}
