#!/usr/bin/env npx tsx
/**
 * 🚀 OpenPencil MCP Server CLI Runner
 * Permet aux agents IA d'interagir avec les 84 pages de Restaurant OS via le protocole MCP
 *
 * Usage:
 *   npx tsx scripts/open-pencil-mcp.ts
 */

import * as readline from 'readline';
import { OpenPencilMcpServer } from '../src/kernel/open-pencil/mcp/OpenPencilMcpServer';

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    const sendJson = (obj: any) => {
        process.stdout.write(JSON.stringify(obj) + '\n');
    };

    // Stdio MCP protocol loop
    rl.on('line', async line => {
        if (!line.trim()) return;

        try {
            const request = JSON.parse(line);

            if (request.method === 'tools/list') {
                sendJson({
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        tools: OpenPencilMcpServer.getTools(),
                    },
                });
                return;
            }

            if (request.method === 'tools/call') {
                const { name, arguments: args } = request.params;
                const result = await OpenPencilMcpServer.executeTool(name, args || {});
                sendJson({
                    jsonrpc: '2.0',
                    id: request.id,
                    result,
                });
                return;
            }

            // Default fallback for initialize or ping
            if (request.method === 'initialize') {
                sendJson({
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        protocolVersion: '2024-11-05',
                        serverInfo: {
                            name: 'open-pencil-restaurant-os-mcp',
                            version: '1.0.0',
                        },
                        capabilities: {
                            tools: {},
                        },
                    },
                });
                return;
            }

            sendJson({
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32601,
                    message: `Méthode inconnue : ${request.method}`,
                },
            });
        } catch (err) {
            sendJson({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
                },
            });
        }
    });

    process.stderr.write('🎨 [OpenPencil MCP Server] Prêt sur stdio pour les 84 pages de Restaurant OS.\n');
}

main().catch(err => {
    process.stderr.write(`Fatal error: ${err}\n`);
    process.exit(1);
});
