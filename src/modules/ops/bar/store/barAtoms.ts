import { createProxyDomain } from '@/store/nexusNodeFactory';
import type { Wine, Cocktail, WineRegion } from '@/modules/ops/types/bar';

const _wines = createProxyDomain<Wine>('wines');
export const winesNodeAtom = _wines.node;
export const winesAtom = _wines.data;
export const winesLoadingAtom = _wines.loading;

const _cocktails = createProxyDomain<Cocktail>('cocktails_bar');
export const cocktailsNodeAtom = _cocktails.node;
export const cocktailsAtom = _cocktails.data;
export const cocktailsLoadingAtom = _cocktails.loading;

const _wineRegions = createProxyDomain<WineRegion>('wineRegions');
export const wineRegionsNodeAtom = _wineRegions.node;
export const wineRegionsAtom = _wineRegions.data;
