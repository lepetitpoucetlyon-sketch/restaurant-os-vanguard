import { atom } from 'jotai';
import { Reservation, GroupEvent } from '@nexus/contracts';
import { createProxyDomain } from '@/store/nexusNodeFactory';
import { currentDateAtom } from '@/store/base';
import { SovereignMath } from '@/lib/services/SovereignMath';
import { ordersAtom } from '@/store/pillars/ops';
import { productsAtom, recipesAtom, stockItemsAtom } from '@/store/pillars/logistics';
import { staffMembersAtom } from '@/store/pillars/human';
import type { MarketingCampaign, SocialAccount } from '../../modules/commerce/acquisition/marketing/types';
import type { Quote } from '../../modules/commerce/acquisition/marketing/quotes.types';
import type { SEOProfile, MarketingSegment, ScheduledPost } from '../../modules/commerce/acquisition/marketing/seo.types';
import type { Customer as CRM } from '../../modules/commerce/relation/customers/types';

export type { MarketingSegment, ScheduledPost } from '../../modules/commerce/acquisition/marketing/seo.types';
export type { SocialAccount } from '../../modules/commerce/acquisition/marketing/types';

// --- 🏨 RESERVATIONS DOMAIN (Grade IX - Industrial) ---

const _reservations = createProxyDomain<Reservation>('reservations');
export const reservationsNodeAtom = _reservations.node;
export const reservationsAtom = _reservations.data;
export const reservationsLoadingAtom = _reservations.loading;

const _groups = createProxyDomain<GroupEvent>('groups');
export const groupsNodeAtom = _groups.node;
export const groupsAtom = _groups.data;
export const groupsLoadingAtom = _groups.loading;

// --- 📊 INDUSTRIAL STATS ---
export const reservationStatsAtom = atom((get) => {
    const reservations = get(reservationsAtom);
    const today = get(currentDateAtom);
    const todayReservations = reservations.filter(r => r.date === today);

    return {
        total: reservations.length,
        todayCount: todayReservations.length,
        todayCovers: todayReservations.reduce((sum, r) => sum + r.partySize, 0),
        pending: reservations.filter(r => r.status === 'confirmed').length,
        seated: reservations.filter(r => r.status === 'seated').length,
        noShow: reservations.filter(r => r.status === 'no_show').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };
});

// --- 🛰️ SYNC & TELEMETRY ---
export const isReservationSyncingAtom = atom(false);

// --- 📈 ANALYTICS DOMAIN (Cross-domain computed selectors) ---

interface MenuAnalysisItem {
    productId: string;
    name: string;
    profitability: number;
    popularity: number;
    category: 'star' | 'plowhorse' | 'puzzle' | 'dog';
}

export const menuAnalysisSelector = atom((get) => {
    const orders = get(ordersAtom);
    const products = get(productsAtom);
    const recipes = get(recipesAtom);
    const stockItems = get(stockItemsAtom);

    if (!products.length) return [];

    const itemSales = orders
        .filter((o) => o.status === 'paid' || o.status === 'delivered')
        .flatMap((o) => o.items || [])
        .reduce(
            (acc, item) => {
                acc[item.productId] = (acc[item.productId] || 0) + (item.quantity || 1);
                return acc;
            },
            {} as Record<string, number>,
        );

    const analysis: MenuAnalysisItem[] = products.map((item) => {
        const popularity = itemSales[item.id] || 0;
        const recipe = recipes.find((r) => r.id === item.id);

        const foodCost =
            (recipe?.ingredients || []).reduce((sum: number, ri) => {
                const stockItem = stockItems.find((si) => si.id === ri.id);
                return sum + ri.quantity * (stockItem?.unitCostInCents || 0);
            }, 0) || (item.priceInCents ?? 0) * 0.3;

        return {
            productId: item.id,
            name: item.name,
            profitability: (item.priceInCents || 0) - foodCost,
            popularity,
            category: 'dog',
        };
    });

    const avgPopularity =
        analysis.reduce((sum, item) => sum + item.popularity, 0) / (analysis.length || 1);
    const avgProfitability =
        analysis.reduce((sum, item) => sum + item.profitability, 0) / (analysis.length || 1);

    return analysis.map((item) => {
        const highPop = item.popularity >= avgPopularity;
        const highProf = item.profitability >= avgProfitability;

        let category: 'star' | 'plowhorse' | 'puzzle' | 'dog' = 'dog';
        if (highPop && highProf) category = 'star';
        else if (highPop && !highProf) category = 'plowhorse';
        else if (!highPop && highProf) category = 'puzzle';

        return { ...item, category };
    });
});

