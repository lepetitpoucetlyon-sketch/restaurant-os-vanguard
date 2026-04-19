import { WineRegion, Wine, Cocktail, BarOrderItem } from '@/types/bar';

export const WINE_REGIONS: WineRegion[] = [
    { id: 'bordeaux', name: 'Bordeaux', country: 'France', color: '#722F37' },
    { id: 'bourgogne', name: 'Bourgogne', country: 'France', color: '#8B0000' },
    { id: 'champagne', name: 'Champagne', country: 'France', color: '#F7E7CE' },
    { id: 'rhone', name: 'Vallée du Rhône', country: 'France', color: '#4A0E0E' },
    { id: 'tuscany', name: 'Toscane', country: 'Italie', color: '#6B2D2D' },
    { id: 'rioja', name: 'Rioja', country: 'Espagne', color: '#5C1A1A' },
];

export const WINE_CELLAR: Wine[] = [
    {
        id: 'W001',
        name: 'Château Margaux 2015',
        region: 'bordeaux',
        type: 'Rouge',
        grape: 'Cabernet Sauvignon, Merlot',
        vintage: 2015,
        priceInCents: 45000,
        costPriceInCents: 25000,
        stock: 6,
        minStock: 2,
        rating: 98,
        servingTemp: '16-18°C',
        pairings: ['Boeuf Wellington', 'Agneau rôti', 'Fromages affinés'],
        notes: 'Grand cru classé, notes de cassis et cèdre',
        location: 'Cave A - Étagère 3',
    },
    {
        id: 'W002',
        name: 'Dom Pérignon 2012',
        region: 'champagne',
        type: 'Champagne',
        grape: 'Chardonnay, Pinot Noir',
        vintage: 2012,
        priceInCents: 28000,
        costPriceInCents: 16000,
        stock: 12,
        minStock: 4,
        rating: 96,
        servingTemp: '8-10°C',
        pairings: ['Huîtres', 'Caviar', 'Homard'],
        notes: 'Finesse exceptionnelle, bulles fines',
        location: 'Cave B - Étagère 1',
    },
    {
        id: 'W003',
        name: 'Romanée-Conti 2018',
        region: 'bourgogne',
        type: 'Rouge',
        grape: 'Pinot Noir',
        vintage: 2018,
        priceInCents: 185000,
        costPriceInCents: 120000,
        stock: 2,
        minStock: 1,
        rating: 100,
        servingTemp: '15-17°C',
        pairings: ['Pigeon rôti', 'Truffe', 'Époisses'],
        notes: 'Le graal des vins, complexité infinie',
        location: 'Cave Premium - Coffre',
    },
    {
        id: 'W004',
        name: 'Château d\'Yquem 2016',
        region: 'bordeaux',
        type: 'Liquoreux',
        grape: 'Sémillon, Sauvignon Blanc',
        vintage: 2016,
        priceInCents: 38000,
        costPriceInCents: 22000,
        stock: 4,
        minStock: 2,
        rating: 97,
        servingTemp: '8-10°C',
        pairings: ['Foie gras', 'Roquefort', 'Tarte Tatin'],
        notes: 'Notes de miel et abricot confit',
        location: 'Cave A - Étagère 5',
    },
];

export const COCKTAILS: Cocktail[] = [
    {
        id: 'C001',
        name: 'Signature Martini',
        category: 'Classique revisité',
        priceInCents: 1600,
        costPriceInCents: 450,
        ingredients: ['Gin premium', 'Vermouth dry', 'Twist citron'],
        garnish: 'Zeste de citron',
        glassware: 'Coupette',
        technique: 'Stirred',
        popularity: 92,
        isSignature: true,
        image: "https://images.unsplash.com/photo-1575023782549-62ca0d244b39?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 'C002',
        name: 'Espresso Martini',
        category: 'After dinner',
        priceInCents: 1400,
        costPriceInCents: 380,
        ingredients: ['Vodka', 'Kahlúa', 'Espresso', 'Sirop sucre'],
        garnish: '3 grains de café',
        glassware: 'Coupette',
        technique: 'Shaken',
        popularity: 88,
        isSignature: false,
        image: "https://images.unsplash.com/photo-1629249726332-9cb57b68623b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 'C003',
        name: 'French 75',
        category: 'Champagne cocktail',
        priceInCents: 1800,
        costPriceInCents: 520,
        ingredients: ['Gin', 'Citron', 'Sirop', 'Champagne'],
        garnish: 'Twist citron',
        glassware: 'Flûte',
        technique: 'Shaken & topped',
        popularity: 85,
        isSignature: false,
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 'C004',
        name: 'Negroni Sbagliato',
        category: 'Apéritif',
        priceInCents: 1400,
        costPriceInCents: 400,
        ingredients: ['Campari', 'Vermouth rouge', 'Prosecco'],
        garnish: 'Tranche orange',
        glassware: 'Tumbler',
        technique: 'Built',
        popularity: 78,
        isSignature: false,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"
    },
];

export const BAR_ORDERS = [
    {
        id: 'BAR001',
        table: 'T05',
        time: '20:15',
        elapsed: 3,
        items: [
            {
                name: 'Signature Martini',
                qty: 2,
                status: 'preparing',
                image: "https://images.unsplash.com/photo-1575023782549-62ca0d244b39?auto=format&fit=crop&w=800&q=80",
                station: "COCKTAIL",
                modifiers: ["Gin Bombay Sapphire", "Extra Dry", "Zeste Citron"],
                details: { glass: "Coupette", method: "Stirred" }
            },
            {
                name: 'Espresso Martini',
                qty: 1,
                status: 'pending',
                image: "https://images.unsplash.com/photo-1629249726332-9cb57b68623b?auto=format&fit=crop&w=800&q=80",
                station: "COCKTAIL",
                notes: "Sans sucre ajouté svp",
                details: { glass: "Coupette", method: "Shaken" }
            },
        ],
        priority: 'normal',
        serverName: "Thomas A."
    },
    {
        id: 'BAR002',
        table: 'T12',
        time: '20:18',
        elapsed: 1,
        items: [
            {
                name: 'Dom Pérignon 2012',
                qty: 1,
                status: 'pending',
                image: "https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?auto=format&fit=crop&w=800&q=80",
                station: "CAVE",
                modifiers: ["Seau à glace", "6 Flûtes"],
                details: { glass: "Flûte", method: "Service" }
            },
        ],
        priority: 'vip',
        serverName: "Alexandre D."
    },
    {
        id: 'BAR003',
        table: 'Bar',
        time: '20:10',
        elapsed: 8,
        items: [
            {
                name: 'French 75',
                qty: 3,
                status: 'preparing',
                image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
                station: "COCKTAIL",
                modifiers: ["Bien frais"],
                details: { glass: "Flûte", method: "Built" }
            },
            {
                name: 'Negroni Sbagliato',
                qty: 2,
                status: 'done',
                image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
                station: "COCKTAIL",
                details: { glass: "Rocks", method: "Built" }
            },
        ],
        priority: 'rush',
        serverName: "Sarah M."
    },
];
