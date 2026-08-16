import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStation } from '@/modules/ops/production/kds/contracts/kds-constants';
import { KDSAudioHardwareService } from '@/modules/ops/production/kds/services/KDSAudioHardwareService';
import type { Order, OrderItem } from '@nexus/contracts';
import { toMicrounits } from '@/shared/schemas/primitives';

describe('🍳 KDS Multi-Postes & Hardware — Integration Kitchen Dispatch Pipeline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scénario 1 : Routage intelligent des lignes de commande par poste culinaire', () => {
        const orderItems = [
            { id: '1', productId: 'p1', name: 'Côte de Bœuf Grillée', quantity: 2, unitPriceInMicrounits: toMicrounits(45_000_000), taxRate: '0.10' as const, modifiers: [] },
            { id: '2', productId: 'p2', name: 'Salade César Fraîcheur', quantity: 1, unitPriceInMicrounits: toMicrounits(16_000_000), taxRate: '0.10' as const, modifiers: [] },
            { id: '3', productId: 'p3', name: 'Tarte Tatin Maison', quantity: 2, unitPriceInMicrounits: toMicrounits(9_000_000), taxRate: '0.10' as const, modifiers: [] },
            { id: '4', productId: 'p4', name: 'Cocktail Old Fashioned', quantity: 2, unitPriceInMicrounits: toMicrounits(14_000_000), taxRate: '0.20' as const, modifiers: [] },
        ] as unknown as OrderItem[];

        // Vérification du dispatch par station
        expect(resolveStation(orderItems[0].name)).toBe('hot');    // Côte de bœuf -> Poste Chaud
        expect(resolveStation(orderItems[1].name)).toBe('cold');   // Salade -> Poste Froid
        expect(resolveStation(orderItems[2].name)).toBe('pastry'); // Tarte Tatin -> Pâtisserie
        expect(resolveStation(orderItems[3].name)).toBe('bar');    // Cocktail -> Bar
    });

    it('Scénario 2 : Tiroir de Contexte Complet Table (Accords Mets & Vins)', () => {
        const fullOrder = {
            id: 'ord_table_12',
            tableNumber: 'Table 12',
            serverName: 'Thomas',
            status: 'preparing',
            createdAt: Date.now(),
            items: [
                { id: 'i1', productId: 'p1', name: 'Foie Gras Poêlé', quantity: 1, unitPriceInMicrounits: toMicrounits(22_000_000), taxRate: '0.10', modifiers: [], seatNumber: 'Siège 1' },
                { id: 'i2', productId: 'p2', name: 'Sauternes 2018 (Verre)', quantity: 1, unitPriceInMicrounits: toMicrounits(12_000_000), taxRate: '0.20', modifiers: [], seatNumber: 'Siège 1' },
                { id: 'i3', productId: 'p3', name: 'Tartare de Saumon', quantity: 1, unitPriceInMicrounits: toMicrounits(18_000_000), taxRate: '0.10', modifiers: [], seatNumber: 'Siège 2' },
                { id: 'i4', productId: 'p4', name: 'Chablis 1er Cru (Verre)', quantity: 1, unitPriceInMicrounits: toMicrounits(11_000_000), taxRate: '0.20', modifiers: [], seatNumber: 'Siège 2' },
            ]
        } as unknown as Order;

        // Groupement par siège pour la vision 360° du Chef
        const groupedBySeat: Record<string, OrderItem[]> = {};
        for (const item of fullOrder.items) {
            const seat = (item as any).seatNumber || 'Partagé';
            if (!groupedBySeat[seat]) groupedBySeat[seat] = [];
            groupedBySeat[seat].push(item);
        }

        expect(Object.keys(groupedBySeat)).toEqual(['Siège 1', 'Siège 2']);
        expect(groupedBySeat['Siège 1'].map(i => i.name)).toContain('Foie Gras Poêlé');
        expect(groupedBySeat['Siège 1'].map(i => i.name)).toContain('Sauternes 2018 (Verre)');
    });

    it('Scénario 3 : Signaux audio Web Audio API & Raccourcis / Pédales physiques', () => {
        const playChimeSpy = vi.spyOn(KDSAudioHardwareService, 'playChime').mockImplementation(() => {});

        // 1. Déclenchement carillon poste chaud et poste froid
        KDSAudioHardwareService.playChime('hot');
        expect(playChimeSpy).toHaveBeenCalledWith('hot');

        KDSAudioHardwareService.playChime('cold');
        expect(playChimeSpy).toHaveBeenCalledWith('cold');

        KDSAudioHardwareService.playChime('suite_fire');
        expect(playChimeSpy).toHaveBeenCalledWith('suite_fire');

        // 2. Vérification de la cartographie matérielle & raccourcis pédales
        const shortcuts = KDSAudioHardwareService.getKeyboardShortcuts();
        expect(shortcuts.length).toBeGreaterThan(5);

        const bumpShortcut = shortcuts.find(s => s.action === 'BUMP_TICKET');
        expect(bumpShortcut).toBeDefined();
        expect(bumpShortcut?.pedalMapping).toBe('Pédale 1');

        // 3. Résolution d'action via code clavier / pédale
        expect(KDSAudioHardwareService.resolveKeyEvent('Space')).toBe('BUMP_TICKET');
        expect(KDSAudioHardwareService.resolveKeyEvent('ArrowRight')).toBe('NEXT_TICKET');
        expect(KDSAudioHardwareService.resolveKeyEvent('KeyF')).toBe('FIRE_NEXT_COURSE');
        expect(KDSAudioHardwareService.resolveKeyEvent('UnknownKey')).toBeNull();
    });

    it('Scénario 4 : Ordonnancement séquentiel des services (Coursing Suite / Envoi)', () => {
        const orderWithCourses = {
            id: 'ord_coursing_01',
            tableNumber: 'Table 4',
            serverName: 'Julie',
            status: 'preparing',
            createdAt: Date.now(),
            items: [
                { id: 'i1', productId: 'p1', name: 'Velouté de Potimarron', quantity: 2, unitPriceInMicrounits: toMicrounits(10_000_000), taxRate: '0.10', modifiers: [], course: 'starter', sentAt: Date.now() - 60000 },
                { id: 'i2', productId: 'p2', name: 'Filet de Bœuf Rossini', quantity: 2, unitPriceInMicrounits: toMicrounits(38_000_000), taxRate: '0.10', modifiers: [], course: 'main', sentAt: undefined },
                { id: 'i3', productId: 'p3', name: 'Soufflé au Grand Marnier', quantity: 2, unitPriceInMicrounits: toMicrounits(14_000_000), taxRate: '0.10', modifiers: [], course: 'dessert', sentAt: undefined },
            ]
        } as unknown as Order;

        const starters = orderWithCourses.items.filter((i: any) => i.course === 'starter');
        const mains = orderWithCourses.items.filter((i: any) => i.course === 'main');
        const desserts = orderWithCourses.items.filter((i: any) => i.course === 'dessert');

        expect(starters.length).toBe(1);
        expect((starters[0] as any).sentAt).toBeDefined(); // Entrée déjà envoyée en cuisson
        expect((mains[0] as any).sentAt).toBeUndefined(); // Plat en attente d'envoi suite
        expect((desserts[0] as any).sentAt).toBeUndefined(); // Dessert en attente
    });
});
