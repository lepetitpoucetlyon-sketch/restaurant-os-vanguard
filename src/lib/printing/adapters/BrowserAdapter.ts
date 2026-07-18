import type { ReceiptTicket, KitchenTicket, PrintResult } from '../types';

function fmtEur(µ: number): string { return (µ / 1_000_000).toFixed(2) + ' €'; }

export function printReceiptBrowser(ticket: ReceiptTicket): PrintResult {
  const tvaM   = 1 + ticket.tvaRatePercent / 100;
  const ht     = Math.round(ticket.totalInMicrounits / tvaM);
  const tva    = ticket.totalInMicrounits - ht;

  const rows = ticket.items.map(i =>
    `<tr><td>${i.qty} × ${i.name}</td><td class="r">${fmtEur(i.qty * i.priceInMicrounits)}</td></tr>`
  ).join('');

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<title>Ticket ${ticket.ticketNumber}</title>
<style>
  body{font-family:monospace;font-size:11px;width:280px;margin:0 auto}
  h1{text-align:center;font-size:13px;margin:4px 0}
  p{text-align:center;margin:2px 0;font-size:10px}
  table{width:100%;border-collapse:collapse}
  td{padding:1px 0} .r{text-align:right}
  .sep{border-top:1px dashed #000;margin:4px 0}
  .tot{font-weight:bold;font-size:12px}
  .foot{text-align:center;font-size:9px;margin-top:6px}
</style></head><body>
<h1>${ticket.restaurantName.toUpperCase()}</h1>
<p>Ticket N° ${ticket.ticketNumber}</p>
<p>${new Date().toLocaleString('fr-FR')}</p>
<div class="sep"></div>
<table>${rows}</table>
<div class="sep"></div>
<table>
  <tr><td>Total HT</td><td class="r">${fmtEur(ht)}</td></tr>
  <tr><td>TVA ${ticket.tvaRatePercent}%</td><td class="r">${fmtEur(tva)}</td></tr>
  <tr class="tot"><td>TOTAL TTC</td><td class="r">${fmtEur(ticket.totalInMicrounits)}</td></tr>
  ${ticket.paymentMethod ? `<tr><td>Règlement</td><td class="r">${ticket.paymentMethod}</td></tr>` : ''}
</table>
<div class="foot"><p>Merci de votre visite !</p>${ticket.footerNote ? `<p>${ticket.footerNote}</p>` : ''}</div>
</body></html>`;

  openPrintWindow(html);
  return { success: true, method: 'browser' };
}

export function printKitchenBrowser(ticket: KitchenTicket): PrintResult {
  const ts = ticket.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const rows = ticket.items.map(i => `
    <tr style="font-size:18px;font-weight:bold">
      <td>${i.qty}×</td><td>${i.name}</td>
    </tr>
    ${(i.modifiers ?? []).map(m => `<tr style="font-size:11px"><td></td><td>> ${m}</td></tr>`).join('')}
  `).join('');

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<title>Bon ${ticket.orderId}</title>
<style>body{font-family:monospace;width:280px;margin:0 auto}
h1{text-align:center;font-size:22px;font-weight:bold}
.sep{border-top:2px solid #000;margin:4px 0}
table{width:100%}td{padding:2px 4px}
</style></head><body>
${ticket.isVoid ? '<h2 style="text-align:center;color:red">** ANNULÉ **</h2>' : ''}
<h1>TABLE ${ticket.tableLabel}</h1>
<p style="text-align:center">${ts}${ticket.serverName ? ` — ${ticket.serverName}` : ''}</p>
<div class="sep"></div>
<table>${rows}</table>
<div class="sep"></div>
<p style="text-align:center;font-size:10px">Bon n° ${ticket.orderId}</p>
</body></html>`;

  openPrintWindow(html);
  return { success: true, method: 'browser' };
}

function openPrintWindow(html: string): void {
  const win = window.open('', '_blank', 'width=360,height=640');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 250);
}
