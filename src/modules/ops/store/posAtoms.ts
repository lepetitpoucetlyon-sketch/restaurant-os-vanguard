import { atom } from 'jotai';
import { Product } from '@/types';

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

// Selector for Cart Count (Grade X Stub)
export const posCartCountSelector = atom(0);
export const posCartTotalSelector = atom(0); // Grade X Suture
