/**
 * VERTICALEvents — Events spécifiques aux verticales métier.
 * Chaque verticale a sa propre section (hotel, health, auto, bakery, salon, retail).
 * Pour ajouter une nouvelle verticale : ajouter une section ici + l'inclure dans catalog.ts.
 */

export interface VERTICALEvents {
  // ── Connecteurs ──────────────────────────────────────────────────────────
  'connectors.auto_activated': { tenantId: string; variant: string; connectors: { id: string; status: 'active' | 'pending_config' }[] };
  'connectors.activated': { tenantId: string; connectorId: string; activatedBy: string };
  'connectors.deactivated': { tenantId: string; connectorId: string; deactivatedBy: string };
  'connectors.config_saved': { tenantId: string; connectorId: string; savedBy: string };
  'connectors.sync_completed': { tenantId: string; connectorId: string; itemsSynced: number };
  'connectors.sync_failed': { tenantId: string; connectorId: string; error: string };

  // ── Vertical: Hotel ──────────────────────────────────────────────────────
  'hotel.guest_checked_in': { tenantId: string; reservationId: string; guestId: string; roomId: string; checkedInAt: string };
  'hotel.guest_checked_out': { tenantId: string; reservationId: string; guestId: string; roomId: string; totalInMicrounits: number };
  'hotel.room_status_changed': { tenantId: string; roomId: string; status: 'CLEAN' | 'DIRTY' | 'MAINTENANCE' };
  'hotel.housekeeping_task_created': { tenantId: string; taskId: string; roomId: string; assignedTo?: string };
  'hotel.folio_charged': { tenantId: string; guestId: string; reservationId: string; amountInMicrounits: number; description: string };
  'hotel.city_ledger_entry': { tenantId: string; companyId: string; amountInMicrounits: number; reference: string };
  'hotel.room_booked': { tenantId: string; reservationId: string; guestId: string; roomType: string; channel: string; arrivalDate: string; departureDate: string; rateInMicrounits: number };
  'hotel.yield_rate_updated': { tenantId: string; roomType: string; date: string; newRateInMicrounits: number };
  'hotel.fire_safety_check': { tenantId: string; checkId: string; result: 'ok' | 'nok'; floor: number };
  'hotel.housekeeper_assigned': { tenantId: string; employeeId: string; taskId: string; roomId: string };
  'hotel.amenity_consumed': { tenantId: string; roomId: string; itemId: string; quantity: number };
  'hotel.occupancy_snapshot': { tenantId: string; date: string; occupancyRate: number; revpar: number };
  'hotel.room_maintenance_required': { tenantId: string; roomId: string; issue: string; priority: 'low' | 'medium' | 'high' };

  // ── Vertical: Health ─────────────────────────────────────────────────────
  'health.patient_admitted': { tenantId: string; patientId: string; wardId: string; admittedAt: string; pathology?: string };
  'health.patient_discharged': { tenantId: string; patientId: string; wardId: string; dischargedAt: string };
  'health.bed_status_changed': { tenantId: string; bedId: string; wardId: string; status: 'available' | 'occupied' | 'cleaning' | 'maintenance' };
  'health.insurance_claim_submitted': { tenantId: string; patientId: string; claimId: string; amountInMicrounits: number; insurerId: string };
  'health.act_billed': { tenantId: string; patientId: string; actCode: string; amountInMicrounits: number; practitionerId: string };
  'health.hds_audit_log': { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string };
  'health.consent_recorded': { tenantId: string; patientId: string; consentType: string; grantedAt: string };
  'health.appointment_booked': { tenantId: string; appointmentId: string; patientId: string; practitionerId: string; slot: string };
  'health.appointment_cancelled': { tenantId: string; appointmentId: string; reason: string };
  'health.practitioner_on_call': { tenantId: string; practitionerId: string; specialty: string; onCallFrom: string; onCallUntil: string };
  'health.medication_dispensed': { tenantId: string; patientId: string; medicationId: string; quantity: number; dispensedBy: string };
  'health.supply_reorder_needed': { tenantId: string; supplyId: string; currentStock: number; reorderThreshold: number };
  'health.patient_flow_snapshot': { tenantId: string; date: string; admissions: number; discharges: number; occupancyRate: number };
  'health.equipment_maintenance_required': { tenantId: string; equipmentId: string; type: string; dueDate: string; critical: boolean };

  // ── Vertical: Auto ───────────────────────────────────────────────────────
  'auto.vehicle_checked_in': { tenantId: string; vehicleId: string; vin: string; customerId: string; mileage: number; checkedInAt: string };
  'auto.diagnostic_completed': { tenantId: string; vehicleId: string; workOrderId: string; faults: { code: string; severity: 'low' | 'medium' | 'critical' }[] };
  'auto.repair_started': { tenantId: string; workOrderId: string; technicianId: string; startedAt: string };
  'auto.vehicle_released': { tenantId: string; vehicleId: string; workOrderId: string; customerId: string; releasedAt: string };
  'auto.invoice_issued': { tenantId: string; workOrderId: string; customerId: string; totalInMicrounits: number; laborInMicrounits: number; partsInMicrounits: number };
  'auto.warranty_claim_submitted': { tenantId: string; vehicleId: string; claimId: string; amountInMicrounits: number; manufacturerId: string };
  'auto.part_consumed': { tenantId: string; partId: string; workOrderId: string; quantity: number };
  'auto.part_reorder_needed': { tenantId: string; partId: string; partNumber: string; currentStock: number; reorderQty: number };
  'auto.certification_expiry': { tenantId: string; vehicleId: string; certType: 'ct' | 'pollution'; expiresAt: string };
  'auto.appointment_booked': { tenantId: string; appointmentId: string; customerId: string; vehicleId: string; serviceType: string; slot: string };
  'auto.customer_satisfaction_logged': { tenantId: string; workOrderId: string; customerId: string; score: number; comment?: string };
  'auto.technician_assigned': { tenantId: string; technicianId: string; workOrderId: string; estimatedHours: number };
  'auto.workshop_metrics_snapshot': { tenantId: string; date: string; workOrdersCompleted: number; avgRepairTimeMinutes: number; revenueInMicrounits: number };
  'auto.lift_maintenance_required': { tenantId: string; liftId: string; issue: string; dueDate: string };

