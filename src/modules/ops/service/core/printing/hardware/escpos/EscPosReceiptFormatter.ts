/**
 * 🧾 EscPosReceiptFormatter — Mise en page des reçus, tickets cuisine et bloc NF525.
 *
 * Fonctions PURES sur un `EscPosContext` (interface minimale du builder) — permet
 * de tester les renderers indépendamment et de conserver l'encapsulation de la classe.
 */

import type { ReceiptTicket, TicketStyle } from '../types';
import { CMD, fmtEur, padL, padR, sep } from './EscPosCommands';

/** Contexte minimal exposé par le builder aux formatters. */
export interface EscPosContext {
    push(...cmds: number[][]): void;
    text(t: string): void;
    readonly lw: number;
}

/**
 * 🏷️ Style Classique — Équilibré, robuste et très lisible.
 */
export function renderClassicReceipt(ctx: EscPosContext, ticket: ReceiptTicket): void {
    const lw = ctx.lw;
    const PRICE_W = 10;
    const QTY_W   = 5;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    ctx.push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    ctx.text(ticket.businessName.toUpperCase());
    ctx.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    ctx.text(sep('=', lw));
    ctx.text(`TICKET N\xb0 ${ticket.ticketNumber}`);
    ctx.text(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    ctx.text(sep('-', lw));

    ctx.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
        const total  = item.qty * item.priceInMicrounits;
        const line   = `${padR(`x${item.qty}`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
        ctx.text(line);
        if (item.qty > 1) ctx.text(padL(`(${fmtEur(item.priceInMicrounits)}/u)`, lw));
    }

    ctx.text(sep('-', lw));
    const tvaM = 1 + ticket.tvaRatePercent / 100;
    const ht   = Math.round(ticket.totalInMicrounits / tvaM);
    const tva  = ticket.totalInMicrounits - ht;
    ctx.text(`${padR('Total HT', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    ctx.text(`${padR(`TVA ${ticket.tvaRatePercent}%`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    ctx.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    ctx.text(`${padR('TOTAL TTC', lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    ctx.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);

    if (ticket.paymentMethod) {
        ctx.text(sep('-', lw));
        ctx.text(padR(`Règlement: ${ticket.paymentMethod}`, lw));
        if (ticket.cashGiven !== undefined) {
            ctx.text(`${padR('Remis', lw - PRICE_W)}${padL(fmtEur(ticket.cashGiven), PRICE_W)}`);
            const change = ticket.cashGiven - ticket.totalInMicrounits;
            ctx.text(`${padR('Monnaie', lw - PRICE_W)}${padL(fmtEur(change), PRICE_W)}`);
        }
    }

    ctx.push(CMD.ALIGN_CENTER);
    ctx.text(sep('=', lw));
    ctx.text('Merci de votre visite !');
    if (ticket.footerNote) ctx.text(ticket.footerNote);
}

/**
 * 🌿 Style Minimaliste — Épuré, aéré, typographie sobre et séparateurs légers.
 */
export function renderMinimalistReceipt(ctx: EscPosContext, ticket: ReceiptTicket): void {
    const lw = ctx.lw;
    const PRICE_W = 10;
    const QTY_W   = 4;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    ctx.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
    ctx.text(ticket.businessName);
    ctx.push(CMD.BOLD_OFF);
    ctx.text(`Reçu #${ticket.ticketNumber} · ${new Date().toLocaleDateString('fr-FR')}`);
    ctx.text(sep('·', lw));

    ctx.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
        const total = item.qty * item.priceInMicrounits;
        const line = `${padR(`${item.qty}`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
        ctx.text(line);
    }

    ctx.text(sep('·', lw));
    const tvaM = 1 + ticket.tvaRatePercent / 100;
    const ht = Math.round(ticket.totalInMicrounits / tvaM);
    const tva = ticket.totalInMicrounits - ht;

    ctx.text(`${padR('HT', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    ctx.text(`${padR(`TVA (${ticket.tvaRatePercent}%)`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    ctx.push(CMD.BOLD_ON);
    ctx.text(`${padR('Total Net', lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    ctx.push(CMD.BOLD_OFF);

    if (ticket.paymentMethod) {
        ctx.text(`${padR(`Payé (${ticket.paymentMethod})`, lw - PRICE_W)}${padL(fmtEur(ticket.totalInMicrounits), PRICE_W)}`);
    }

    ctx.push(CMD.ALIGN_CENTER);
    ctx.text(sep('·', lw));
    if (ticket.footerNote) {
        ctx.text(ticket.footerNote);
    } else {
        ctx.text('À bientôt');
    }
}

/**
 * 🍷 Style Gourmet — Prestige gastronomique, encadrements et ornements.
 */
export function renderGourmetReceipt(ctx: EscPosContext, ticket: ReceiptTicket): void {
    const lw = ctx.lw;
    const PRICE_W = 10;
    const QTY_W   = 5;
    const NAME_W  = lw - QTY_W - PRICE_W - 2;

    ctx.push(CMD.ALIGN_CENTER);
    ctx.text('✦  ✦  ✦');
    ctx.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    ctx.text(ticket.businessName.toUpperCase());
    ctx.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    ctx.text('MAISON FONDEE SUR L\'EXCELLENCE');
    ctx.text(sep('═', lw));
    ctx.text(`NOTE D'ADDITION N\xb0 ${ticket.ticketNumber}`);
    ctx.text(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    ctx.text(sep('─', lw));

    ctx.push(CMD.ALIGN_LEFT);
    for (const item of ticket.items) {
        const total = item.qty * item.priceInMicrounits;
        const line = `${padR(`${item.qty}x`, QTY_W)} ${padR(item.name, NAME_W)} ${padL(fmtEur(total), PRICE_W)}`;
        ctx.push(CMD.BOLD_ON);
        ctx.text(line);
        ctx.push(CMD.BOLD_OFF);
        if (item.qty > 1) {
            ctx.text(padL(`au tarif de ${fmtEur(item.priceInMicrounits)} l'unité`, lw));
        }
    }

    ctx.text(sep('─', lw));
    const tvaM = 1 + ticket.tvaRatePercent / 100;
    const ht = Math.round(ticket.totalInMicrounits / tvaM);
    const tva = ticket.totalInMicrounits - ht;

    ctx.text(`${padR('Montant Hors Taxes', lw - PRICE_W)}${padL(fmtEur(ht), PRICE_W)}`);
    ctx.text(`${padR(`TVA légale ${ticket.tvaRatePercent}%`, lw - PRICE_W)}${padL(fmtEur(tva), PRICE_W)}`);

    ctx.push(CMD.ALIGN_CENTER);
    ctx.text(sep('═', lw));
    ctx.push(CMD.BOLD_ON, CMD.DOUBLE_HEIGHT);
    ctx.text(`TOTAL TTC : ${fmtEur(ticket.totalInMicrounits)}`);
    ctx.push(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
    ctx.text(sep('═', lw));

    if (ticket.paymentMethod) {
        ctx.push(CMD.ALIGN_LEFT);
        ctx.text(padR(`Règlement honoré par : ${ticket.paymentMethod}`, lw));
        if (ticket.cashGiven !== undefined) {
            ctx.text(`${padR('Espèces reçues', lw - PRICE_W)}${padL(fmtEur(ticket.cashGiven), PRICE_W)}`);
            const change = ticket.cashGiven - ticket.totalInMicrounits;
            ctx.text(`${padR('Rendu de monnaie', lw - PRICE_W)}${padL(fmtEur(change), PRICE_W)}`);
        }
    }

    ctx.push(CMD.ALIGN_CENTER);
    ctx.text('✦ ✦ ✦');
    ctx.text('Toute la brigade vous remercie chaleureusement');
    if (ticket.footerNote) ctx.text(ticket.footerNote);
}

/**
 * 🛡️ Pied de page fiscal NF525 — SIRET + hash de scellement chaîné inaltérable.
 * No-op si aucune donnée NF525 n'est fournie (mode démo).
 */
export function appendNf525Footer(ctx: EscPosContext, ticket: ReceiptTicket, style: TicketStyle): void {
    if (!ticket.nf525Hash && !ticket.siret) return;
    const lw = ctx.lw;
    ctx.text(sep(style === 'minimalist' ? '·' : '-', lw));
    if (ticket.siret) ctx.text(`SIRET: ${ticket.siret}`);
    ctx.text('--- CERTIFICATION NF525 ---');
    ctx.text('Restaurant OS Core v1.0.0');
    if (ticket.certifiedAt) ctx.text(`Date: ${ticket.certifiedAt}`);
    if (ticket.nf525Hash) {
        ctx.text('Signature:');
        for (let i = 0; i < ticket.nf525Hash.length; i += lw) {
            ctx.text(ticket.nf525Hash.substring(i, i + lw));
        }
    }
}

export function defaultQrLabel(style: TicketStyle): string {
    if (style === 'gourmet') return '✦ VOTRE EXPERIENCE CLIENT ✦';
    if (style === 'minimalist') return 'e-Ticket & Avis';
    return 'SCANNEZ POUR VOTRE e-TICKET & AVIS';
}
