import { describe, it, expect } from 'vitest';
import { OpenPencilMcpServer } from '@/kernel/open-pencil/mcp/OpenPencilMcpServer';

describe('⚡ OpenPencil — MCP Server & AI Agent Tools', () => {
    it('expose la liste complète des 6 outils MCP', () => {
        const tools = OpenPencilMcpServer.getTools();
        expect(tools.length).toBe(6);
        expect(tools.map(t => t.name)).toContain('openpencil_list_pages');
        expect(tools.map(t => t.name)).toContain('openpencil_get_page');
        expect(tools.map(t => t.name)).toContain('openpencil_update_node');
        expect(tools.map(t => t.name)).toContain('openpencil_apply_client_branding');
        expect(tools.map(t => t.name)).toContain('openpencil_export_code');
        expect(tools.map(t => t.name)).toContain('openpencil_lint_design');
    });

    it('exécute openpencil_list_pages et retourne les 84 pages', async () => {
        const res = await OpenPencilMcpServer.executeTool('openpencil_list_pages', {});
        expect(res.isError).toBeFalsy();
        const data = JSON.parse(res.content[0].text);
        expect(data.total).toBe(84);
        expect(data.pages.length).toBe(84);
    });

    it('exécute openpencil_get_page par ID ou par route', async () => {
        const res1 = await OpenPencilMcpServer.executeTool('openpencil_get_page', { pageId: 'page-pos' });
        expect(res1.isError).toBeFalsy();
        const doc1 = JSON.parse(res1.content[0].text);
        expect(doc1.pages[0].id).toBe('page-pos');

        const res2 = await OpenPencilMcpServer.executeTool('openpencil_get_page', { route: '/floor-plan' });
        expect(res2.isError).toBeFalsy();
        const doc2 = JSON.parse(res2.content[0].text);
        expect(doc2.pages[0].route).toBe('/floor-plan');
    });

    it('exécute openpencil_apply_client_branding sur les 84 pages', async () => {
        const res = await OpenPencilMcpServer.executeTool('openpencil_apply_client_branding', {
            tenantId: 'resto-test-mcp',
            restaurantName: 'Brasserie Bellecour',
            primaryColor: '#D97706',
        });
        expect(res.isError).toBeFalsy();
        expect(res.content[0].text).toContain('84 pages');
    });

    it('exécute openpencil_export_code et produit du code React TSX', async () => {
        const res = await OpenPencilMcpServer.executeTool('openpencil_export_code', { pageId: 'page-kds' });
        expect(res.isError).toBeFalsy();
        expect(res.content[0].text).toContain('"use client"');
        expect(res.content[0].text).toContain('export default function');
    });

    it('exécute openpencil_lint_design et effectue les contrôles a11y', async () => {
        const res = await OpenPencilMcpServer.executeTool('openpencil_lint_design', { pageId: 'page-pos' });
        expect(res.isError).toBeFalsy();
        const lintResult = JSON.parse(res.content[0].text);
        expect(lintResult.pageId).toBe('page-pos');
        expect(lintResult.score).toBeDefined();
    });
});