  // ── Vertical: Bakery ─────────────────────────────────────────────────────
  'bakery.batch_started': { tenantId: string; batchId: string; recipe: string; quantity: number; ovenId: string; startedAt: string };
  'bakery.batch_completed': { tenantId: string; batchId: string; recipe: string; yield: number; completedAt: string };
  'bakery.oven_temp_alert': { tenantId: string; ovenId: string; currentTemp: number; targetTemp: number; severity: 'warning' | 'critical' };
  'bakery.preorder_received': { tenantId: string; preorderId: string; customerId: string; items: { productId: string; quantity: number }[]; pickupDate: string };
  'bakery.display_stock_low': { tenantId: string; productId: string; currentStock: number; threshold: number };
  'bakery.allergen_declared': { tenantId: string; productId: string; allergens: string[]; updatedAt: string };
  'bakery.ingredient_consumed': { tenantId: string; batchId: string; lines: { ingredientId: string; quantity: number }[] };
  'bakery.waste_logged': { tenantId: string; batchId: string; productId: string; quantity: number; reason: string };
  'bakery.metrics_snapshot': { tenantId: string; date: string; batchesProduced: number; wastePercent: number; revenueInMicrounits: number };

  // ── Vertical: Salon ──────────────────────────────────────────────────────
  'salon.appointment_booked': { tenantId: string; appointmentId: string; customerId: string; stylistId: string; service: string; slot: string };
  'salon.appointment_completed': { tenantId: string; appointmentId: string; customerId: string; stylistId: string; durationMinutes: number; totalInMicrounits: number };
  'salon.appointment_cancelled': { tenantId: string; appointmentId: string; reason: string; customerId: string };
  'salon.no_show': { tenantId: string; appointmentId: string; customerId: string; stylistId: string };
  'salon.stylist_assigned': { tenantId: string; stylistId: string; appointmentId: string };
  'salon.product_consumed': { tenantId: string; productId: string; quantity: number; appointmentId: string };
  'salon.loyalty_earned': { tenantId: string; customerId: string; points: number; sourceAppointmentId: string };
  'salon.chair_metrics_snapshot': { tenantId: string; date: string; totalAppointments: number; utilization: number; revenueInMicrounits: number };

  // ── Vertical: Retail ─────────────────────────────────────────────────────
  'retail.sale_completed': { tenantId: string; saleId: string; customerId?: string; lines: { productId: string; quantity: number; unitPriceInMicrounits: number }[]; totalInMicrounits: number; paymentMethod: string };
  'retail.return_processed': { tenantId: string; returnId: string; originalSaleId: string; lines: { productId: string; quantity: number }[]; refundInMicrounits: number };
  'retail.stock_alert': { tenantId: string; productId: string; sku: string; currentStock: number; threshold: number };
  'retail.promotion_activated': { tenantId: string; promotionId: string; discountPercent: number; productIds: string[]; validUntil: string };
  'retail.pos_session_opened': { tenantId: string; sessionId: string; operatorId: string; openedAt: string; openingFloat: number };
  'retail.pos_session_closed': { tenantId: string; sessionId: string; operatorId: string; closedAt: string; totalInMicrounits: number };
  'retail.loyalty_earned': { tenantId: string; customerId: string; points: number; sourceSaleId: string };
  'retail.metrics_snapshot': { tenantId: string; date: string; transactions: number; revenueInMicrounits: number; avgBasketInMicrounits: number };

  // ── Vertical: Gym ────────────────────────────────────────────────────────
  'gym.class_booked': { tenantId: string; classId: string; memberId: string; slot: string };
  'gym.turnstile_scanned': { tenantId: string; memberId: string; accessGranted: boolean; turnstileId: string };

  // ── Vertical: Coworking ──────────────────────────────────────────────────
  'coworking.meeting_room_booked': { tenantId: string; roomId: string; companyId: string; hours: number };
  'coworking.desk_checked_in': { tenantId: string; deskId: string; memberId: string; checkedInAt: string };

  // ── Vertical: Veterinary ────────────────────────────────────────────────
  'veterinary.vaccine_reminder_sent': { tenantId: string; animalId: string; ownerId: string; vaccineName: string };
  'veterinary.pet_consultation_completed': { tenantId: string; consultationId: string; animalId: string; vetId: string };
  'veterinary.icad_chip_scanned': { tenantId: string; icadNumber: string; animalId: string };

  // ── Vertical: Florist ───────────────────────────────────────────────────
  'florist.arrangement_created': { tenantId: string; arrangementId?: string; recipeId?: string; floristId?: string; orderId?: string; customerId?: string; flowers?: string[] };
  'florist.perishable_stem_logged': { tenantId: string; stemType: string; quantity: number; expiryDate: string };
  'florist.delivery_dispatched': { tenantId: string; deliveryId: string; recipientAddress: string };
}
