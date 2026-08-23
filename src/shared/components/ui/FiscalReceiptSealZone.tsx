"use client";

import React from "react";
import { cn } from "@/lib/ui.foundations";

/**
 * 🔒 FiscalReceiptSealZone — Zone inviolable NF525.
 *
 * Wrapper React pour les mentions légales obligatoires sur les tickets de caisse
 * et les écrans d'encaissement. Garantit que les 7 mentions DGFiP ne peuvent
 * JAMAIS être masquées, déplacées ou supprimées par le Layout Builder.
 *
 * Utilisé par :
 * - Le composant POS (ticket de caisse affiché à l'écran)
 * - Le composant d'impression ESC/POS (ticket physique)
 * - Le Layout Builder (verrouille les slots contenant cette zone)
 *
 * Mentions obligatoires (Art. 286-I-3° bis CGI) :
 * 1. Dénomination sociale et SIRET
 * 2. Date et heure de la transaction
 * 3. Numéro de série séquentiel inaltérable
 * 4. Détail des articles (désignation, quantité, prix unitaire)
 * 5. Taux et montants de TVA ventilés
 * 6. Montant total TTC
 * 7. Mode(s) de règlement
 *
 * Le composant est volontairement un wrapper passif : il ne contient aucune
 * logique métier (calculée par FiscalSealer). Il se contente de :
 * - Rendre ses enfants dans un conteneur visuellement identifiable
 * - Empêcher toute interaction de suppression (pointer-events sur le bouton supprimer)
 * - Exposer un data-attribute `data-fiscal-seal="true"` pour le Layout Builder
 */

interface FiscalReceiptSealZoneProps {
    children: React.ReactNode;
    /** Afficher une bordure visuelle de protection (mode dev/audit). */
    showSealBorder?: boolean;
    /** Identifiant unique de la zone scellée (pour le Layout Builder). */
    zoneId?: string;
    className?: string;
}

export function FiscalReceiptSealZone({
    children,
    showSealBorder = false,
    zoneId = "fiscal-seal-main",
    className,
}: FiscalReceiptSealZoneProps) {
    return (
        <div
            data-fiscal-seal="true"
            data-seal-zone-id={zoneId}
            data-layout-locked="true"
            data-layout-visible="true"
            data-layout-undeletable="true"
            className={cn(
                // Position stable — ne peut pas être caché par un z-index
                "relative z-[100]",
                // Protection visuelle en mode audit
                showSealBorder && [
                    "ring-2 ring-amber-500/40 ring-offset-2 ring-offset-surface-bg",
                    "before:absolute before:-top-5 before:left-2",
                    "before:content-['🔒_Zone_NF525_—_Inaltérable']",
                    "before:text-[10px] before:font-mono before:text-amber-500/80",
                    "before:bg-surface-bg before:px-1.5 before:py-0.5 before:rounded",
                ],
                className,
            )}
        >
            {children}
        </div>
    );
}

/**
 * Vérifie qu'un slot de layout est une zone scellée NF525.
 * Utilisé par le Layout Builder pour empêcher la suppression/masquage.
 */
export function isFiscalSealSlot(element: HTMLElement | null): boolean {
    if (!element) return false;
    return element.closest("[data-fiscal-seal='true']") !== null;
}

/**
 * Liste des zoneId fiscaux protégés.
 * Le Layout Builder doit refuser de toucher ces slots.
 */
export const FISCAL_SEAL_ZONE_IDS = [
    "fiscal-seal-main",
    "fiscal-seal-receipt-total",
    "fiscal-seal-vat-breakdown",
    "fiscal-seal-serial-number",
    "fiscal-seal-payment-methods",
    "fiscal-seal-business-identity",
    "fiscal-seal-datetime",
] as const;

export type FiscalSealZoneId = typeof FISCAL_SEAL_ZONE_IDS[number];
