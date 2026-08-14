// NO 'use client' — This is a React Server Component (Next.js App Router)
// It runs server-side and injects the schema.org JSON-LD block for the restaurant menu.

interface CategoryRecord {
  id: string;
  name: string;
  description?: string;
}

interface ProductRecord {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  priceTTC?: number;
  categoryId?: string;
  visibleOnMenu?: boolean;
}

interface MenuItemLd {
  '@type': 'MenuItem';
  name: string;
  description?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: 'EUR';
  };
}

interface MenuSectionLd {
  '@type': 'MenuSection';
  name: string;
  description?: string;
  hasMenuItem: MenuItemLd[];
}

async function fetchMenuData(): Promise<{
  categories: CategoryRecord[];
  products: ProductRecord[];
}> {
  try {
    const { Nexus } = await import('@/lib/nexus/NexusAdapter');
    const [categories, products] = await Promise.all([
      Nexus.adapter
        .query<CategoryRecord>('menu_categories')
        .catch(() => [] as CategoryRecord[]),
      Nexus.adapter
        .query<ProductRecord>('products')
        .catch(() => [] as ProductRecord[]),
    ]);
    return { categories, products };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[MenuJsonLd] fetchMenuData échoué — JSON-LD omis', err);
    return { categories: [], products: [] };
  }
}

export default async function MenuJsonLd() {
  const { categories, products } = await fetchMenuData();

  const hasMenuSection: MenuSectionLd[] = categories.map((cat) => {
    const catProducts = products.filter(
      (p) => p.categoryId === cat.id && p.visibleOnMenu !== false
    );

    const hasMenuItem: MenuItemLd[] = catProducts.map((p) => {
      const item: MenuItemLd = {
        '@type': 'MenuItem',
        name: p.name,
      };
      const desc = p.shortDescription ?? p.longDescription;
      if (desc) item.description = desc;
      if (p.priceTTC) {
        item.offers = {
          '@type': 'Offer',
          price: p.priceTTC.toFixed(2),
          priceCurrency: 'EUR',
        };
      }
      return item;
    });

    const section: MenuSectionLd = {
      '@type': 'MenuSection',
      name: cat.name,
      hasMenuItem,
    };
    if (cat.description) section.description = cat.description;
    return section;
  });

  const restaurantName =
    process.env.NEXT_PUBLIC_RESTAURANT_NAME ??
    process.env.NEXT_PUBLIC_APP_NAME ??
    'Restaurant';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurantName,
    menu: {
      '@type': 'Menu',
      hasMenuSection,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
