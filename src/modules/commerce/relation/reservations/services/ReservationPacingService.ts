/**
 * ReservationPacingService.ts
 * 
 * Moteur de régulation des flux et de cadencement (Pacing) des réservations.
 * Invariant : Plafonner l'afflux de convives par tranche de 15 minutes pour protéger la cuisine (KDS) et l'accueil en salle.
 */

export interface PacingConfig {
  defaultMaxCoversPerSlot: number; // Capacité max cuisine/salle par 15 min (ex: 12)
  slotIntervalMinutes: number;    // Intervalle (défaut 15 min)
  serviceStartTime: string;       // "19:00"
  serviceEndTime: string;         // "23:00"
  slotOverrides?: Record<string, number>; // Surcharges spécifiques (ex: {"20:00": 8})
}

export interface ExistingReservationSlot {
  id: string;
  timeSlot: string; // "19:30"
  partySize: number;
}

export interface PacingSlotStatus {
  timeSlot: string;
  maxCapacityCovers: number;
  bookedCovers: number;
  availableCovers: number;
  isLocked: boolean;
}

export interface BookingFeasibilityResult {
  canAccept: boolean;
  requestedSlot: string;
  partySize: number;
  availableOnSlot: number;
  reason?: 'SLOT_FULL' | 'INSUFFICIENT_CAPACITY' | 'OUTSIDE_SERVICE_HOURS';
  suggestedAlternativeSlots: string[];
}

export class ReservationPacingService {
  public static readonly DEFAULT_INTERVAL_MIN = 15;
  public static readonly DEFAULT_MAX_COVERS = 12;

  /**
   * Génère la liste des créneaux horaires disponibles sur le service.
   */
  public static generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = this.DEFAULT_INTERVAL_MIN
  ): string[] {
    const slots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let currentTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    while (currentTotalMinutes <= endTotalMinutes) {
      const h = Math.floor(currentTotalMinutes / 60);
      const m = currentTotalMinutes % 60;
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(formatted);
      currentTotalMinutes += intervalMinutes;
    }

    return slots;
  }

  /**
   * Calcule l'état d'occupation de chaque créneau horaire.
   */
  public static computeSlotsStatus(
    config: PacingConfig,
    existingReservations: ExistingReservationSlot[]
  ): PacingSlotStatus[] {
    const slots = this.generateTimeSlots(
      config.serviceStartTime,
      config.serviceEndTime,
      config.slotIntervalMinutes || this.DEFAULT_INTERVAL_MIN
    );

    const bookedBySlot = new Map<string, number>();
    for (const r of existingReservations) {
      const current = bookedBySlot.get(r.timeSlot) || 0;
      bookedBySlot.set(r.timeSlot, current + r.partySize);
    }

    return slots.map((timeSlot) => {
      const maxCapacity = config.slotOverrides?.[timeSlot] ?? config.defaultMaxCoversPerSlot;
      const booked = bookedBySlot.get(timeSlot) || 0;
      const available = Math.max(0, maxCapacity - booked);

      return {
        timeSlot,
        maxCapacityCovers: maxCapacity,
        bookedCovers: booked,
        availableCovers: available,
        isLocked: available <= 0,
      };
    });
  }

  /**
   * Vérifie la faisabilité d'une nouvelle réservation et suggère des alternatives si saturé.
   */
  public static evaluateBooking(
    config: PacingConfig,
    existingReservations: ExistingReservationSlot[],
    requestedSlot: string,
    partySize: number
  ): BookingFeasibilityResult {
    const slotsStatus = this.computeSlotsStatus(config, existingReservations);
    const targetSlot = slotsStatus.find((s) => s.timeSlot === requestedSlot);

    if (!targetSlot) {
      return {
        canAccept: false,
        requestedSlot,
        partySize,
        availableOnSlot: 0,
        reason: 'OUTSIDE_SERVICE_HOURS',
        suggestedAlternativeSlots: slotsStatus.filter((s) => s.availableCovers >= partySize).map((s) => s.timeSlot).slice(0, 3),
      };
    }

    if (targetSlot.availableCovers >= partySize) {
      return {
        canAccept: true,
        requestedSlot,
        partySize,
        availableOnSlot: targetSlot.availableCovers,
        suggestedAlternativeSlots: [],
      };
    }

    const [reqH, reqM] = requestedSlot.split(':').map(Number);
    const reqTotalMin = reqH * 60 + reqM;

    const suggestedAlternativeSlots = slotsStatus
      .filter((s) => s.availableCovers >= partySize && s.timeSlot !== requestedSlot)
      .map((s) => {
        const [h, m] = s.timeSlot.split(':').map(Number);
        const diff = Math.abs(h * 60 + m - reqTotalMin);
        return { timeSlot: s.timeSlot, diff };
      })
      .sort((a, b) => a.diff - b.diff)
      .map((s) => s.timeSlot)
      .slice(0, 3);

    return {
      canAccept: false,
      requestedSlot,
      partySize,
      availableOnSlot: targetSlot.availableCovers,
      reason: targetSlot.availableCovers === 0 ? 'SLOT_FULL' : 'INSUFFICIENT_CAPACITY',
      suggestedAlternativeSlots,
    };
  }
}
