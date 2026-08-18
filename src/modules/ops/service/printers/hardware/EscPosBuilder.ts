import type { ReceiptTicket, KitchenTicket, PaperWidth, BitmapImage, TicketStyle } from './types';

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
  FEED_2:        [ESC, 0x64, 0x02],
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
    if (c === 0x20ac) {
      // Symbole Euro standard thermique (CP1252 / CP858)
      b.push(0x80);
    } else {
      b.push(c > 0xff ? 0x3f : c);
    }
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

/**
 * 🖨️ EscPosBuilder — Moteur d'impression thermique ESC/POS multi-thèmes avec Bitmap Logo & QR Code
 */
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

  /**
   * 🖼️ Imprime une image monochrome 1-bit via la commande standard ESC/POS raster `GS v 0`
   */
  appendRasterImage(bitmap: BitmapImage): this {
    const { width, height, data } = bitmap;
    if (width <= 0 || height <= 0 || !data || data.length === 0) return this;

    const bytesWidth = Math.ceil(width / 8);
    const xL = bytesWidth & 0xff;
    const xH = (bytesWidth >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    // Centrage et commande GS v 0 0 xL xH yL yH
    this.push(CMD.ALIGN_CENTER);
    this.bytes.push(GS, 0x76, 0x30, 0x00, xL, xH, yL, yH);

    // Injection des octets de pixels
    for (let i = 0; i < data.length; i++) {
      this.bytes.push(data[i]);
    }
    this.push(CMD.FEED_1);
    return this;
  }

  /**
   * 📱 Imprime un QR Code natif thermique via les commandes standard ESC/POS `GS ( k`
   */
  appendQRCode(url: string, label?: string, size = 5): this {
    if (!url || url.trim().length === 0) return this;

    const dataBytes: number[] = [];
    for (let i = 0; i < url.length; i++) {
      dataBytes.push(url.charCodeAt(i) & 0xff);
    }

    const length = dataBytes.length + 3;
    const pL = length & 0xff;
    const pH = (length >> 8) & 0xff;

    this.push(CMD.ALIGN_CENTER);

    if (label) {
      this.push(CMD.BOLD_ON);
      this.text(label);
      this.push(CMD.BOLD_OFF);
    }

    // 1. Modèle QR Code (Modèle 2 standard)
    this.bytes.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Taille du module (1 à 16 dots, 5 par défaut)
    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(Math.max(size, 2), 8));
    // 3. Niveau de correction d'erreur (Niveau M = 15% de redondance)
    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Stockage des données du QR Code
    this.bytes.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);
    // 5. Impression du symbole QR Code
    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

    this.push(CMD.FEED_1);
    return this;
  }

  /**
   * 🧾 Construit le ticket de caisse selon le style sélectionné ('classic' | 'minimalist' | 'gourmet')
   */
  buildReceipt(ticket: ReceiptTicket): Uint8Array {
    this.bytes = [];
    const style: TicketStyle = ticket.ticketStyle || 'classic';

    this.push(CMD.INIT);

    // 1. Logo Bitmap optionnel
    if (ticket.logoBitmap) {
      this.appendRasterImage(ticket.logoBitmap);
    }

    // 2. Corps du ticket selon le style
    if (style === 'minimalist') {
      this.renderMinimalistReceipt(ticket);
    } else if (style === 'gourmet') {
      this.renderGourmetReceipt(ticket);
    } else {
      this.renderClassicReceipt(ticket);
    }

    // 3. QR Code optionnel en bas de ticket
    if (ticket.qrCodeUrl) {
      const defaultLabel = style === 'gourmet'
        ? '✦ VOTRE EXPERIENCE CLIENT ✦'
        : style === 'minimalist'
        ? 'e-Ticket & Avis'
        : 'SCANNEZ POUR VOTRE e-TICKET & AVIS';
      this.appendQRCode(ticket.qrCodeUrl, ticket.qrCodeLabel || defaultLabel);
    }

    // 4. Bloc de certification légale NF525 (Obligatoire)
    this.appendNf525Footer(ticket, this.lw, style);

    this.push(CMD.FEED_5);
    if (this.hasCutter) this.push(CMD.CUT_PARTIAL);

    return new Uint8Array(this.bytes);
  }

  /**
   * 🏷️ Style Classique — Équilibré, robuste et très lisible
   */
  private renderClassicReceipt(ticket: ReceiptTicket): void {
    const lw = this.lw;
    const PRICE_W = 10;
    const QTY_W   = 5;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    this.push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(ticket.businessName.toUpperCase());
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
        const change = ticket.cashGiven - ticket.totalInMicrounits;
        this.text(`${padR('Monnaie', lw - PRICE_W)}${padL(fmtEur(change), PRICE_W)}`);
      }
    }

    this.push(CMD.ALIGN_CENTER);
    this.text(sep('=', lw));
    this.text('Merci de votre visite !');
    if (ticket.footerNote) this.text(ticket.footerNote);
  }

  /**
   * 🌿 Style Minimaliste — Épuré, aéré, typographie sobre et séparateurs légers
   */
  private renderMinimalistReceipt(ticket: ReceiptTicket): void {
    const lw = this.lw;
    const PRICE_W = 10;
    const QTY_W   = 4;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    this.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
    this.text(ticket.businessName);
    this.push(CMD.BOLD_OFF);
    this.text(`Reçu #${ticket.ticketNumber} · ${new Date().toLocaleDateString('fr-FR')}`);
    this.text(sep('·', lw));

    this.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
      const total = item.qty * item.priceInMicrounits;
      const line = `${padR(`${item.qty}`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
      this.text(line);
    }

    this.text(sep('·', lw));
    const tvaM = 1 + ticket.tvaRatePercent / 100;
    const ht = Math.round(ticket.totalInMicrounits / tvaM);
    const tva = ticket.totalInMicrounits - ht;

    this.text(`${padR('HT', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    this.text(`${padR(`TVA (${ticket.tvaRatePercent}%)`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    this.push(CMD.BOLD_ON);
    this.text(`${padR('Total Net', lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    this.push(CMD.BOLD_OFF);

    if (ticket.paymentMethod) {
      this.text(`${padR(`Payé (${ticket.paymentMethod})`, lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    }

    this.push(CMD.ALIGN_CENTER);
    this.text(sep('·', lw));
    if (ticket.footerNote) {
      this.text(ticket.footerNote);
    } else {
      this.text('À bientôt');
    }
  }

  /**
   * 🍷 Style Gourmet — Prestige gastronomique, encadrements et ornements
   */
  private renderGourmetReceipt(ticket: ReceiptTicket): void {
    const lw = this.lw;
    const PRICE_W = 10;
    const QTY_W   = 5;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    this.push(CMD.ALIGN_CENTER);
    this.text('✦  ✦  ✦');
    this.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(ticket.businessName.toUpperCase());
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    this.text('MAISON FONDEE SUR L\'EXCELLENCE');
    this.text(sep('═', lw));
    this.text(`NOTE D'ADDITION N\xb0 ${ticket.ticketNumber}`);
    this.text(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    this.text(sep('─', lw));

    this.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
      const total = item.qty * item.priceInMicrounits;
      const line = `${padR(`${item.qty}x`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
      this.push(CMD.BOLD_ON);
      this.text(line);
      this.push(CMD.BOLD_OFF);
      if (item.qty > 1) {
        this.text(padL(`au tarif de ${fmtEur(item.priceInMicrounits)} l'unité`, lw));
      }
    }

    this.text(sep('─', lw));
    const tvaM = 1 + ticket.tvaRatePercent / 100;
    const ht = Math.round(ticket.totalInMicrounits / tvaM);
    const tva = ticket.totalInMicrounits - ht;

    this.text(`${padR('Montant Hors Taxes', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    this.text(`${padR(`TVA légale ${ticket.tvaRatePercent}%`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    this.push(CMD.ALIGN_CENTER);
    this.text(sep('═', lw));
    this.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(`TOTAL TTC : ${fmtEur(ticket.totalInMicrounits)}`);
    this.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    this.text(sep('═', lw));

    if (ticket.paymentMethod) {
      this.push(CMD.ALIGN_LEFT);
      this.text(padR(`Règlement honoré par : ${ticket.paymentMethod}`, lw));
      if (ticket.cashGiven !== undefined) {
        this.text(`${padR('Espèces reçues', lw - PRICE_W)}${padL(fmtEur(ticket.cashGiven), PRICE_W)}`);
        const change = ticket.cashGiven - ticket.totalInMicrounits;
        this.text(`${padR('Rendu de monnaie', lw - PRICE_W)}${padL(fmtEur(change), PRICE_W)}`);
      }
    }

    this.push(CMD.ALIGN_CENTER);
    this.text('✦ ✦ ✦');
    this.text('Toute la brigade vous remercie chaleureusement');
    if (ticket.footerNote) this.text(ticket.footerNote);
  }

  /**
   * 🛡️ Pied de page fiscal NF525 conforme et inaltérable
   */
  private appendNf525Footer(ticket: ReceiptTicket, lw: number, style: TicketStyle): void {
    if (!ticket.nf525Hash && !ticket.siret) return;
    this.text(sep(style === 'minimalist' ? '·' : '-', lw));
    if (ticket.siret) this.text(`SIRET: ${ticket.siret}`);
    this.text('--- CERTIFICATION NF525 ---');
    this.text('Restaurant OS Core v1.0.0');
    if (ticket.certifiedAt) this.text(`Date: ${ticket.certifiedAt}`);
    if (ticket.nf525Hash) {
      this.text(`Signature:`);
      for (let i = 0; i < ticket.nf525Hash.length; i += lw) {
        this.text(ticket.nf525Hash.substring(i, i + lw));
      }
    }
  }

  buildKitchen(ticket: KitchenTicket): Uint8Array {
    const lw = this.lw;
    this.bytes = [];
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

  buildTest(businessName = 'TEST IMPRESSION'): Uint8Array {
    const lw = this.lw;
    this.bytes = [];
    this.push(CMD.INIT, CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    this.text(businessName.toUpperCase());
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
