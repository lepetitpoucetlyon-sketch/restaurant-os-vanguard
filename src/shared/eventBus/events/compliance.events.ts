export interface COMPLIANCEEvents {
  'sovereign.breach': {
    v: 1;
    isSimulation?: boolean;
    targetTenantId: string;
    anchoredTenantId: string;
    path?: string;
    message: string;
  };

  'haccp.check.saved': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    checkId: string;
    operatorId: string;
    timestamp: number;
  };

  'haccp.nonconform': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    checkId: string;
    correctionDeadline: number;
  };

  'compliance.deadline_approaching': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    type: string;
    daysLeft: number;
  };

  'security.pin_locked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    terminalId: string;
    lockedUntil: number;
  };

  'haccp.alert': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    readingId: string;
    alertType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  };

  'haccp.temperature_logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    temperature: number;
    unit: string;
    timestamp: number;
  };

  'recall.declared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    recallId: string;
    productIds: string[];
    reason: string;
  };

  'cert.expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    certId: string;
    certType: string;
    entityName: string;
    expiredAt: string;
  };

  'compliance.calendar': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    eventType: 'audit' | 'renewal' | 'inspection' | 'training';
    title: string;
    dueDate: string;
    daysUntilDue: number;
  };

  'dlc.expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    batchNumber: string;
    quantity: number;
  };

  'iot.offline': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    lastSeenAt: number;
  };

  'sensor.temperature_anomaly': {
    v: 1;
    tenantId: string;
    sensorId: string;
    temperature: number;
    durationInMinutes: number;
  };

  'crm.allergen_flagged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    reservationId: string;
    allergens: string[];
    tableId: string;
    flaggedAt: number;
  };

  'haccp.cooling_cycle_logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    batchId: string;
    productId: string;
    productName: string;
    startTempCelsius: number;
    endTempCelsius: number;
    durationMinutes: number;
    operatorId: string;
    compliant: boolean;
    loggedAt: number;
  };

  'crypto.integrity_failed': {
    v: 1;
    tenantId: string;
    journalId: string;
    expectedHash: string;
    actualHash: string;
    detectedAt: number;
  };

  'security.unauthorized_access_attempt': {
    v: 1;
    tenantId: string;
    resource: string;
    ipAddress: string;
    reason: 'invalid_hmac' | 'expired_token' | 'ip_throttled' | 'user_not_found';
    attemptedAt: number;
  };

  'compliance.recall_broadcast': { v:1; tenantId: string; recallId: string; productRef: string; affectedBatchIds: string[]; affectedTenantCount: number; broadcastAt: number };

  'compliance.disinfection_sequence_violation': { v:1; tenantId: string; stationId: string; fromTask: string; toTask: string; requiredProtocol: string; violatedAt: number };

  'compliance.oil_friture_test_required': { v:1; tenantId: string; frituseId: string; lastTestAt?: number; reason: 'first_use' | 'daily_limit'; triggeredAt: number };

  'compliance.bsdd_waste_oil_recorded': { v:1; tenantId: string; entryId: string; volumeLiters: number; collectorSiret?: string; recordedAt: number };

  'security.mass_data_export_alert': { v:1; tenantId: string; actorId: string; exportedCount: number; thresholdCount: number; resourceType: string; alertedAt: number };

  'compliance.co2_alarm_triggered': { v:1; tenantId: string; locationId: string; ppmLevel: number; threshold: number; triggeredAt: number };

  'compliance.fire_safety_test_due': { v:1; tenantId: string; testType: 'baes_monthly' | 'annual_commission'; lastTestAt?: number; dueAt: number };

  'compliance.water_cut_protocol_triggered': { v:1; tenantId: string; detectedAt: number; estimatedRestorationIso?: string; notifiedOperatorId: string };

  'compliance.breathalyzer_test_due': { v:1; tenantId: string; erp: boolean; reason: 'nightly' | 'incident'; dueAt: number };

  'security.admin_session_revoked': { v:1; uid: string; reason: string; revokedAt: number };

  'compliance.witness_dish_checklist_created': { v:1; tenantId: string; reservationId: string; couverts: number; dishCount: number; retainUntil: number; createdAt: number };

  'compliance.frying_oil_threshold_exceeded': { v:1; tenantId: string; stationId: string; polarCompoundsPct: number; maxAllowed: number; testedAt: number };

  'compliance.breathalyzer_stock_low': { v:1; tenantId: string; currentStock: number; minStock: number; detectedAt: number };

  'compliance.nf525_cert_expiry_alert': { v:1; tenantId: string; certNumber: string; daysUntilExpiry: number; severity: 'warning' | 'critical' | 'expired'; detectedAt: number };

  'compliance.haccp_frequency_violated': { v:1; tenantId: string; taskType: string; equipmentId: string; requiredFrequencyPerDay: number; actualLoggedCount: number; alertedAt: number };

  'compliance.iot_sensor_fault': { v:1; tenantId: string; sensorId: string; equipmentId: string; faultType: 'radio_lost' | 'power_lost' | 'true_temperature_breach'; tempCelsius?: number; detectedAt: number };

  'compliance.tiac_emergency_opened': { v:1; tenantId: string; incidentId: string; suspectedDishes: string[]; affectedCovers: number; reportedAt: number };

  'compliance.food_donation_report_generated': { v:1; tenantId: string; periodLabel: string; totalWeightKg: number; beneficiaryOrg: string; generatedAt: number };

  'compliance.crustacean_tank_alert': { v:1; tenantId: string; tankId: string; oxygenLevelMgL: number; tempCelsius: number; salinityPpt: number; isCritical: boolean; detectedAt: number };

  'compliance.grease_trap_alert': { v:1; tenantId: string; trapId: string; saturationPct: number; requiresEmptying: boolean; detectedAt: number };

  'compliance.emergency_exit_verified': { v:1; tenantId: string; exitId: string; photoVerificationUrl: string; verifiedBy: string; verifiedAt: number };

  'compliance.hood_delta_t_critical': { v:1; tenantId: string; hoodId: string; deltaTCelsius: number; gasCutoffTriggered: boolean; detectedAt: number };

  'compliance.thawing_protocol_violation': { v:1; tenantId: string; batchId: string; methodUsed: string; isHotWaterForbidden: boolean; detectedAt: number };

  'compliance.pest_control_3d_recorded': { v:1; tenantId: string; interventionDateIso: string; providerSiret: string; certNumber: string; recordedAt: number };

  'compliance.cleaning_rinse_validated': { v:1; tenantId: string; zoneId: string; residualPh: number; isRinseComplete: boolean; validatedAt: number };

  'compliance.meat_aging_humidity_alert': { v:1; tenantId: string; chamberId: string; relativeHumidityPct: number; minAllowedPct: number; maxAllowedPct: number; detectedAt: number };

  'compliance.dining_room_co2_warning': { v:1; tenantId: string; roomZone: string; co2Ppm: number; vmcBoostActivated: boolean; alertedAt: number };

  'security.cross_tenant_role_delegated': { v:1; masterAdminId: string; targetTenantId: string; assignedRole: string; delegatedAt: number };

  'security.gdpr_anonymized': { v:1; tenantId: string; customerId: string; anonymizedFieldsCount: number; anonymizedAt: number };

  'security.lockdown_enforced': { v:1; tenantId: string; reason: string; revokedTokensCount: number; lockedAt: number };

  'compliance.critical_waste_detected': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reading: import('@nexus/contracts').SensorReading;
    impactedStock?: import('@nexus/contracts').StockItem[];
    detectedAt: number;
  };
}

