import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { toMicrounits } from '@/domain/schemas/primitives';
import type { ReservationSettings } from '@/shared/nexus/contracts/settings/reservations';

interface Reservation {
    id: string;
    status: string;
    guestCount?: number;
    stripeSetupIntentId?: string;
    stripePaymentMethodId?: string;
    customerEmail?: string;
    customerId?: string;
}

export const NoShowService = {
    shouldRequireImprint(settings: ReservationSettings, guestCount: number): boolean {
        if (!settings.cardImprintEnabled) return false;
        switch (settings.cardImprintCondition) {
            case 'always': return true;
            case 'group': return guestCount >= (settings.cardImprintGroupMin ?? 6);
            case 'amount': return (settings.depositAmount ?? 0) >= (settings.cardImprintAmountMin ?? 50);
            case 'privatization': return false;
            default: return false;
        }
    },

    isWithinCancellationWindow(settings: ReservationSettings, reservationDate: Date): boolean {
        const hoursUntil = (reservationDate.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntil > (settings.cardImprintCancelHours ?? 24);
    },

    async processNoShow(
        tenantId: string,
        reservationId: string,
        operatorId: string
    ): Promise<{ captured: boolean; amountInMicrounits: number }> {
        const reservation = await Nexus.adapter.get<Reservation>(
            `tenants/${tenantId}/reservations/${reservationId}`
        );

        if (!reservation) throw new Error('Réservation introuvable');

        await Nexus.adapter.update(
            `tenants/${tenantId}/reservations/${reservationId}`,
            { status: 'no_show' }
        );

        const settingsDoc = await Nexus.adapter.get<{ reservations: ReservationSettings }>(
            `tenants/${tenantId}/settings/main`
        );
        const settings = settingsDoc?.reservations;

        let captured = false;
        let amountInMicrounits = 0;

        if (settings?.cardImprintEnabled && reservation.stripePaymentMethodId) {
            const penaltyEuros = settings.cardImprintPenaltyAmount ?? 0;
            if (penaltyEuros > 0) {
                amountInMicrounits = toMicrounits(Math.round(penaltyEuros * 1_000_000));

                await Nexus.adapter.create(
                    `tenants/${tenantId}/noShowCharges/${reservationId}`,
                    {
                        reservationId,
                        paymentMethodId: reservation.stripePaymentMethodId,
                        amountInMicrounits,
                        status: 'pending_capture',
                        createdAt: new Date().toISOString(),
                        operatorId,
                    } as unknown as import('@/shared/nexus-contract').SovereignData
                );
                captured = true;
            }
        }

        empireAudit.log({
            module: 'accounting',
            action: 'no_show_processed',
            userId: operatorId,
            severity: 'medium',
            timestamp: new Date(),
            details: {
                reservationId,
                captured,
                amountInMicrounits,
                customerId: reservation.customerId,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });

        return { captured, amountInMicrounits };
    },
};
