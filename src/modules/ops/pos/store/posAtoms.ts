import { atom } from 'jotai';
import { Product } from '@nexus/contracts';
import { activeCartAtom } from './orderAtoms';

/**
 * 🛒 POS UI ATOMS - ALPHA-7
 * Objectif : Découpleur l'état de l'interface du cycle de rendu local.
 */

// Recherche active dans la grille de produits
export const posSearchQueryAtom = atom<string>("");

// Produit actuellement sélectionné pour afficher les détails/options
export const posSelectedProductAtom = atom<Product | null>(null);

// État d'ouverture du dialogue de détails du produit
export const posProductDetailsOpenAtom = atom<boolean>(false);

// Filtre de catégorie actif (synchronisé avec le Shell POS)
export const posCategoryFilterAtom = atom<string>("all");

// Selector for Cart Count (Grade X)
export const posCartCountSelector = atom((get) => {
    const cart = get(activeCartAtom);
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Selector for Cart Total (Grade X Suture)
export const posCartTotalSelector = atom((get) => {
    const cart = get(activeCartAtom);
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + (item.priceInCents * item.quantity), 0);
});
