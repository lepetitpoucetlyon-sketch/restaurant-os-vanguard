import { IngredientUnit, PreparationType } from "@nexus/contracts";

export const PREPARATION_TYPES: { value: PreparationType; label: string }[] = [
    { value: 'mise_en_place', label: 'Mise en place générale' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'fond', label: 'Fond / Bouillon' },
    { value: 'marinade', label: 'Marinade' },
    { value: 'bouillon', label: 'Bouillon' },
    { value: 'pate', label: 'Pâte (boulangerie/pâtisserie)' },
    { value: 'garniture', label: 'Garniture' },
    { value: 'decoupe', label: 'Découpe / Portionnage' },
    { value: 'assemblage', label: 'Assemblage prêt à cuire' },
    { value: 'dessert_base', label: 'Base dessert (crème, ganache...)' },
    { value: 'other', label: 'Autre' }
];

export const CONTAINER_OPTIONS = [
    'Bac GN 1/1',
    'Bac GN 1/2',
    'Bac GN 1/3',
    'Bac GN 1/4',
    'Bac GN 1/6',
    'Bac GN 1/9',
    'Seau 5L',
    'Seau 10L',
    'Bocal 1L',
    'Film alimentaire',
    'Autre'
];

export const UNIT_OPTIONS: IngredientUnit[] = ['kg', 'g', 'l', 'ml', 'unit', 'piece'];

export interface UsedIngredient {
    stockItemId: string;
    ingredientName: string;
    quantityUsed: number;
    unit: IngredientUnit;
}
