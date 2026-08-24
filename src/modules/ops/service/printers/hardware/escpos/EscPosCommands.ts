/**
 * 🎛️ EscPosCommands — Constantes bas-niveau ESC/POS et helpers d'encodage/formatage.
 *
 * Fonctions PURES (aucun état) — utilisées par EscPosBuilder et EscPosReceiptFormatter.
 */

import type { PaperWidth } from '../types';

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;

export const CMD: Record<string, number[]> = {
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

export function microToEuros(µ: number): number {
    return µ / 1_000_000;
}

export function fmtEur(µ: number): string {
    return microToEuros(µ).toFixed(2) + ' €';
}

export function lineWidth(paperWidth: PaperWidth): number {
    return paperWidth === 58 ? 32 : paperWidth === 72 ? 40 : 42;
}

/** Encodage caractère → bytes CP1252/CP858 (le symbole € est remappé sur 0x80). */
export function encodeText(text: string): number[] {
    const b: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c === 0x20ac) {
            b.push(0x80);
        } else {
            b.push(c > 0xff ? 0x3f : c);
        }
    }
    b.push(LF);
    return b;
}

export function padR(s: string, w: number): string {
    return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length);
}

export function padL(s: string, w: number): string {
    return s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s;
}

export function sep(char = '-', w = 42): string {
    return char.repeat(w);
}
