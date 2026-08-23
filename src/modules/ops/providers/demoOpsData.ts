import type { Table, Zone, Floor } from '@/modules/ops';
import type { Product } from '@/modules/commerce';
import type { Category } from '@/shared/nexus/contracts/common.types';
import { toMicrounits } from '@/shared/schemas/primitives';

const now = () => Date.now();
const nowISO = () => new Date().toISOString();

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-entrees', name: 'Entrées du Chef', sortOrder: 1, icon: 'UtensilsCrossed', color: '#C5A059', createdAt: nowISO(), updatedAt: nowISO() },
  { id: 'cat-plats', name: 'Plats & Spécialités', sortOrder: 2, icon: 'Beef', color: '#C5A059', createdAt: nowISO(), updatedAt: nowISO() },
  { id: 'cat-desserts', name: 'Desserts Gourmands', sortOrder: 3, icon: 'Coffee', color: '#C5A059', createdAt: nowISO(), updatedAt: nowISO() },
  { id: 'cat-boissons', name: 'Boissons & Carte des Vins', sortOrder: 4, icon: 'GlassWater', color: '#C5A059', createdAt: nowISO(), updatedAt: nowISO() },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-1', type: 'product',
    name: 'Tartare de Bar & Agrumes',
    description: 'Bar de ligne mariné au combawa, émulsion d\'agrumes et tuile de sarrasin.',
    priceInMicrounits: toMicrounits(160_000_000),
    priceInCents: 1600, taxRate: '0.10', categoryId: 'cat-entrees', isAvailable: true,
    allergens: ['Poisson'], updatedAt: now(),
  },
  {
    id: 'prod-2', type: 'product',
    name: 'Burrata Crémeuse des Pouilles',
    description: 'Tomates anciennes rôties, pesto de basilic pourpre et huile d\'olive d\'Ombrie.',
    priceInMicrounits: toMicrounits(145_000_000),
    priceInCents: 1450, taxRate: '0.10', categoryId: 'cat-entrees', isAvailable: true,
    allergens: ['Lactose'], updatedAt: now(),
  },
  {
    id: 'prod-3', type: 'product',
    name: 'Filet de Bœuf Rossini & Purée Truffée',
    description: 'Bœuf maturé 30 jours, escalope de foie gras poêlée et jus corsé au porto.',
    priceInMicrounits: toMicrounits(340_000_000),
    priceInCents: 3400, taxRate: '0.10', categoryId: 'cat-plats', isAvailable: true,
    allergens: [], updatedAt: now(),
  },
  {
    id: 'prod-4', type: 'product',
    name: 'Risotto aux Gambas Royales & Safran',
    description: 'Riz Carnaroli crémeux, gambas flambées au cognac et pistils de safran bio.',
    priceInMicrounits: toMicrounits(265_000_000),
    priceInCents: 2650, taxRate: '0.10', categoryId: 'cat-plats', isAvailable: true,
    allergens: ['Crustacés', 'Lactose'], updatedAt: now(),
  },
  {
    id: 'prod-5', type: 'product',
    name: 'Pizza Truffe Noire & Stracciatella',
    description: 'Pâte levée 72h, crème de truffe d\'été, fior di latte et stracciatella fraîche.',
    priceInMicrounits: toMicrounits(220_000_000),
    priceInCents: 2200, taxRate: '0.10', categoryId: 'cat-plats', isAvailable: true,
    allergens: ['Gluten', 'Lactose'], updatedAt: now(),
  },
  {
    id: 'prod-6', type: 'product',
    name: 'Sphère Chocolat Grand Cru Guanaja',
    description: 'Cœur coulant au caramel beurre salé, crumble cacao et glace vanille Bourbon.',
    priceInMicrounits: toMicrounits(115_000_000),
    priceInCents: 1150, taxRate: '0.10', categoryId: 'cat-desserts', isAvailable: true,
    allergens: ['Lactose', 'Œufs'], updatedAt: now(),
  },
  {
    id: 'prod-7', type: 'product',
    name: 'Tiramisu Traditionnel au Café d\'Éthiopie',
    description: 'Biscuits savoyards maison imbibés au moka d\'Éthiopie et mascarpone aéré.',
    priceInMicrounits: toMicrounits(95_000_000),
    priceInCents: 950, taxRate: '0.10', categoryId: 'cat-desserts', isAvailable: true,
    allergens: ['Gluten', 'Lactose', 'Œufs'], updatedAt: now(),
  },
  {
    id: 'prod-8', type: 'product',
    name: 'Cocktail Signature Resto OS',
    description: 'Gin artisanal français, cordial de yuzu frais, basilic pourpre et tonic fumé.',
    priceInMicrounits: toMicrounits(130_000_000),
    priceInCents: 1300, taxRate: '0.20', categoryId: 'cat-boissons', isAvailable: true,
    allergens: [], updatedAt: now(),
  },
  {
    id: 'prod-9', type: 'product',
    name: 'Chablis Premier Cru 2022 (Verre 12cl)',
    description: 'Domaine William Fèvre — Minéral, vif et élégant avec des notes florales.',
    priceInMicrounits: toMicrounits(120_000_000),
    priceInCents: 1200, taxRate: '0.20', categoryId: 'cat-boissons', isAvailable: true,
    allergens: ['Sulfites'], updatedAt: now(),
  },
];

export const DEMO_ZONES: Zone[] = [
  { id: 'salle-principale', type: 'zone', name: 'Salle Principale', color: '#C5A059', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'terrasse', type: 'zone', name: 'Terrasse Extérieure', color: '#059669', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'vip', type: 'zone', name: 'Salon Privé VIP', color: '#722F37', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
];

export const DEMO_FLOORS: Floor[] = [
  { id: 'floor-1', type: 'floor', name: 'Rez-de-chaussée', level: 0, isActive: true, schemaVersion: 2, updatedAt: now() },
];

export const DEMO_TABLES: Table[] = [
  { id: 'tbl-1', type: 'table', number: '1', seats: 2, status: 'ordered', x: 80, y: 80, width: 90, height: 90, shape: 'rect', zoneId: 'salle-principale', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-2', type: 'table', number: '2', seats: 4, status: 'free', x: 220, y: 80, width: 100, height: 100, shape: 'rect', zoneId: 'salle-principale', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-3', type: 'table', number: '3', seats: 6, status: 'eating', x: 380, y: 80, width: 110, height: 110, shape: 'circle', zoneId: 'salle-principale', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-4', type: 'table', number: '4', seats: 2, status: 'paying', x: 550, y: 80, width: 90, height: 90, shape: 'rect', zoneId: 'salle-principale', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-101', type: 'table', number: '101', seats: 4, status: 'seated', x: 80, y: 240, width: 95, height: 95, shape: 'rect', zoneId: 'terrasse', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-102', type: 'table', number: '102', seats: 4, status: 'free', x: 220, y: 240, width: 95, height: 95, shape: 'rect', zoneId: 'terrasse', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
  { id: 'tbl-201', type: 'table', number: '201', seats: 8, status: 'reserved', x: 400, y: 240, width: 130, height: 130, shape: 'circle', zoneId: 'vip', floorId: 'floor-1', schemaVersion: 2, updatedAt: now() },
];
