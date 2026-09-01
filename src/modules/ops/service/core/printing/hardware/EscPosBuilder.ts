/**
 * 🖨️ EscPosBuilder — Moteur d'impression thermique ESC/POS.
 *
 * Assemble les commandes bas-niveau (voir `escpos/EscPosCommands.ts`) et délègue la
 * mise en page des reçus aux formatters (voir `escpos/EscPosReceiptFormatter.ts`).
 * Supporte Bitmap Logo, QR Code natif et 3 styles de tickets (classic / minimalist / gourmet).
 */

import type { ReceiptTicket, KitchenTicket, PaperWidth, BitmapImage, TicketStyle } from './types';
import {
    CMD,
    GS,
    encodeText,
    lineWidth,
    sep,
} from './escpos/EscPosCommands';
import {
    appendNf525Footer,
    defaultQrLabel,
    renderClassicReceipt,
    renderGourmetReceipt,
    renderMinimalistReceipt,
    type EscPosContext,
} from './escpos/EscPosReceiptFormatter';

export class EscPosBuilder {
    private bytes: number[] = [];
    readonly lw: number;

    constructor(private paperWidth: PaperWidth = 80, private hasCutter = true) {
        this.lw = lineWidth(paperWidth);
    }

    push(...cmds: number[][]): this {
        for (const cmd of cmds) this.bytes.push(...cmd);
        return this;
    }

    text(t: string): this {
        this.bytes.push(...encodeText(t));
        return this;
    }

    private asContext(): EscPosContext {
        return {
            push: (...cmds) => { this.push(...cmds); },
            text: (t) => { this.text(t); },
            lw: this.lw,
        };
    }

    /**
     * 🖼️ Imprime une image monochrome 1-bit via la commande standard ESC/POS raster `GS v 0`.
     */
    appendRasterImage(bitmap: BitmapImage): this {
        const { width, height, data } = bitmap;
        if (width <= 0 || height <= 0 || !data || data.length === 0) return this;

        const bytesWidth = Math.ceil(width / 8);
        const xL = bytesWidth & 0xff;
        const xH = (bytesWidth >> 8) & 0xff;
        const yL = height & 0xff;
        const yH = (height >> 8) & 0xff;

        this.push(CMD.ALIGN_CENTER);
        this.bytes.push(GS, 0x76, 0x30, 0x00, xL, xH, yL, yH);

        for (let i = 0; i < data.length; i++) {
            this.bytes.push(data[i]);
        }
        this.push(CMD.FEED_1);
        return this;
    }

    /**
     * 📱 Imprime un QR Code natif thermique via les commandes standard ESC/POS `GS ( k`.
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
        // 2. Taille du module (min 2, max 8)
        this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(Math.max(size, 2), 8));
        // 3. Niveau de correction d'erreur (M = 15% de redondance)
        this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
        // 4. Stockage des données
        this.bytes.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);
        // 5. Impression du symbole
        this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

        this.push(CMD.FEED_1);
        return this;
    }

    /**
     * 🧾 Construit le ticket de caisse selon le style sélectionné
     * ('classic' | 'minimalist' | 'gourmet').
     */
    buildReceipt(ticket: ReceiptTicket): Uint8Array {
        this.bytes = [];
        const style: TicketStyle = ticket.ticketStyle || 'classic';

        this.push(CMD.INIT);

        if (ticket.logoBitmap) {
            this.appendRasterImage(ticket.logoBitmap);
        }

        const ctx = this.asContext();
        if (style === 'minimalist') {
            renderMinimalistReceipt(ctx, ticket);
        } else if (style === 'gourmet') {
            renderGourmetReceipt(ctx, ticket);
        } else {
            renderClassicReceipt(ctx, ticket);
        }

        if (ticket.qrCodeUrl) {
            this.appendQRCode(ticket.qrCodeUrl, ticket.qrCodeLabel || defaultQrLabel(style));
        }

        appendNf525Footer(ctx, ticket, style);

        this.push(CMD.FEED_5);
        if (this.hasCutter) this.push(CMD.CUT_PARTIAL);

        return new Uint8Array(this.bytes);
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
