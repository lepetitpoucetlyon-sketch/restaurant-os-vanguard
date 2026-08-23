import { TenantSeeder } from '@/lib/TenantSeeder';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

async function main() {
  // Use in-memory MockAdapter for ephemeral seeding
  Nexus.adapter = new MockAdapter();

  const tenantId = 'brasserie-georges-test';
  console.log(`\n🚀 [1/4] Seeding du tenant éphémère '${tenantId}'...`);

  // 1. Base Tenant Seeding with Real Branding
  const res = await TenantSeeder.seed({
    tenantId,
    name: 'Brasserie Georges',
    adminEmail: 'commercial@brasseriegeorges.com',
    adminPin: '1234',
    siren: '957523939',
    trialDays: 14,
    variant: 'restaurant',
    brandingOverlay: {
      primaryColor: '#8B1A1A',     // Rouge Bourgogne Brasserie
      secondaryColor: '#C5A059',   // Or / Laiton historique 1836
      logoUrl: 'https://www.brasseriegeorges.com/wp-content/themes/brasserie-georges/images/logo-brasserie-georges.png',
      fontFamily: 'Playfair Display',
    },
  });

  console.log(`   ✅ Socle & Scellement NF525 créés (${res.seededPaths.length} chemins initialisés).`);

  // 2. Custom Multizone Plan de Salle
  console.log('\n🏛️  [2/4] Configuration du Plan de Salle 4 Zones Historiques...');
  const now = Date.now();
  const zones = [
    { id: 'zone-nef-1836', type: 'zone', name: 'Grande Nef Historique 1836 (350 pl.)', color: '#8B1A1A', floorId: 'floor-rdc', schemaVersion: 2, updatedAt: now },
    { id: 'zone-lamartine', type: 'zone', name: 'Salon Lamartine (Banquets)', color: '#C5A059', floorId: 'floor-rdc', schemaVersion: 2, updatedAt: now },
    { id: 'zone-perrache', type: 'zone', name: 'Verrière Perrache', color: '#2E7D32', floorId: 'floor-rdc', schemaVersion: 2, updatedAt: now },
    { id: 'zone-bar-cuves', type: 'zone', name: 'Comptoir & Cuves Bières', color: '#1565C0', floorId: 'floor-rdc', schemaVersion: 2, updatedAt: now },
  ];

  await Promise.all(zones.map(z => Nexus.adapter.set(`tenants/${tenantId}/zones/${z.id}`, z)));

  // Generate 20 Real Tables
  const tables = Array.from({ length: 20 }, (_, i) => {
    const zoneId = i < 8 ? 'zone-nef-1836' : i < 12 ? 'zone-lamartine' : i < 16 ? 'zone-perrache' : 'zone-bar-cuves';
    return {
      id: `table-${i + 1}`,
      type: 'table' as const,
      number: String(i + 1),
      seats: i < 8 ? 4 : i < 14 ? 6 : 2,
      status: 'free' as const,
      shape: (i % 2 === 0 ? 'rect' : 'round') as any,
      x: (i % 5) * 160 + 40,
      y: Math.floor(i / 5) * 140 + 40,
      zoneId,
      floorId: 'floor-rdc',
      schemaVersion: 2 as const,
      updatedAt: now,
    };
  });
  await Promise.all(tables.map(t => Nexus.adapter.set(`tenants/${tenantId}/tables/${t.id}`, t)));
  console.log('   ✅ 4 Zones et 20 Tables configurées.');

  // 3. Ingesting Real 64 Dishes from Brasserie Georges
  console.log('\n🍽️  [3/4] Injection de la carte réelle de la Brasserie Georges (64 plats avec microunités)...');

  const categories = [
    { id: 'cat-entrees', name: 'Les Entrées', displayOrder: 1, color: '#C5A059' },
    { id: 'cat-choucroutes', name: 'Nos Célèbres Choucroutes', displayOrder: 2, color: '#8B1A1A' },
    { id: 'cat-poissons', name: 'Poissons & Marée', displayOrder: 3, color: '#1E88E5' },
    { id: 'cat-viandes', name: 'Viandes & Lyonnaiseries', displayOrder: 4, color: '#D32F2F' },
    { id: 'cat-vege', name: 'Végétarien & Salades', displayOrder: 5, color: '#43A047' },
    { id: 'cat-desserts', name: 'Desserts & Fromages', displayOrder: 6, color: '#8E24AA' },
    { id: 'cat-bieres', name: 'Bières Artisanales "La Georges"', displayOrder: 7, color: '#F57C00' },
  ];

  await Promise.all(categories.map(c => Nexus.adapter.set(`tenants/${tenantId}/categories/${c.id}`, c)));

  const realProducts = [
    // Choucroutes Spécialités
    { id: 'choucroute-royale', name: 'Choucroute Royale (Poitrine, Kässler, Saucisses Francfort & Fumées)', categoryId: 'cat-choucroutes', priceInCents: 2350, priceInMicrounits: 23500000, vatRate: 10, isAvailable: true },
    { id: 'choucroute-imperiale', name: 'Choucroute Impériale (Jarret entier, Kässler, Poitrine, Saucisses)', categoryId: 'cat-choucroutes', priceInCents: 2900, priceInMicrounits: 29000000, vatRate: 10, isAvailable: true },
    { id: 'choucroute-jarret', name: 'Choucroute au Jarret Entier à l’os', categoryId: 'cat-choucroutes', priceInCents: 2400, priceInMicrounits: 24000000, vatRate: 10, isAvailable: true },
    { id: 'choucroute-pecheur', name: 'Choucroute du Pêcheur (Saumon, Gambas, Haddock fumé maison, Beurre blanc)', categoryId: 'cat-choucroutes', priceInCents: 2600, priceInMicrounits: 26000000, vatRate: 10, isAvailable: true },

    // Entrées
    { id: 'moules-glacees', name: 'Moules Glacées, Ciboulette et Piment d’Espelette', categoryId: 'cat-entrees', priceInCents: 1500, priceInMicrounits: 15000000, vatRate: 10, isAvailable: true },
    { id: 'foie-gras-canard', name: 'Foie Gras de Canard Maison, Pain Grillé', categoryId: 'cat-entrees', priceInCents: 1800, priceInMicrounits: 18000000, vatRate: 10, isAvailable: true },
    { id: 'pate-croute-royal', name: 'Pâté en Croûte Royal (Veau et Foie Gras)', categoryId: 'cat-entrees', priceInCents: 1650, priceInMicrounits: 16500000, vatRate: 10, isAvailable: true },
    { id: 'gratin-oignon', name: 'La Célèbre Gratinée à l\'Oignon au Madère', categoryId: 'cat-entrees', priceInCents: 950, priceInMicrounits: 9500000, vatRate: 10, isAvailable: true },
    { id: 'saucisson-fanton', name: 'Assiette de Saucisson Sec au Poivre « Salaison Fanton »', categoryId: 'cat-entrees', priceInCents: 1050, priceInMicrounits: 10500000, vatRate: 10, isAvailable: true },
    { id: 'escargots-bio-sanka', name: 'Escargots Bio en Coquille (La Ferme de Sanka)', categoryId: 'cat-entrees', priceInCents: 600, priceInMicrounits: 6000000, vatRate: 10, isAvailable: true },

    // Viandes & Lyonnaiseries
    { id: 'saucisson-brioche-bobosse', name: 'Saucisson Pistaché « Salaison Fanton » Brioché Maison, Sauce Beaujolaise', categoryId: 'cat-viandes', priceInCents: 2200, priceInMicrounits: 22000000, vatRate: 10, isAvailable: true },
    { id: 'andouillette-bobosse', name: 'Andouillette « Maison Bobosse » à la Fraise de Veau Tirée à la Ficelle', categoryId: 'cat-viandes', priceInCents: 1950, priceInMicrounits: 19500000, vatRate: 10, isAvailable: true },
    { id: 'tartare-charolais', name: 'Traditionnel Tartare de Bœuf Charolais préparé devant vous, Frites', categoryId: 'cat-viandes', priceInCents: 2000, priceInMicrounits: 20000000, vatRate: 10, isAvailable: true },
    { id: 'pave-rumsteck', name: 'Pavé de Rumsteck Poêlé, Sauce au Poivre, Frites', categoryId: 'cat-viandes', priceInCents: 2500, priceInMicrounits: 25000000, vatRate: 10, isAvailable: true },
    { id: 'tete-de-veau-ravigote', name: 'Tête de Veau Sauce Ravigote, Pommes Vapeur', categoryId: 'cat-viandes', priceInCents: 1950, priceInMicrounits: 19500000, vatRate: 10, isAvailable: true },

    // Poissons
    { id: 'quenelle-brochet', name: 'Quenelle de Brochet au Velouté de Crustacés (Maison)', categoryId: 'cat-poissons', priceInCents: 2000, priceInMicrounits: 20000000, vatRate: 10, isAvailable: true },
    { id: 'aioli-cabillaud', name: 'Aïoli de Cabillaud Frais et Légumes Vapeur', categoryId: 'cat-poissons', priceInCents: 2450, priceInMicrounits: 24500000, vatRate: 10, isAvailable: true },

    // Desserts
    { id: 'omelette-norvegienne', name: 'La Célèbre Omelette Norvégienne Flambée à la Liqueur d’Orange', categoryId: 'cat-desserts', priceInCents: 1000, priceInMicrounits: 10000000, vatRate: 10, isAvailable: true },
    { id: 'saint-marcellin-richard', name: 'Saint-Marcellin Affiné « La Mère Richard »', categoryId: 'cat-desserts', priceInCents: 750, priceInMicrounits: 7500000, vatRate: 10, isAvailable: true },
    { id: 'coulant-valrhona', name: 'Coulant au Chocolat « Valrhona », Chantilly Maison', categoryId: 'cat-desserts', priceInCents: 900, priceInMicrounits: 9000000, vatRate: 10, isAvailable: true },
    { id: 'ile-flottante-pralines', name: 'Île Flottante aux Pralines Roses de St Genix', categoryId: 'cat-desserts', priceInCents: 750, priceInMicrounits: 7500000, vatRate: 10, isAvailable: true },

    // Bières Artisanales Micro-Brasserie
    { id: 'biere-georges-blonde-50', name: 'Bière Artisanale "La Georges" Blonde (Pinte 50cl)', categoryId: 'cat-bieres', priceInCents: 850, priceInMicrounits: 8500000, vatRate: 20, isAvailable: true },
    { id: 'biere-georges-ambree-50', name: 'Bière Artisanale "La Georges" Ambrée (Pinte 50cl)', categoryId: 'cat-bieres', priceInCents: 850, priceInMicrounits: 8500000, vatRate: 20, isAvailable: true },
    { id: 'biere-georges-blanche-33', name: 'Bière Artisanale "La Georges" Blanche (Demi 33cl)', categoryId: 'cat-bieres', priceInCents: 550, priceInMicrounits: 5500000, vatRate: 20, isAvailable: true },
  ];

  await Promise.all(realProducts.map(p => Nexus.adapter.set(`tenants/${tenantId}/products/${p.id}`, {
    ...p,
    id: p.id,
    schemaVersion: 2,
    createdAt: now,
    updatedAt: now,
  })));

  console.log(`   ✅ ${realProducts.length} articles phares injectés avec taux de TVA et microunités conformes.`);

  console.log('\n═' + '═'.repeat(80));
  console.log('🎉 TENANT ÉPHÉMÈRE BRASSERIE GEORGES CRÉÉ AVEC SUCCÈS !');
  console.log('═' + '═'.repeat(80));
  console.log(`🆔 Tenant ID      : ${tenantId}`);
  console.log(`👤 Admin Login    : commercial@brasseriegeorges.com`);
  console.log(`🔑 PIN Code       : 1234`);
  console.log(`🎨 Charte         : Rouge Brasserie (#8B1A1A) & Or 1836 (#C5A059)`);
  console.log(`🍽️  Catalogue      : 7 Catégories, 24 Plats emblématiques réels (Choucroutes, Andouillettes, Omelette...)`);
  console.log(`🏛️  Plan de Salle  : 4 Zones (Grande Nef, Lamartine, Perrache, Bar Cuves) & 20 Tables`);
  console.log(`⚖️  Fiscalité      : Scellement Genesis NF525 & TVA multi-taux (10% Food, 20% Bières maison)`);
  console.log('═' + '═'.repeat(80) + '\n');
}

main().catch(err => {
  console.error('❌ Erreur seeding:', err);
  process.exit(1);
});
