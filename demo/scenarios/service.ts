import { SimulacraEngine } from '../engine/SimulacraEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { DEMO_MENU } from '../fixtures/menu';

export interface ServiceExecutionResult {
  ordersCount: number;
  revenueInMicrounits: number;
  zClosed: boolean;
  customersWithCRM: number;
  wasteEvents: number;
}

// ── ID Helpers ──────────────────────────────────────────────────────────────

function seq(prefix: string, idx: number) {
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── POS Terminal Login (début de service) ────────────────────────────────────

async function openService(engine: SimulacraEngine, service: 'midi' | 'soir') {
  const tenantId = engine.config.tenantId;
  const label = service === 'midi' ? 'Terminal Salle Midi' : 'Terminal Soir';

  // POS login
  await NexusEventBus.emit('pos.terminal_login', {
    v: 1,
    isSimulation: true,
    tenantId,
    terminalId: 'pos_salle_01',
    operatorId: 'emp_srv_1',
    loggedAt: Date.now(),
  });

  // Staff clock-in (chaque membre d'équipe)
  const staffIds = ['emp_mgr_1', 'emp_chef_1', 'emp_srv_1', 'emp_hot_1'];
  for (const userId of staffIds) {
    await NexusEventBus.emit('hr.clock_in', {
      v: 1,
      isSimulation: true,
      tenantId,
      userId,
      timestamp: Date.now(),
    });
    await NexusEventBus.emit('hr.shift_started', {
      v: 1,
      isSimulation: true,
      tenantId,
      shiftId: seq('shift', Date.now()),
      employeeId: userId,
      startedAt: Date.now(),
      role: userId.includes('chef') ? 'chef_cuisinier' : userId.includes('mgr') ? 'manager' : 'serveur',
    });
  }

  // HACCP — relevé température frigo en début de service
  const sensors = ['frigo_viande', 'frigo_poisson', 'frigo_legumes', 'frigo_dessert'];
  for (const sensorId of sensors) {
    const temp = 2 + Math.random() * 2; // 2-4°C — normal
    await NexusEventBus.emit('haccp.temperature_logged', {
      v: 1,
      isSimulation: true,
      tenantId,
      sensorId,
      temperature: Math.round(temp * 10) / 10,
      unit: '°C',
      timestamp: Date.now(),
    });
    await NexusEventBus.emit('haccp.check.saved', {
      v: 1,
      isSimulation: true,
      tenantId,
      checkId: seq('hcpchk', Date.now()),
      operatorId: 'emp_chef_1',
      timestamp: Date.now(),
    });
  }
}

// ── Service Midi complet (12:00 - 14:30) ─────────────────────────────────────

export async function runServiceMidi(
  engine: SimulacraEngine,
  dateStr: string
): Promise<ServiceExecutionResult> {
  const tenantId = engine.config.tenantId;
  const covers = engine.config.coversMidi;
  const ordersCount = Math.ceil(covers / 2.5);

  await openService(engine, 'midi');

  let revenueInMicrounits = 0;
  let customersWithCRM = 0;
  let wasteEvents = 0;

  // Accueil des réservations pré-enregistrées
  await NexusEventBus.emit('reservation.matched', {
    v: 1,
    isSimulation: true,
    tenantId,
    reservationId: 'res_demo_1',
    tableId: 'tbl_101',
    allergens: [],
    covers: 2,
    matchedAt: Date.now(),
  });
  await NexusEventBus.emit('table.assigned', {
    v: 1,
    isSimulation: true,
    tenantId,
    tableId: 'tbl_101',
    reservationId: 'res_demo_1',
    partySize: 2,
  });

  // ── Boucle de commandes ──────────────────────────────────────────────────
  for (let i = 1; i <= ordersCount; i++) {
    const orderId = seq(`ord_midi_${dateStr}`, i);
    const mainDish = DEMO_MENU[i % DEMO_MENU.length];
    const drink = DEMO_MENU[16 + (i % 4)];
    const items = [
      { id: `li_${i}_1`, productId: mainDish.id, name: mainDish.name, quantity: 1, unitPriceInMicrounits: mainDish.priceInMicrounits, vatRate: mainDish.vatRate, totalInMicrounits: mainDish.priceInMicrounits },
      { id: `li_${i}_2`, productId: drink.id, name: drink.name, quantity: 1, unitPriceInMicrounits: drink.priceInMicrounits, vatRate: drink.vatRate, totalInMicrounits: drink.priceInMicrounits },
    ];
    const totalOrder = mainDish.priceInMicrounits + drink.priceInMicrounits;
    revenueInMicrounits += totalOrder;

    // 1. Commande placée → KDS
    await NexusEventBus.emit('order.placed', {
      v: 1, isSimulation: true, tenantId, orderId,
      tableId: `tbl_10${(i % 4) + 1}`,
      operatorId: 'emp_srv_1',
      items: items as any,
    });

    // 2. KDS — réception ticket
    await NexusEventBus.emit('kds.ticket_received', {
      v: 1, isSimulation: true, tenantId, orderId,
      stationId: 'kds_chaud',
      items: items.map(it => ({ id: it.id, productId: it.productId, name: it.name, quantity: 1, course: 1 })),
    });

    // 3. KDS — items marqués en cours puis done
    await NexusEventBus.emit('kds.item_started', {
      v: 1, isSimulation: true, tenantId, orderId,
      itemId: items[0].id, operatorId: 'emp_chef_1',
    });
    await NexusEventBus.emit('kds.item_done', {
      v: 1, isSimulation: true, tenantId, orderId,
      itemId: items[0].id, operatorId: 'emp_chef_1',
    });
    await NexusEventBus.emit('kds.ticket_done', {
      v: 1, isSimulation: true, tenantId, orderId,
    });

    // 4. Proforma imprimé
    await NexusEventBus.emit('order.proforma_printed', {
      v: 1, isSimulation: true, tenantId, orderId,
      tableId: `tbl_10${(i % 4) + 1}`,
      operatorId: 'emp_srv_1',
      totalInMicrounits: totalOrder,
      printedAt: Date.now(),
    });

    // 5. Paiement
    const paymentMode = i % 3 === 0 ? 'cash' : 'card';
    const customerId = i % 4 === 0 ? `cust_midi_${i}` : undefined;
    await NexusEventBus.emit('order.paid', {
      v: 1, isSimulation: true, tenantId, orderId,
      tableId: `tbl_10${(i % 4) + 1}`,
      operatorId: 'emp_srv_1',
      customerId,
      items: items as any,
      totalInMicrounits: totalOrder,
      paymentMode,
    });

    // 6. Scellement NF525
    await NexusEventBus.emit('finance.order_sealed', {
      tenantId, orderId, totalInMicrounits: totalOrder, operatorId: 'emp_srv_1',
    });

    // 7. CRM — fidélité (1/4 des clients)
    if (customerId) {
      customersWithCRM++;
      await NexusEventBus.emit('crm.points_earned', {
        v: 1, isSimulation: true, tenantId, customerId, points: Math.round(totalOrder / 1_000_000), sourceOrderId: orderId,
      });
      // Potentiel unlock récompense
      if (i % 8 === 0) {
        await NexusEventBus.emit('crm.reward_unlocked', {
          tenantId, customerId, rewardId: 'reward_dessert_offert', rewardName: 'Dessert offert',
        });
      }
    }

    // 8. Pourboire CB distribué
    if (paymentMode === 'card' && i % 5 === 0) {
      const tip = Math.round(totalOrder * 0.1);
      await NexusEventBus.emit('hr.tip_distributed', {
        tenantId, orderId, tipInMicrounits: tip, staffIds: ['emp_srv_1', 'emp_chef_1'],
      });
    }

    // 9. Déduction de stock
    await NexusEventBus.emit('inventory.deducted', {
      tenantId, orderId,
      lines: [{ stockItemId: mainDish.ingredientId ?? mainDish.id, quantity: 1 }],
    });

    // 10. Libération de table
    await NexusEventBus.emit('table.released', {
      v: 1, isSimulation: true, tenantId, tableId: `tbl_10${(i % 4) + 1}`, orderId,
    });
    await NexusEventBus.emit('table.cleared', {
      v: 1, isSimulation: true, tenantId, tableId: `tbl_10${(i % 4) + 1}`, orderId, sessionEnd: false,
    });
  }

  // 11. Gaspillage (3 items impactés par service)
  const wasteItems = ['salade_verte_lot_003', 'tomate_cerise_lot_001', 'pain_ciabatta_lot_007'];
  for (const wasteItemId of wasteItems) {
    await NexusEventBus.emit('waste.logged', {
      v: 1, isSimulation: true, tenantId,
      wasteId: seq('waste', Date.now()),
      ingredientId: wasteItemId,
      ingredientName: wasteItemId.replace(/_/g, ' '),
      quantity: 0.3,
      unit: 'kg',
      reason: 'dlc_proche',
    });
    wasteEvents++;
  }

  // 12. Clôture Z (Ticket Z NF525)
  engine.clock.advanceHours(3);
  await NexusEventBus.emit('finance.ticket_z_closed', {
    v: 1, isSimulation: true, tenantId,
    date: dateStr,
    totalInMicrounits: revenueInMicrounits,
    ordersCount,
  });
  await NexusEventBus.emit('finance.z_report_requested', {
    tenantId, operatorId: 'emp_mgr_1', requestedAt: new Date().toISOString(),
  });

  // 13. Événement analytics fin de service
  await NexusEventBus.emit('analytics.sales_data_ready', {
    tenantId,
    periodStart: `${dateStr}T12:00:00Z`,
    periodEnd: `${dateStr}T15:00:00Z`,
    totalInMicrounits: revenueInMicrounits,
    covers,
  });

  return { ordersCount, revenueInMicrounits, zClosed: true, customersWithCRM, wasteEvents };
}

// ── Service Soir complet (19:00 - 22:30) ─────────────────────────────────────

export async function runServiceSoir(
  engine: SimulacraEngine,
  dateStr: string
): Promise<ServiceExecutionResult> {
  const tenantId = engine.config.tenantId;
  const covers = engine.config.coversSoir;
  const ordersCount = Math.ceil(covers / 2.5);

  await openService(engine, 'soir');

  let revenueInMicrounits = 0;
  let customersWithCRM = 0;
  let wasteEvents = 0;

  // Accueil grand groupe avec acompte
  await NexusEventBus.emit('biggroup.confirmed', {
    v: 1, isSimulation: true, tenantId,
    reservationId: 'res_demo_2',
    covers: 6,
    date: dateStr,
    customerId: 'cust_groupe_dupont',
  });
  await NexusEventBus.emit('reservation.matched', {
    v: 1, isSimulation: true, tenantId,
    reservationId: 'res_demo_2',
    tableId: 'tbl_104',
    allergens: ['gluten', 'lait'],
    covers: 6,
    matchedAt: Date.now(),
  });
  // Alerte allergie → KDS
  await NexusEventBus.emit('crm.allergen_flagged', {
    v: 1, isSimulation: true, tenantId,
    customerId: 'cust_groupe_dupont',
    reservationId: 'res_demo_2',
    allergens: ['gluten', 'lait'],
    tableId: 'tbl_104',
    flaggedAt: Date.now(),
  });

  // ── Boucle de commandes soir ─────────────────────────────────────────────
  for (let i = 1; i <= ordersCount; i++) {
    const orderId = seq(`ord_soir_${dateStr}`, i);
    const starter = DEMO_MENU[i % 5];
    const main = DEMO_MENU[5 + (i % 7)];
    const dessert = DEMO_MENU[12 + (i % 4)];
    const drink = DEMO_MENU[16 + (i % 4)];

    const items = [
      { id: `li_s${i}_1`, productId: starter.id, name: starter.name, quantity: 1, unitPriceInMicrounits: starter.priceInMicrounits, vatRate: starter.vatRate, totalInMicrounits: starter.priceInMicrounits },
      { id: `li_s${i}_2`, productId: main.id, name: main.name, quantity: 1, unitPriceInMicrounits: main.priceInMicrounits, vatRate: main.vatRate, totalInMicrounits: main.priceInMicrounits },
      { id: `li_s${i}_3`, productId: dessert.id, name: dessert.name, quantity: 1, unitPriceInMicrounits: dessert.priceInMicrounits, vatRate: dessert.vatRate, totalInMicrounits: dessert.priceInMicrounits },
      { id: `li_s${i}_4`, productId: drink.id, name: drink.name, quantity: 1, unitPriceInMicrounits: drink.priceInMicrounits, vatRate: drink.vatRate, totalInMicrounits: drink.priceInMicrounits },
    ];
    const totalOrder = items.reduce((s, it) => s + it.totalInMicrounits, 0);
    revenueInMicrounits += totalOrder;

    // Commande → KDS avec courses (entrée, plat, dessert)
    await NexusEventBus.emit('order.placed', {
      v: 1, isSimulation: true, tenantId, orderId,
      tableId: `tbl_10${(i % 5) + 1}`,
      operatorId: 'emp_srv_1',
      items: items as any,
    });
    await NexusEventBus.emit('kds.ticket_received', {
      v: 1, isSimulation: true, tenantId, orderId,
      stationId: 'kds_chaud',
      items: items.map((it, idx) => ({ id: it.id, productId: it.productId, name: it.name, quantity: 1, course: idx + 1 })),
    });

    // Fire courses par séquence
    for (let course = 1; course <= 3; course++) {
      await NexusEventBus.emit('kds.course_fired', {
        v: 1, isSimulation: true, tenantId, orderId, course,
      });
      await NexusEventBus.emit('kds.fire_next_course', {
        v: 1, isSimulation: true, tenantId, orderId,
        course, stationId: 'kds_chaud', firedBy: 'emp_chef_1', firedAt: Date.now(),
      });
    }
    await NexusEventBus.emit('kds.bumped', {
      v: 1, isSimulation: true, tenantId, orderId, stationId: 'kds_chaud',
    });

    // Paiement
    const customerId = i % 3 === 0 ? `cust_soir_${i}` : undefined;
    const paymentMode = i % 4 === 0 ? 'cash' : i % 4 === 1 ? 'card' : 'card';
    await NexusEventBus.emit('order.paid', {
      v: 1, isSimulation: true, tenantId, orderId,
      tableId: `tbl_10${(i % 5) + 1}`,
      operatorId: 'emp_srv_1',
      customerId,
      items: items as any,
      totalInMicrounits: totalOrder,
      paymentMode,
    });
    await NexusEventBus.emit('finance.order_sealed', {
      tenantId, orderId, totalInMicrounits: totalOrder, operatorId: 'emp_srv_1',
    });

    // TVA — vérification
    const expectedVat = Math.round(totalOrder * 10 / 110);
    await NexusEventBus.emit('analytics.sales_data_ready', {
      tenantId,
      periodStart: `${dateStr}T19:00:00Z`,
      periodEnd: `${dateStr}T19:01:00Z`,
      totalInMicrounits: totalOrder,
      covers: items.length,
    });

    // CRM
    if (customerId) {
      customersWithCRM++;
      await NexusEventBus.emit('crm.points_earned', {
        v: 1, isSimulation: true, tenantId, customerId, points: Math.round(totalOrder / 1_000_000), sourceOrderId: orderId,
      });
      // Potentiel birthday le soir
      if (i % 10 === 0) {
        await NexusEventBus.emit('crm.birthday_approaching', {
          v: 1, isSimulation: true, tenantId, customerId, birthdayAt: dateStr, daysUntil: 0,
        });
      }
      // RFM Trigger
      await NexusEventBus.emit('crm.rfm_trigger', { tenantId, customerId });
    }

    // Pourboire CB
    if (paymentMode === 'card') {
      const tip = Math.round(totalOrder * 0.12);
      await NexusEventBus.emit('hr.tip_distributed', {
        tenantId, orderId, tipInMicrounits: tip, staffIds: ['emp_srv_1', 'emp_chef_1', 'emp_hot_1'],
      });
    }

    // Stock déduction
    await NexusEventBus.emit('inventory.deducted', {
      tenantId, orderId,
      lines: items.map(it => ({ stockItemId: it.productId, quantity: 1 })),
    });

    // Libération table
    await NexusEventBus.emit('table.released', {
      v: 1, isSimulation: true, tenantId, tableId: `tbl_10${(i % 5) + 1}`, orderId,
    });
  }

  // BCG Matrix Intelligence — fin de journée
  await NexusEventBus.emit('intelligence.menu_engineering_requested', {
    tenantId, periodDays: 7,
  });
  await NexusEventBus.emit('intelligence.bcg_calculated', {
    tenantId,
    stars: ['prod_plat_1', 'prod_plat_2'],
    plowhorses: ['prod_plat_6'],
    puzzles: ['prod_ent_5'],
    dogs: ['prod_des_3'],
    calculatedAt: new Date().toISOString(),
  });

  // HACCP — cycle de refroidissement légal (bouillons, fonds de sauce)
  await NexusEventBus.emit('haccp.cooling_cycle_logged', {
    v: 1, isSimulation: true, tenantId,
    batchId: seq('batch_fond', Date.now()),
    productId: 'prod_plat_4',
    productName: 'Fond de veau',
    startTempCelsius: 85,
    endTempCelsius: 3,
    durationMinutes: 90,
    operatorId: 'emp_chef_1',
    compliant: true,
    loggedAt: Date.now(),
  });

  // Clôture Z soir
  engine.clock.advanceHours(4);
  await NexusEventBus.emit('finance.ticket_z_closed', {
    v: 1, isSimulation: true, tenantId,
    date: dateStr,
    totalInMicrounits: revenueInMicrounits,
    ordersCount,
  });

  // Avis post-repas (simulation — 10% négatif, 90% positif)
  const positiveReviews = Math.floor(ordersCount * 0.9);
  const negativeReviews = ordersCount - positiveReviews;
  for (let k = 0; k < positiveReviews; k++) {
    await NexusEventBus.emit('review.positive', {
      v: 1, isSimulation: true, tenantId,
      reviewId: seq('rev_pos', k),
      customerId: `cust_review_${k}`,
      rating: 4 + (k % 2),
      platform: k % 2 === 0 ? 'google' : 'tripadvisor',
      content: 'Excellent repas, service impeccable !',
    });
  }
  for (let k = 0; k < negativeReviews; k++) {
    await NexusEventBus.emit('review.negative', {
      v: 1, isSimulation: true, tenantId,
      reviewId: seq('rev_neg', k),
      customerId: `cust_review_neg_${k}`,
      rating: 2 + (k % 2),
      platform: 'google',
      content: 'Service un peu long ce soir.',
    });
  }

  // Fin de service — clock-out staff
  for (const userId of ['emp_mgr_1', 'emp_chef_1', 'emp_srv_1', 'emp_hot_1']) {
    await NexusEventBus.emit('hr.shift_ended', {
      v: 1, isSimulation: true, tenantId,
      shiftId: seq('shift_end', Date.now()),
      employeeId: userId,
      endedAt: Date.now(),
    });
    // Vérification pause légale 30min
    await NexusEventBus.emit('hr.break_checked', {
      v: 1, isSimulation: true, tenantId,
      employeeId: userId,
      shiftId: seq('shift_brk', Date.now()),
      shiftDurationHours: 8,
      breakMinutes: 30,
      required: true,
      compliant: true,
    });
  }

  await NexusEventBus.emit('service.end', { tenantId });

  return { ordersCount, revenueInMicrounits, zClosed: true, customersWithCRM, wasteEvents };
}
