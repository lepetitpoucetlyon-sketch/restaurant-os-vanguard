import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PlatformVariant } from '@nexus/contracts';
import { SovereignMath } from '@/lib/services/SovereignMath';
import { resolveMetricLabels } from '@/verticals/_shared/labels';

interface OrderRecord {
  status: string;
  totalInMicrounits?: number | null;
  totalInCents?: number | null;
  createdAt: number;
  covers?: number;
  items?: Array<{ name: string; productId: string; quantity: number }>;
}

interface ReservationRecord {
  date: string; // ISO "YYYY-MM-DD"
  partySize?: number;
  covers?: number;
  status: string;
}

/**
 * Builds a weekly HTML report for the given date range.
 *
 * @param startDate - Unix timestamp (ms) for the start of the week (Monday 00:00)
 * @param endDate   - Unix timestamp (ms) for the end of the week (Sunday 23:59:59)
 * @returns HTML string ready to be sent as an email body
 */
export async function buildWeeklyReportHTML(
  startDate: number,
  endDate: number,
  tenantId?: string,
  variant: PlatformVariant = 'restaurant'
): Promise<string> {
  const labels = resolveMetricLabels(variant);
  // Dynamic import so this module can be used without bundling Nexus at module level
  const { Nexus } = await import('@/lib/nexus/NexusAdapter');

  const startISO = new Date(startDate).toISOString().split('T')[0];
  const endISO = new Date(endDate).toISOString().split('T')[0];

  const ordersPath = tenantId ? `tenants/${tenantId}/orders` : Nexus.getTenantPath('orders');
  const resPath = tenantId ? `tenants/${tenantId}/reservations` : Nexus.getTenantPath('reservations');

  const [orders, reservations] = await Promise.all([
    Nexus.adapter.query<OrderRecord>(ordersPath, {
      where: [
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ],
    }).catch(() => [] as OrderRecord[]),
    Nexus.adapter
      .query<ReservationRecord>(resPath, {
        where: [
          { field: 'date', operator: '>=', value: startISO },
          { field: 'date', operator: '<=', value: endISO },
        ],
      })
      .catch(() => [] as ReservationRecord[]),
  ]);

  const weekOrders = orders.filter(
    (o) => o.status === 'paid' || o.status === 'delivered'
  );

  // Revenue totals
  const totalMicrounits = weekOrders.reduce(
    (acc, o) => SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o)),
    0
  );
  const totalRevenue = SovereignMath.fromMicrounits(totalMicrounits);
  const totalUnits = weekOrders.reduce((acc, o) => acc + (o.covers ?? 1), 0);
  const avgSpend =
    weekOrders.length > 0
      ? Math.round(
          SovereignMath.fromMicrounits(
            SovereignMath.divide(totalMicrounits, weekOrders.length)
          ) * 100
        ) / 100
      : 0;

  // Top products by quantity sold
  const productCounts = new Map<string, { name: string; count: number }>();
  for (const o of weekOrders) {
    for (const item of o.items ?? []) {
      const prev = productCounts.get(item.productId);
      if (prev) {
        prev.count += item.quantity;
      } else {
        productCounts.set(item.productId, { name: item.name, count: item.quantity });
      }
    }
  }
  const topProducts = Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Reservations by day
  const weekStart = new Date(startDate);
  const weekEnd = new Date(endDate);
  const weekReservations = reservations.filter((r) => {
    const d = new Date(r.date);
    return d >= weekStart && d <= weekEnd;
  });

  const resByDay = new Map<string, number>();
  for (const r of weekReservations) {
    const key = r.date.slice(0, 10);
    resByDay.set(key, (resByDay.get(key) ?? 0) + (r.covers ?? r.partySize ?? 0));
  }

  // Format labels
  const startLabel = format(new Date(startDate), 'd MMM', { locale: fr });
  const endLabel = format(new Date(endDate), 'd MMM yyyy', { locale: fr });
  const generatedLabel = format(new Date(), "d MMM yyyy 'à' HH:mm", { locale: fr });

  // Build HTML table rows
  const productRows = topProducts.length
    ? topProducts
        .map(
          (p, i) =>
            `<tr>
               <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;font-size:13px;">${i + 1}. ${p.name}</td>
               <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;text-align:right;font-size:13px;font-weight:700;color:#c9a84c;">${p.count}</td>
             </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:10px 16px;color:#888;font-size:13px;">Aucune vente enregistrée cette semaine.</td></tr>`;

  const dayRows = resByDay.size
    ? Array.from(resByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([day, covers]) =>
            `<tr>
               <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;font-size:13px;">${format(new Date(day), 'EEEE d MMM', { locale: fr })}</td>
               <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;text-align:right;font-size:13px;font-weight:700;color:#c9a84c;">${covers} ${labels.unitPlural}</td>
             </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:10px 16px;color:#888;font-size:13px;">Aucune réservation cette semaine.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Rapport Hebdomadaire — ${startLabel} au ${endLabel}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Arial,sans-serif;color:#e0e0e0;">
  <div style="max-width:640px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

    <!-- Header -->
    <div style="padding:32px;background:#111;border-bottom:1px solid #2a2a2a;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#c9a84c;">RESTAURANT OS</p>
      <h1 style="margin:0;font-size:26px;font-weight:300;color:#fff;letter-spacing:-0.5px;">Rapport Hebdomadaire</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#888;">${startLabel} — ${endLabel}</p>
    </div>

    <!-- KPI row -->
    <div style="padding:24px 32px 0;">
      <table style="width:100%;border-collapse:separate;border-spacing:12px;">
        <tr>
          <td style="background:#222;border-radius:12px;padding:20px;text-align:center;vertical-align:top;width:33%;">
            <div style="font-size:9px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">CA Total</div>
            <div style="font-size:22px;font-weight:300;color:#fff;">${totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</div>
          </td>
          <td style="background:#222;border-radius:12px;padding:20px;text-align:center;vertical-align:top;width:33%;">
            <div style="font-size:9px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">${labels.unitPlural.charAt(0).toUpperCase() + labels.unitPlural.slice(1)}</div>
            <div style="font-size:22px;font-weight:300;color:#fff;">${totalUnits}</div>
          </td>
          <td style="background:#222;border-radius:12px;padding:20px;text-align:center;vertical-align:top;width:33%;">
            <div style="font-size:9px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">Dépense moy.</div>
            <div style="font-size:22px;font-weight:300;color:#fff;">${avgSpend.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Top Products -->
    <div style="padding:24px 32px 0;">
      <h2 style="margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;">Meilleurs Produits</h2>
      <table style="width:100%;border-collapse:collapse;background:#222;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#2a2a2a;">
            <th style="padding:8px 16px;text-align:left;font-size:9px;font-weight:900;color:#666;text-transform:uppercase;letter-spacing:0.15em;">Produit</th>
            <th style="padding:8px 16px;text-align:right;font-size:9px;font-weight:900;color:#666;text-transform:uppercase;letter-spacing:0.15em;">Ventes</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>
    </div>

    <!-- Reservations by day -->
    <div style="padding:24px 32px;">
      <h2 style="margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;">Réservations par Jour</h2>
      <table style="width:100%;border-collapse:collapse;background:#222;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#2a2a2a;">
            <th style="padding:8px 16px;text-align:left;font-size:9px;font-weight:900;color:#666;text-transform:uppercase;letter-spacing:0.15em;">Jour</th>
            <th style="padding:8px 16px;text-align:right;font-size:9px;font-weight:900;color:#666;text-transform:uppercase;letter-spacing:0.15em;">${labels.unitPlural}</th>
          </tr>
        </thead>
        <tbody>${dayRows}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#111;border-top:1px solid #2a2a2a;text-align:center;">
      <p style="margin:0;font-size:11px;color:#555;">Généré automatiquement le ${generatedLabel} · Restaurant OS</p>
    </div>
  </div>
</body>
</html>`;
}