export const staffPerformanceSelector = atom((get) => {
    const orders = get(ordersAtom);
    const staff = get(staffMembersAtom);
    const products = get(productsAtom);

    return staff
        .filter((u) => u.role === 'server' || u.role === 'admin')
        .map((user) => {
            const serverOrders = orders.filter((o) => o.serverName === user.name);
            const totalSales = SovereignMath.toCents(BigInt(serverOrders.reduce(
                (sum: number, o) => sum + SovereignMath.orderTotalMicrounits(o),
                0,
            )));
            const orderCount = serverOrders.length;
            const upsellOrders = serverOrders.filter((o) =>
                (o.items || []).some((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return String(product?.category || '')
                        .toLowerCase()
                        .includes('cocktail');
                }),
            ).length;

            return {
                userId: user.id,
                userName: user.name,
                totalSalesInCents: totalSales,
                totalSales: totalSales / 100,
                orderCount: orderCount,
                averageCheck: orderCount > 0 ? totalSales / orderCount / 100 : 0,
                upsellRate: orderCount > 0 ? (upsellOrders / orderCount) * 100 : 0,
                kudos: user.kudos || 0,
            };
        });
});

export const laborCostRatioSelector = atom((get): number => {
    const orders = get(ordersAtom);
    const staff = get(staffMembersAtom);

    const totalRevenue = SovereignMath.toCents(BigInt(orders
        .filter((o) => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum: number, o) => sum + SovereignMath.orderTotalMicrounits(o), 0)));

    const activeStaff = staff.length;
    const estimatedHourlyLabor = activeStaff * 1500;
    const currentRevenue = totalRevenue || 1;
    return (estimatedHourlyLabor * 8) / currentRevenue;
});

// --- 📢 MARKETING & CRM DOMAIN ---

export const seoProfileAtom = atom<SEOProfile | null>(null);

const _marketingCampaigns = createProxyDomain<MarketingCampaign>('marketingCampaigns');
export const marketingCampaignsNodeAtom = _marketingCampaigns.node;
export const marketingCampaignsAtom = _marketingCampaigns.data;

const _socialAccounts = createProxyDomain<SocialAccount>('socialAccounts');
export const socialAccountsNodeAtom = _socialAccounts.node;
export const socialAccountsAtom = _socialAccounts.data;

const _quotes = createProxyDomain<Quote>('quotes');
export const quotesNodeAtom = _quotes.node;
export const quotesAtom = _quotes.data;
export const quotesLoadingAtom = _quotes.loading;

const _marketingSegments = createProxyDomain<MarketingSegment>('marketingSegments');
export const marketingSegmentsNodeAtom = _marketingSegments.node;
export const marketingSegmentsAtom = _marketingSegments.data;
export const marketingSegmentsLoadingAtom = _marketingSegments.loading;

const _scheduledPosts = createProxyDomain<ScheduledPost>('scheduledPosts');
export const scheduledPostsNodeAtom = _scheduledPosts.node;
export const scheduledPostsAtom = _scheduledPosts.data;
export const scheduledPostsLoadingAtom = _scheduledPosts.loading;

const _crms = createProxyDomain<CRM>('crms');
export const crmsNodeAtom = _crms.node;
export const crmsAtom = atom(
    (get) => get(_crms.data),
    (get, set, newValue: CRM[]) => {
        const node = get(_crms.node) as import('@/store/nexusNodeFactory').NexusNode<CRM>;
        set(_crms.node, { ...node, data: newValue });
    }
);
export const crmsLoadingAtom = _crms.loading;
export const selectedCRMAtom = atom<CRM | null>(null);

export const isMarketingSyncingAtom = atom(false);

export const seoLoadingAtom = atom((get) => {
    const mNode = get(marketingCampaignsNodeAtom);
    const pNode = get(scheduledPostsNodeAtom);
    return (mNode?.loading || pNode?.loading) || false;
});
