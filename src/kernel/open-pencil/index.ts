/**
 * 🎨 OpenPencil Core Kernel Barrel (ADR-015)
 * Point d'entrée unique pour le moteur Design-as-Code OpenPencil & Personnalisation des 84 pages
 */

export * from './schema';
export * from './engine';
export * from './catalog/PageCatalogRegistry';
export * from './overrides/TenantPageCustomizer';
export * from './mcp/toolDefinitions';
export * from './mcp/OpenPencilMcpServer';
