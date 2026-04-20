// @ts-nocheck
// @ts-nocheck
import { atom } from 'jotai';
import { 
    ordersAtom, 
    productsAtom, 
    recipesAtom, 
    staffMembersAtom 
} from './operationalAtoms';
import { Order } from '@/types/orders.types';
import { Product, Recipe } from '@/types/common.types';
import { User as StaffMember } from '@/types/auth.types';

// --- 📈 ANALYTICS DOMAIN (Cross-domain computed selectors) ---

interface MenuAnalysisItem {
    productId: string;
    name: string;
    profitability: number;
    popularity: number;
    category: 'star' | 'plowhorse' | 'puzzle' | 'dog';
}

/**
 * Menu Engineering (Star / Plowhorse / Puzzle / Dog)
 * Ce selector croise les données de commandes, produits et recettes.
 */
export const menuAnalysisSelector = atom((get) => {
    const orders = get(ordersAtom);
    const products = get(productsAtom);
    const recipes = get(recipesAtom);

    if (!products.length) return [];
    
    const itemSales = orders
        .filter(o => o.status === 'paid' || o.status === 'delivered')
        .flatMap(o => o.items)
        .reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + (item.quantity || 1);
            return acc;
        }, {} as Record<string, number>);

    const analysis: MenuAnalysisItem[] = products.map(item => {
        const popularity = itemSales[item.id] || 0;
        const recipe = recipes.find(r => r.id === item.id || r.productId === item.id);
        
        const foodCost = recipe?.ingredients?.reduce((sum: number, ri) => {
            const ingredient = products.find(p => p.id === ri.id);
            return sum + (ri.quantity * (ingredient?.priceInCents || 0));
        }, 0) || item.priceInCents * 0.3; // Default 30% food cost fallback

        return {
            productId: item.id,
            name: item.name,
            profitability: (item.priceInCents || 0) - foodCost,
            popularity,
            category: 'dog'
        };
    });

    const avgPopularity = analysis.reduce((sum, item) => sum + item.popularity, 0) / (analysis.length || 1);
    const avgProfitability = analysis.reduce((sum, item) => sum + item.profitability, 0) / (analysis.length || 1);

    return analysis.map(item => {
        const highPop = item.popularity >= avgPopularity;
        const highProf = item.profitability >= avgProfitability;

        let category: 'star' | 'plowhorse' | 'puzzle' | 'dog' = 'dog';
        if (highPop && highProf) category = 'star';
        else if (highPop && !highProf) category = 'plowhorse';
        else if (!highPop && highProf) category = 'puzzle';

        return { ...item, category };
    });
});

/**
 * Staff Sales & Upsell Performance
 */
export const staffPerformanceSelector = atom((get) => {
    const orders = get(ordersAtom);
    const staff = get(staffMembersAtom);
    const products = get(productsAtom);

    return staff
        .filter(u => u.role === 'server' || u.role === 'admin')
        .map(user => {
            const serverOrders = orders.filter(o => o.serverName === user.name);
            const totalSales = serverOrders.reduce((sum: number, o) => sum + (o.totalInCents || 0), 0);
            const orderCount = serverOrders.length;
            const upsellOrders = serverOrders.filter(o =>
                o.items.some(item => {
                    const product = products.find(p => p.id === item.productId);
                    return product?.categoryId?.toLowerCase().includes('cocktail');
                })
            ).length;

            return {
                userId: user.id,
                userName: user.name,
                totalSalesInCents: totalSales,
                totalSales: totalSales / 100,
                orderCount: orderCount,
                averageCheck: orderCount > 0 ? (totalSales / orderCount) / 100 : 0,
                upsellRate: orderCount > 0 ? (upsellOrders / orderCount) * 100 : 0,
                kudos: (user as any).kudos || 0
            };
        });
});

/**
 * Labor Cost Ratio (Efficiency)
 */
export const laborCostRatioSelector = atom((get): number => {
    const orders = get(ordersAtom);
    const staff = get(staffMembersAtom);
    
    const totalRevenue = orders
        .filter(o => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum: number, o) => sum + (o.totalInCents || 0), 0);
        
    const activeStaff = staff.length;
    const estimatedHourlyLabor = activeStaff * 1500; // 15.00 in cents
    const currentRevenue = totalRevenue || 1;
    return (estimatedHourlyLabor * 8) / currentRevenue;
});
