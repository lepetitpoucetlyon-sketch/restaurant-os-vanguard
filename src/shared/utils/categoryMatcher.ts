/**
 * 🏛️ Universal Category Matcher for Restaurant OS — Grade X
 * Seamlessly matches products across category IDs, Names, Slugs, Accents, and Singular/Plural aliases.
 */
export function isProductInCategory(
    product: { category?: string; categoryId?: string; categoryName?: string },
    categoryFilter: string,
    categories?: Array<{ id: string; name: string; slug?: string }>
): boolean {
    if (!categoryFilter || categoryFilter === 'all') return true;

    const filterRaw = String(categoryFilter).trim();
    if (filterRaw.toLowerCase() === 'all') return true;

    const pCat = String(product.category || product.categoryName || '').trim();
    const pCatId = String(product.categoryId || '').trim();

    // 1. Direct String Match (Fast Path)
    if (pCatId === filterRaw || pCat === filterRaw) return true;

    // 2. Normalized String Helper (lowercase + accent-stripped + alphanumeric only)
    const normalize = (str: string) => 
        str.normalize('NFD')
           .replace(/[\u0300-\u06ff]/g, '')
           .toLowerCase()
           .replace(/[^a-z0-9]/g, '');

    const normFilter = normalize(filterRaw);
    const normPCat = normalize(pCat);
    const normPCatId = normalize(pCatId);

    if (normFilter !== '' && (normFilter === normPCat || normFilter === normPCatId)) return true;

    // 3. Category Metadata Lookup (If categoryFilter is a Category ID like "cat_101")
    if (categories && categories.length > 0) {
        const matchedCatObj = categories.find(c => 
            String(c.id) === filterRaw || 
            normalize(String(c.id)) === normFilter || 
            normalize(String(c.name)) === normFilter
        );

        if (matchedCatObj) {
            const normObjId = normalize(String(matchedCatObj.id));
            const normObjName = normalize(String(matchedCatObj.name));

            if (
                (normPCat !== '' && (normPCat === normObjId || normPCat === normObjName)) ||
                (normPCatId !== '' && (normPCatId === normObjId || normPCatId === normObjName))
            ) {
                return true;
            }
        }
    }

    // 4. Substring fallback matching for plural/singular (e.g. "boisson" vs "boissons")
    if (normPCat.length >= 3 && normFilter.length >= 3) {
        if (normPCat.includes(normFilter) || normFilter.includes(normPCat)) return true;
    }

    return false;
}
