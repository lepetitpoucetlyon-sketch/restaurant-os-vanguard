/**
 * 🏢 TenantPageCustomizer — Gestionnaire de Personnalisation Multi-Tenant des Pages
 * Permet de charger, surcharger et appliquer l'ADN de marque d'un client restaurateur sur n'importe quelle page
 */

import { PageDocument, SceneNode } from '../schema/PenDocument';
import { hexToRgba } from '../schema/StyleTokens';
import { PageCatalogRegistry } from '../catalog/PageCatalogRegistry';
import { ReactToPenTransformer } from '../engine/ReactToPenTransformer';

export interface ClientBrandDna {
    tenantId: string;
    restaurantName: string;
    primaryColor: string; // Hex (ex: "#E11D48" pour un bar branché, "#10B981" pour un salad bar, "#C5A059" pour gastronomique)
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamilyBrand?: string;
    fontFamilyBody?: string;
    logoUrl?: string;
    customTagline?: string;
}

export class TenantPageCustomizer {
    private static memoryStore: Map<string, string> = new Map(); // key: `tenantId:pageId` -> JSON string

    /**
     * Génère la clé de stockage
     */
    private static getStorageKey(tenantId: string, pageId: string): string {
        return `openpencil:custom_page:${tenantId}:${pageId}`;
    }

    /**
     * Récupère le SceneGraph d'une page pour un tenant spécifique (avec surcharge si elle existe)
     */
    public static getPageForTenant(tenantId: string, pageId: string, brandDna?: ClientBrandDna): PageDocument {
        // 1. Vérifier si une surcharge enregistrée existe
        const key = this.getStorageKey(tenantId, pageId);
        let customJson: string | null = null;

        if (typeof window !== 'undefined' && window.localStorage) {
            customJson = window.localStorage.getItem(key);
        }
        if (!customJson) {
            customJson = this.memoryStore.get(`${tenantId}:${pageId}`) || null;
        }

        if (customJson) {
            try {
                return JSON.parse(customJson) as PageDocument;
            } catch {
                // Fallback sur le template de base
            }
        }

        // 2. Récupérer le modèle de base depuis le catalogue
        const meta = PageCatalogRegistry.getPageById(pageId);
        if (!meta) {
            throw new Error(`[TenantPageCustomizer] Page "${pageId}" introuvable dans le catalogue.`);
        }

        const basePage = ReactToPenTransformer.createPageSceneGraph({
            id: meta.id,
            name: meta.name,
            route: meta.route,
            category: meta.category,
            description: meta.description,
            icon: meta.icon,
            device: meta.devicePreset,
            widgets: meta.widgets,
        });

        // 3. Si un ADN de marque est fourni, l'injecter sur le modèle de base
        if (brandDna) {
            return this.applyBrandDna(basePage, brandDna);
        }

        return basePage;
    }

    /**
     * Sauvegarde la personnalisation d'une page pour un tenant
     */
    public static savePageForTenant(tenantId: string, page: PageDocument): void {
        const key = this.getStorageKey(tenantId, page.id);
        const json = JSON.stringify(page);

        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, json);
        }
        this.memoryStore.set(`${tenantId}:${page.id}`, json);
    }

    /**
     * Supprime la personnalisation d'une page pour réinitialiser au modèle usine
     */
    public static resetPageForTenant(tenantId: string, pageId: string): void {
        const key = this.getStorageKey(tenantId, pageId);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
        }
        this.memoryStore.delete(`${tenantId}:${pageId}`);
    }

    /**
     * Applique récursivement une charte graphique client sur tous les nœuds d'un PageDocument
     */
private static applyBrandFills(node: SceneNode, primaryRgba: ReturnType<typeof hexToRgba>): void {
        if (!node.fills || !Array.isArray(node.fills)) return;
        for (const fill of node.fills) {
            if (fill.tokenReference?.includes('gold') || fill.tokenReference?.includes('brand')) {
                fill.color = primaryRgba;
            }
        }
    }

    private static applyBrandTypography(node: SceneNode, brand: ClientBrandDna): void {
        if (node.type !== 'TEXT' || !('style' in node) || !node.style) return;
        if (brand.fontFamilyBrand && (node.style.fontSize >= 24 || node.style.fontFamily?.includes('Cormorant'))) {
            node.style.fontFamily = brand.fontFamilyBrand;
        } else if (brand.fontFamilyBody) {
            node.style.fontFamily = brand.fontFamilyBody;
        }
    }

    private static applyBrandTitle(node: SceneNode, brand: ClientBrandDna): void {
        if (node.id.startsWith('title-') && node.type === 'TEXT' && 'characters' in node) {
            if (brand.restaurantName && !node.characters.includes(brand.restaurantName)) {
                node.characters = `${node.characters} · ${brand.restaurantName}`;
            }
        }
    }

    /**
     * Applique récursivement une charte graphique client sur tous les nœuds d'un PageDocument
     */
    public static applyBrandDna(page: PageDocument, brand: ClientBrandDna): PageDocument {
        const clonedPage: PageDocument = JSON.parse(JSON.stringify(page));
        const primaryRgba = hexToRgba(brand.primaryColor);

        const mutateNodes = (node: SceneNode): void => {
            this.applyBrandFills(node, primaryRgba);
            this.applyBrandTypography(node, brand);
            this.applyBrandTitle(node, brand);

            if ('children' in node && Array.isArray(node.children)) {
                for (const child of node.children) {
                    mutateNodes(child);
                }
            }
        };

        mutateNodes(clonedPage.rootNode);
        return clonedPage;
    }
}
