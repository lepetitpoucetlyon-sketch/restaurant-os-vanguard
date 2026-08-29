/**
 * 🛠️ OpenPencil MCP Tool Definitions
 * Spécifications standardisées des outils OpenPencil pour les agents IA (Antigravity, Claude Code, Cursor)
 */

export interface OpenPencilToolDef {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export const OPEN_PENCIL_MCP_TOOLS: OpenPencilToolDef[] = [
    {
        name: 'openpencil_list_pages',
        description: 'Liste l ensemble des 84 pages disponibles dans Restaurant OS Core avec métadonnées, catégories et routes',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['operations', 'commerce', 'management', 'admin', 'marketing', 'public', 'all'],
                    description: 'Filtrer par catégorie de page',
                },
            },
        },
    },
    {
        name: 'openpencil_get_page',
        description: 'Récupère l AST SceneGraph .pen complet d une page donnée par son ID ou sa route',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'ID de la page (ex: "page-pos", "page-kds", "page-reservations")' },
                route: { type: 'string', description: 'Route de la page (ex: "/pos", "/floor-plan")' },
                tenantId: { type: 'string', description: 'ID optionnel du client restaurant' },
            },
        },
    },
    {
        name: 'openpencil_update_node',
        description: 'Met à jour un nœud dans le SceneGraph d une page (textes, styles, layout, fills, visibilité)',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'ID de la page cible' },
                nodeId: { type: 'string', description: 'ID du nœud à modifier' },
                updates: {
                    type: 'object',
                    description: 'Propriétés à mettre à jour (ex: { characters: "Nouveau titre", visible: true, cornerRadius: 16 })',
                },
                tenantId: { type: 'string', description: 'Tenant cible pour la sauvegarde' },
            },
            required: ['pageId', 'nodeId', 'updates'],
        },
    },
    {
        name: 'openpencil_apply_client_branding',
        description: 'Applique une charte graphique complète (couleur primaire, typographie, nom du restaurant) sur une page ou sur les 84 pages d un tenant',
        inputSchema: {
            type: 'object',
            properties: {
                tenantId: { type: 'string', description: 'ID du client restaurant' },
                restaurantName: { type: 'string', description: 'Nom de l établissement' },
                primaryColor: { type: 'string', description: 'Couleur hexadécimale principale (ex: "#E11D48")' },
                pageId: { type: 'string', description: 'ID optionnel de page spécifique (si omis, applique au tenant)' },
                fontFamilyBrand: { type: 'string', description: 'Police des titres (ex: "Cormorant Garamond")' },
            },
            required: ['tenantId', 'restaurantName', 'primaryColor'],
        },
    },
    {
        name: 'openpencil_export_code',
        description: 'Génère le code React TSX / Tailwind de production pour une page personnalisée',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'ID de la page à exporter' },
                tenantId: { type: 'string', description: 'ID du client restaurant' },
            },
            required: ['pageId'],
        },
    },
    {
        name: 'openpencil_lint_design',
        description: 'Vérifie l accessibilité (WCAG 2.1 AA, contrastes de couleur, zones tactiles >= 44px) et la conformité responsive d une page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'ID de la page à auditer' },
            },
            required: ['pageId'],
        },
    },
];
