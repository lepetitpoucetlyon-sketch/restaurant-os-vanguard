import { EscPosEncoder } from './EscPosEncoder';

/**
 * Receipt Builder (Fluent API)
 * High-level builder to compose a receipt for printing.
 */
export class ReceiptBuilder {
    private encoder: EscPosEncoder;
    private maxCharsPerLine: number = 42; // Standard for 80mm paper (usually 42 to 48 chars)

    constructor() {
        this.encoder = new EscPosEncoder();
    }

    /**
     * Set standard 80mm or 58mm paper size
     */
    public setPaperWidth(mm: 80 | 58): this {
        this.maxCharsPerLine = mm === 80 ? 42 : 32;
        return this;
    }

    /**
     * Print header with restaurant name
     */
    public header(businessName: string, subText?: string): this {
        this.encoder
            .align('center')
            .bold(true)
            .size(2, 2)
            .text(businessName)
            .newline()
            .bold(false)
            .size(1, 1);

        if (subText) {
            this.encoder.text(subText).newline();
        }
        
        this.encoder.newline();
        return this;
    }

    /**
     * Print a separator line (---)
     */
    public divider(char: string = '-'): this {
        this.encoder
            .align('left')
            .text(char.repeat(this.maxCharsPerLine))
            .newline();
        return this;
    }

    /**
     * Print an item row (Item name on left, price on right)
     */
    public itemRow(name: string, quantity: number, priceStr: string): this {
        const qtyStr = quantity > 1 ? `${quantity}x ` : '';
        const leftSide = `${qtyStr}${name}`;
        
        // Calculate spaces needed
        const spaceCount = this.maxCharsPerLine - leftSide.length - priceStr.length;
        
        if (spaceCount > 0) {
            this.encoder
                .align('left')
                .text(leftSide)
                .text(' '.repeat(spaceCount))
                .text(priceStr)
                .newline();
        } else {
            // Name is too long, wrap it
            this.encoder.align('left').text(leftSide).newline();
            this.encoder
                .align('right')
                .text(priceStr)
                .newline();
        }
        
        return this;
    }

    /**
     * Print total section
     */
    public total(totalStr: string): this {
        this.divider('=');
        this.encoder
            .align('right')
            .bold(true)
            .size(2, 2)
            .text(`TOTAL: ${totalStr}`)
            .newline()
            .bold(false)
            .size(1, 1)
            .newline();
        return this;
    }

    /**
     * Add NF525 signature block at the bottom
     */
    public nf525Signature(hash: string, sequenceNum: string, date: Date): this {
        this.divider();
        this.encoder
            .align('center')
            .size(1, 1)
            .text('Ticket de caisse certifie')
            .newline()
            .text(`Date: ${date.toLocaleString('fr-FR')}`)
            .newline()
            .text(`N°: ${sequenceNum}`)
            .newline()
            .text(`Sceau: ${hash.substring(0, 16)}...`)
            .newline();
        return this;
    }

    /**
     * Cut paper and return the raw buffer to be sent to printer
     */
    public finishAndCut(): Uint8Array {
        this.encoder.newline().newline().newline().cut();
        return this.encoder.build();
    }
}
