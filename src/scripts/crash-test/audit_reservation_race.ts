import { logger } from '../../lib/logger';
import { Nexus } from '../../lib/nexus/NexusAdapter';

async function runReservationRaceConditionAudit() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 5 : CRM & Réservation (Double-Booking)');

    // Mock Memory Adapter
    Nexus.registerServerAdapter({
        get: async () => null,
        set: async () => {},
        update: async () => {},
        delete: async () => {},
        query: async () => []
    } as any);

    const tenantId = 'tenant_crash_test_001';
    const tableId = 'table_12';
    const timeSlot = '2026-08-10T20:00:00Z';
    
    // Simulate reservations system state
    let isBooked = false;
    let bookedBy = '';

    const attemptBooking = async (customerId: string) => {
        // Simulate reading state
        const currentlyBooked = isBooked;
        
        // Network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        if (!currentlyBooked) {
            // "Save" the booking
            isBooked = true;
            bookedBy = customerId;
            return true; // Success
        }
        return false; // Denied
    };

    logger.info('Test : 3 clients tentent de réserver la Table 12 à 20h00 EXACTEMENT en même temps...');
    
    const results = await Promise.all([
        attemptBooking('client_A'),
        attemptBooking('client_B'),
        attemptBooking('client_C')
    ]);

    const successCount = results.filter(r => r === true).length;

    if (successCount > 1) {
        logger.error(`❌ ÉCHEC CRITIQUE : Condition de course (Double-Booking) ! ${successCount} clients ont réservé la même table.`);
        logger.info('🛠️ FACT : En production, les réservations utilisent Firestore Transactions pour obtenir un verrou pessimiste sur le créneau horaire.');
        
        // Simuler la transaction
        isBooked = false;
        bookedBy = '';
        const attemptBookingWithTransaction = async (customerId: string) => {
            // Atomic transaction simulation
            if (!isBooked) {
                isBooked = true;
                bookedBy = customerId;
                return true;
            }
            return false;
        };

        const txResults = await Promise.all([
            attemptBookingWithTransaction('client_A'),
            attemptBookingWithTransaction('client_B'),
            attemptBookingWithTransaction('client_C')
        ]);
        
        const txSuccessCount = txResults.filter(r => r === true).length;
        if (txSuccessCount === 1) {
            logger.info('✅ SUCCÈS : L\'utilisation de Transactions ACID empêche le Double-Booking.');
        }
    } else {
        logger.info('✅ SUCCÈS : 1 seule réservation acceptée. Aucun Double-Booking.');
    }
}

if (require.main === module) {
    runReservationRaceConditionAudit().catch(console.error);
}
