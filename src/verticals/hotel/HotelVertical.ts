import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  HotelOpsAdapter,
  HotelCommerceAdapter,
  HotelFinanceAdapter,
  HotelFacilityAdapter,
  HotelHumanAdapter,
  HotelIntelligenceAdapter,
  HotelLogisticsAdapter,
  HotelMccAdapter,
} from './adapters';

export class HotelVertical implements IVerticalPlugin {
  public readonly id = 'hotel';
  public readonly name = 'Hotel OS';
  public readonly version = '1.0.0';
  public readonly description = 'PMS, Housekeeping, Yield Management, City Ledger, Channel Manager';
  public readonly dependencies = ['finance', 'commerce', 'human', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale hôtel…`);

    // Routes
    context.registerRoute('/pms', React.lazy(() =>
      import('./pms/components/PMSDashboard').then(m => ({ default: m.PMSDashboard }))));
    context.registerRoute('/housekeeping', React.lazy(() =>
      import('./ops/housekeeping').then(m => ({ default: m.HousekeepingPage }))));
    context.registerRoute('/yield', React.lazy(() =>
      import('./commerce/yield').then(m => ({ default: m.YieldManagementPage }))));
    context.registerRoute('/city-ledger', React.lazy(() =>
      import('./finance/city-ledger').then(m => ({ default: m.CityLedgerPage }))));

    // Ops — check-in → facturation folio + housekeeping libéré
    context.registerEventHandler<{ tenantId: string; reservationId: string; guestId: string; roomId: string; checkedInAt: string }>(
      'hotel.guest_checked_in',
      ({ tenantId, reservationId, guestId, roomId, checkedInAt }) => {
        HotelOpsAdapter.emitRoomStatusChanged({ tenantId, roomId, status: 'DIRTY' });
        HotelFinanceAdapter.emitFolioCharged({ tenantId, guestId, reservationId, amountInMicrounits: 0, description: 'Ouverture folio check-in' });
        HotelIntelligenceAdapter.emitOccupancySnapshot({ tenantId, date: checkedInAt.slice(0, 10), occupancyRate: 0, revpar: 0 });
      },
    );

    // Ops — check-out → clôture folio + libération chambre + audit fiscal si montant anormal
    context.registerEventHandler<{ tenantId: string; reservationId: string; guestId: string; roomId: string; totalInMicrounits: number }>(
      'hotel.guest_checked_out',
      ({ tenantId, reservationId, guestId, roomId, totalInMicrounits }) => {
        HotelFinanceAdapter.emitFolioCharged({ tenantId, guestId, reservationId, amountInMicrounits: totalInMicrounits, description: 'Clôture folio check-out' });
        HotelOpsAdapter.emitRoomStatusChanged({ tenantId, roomId, status: 'DIRTY' });
        HotelHumanAdapter.emitHousekeeperAssigned({ tenantId, employeeId: 'auto', taskId: `clean-${roomId}-${Date.now()}`, roomId });
        // Audit fiscal si séjour > 10 000 € (seuil anti-blanchiment simplifié)
        if (totalInMicrounits > 10_000 * 1_000_000) {
          HotelMccAdapter.emitFiscalAuditRequired({ tenantId, reason: `Séjour ${reservationId} : montant élevé ${(totalInMicrounits / 1_000_000).toFixed(2)} €`, urgency: 'high' });
        }
      },
    );

    // Chambre sale → tâche housekeeping auto-assignée
    context.registerEventHandler<{ tenantId: string; roomId: string; status: 'CLEAN' | 'DIRTY' | 'MAINTENANCE' }>(
      'hotel.room_status_changed',
      ({ tenantId, roomId, status }) => {
        if (status === 'DIRTY') {
          HotelHumanAdapter.emitHousekeeperAssigned({ tenantId, employeeId: 'auto', taskId: `clean-${roomId}-${Date.now()}`, roomId });
        }
        if (status === 'MAINTENANCE') {
          HotelFacilityAdapter.emitRoomMaintenanceRequired({ tenantId, roomId, issue: 'Chambre en maintenance', priority: 'medium' });
        }
      },
    );

    // Commerce — room booked → yield rate update signal
    context.registerEventHandler<{ tenantId: string; reservationId: string; guestId: string; roomType: string; channel: string; arrivalDate: string; departureDate: string; rateInMicrounits: number }>(
      'hotel.room_booked',
      ({ tenantId, roomType, arrivalDate, rateInMicrounits }) => {
        HotelCommerceAdapter.emitYieldRateUpdated({ tenantId, roomType, date: arrivalDate, newRateInMicrounits: rateInMicrounits });
      },
    );

    // Finance — city ledger entry
    context.registerEventHandler<{ tenantId: string; companyId: string; amountInMicrounits: number; reference: string }>(
      'hotel.city_ledger_entry',
      ({ tenantId, companyId, amountInMicrounits, reference }) => {
        HotelFinanceAdapter.emitCityLedgerEntry({ tenantId, companyId, amountInMicrounits, reference });
      },
    );

    // Logistics — amenity consommé → réapprovisionnement si besoin
    context.registerEventHandler<{ tenantId: string; roomId: string; itemId: string; quantity: number }>(
      'hotel.amenity_consumed',
      ({ tenantId, roomId, itemId, quantity }) => {
        HotelLogisticsAdapter.emitAmenityConsumed({ tenantId, roomId, itemId, quantity });
      },
    );

    // Facility — maintenance chambre
    context.registerEventHandler<{ tenantId: string; roomId: string; issue: string; priority: 'low' | 'medium' | 'high' }>(
      'hotel.room_maintenance_required',
      ({ tenantId, roomId, issue, priority }) => {
        HotelFacilityAdapter.emitRoomMaintenanceRequired({ tenantId, roomId, issue, priority });
      },
    );

    // MCC — health ping au démarrage
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        HotelMccAdapter.emitHealthPing({ tenantId, status: 'healthy', pmsOnline: true, occupancy: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale hôtel active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale hôtel.`);
  }
}
