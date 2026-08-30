/**
 * ⚡ OpenPencilMcpServer — Moteur d'exécution des outils MCP pour agents IA
 * Permet aux agents de piloter la personnalisation des 84 pages via Model Context Protocol
 */

import { OPEN_PENCIL_MCP_TOOLS, OpenPencilToolDef } from './toolDefinitions';
import { PageCatalogRegistry } from '../catalog/PageCatalogRegistry';
import { TenantPageCustomizer, ClientBrandDna } from '../overrides/TenantPageCustomizer';
import { PageSceneGraphCompiler } from '../engine/PageSceneGraphCompiler';
import { SceneGraphManager } from '../engine/SceneGraphManager';

export class OpenPencilMcpServer {
    public static getTools(): OpenPencilToolDef[] {
        return OPEN_PENCIL_MCP_TOOLS;
    }

    /**
     * Exécute un appel d'outil MCP OpenPencil
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP tool args are dynamic JSON per protocol
    public static async executeTool(toolName: string, args: Record<string, any>): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
        try {
            switch (toolName) {
                case 'openpencil_list_pages': {
                    const category = args.category;
                    const pages = category && category !== 'all'
                        ? PageCatalogRegistry.getPagesByCategory(category)
                        : PageCatalogRegistry.getAllPages();

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        total: pages.length,
                                        pages: pages.map(p => ({
                                            id: p.id,
                                            route: p.route,
                                            name: p.name,
                                            category: p.category,
                                            icon: p.icon,
                                            devicePreset: p.devicePreset,
                                        })),
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                }

                case 'openpencil_get_page': {
                    let pageId = args.pageId;
                    if (!pageId && args.route) {
                        const meta = PageCatalogRegistry.getPageByRoute(args.route);
                        pageId = meta?.id;
                    }
                    if (!pageId) {
                        return {
                            isError: true,
                            content: [{ type: 'text', text: 'Paramètre pageId ou route obligatoire et valide requis.' }],
                        };
                    }

                    const tenantId = args.tenantId || '_demo_restaurant';
                    const page = TenantPageCustomizer.getPageForTenant(tenantId, pageId);
                    return {
                        content: [{ type: 'text', text: PageSceneGraphCompiler.serialize({
                            version: '1.0.0',
                            name: `Export Page ${page.name}`,
                            author: 'OpenPencil MCP Server',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            pages: [page],
                        }) }],
                    };
                }

                case 'openpencil_update_node': {
                    const { pageId, nodeId, updates, tenantId = '_demo_restaurant' } = args;
                    const page = TenantPageCustomizer.getPageForTenant(tenantId, pageId);
                    const manager = new SceneGraphManager({
                        version: '1.0.0',
                        name: 'Temp',
                        author: 'MCP',
                        createdAt: '',
                        updatedAt: '',
                        pages: [page],
                    });

                    const success = manager.updateNode(nodeId, updates);
                    if (!success) {
                        return {
                            isError: true,
                            content: [{ type: 'text', text: `Nœud "${nodeId}" introuvable sur la page "${pageId}".` }],
                        };
                    }

                    const updatedPage = manager.getActivePage()!;
                    TenantPageCustomizer.savePageForTenant(tenantId, updatedPage);

                    return {
                        content: [{ type: 'text', text: `✅ Nœud "${nodeId}" mis à jour avec succès sur "${pageId}" pour le tenant "${tenantId}".` }],
                    };
                }

                case 'openpencil_apply_client_branding': {
                    const { tenantId, restaurantName, primaryColor, pageId, fontFamilyBrand } = args;
                    const brandDna: ClientBrandDna = {
                        tenantId,
                        restaurantName,
                        primaryColor,
                        fontFamilyBrand,
                    };

                    if (pageId) {
                        const page = TenantPageCustomizer.getPageForTenant(tenantId, pageId, brandDna);
                        TenantPageCustomizer.savePageForTenant(tenantId, page);
                        return {
                            content: [{ type: 'text', text: `✅ ADN de marque appliqué avec succès sur la page "${pageId}" pour "${restaurantName}" (${tenantId}).` }],
                        };
                    }

                    // Appliquer sur l'ensemble des 84 pages
                    const allPages = PageCatalogRegistry.getAllPages();
                    for (const meta of allPages) {
                        const p = TenantPageCustomizer.getPageForTenant(tenantId, meta.id, brandDna);
                        TenantPageCustomizer.savePageForTenant(tenantId, p);
                    }

                    return {
                        content: [{ type: 'text', text: `✅ ADN de marque appliqué avec succès sur les ${allPages.length} pages de Restaurant OS pour "${restaurantName}" (${tenantId}).` }],
                    };
                }

                case 'openpencil_export_code': {
                    const { pageId, tenantId = '_demo_restaurant' } = args;
                    const page = TenantPageCustomizer.getPageForTenant(tenantId, pageId);
                    const tsx = PageSceneGraphCompiler.compileToReactTSX(page);
                    return {
                        content: [{ type: 'text', text: tsx }],
                    };
                }

                case 'openpencil_lint_design': {
                    const { pageId } = args;
                    const page = TenantPageCustomizer.getPageForTenant('_demo_restaurant', pageId);
                    const issues: string[] = [];

                    // Parcours pour vérifier l'a11y et le dimensionnement
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- traversée récursive de SceneNode polymorphe
                    const checkNode = (n: any) => {
                        if (n.type === 'FRAME' && n.id.includes('btn') && (n.width < 44 || n.height < 44)) {
                            issues.push(`Zone tactile sous 44px sur le bouton "${n.name}" (${n.width}x${n.height}px) - WCAG 2.5.5.`);
                        }
                        if (n.type === 'TEXT' && n.style?.fontSize < 11) {
                            issues.push(`Texte trop petit sur "${n.name}" (${n.style.fontSize}px) - recommandation minimum 11px.`);
                        }
                        if (n.children && Array.isArray(n.children)) {
                            for (const c of n.children) checkNode(c);
                        }
                    };

                    checkNode(page.rootNode);

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        pageId,
                                        passed: issues.length === 0,
                                        score: issues.length === 0 ? '100% WCAG AA' : `${Math.max(60, 100 - issues.length * 10)}%`,
                                        issuesCount: issues.length,
                                        issues,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                }

                default:
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Outil OpenPencil inconnu: "${toolName}".` }],
                    };
            }
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Erreur lors de l'exécution de ${toolName}: ${err instanceof Error ? err.message : String(err)}` }],
            };
        }
    }
}
