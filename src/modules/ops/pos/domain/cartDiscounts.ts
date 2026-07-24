import { toMicrounits, Microunits } from "@/domain/schemas/primitives";
import type { CartItem } from "../../engine/types";

/**
 * 💸 POS — Logique pure de remise / offre par ligne
 *
 * Extraite de usePos (dette-2) pour :
 *  - sortir la logique métier du hook React,
 *  - la rendre testable unitairement (fonctions pures, aucun effet de bord),
 *  - garantir la cohérence microunits (jamais de cents dans le nouveau code).
 *
 * Chaque fonction retourne un NOUVEL objet CartItem — l'entrée n'est jamais mutée.
 * Le prix effectif est toujours reflété dans `unitPriceInMicrounits` pour que
 * les totaux (POSService.calculateCartTotal) se recalculent automatiquement.
 */

/**
 * Applique (ou retire) une remise en pourcentage à une ligne de panier.
 *
 * @param item     Ligne cible.
 * @param percent  0–100. `0` retire la remise et restaure le prix d'origine.
 * @returns        Nouvelle ligne avec le prix remisé reflété dans unitPriceInMicrounits.
 */
export function applyItemDiscount(item: CartItem, percent: number): CartItem {
    // Prix d'origine : réutilise celui déjà stocké si une remise est ré-appliquée.
    const originalPrice: Microunits =
        item.originalPriceInMicrounits ?? item.unitPriceInMicrounits;

    if (percent === 0) {
        // Retrait de remise — restaure le prix d'origine.
        return {
            ...item,
            unitPriceInMicrounits: originalPrice,
            discountInMicrounits: toMicrounits(0),
            discountPercent: undefined,
            originalPriceInMicrounits: undefined,
        };
    }

    const discountMicro = toMicrounits(
        Math.round((originalPrice * percent) / 100)
    );
    const discountedPrice = toMicrounits(originalPrice - discountMicro);

    return {
        ...item,
        originalPriceInMicrounits: originalPrice,
        unitPriceInMicrounits: discountedPrice,
        discountInMicrounits: discountMicro,
        discountPercent: percent,
    };
}

/**
 * Marque une ligne comme offerte par la direction (prix = 0, remise = 100 %).
 * Le prix d'origine est conservé pour affichage barré.
 *
 * @param item  Ligne cible.
 * @returns     Nouvelle ligne offerte.
 */
export function applyItemOffer(item: CartItem): CartItem {
    const originalPrice: Microunits =
        item.originalPriceInMicrounits ?? item.unitPriceInMicrounits;

    return {
        ...item,
        originalPriceInMicrounits: originalPrice,
        unitPriceInMicrounits: toMicrounits(0),
        discountInMicrounits: originalPrice,
        discountPercent: 100,
        isOffer: true,
    };
}
