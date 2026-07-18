import type { ReceiptTicket, KitchenTicket, PaperWidth } from './types';

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const CMD: Record<string, number[]> = {
  INIT:          [ESC, 0x40],
  ALIGN_LEFT:    [ESC, 0x61, 0x00],
  ALIGN_CENTER:  [ESC, 0x61, 0x01],
  ALIGN_RIGHT:   [ESC, 0x61, 0x02],
  BOLD_ON:       [ESC, 0x45, 0x01],
  BOLD_OFF:      [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT: [GS,  0x21, 0x01],
  DOUBLE_SIZE:   [GS,  0x21, 0x11],
  NORMAL_SIZE:   [GS,  0x21, 0x00],
  FEED_1:        [ESC, 0x64, 0x01],
  FEED_3:        [ESC, 0x64, 0x03],
  FEED_5:        [ESC, 0x64, 0x05],
  CUT_FULL:      [GS,  0x56, 0x00],
  CUT_PARTIAL:   [GS,  0x56, 0x01],
  OPEN_DRAWER:   [ESC, 0x70, 0x00, 0x19, 0xfa],
};

function microToEuros(µ: number): number { return µ / 1_000_000; }
function fmtEur(µ: number): string { return microToEuros(µ).toFixed(2) + ' €'; }

function lineWidth(paperWidth: PaperWidth): number {
  return paperWidth === 58 ? 32 : paperWidth === 72 ? 40 : 42;
}

function encodeText(text: string): number[] {
  const b: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    b.push(c > 0xff ? 0x3f : c);
  }
  b.push(LF);
  return b;
}

function padR(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length);
}
function padL(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s;
}
function sep(char = '-', w = 42): string { return char.repeat(w); }

export class EscPosBuilder {
  private bytes: number[] = [];
  private lw: number;

  constructor(private paperWidth: PaperWidth = 80, private hasCutter = true) {
    this.lw = lineWidth(paperWidth);
  }

  private push(...cmds: number[][]): this {
    for (const cmd of cmds) this.bytes.push(...cmd);
    return this;
  }

  private text(t: string): this {
    this.bytes.push(...encodeText(t));
    return this;
  }

  buildReceipt(ticket: ReceiptTicket): Uint8Array {
    const lw = this.lw;
    const PRICE_W = 10;
    const QTY_W   = 5;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    this.push(CMD.INIT, CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(ticket.restaurantName.toUpperCase());
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    this.text(sep('=', lw));
    this.text(`TICKET N\xb0 ${ticket.ticketNumber}`);
    this.text(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    this.text(sep('-', lw));

    this.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
      const total  = item.qty * item.priceInMicrounits;
      const line   = `${padR(`x${item.qty}`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
      this.text(line);
      if (item.qty > 1) this.text(padL(`(${fmtEur(item.priceInMicrounits)}/u)`, lw));
    }

    this.text(sep('-', lw));
    const tvaM   = 1 + ticket.tvaRatePercent / 100;
    const ht     = Math.round(ticket.totalInMicrounits / tvaM);
    const tva    = ticket.totalInMicrounits - ht;
    this.text(`${padR('Total HT', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    this.text(`${padR(`TVA ${ticket.tvaRatePercent}%`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    this.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(`${padR('TOTAL TTC', lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);

    if (ticket.paymentMethod) {
      this.text(sep('-', lw));
      this.text(padR(`Règlement: ${ticket.paymentMethod}`, lw));
      if (ticket.cashGiven !== undefined) {
        this.text(`${padR('Remis', lw - PRICE_W)}${padL(fmtEur(ticket.cashGiven), PRICE_W)}`);
        const change = (ticket.cashGiven ?? 0) - ticket.totalInMicrounits;
        this.text(`${padR('Monnaie', lw - PRICE_W)}${padL(fmtEur(change), PRICE_W)}`);
      }
    }

    this.push(CMD.ALIGN_CENTER);
    this.text(sep('=', lw));
    this.text('Merci de votre visite !');
    if (ticket.footerNote) this.text(ticket.footerNote);
    this.push(CMD.FEED_5);
    if (this.hasCutter) this.push(CMD.CUT_PARTIAL);

    return new Uint8Array(this.bytes);
  }

  buildKitchen(ticket: KitchenTicket): Uint8Array {
    const lw = this.lw;
    this.push(CMD.INIT);

    if (ticket.isVoid) {
      this.push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_SIZE);
      this.text('** ANNULÉ **');
      this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    }

    this.push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(`TABLE ${ticket.tableLabel}`);
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);

    const ts = ticket.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.text(`${ts}  ${ticket.serverName ?? ''}`);
    this.text(sep('=', lw));

    this.push(CMD.ALIGN_LEFT, CMD.BOLD_ON);
    let lastCourse = '';
    for (const item of ticket.items) {
      if (item.course && item.course !== lastCourse) {
        this.text(sep('-', lw));
        this.text(item.course.toUpperCase());
        lastCourse = item.course;
      }
      this.push(CMD.DOUBLE_HEIGHT);
      this.text(`${item.qty}x  ${item.name}`);
      this.push(CMD.NORMAL_SIZE);
      if (item.modifiers?.length) {
        for (const mod of item.modifiers) this.text(`    > ${mod}`);
      }
    }
    this.push(CMD.BOLD_OFF);
    this.text(sep('=', lw));
    this.text(`Bon n\xb0 ${ticket.orderId}`);
    this.push(CMD.FEED_5);
    if (this.hasCutter) this.push(CMD.CUT_PARTIAL);

    return new Uint8Array(this.bytes);
  }

  buildTest(restaurantName = 'TEST IMPRESSION'): Uint8Array {
    const lw = this.lw;
    this.push(CMD.INIT, CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(restaurantName.toUpperCase());
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    this.text(sep('=', lw));
    this.push(CMD.ALIGN_LEFT);
    this.text(`Largeur papier : ${this.paperWidth}mm`);
    this.text(`Colonnes       : ${lw}`);
    this.text(`Coupe-papier   : ${this.hasCutter ? 'OUI' : 'NON'}`);
    this.text(new Date().toLocaleString('fr-FR'));
    this.text(sep('-', lw));
    this.push(CMD.ALIGN_CENTER);
    this.text('Imprimante OK !');
    this.push(CMD.FEED_5);
    if (this.hasCutter) this.push(CMD.CUT_PARTIAL);
    return new Uint8Array(this.bytes);
  }

  openCashDrawer(): Uint8Array {
    return new Uint8Array([...CMD.INIT, ...CMD.OPEN_DRAWER]);
  }
}
