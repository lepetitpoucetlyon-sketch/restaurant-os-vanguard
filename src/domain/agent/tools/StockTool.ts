// @ts-nocheck
import { User } from '@/types';
import { ToolDefinition } from './FinanceTool';

export const StockTool: ToolDefinition = {
    name: 'check_low_stock',
    description: 'Vérifie les articles en rupture ou en stock faible. Accessible au personnel de cuisine et managers.',
    parameters: {
        type: 'object',
        properties: {}
    },
    category: 'inventory',
    execute: async (args, user) => {
        // Mock data, would call StockEngine
        return [
            { item: 'Café Arabica', currentWeight: 1.2, unit: 'kg', threshold: 2.0, status: 'low' },
            { item: 'Lait Entier', currentVolume: 0, unit: 'L', threshold: 10, status: 'out_of_stock' }
        ];
    }
};

export const ReservationTool: ToolDefinition = {
    name: 'get_today_reservations',
    description: 'Récupère la liste des réservations pour aujourd\'hui.',
    parameters: {
        type: 'object',
        properties: {}
    },
    category: 'reservations',
    execute: async (args, user) => {
        return [
            { id: 'res_1', customer: 'M. Dupont', time: '20:00', guests: 4, table: 12, vip: true },
            { id: 'res_2', customer: 'Mme. Martin', time: '19:30', guests: 2, table: 5, vip: false }
        ];
    }
};
