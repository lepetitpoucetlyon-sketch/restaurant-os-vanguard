
import { EscalationLevel } from './types';

/**
 * 🏛️ EscalationEngine - Grade X+++
 * Détermine le niveau d'escalade d'une dette.
 */
export class EscalationEngine {
    /**
     * Détermine le niveau en fonction des jours de retard.
     */
    static determineLevel(dueDateInput: string | Date, currentDate: Date = new Date()): EscalationLevel | null {
        const dueDate = typeof dueDateInput === 'string' ? new Date(dueDateInput) : dueDateInput;
        const diffTime = currentDate.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Division sur le temps, non financière.

        if (diffDays >= 1 && diffDays <= 6) {
            return 'FRIENDLY_REMINDER';
        }
        if (diffDays >= 7 && diffDays <= 29) {
            return 'FORMAL_NOTICE';
        }
        if (diffDays >= 30) {
            return 'LEGAL_WARNING';
        }

        return null;
    }
}
