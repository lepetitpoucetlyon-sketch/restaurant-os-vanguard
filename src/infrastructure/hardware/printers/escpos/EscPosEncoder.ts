/**
 * ESC/POS Byte Encoder (Grade X)
 * Handles low-level hexadecimal conversions for thermal printers.
 * Completely hardware-agnostic (Epson, Star, Bixolon, etc.).
 */

export class EscPosEncoder {
    private buffer: number[] = [];
    // Basic latin1 encoding is generally supported by thermal printers for standard text.
    // For advanced chars (é, à), codepages need to be set depending on the specific printer.
    private encoder = new TextEncoder();

    constructor() {
        this.initialize();
    }

    /**
     * Initializes the printer (ESC @)
     */
    public initialize(): this {
        this.buffer.push(0x1b, 0x40);
        return this;
    }

    /**
     * Adds text to the buffer
     */
    public text(data: string): this {
        // A robust implementation would handle code pages for French accents.
        // For Phase 1, we use basic char codes.
        for (let i = 0; i < data.length; i++) {
            let charCode = data.charCodeAt(i);
            if (charCode > 255) charCode = 63; // '?' for unmapped chars
            this.buffer.push(charCode);
        }
        return this;
    }

    /**
     * Print and line feed (LF)
     */
    public newline(): this {
        this.buffer.push(0x0a);
        return this;
    }

    /**
     * Set text alignment
     * @param align 'left' | 'center' | 'right'
     */
    public align(align: 'left' | 'center' | 'right'): this {
        const alignValue = align === 'center' ? 1 : align === 'right' ? 2 : 0;
        this.buffer.push(0x1b, 0x61, alignValue);
        return this;
    }

    /**
     * Set emphasized (bold) mode
     */
    public bold(enable: boolean = true): this {
        this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
        return this;
    }

    /**
     * Set text size (1 to 8 for width and height)
     */
    public size(width: number, height: number): this {
        const w = Math.min(Math.max(width - 1, 0), 7);
        const h = Math.min(Math.max(height - 1, 0), 7);
        const sizeByte = (w << 4) | h;
        this.buffer.push(0x1d, 0x21, sizeByte);
        return this;
    }

    /**
     * Cut paper (GS V)
     */
    public cut(): this {
        // Full cut with feed
        this.buffer.push(0x1d, 0x56, 0x41, 0x03);
        return this;
    }

    /**
     * Open cash drawer (ESC p)
     */
    public openDrawer(): this {
        // Pin 2 (0x00), Pulse ON time (25ms), Pulse OFF time (250ms)
        this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
        return this;
    }

    /**
     * Beep (if supported)
     */
    public beep(): this {
        this.buffer.push(0x1b, 0x42, 0x03, 0x02);
        return this;
    }

    /**
     * Build the final Uint8Array buffer ready to be sent over WebUSB / WebBluetooth
     */
    public build(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}
