import { describe, it, expect } from 'vitest';
import { 
    PERMISSION_ROLE_LEVELS, 
    PERMISSION_ROLE_LABELS,
    type Space,
    type BOM,
    type WorkloadUnit,
    type StorageType,
    type ItemCategory
} from '@/shared/nexus/contracts';
import { 
    spacesNodeAtom, 
    availableSpacesAtom 
} from '@/store/pillars/ops';
import { 
    bomNodeAtom, 
    calculateAssemblyCostSelector 
} from '@/store/pillars/logistics';
import { 
    regulatoryLogsNodeAtom 
} from '@/store/pillars/compliance';
import { resolveVatRate, inferCategory } from '@/modules/finance/fiscalite/tax/vatResolver';
import { NAV_SECTIONS, filterByVertical } from '@/config/navConfig';

describe('🏛️ Universal 8 Pillars Generalization Certification', () => {

    describe('P1 & Contracts: Spaces, BOM and Workload Units', () => {
        it('should support Space and BOM types without typescript or runtime ambiguity', () => {
            const mockSpace: Partial<Space> = { id: 'bay-1', name: 'Baie Mécanique 1', status: 'free', seats: 1 };
            expect(mockSpace.name).toBe('Baie Mécanique 1');

            const mockBOM: Partial<BOM> = { id: 'bom-1', name: 'Forfait Vidange 5W30', preparationTimeMinutes: 45 };
            expect(mockBOM.preparationTimeMinutes).toBe(45);

            const validUnits: WorkloadUnit[] = ['cover', 'vehicle', 'patient', 'client', 'asset_lot', 'unit'];
            expect(validUnits).toContain('vehicle');
            expect(validUnits).toContain('patient');
            expect(validUnits).toContain('asset_lot');
        });

        it('should support universal storage and item categories', () => {
            const storageBay: StorageType = 'workshop_bay';
            const storageVault: StorageType = 'vault_safe';
            const sparePartCategory: ItemCategory = 'spare_part';
            const luxuryCategory: ItemCategory = 'luxury_goods';

            expect(storageBay).toBe('workshop_bay');
            expect(storageVault).toBe('vault_safe');
            expect(sparePartCategory).toBe('spare_part');
            expect(luxuryCategory).toBe('luxury_goods');
        });
    });

    describe('P5 & Permissions: Cross-Vertical Roles & Levels', () => {
        it('should resolve numerical role levels for cross-vertical roles', () => {
            expect(PERMISSION_ROLE_LEVELS.chef_atelier).toBe(50);
            expect(PERMISSION_ROLE_LEVELS.praticien).toBe(50);
            expect(PERMISSION_ROLE_LEVELS.curator).toBe(50);
            expect(PERMISSION_ROLE_LEVELS.expert).toBe(50);
            expect(PERMISSION_ROLE_LEVELS.mecanicien).toBe(40);
            expect(PERMISSION_ROLE_LEVELS.coiffeur).toBe(40);
            expect(PERMISSION_ROLE_LEVELS.vendeur).toBe(40);
        });

        it('should have human readable labels for all roles', () => {
            expect(PERMISSION_ROLE_LABELS.mecanicien).toBe('Mécanicien');
            expect(PERMISSION_ROLE_LABELS.praticien).toBe('Praticien / Médecin');
            expect(PERMISSION_ROLE_LABELS.curator).toBe('Curator / Gestionnaire Coffre');
            expect(PERMISSION_ROLE_LABELS.expert).toBe('Expert Authentificateur');
        });
    });

    describe('Store Pillars: State Atom Aliases Integrity', () => {
        it('should provide valid atom proxies for spaces, bom and regulatory logs', () => {
            expect(spacesNodeAtom).toBeDefined();
            expect(availableSpacesAtom).toBeDefined();
            expect(bomNodeAtom).toBeDefined();
            expect(calculateAssemblyCostSelector).toBeDefined();
            expect(regulatoryLogsNodeAtom).toBeDefined();
        });
    });

    describe('P3: Universal VAT Resolution', () => {
        it('should correctly infer categories across different verticals', () => {
            expect(inferCategory('auto', 'Forfait Vidange')).toBe('service');
            expect(inferCategory('auto', 'Filtre à Huile Purflux')).toBe('spare_parts');
            expect(inferCategory('sante', 'Consultation Spécialiste')).toBe('medical_exempt');
            expect(inferCategory('salon', 'Shampoing Coupe Brushing')).toBe('service');
            expect(inferCategory('restaurant', 'Entrecôte Grillée')).toBe('food');
            expect(inferCategory('bar', 'Cocktail Mojito')).toBe('alcohol');
        });

        it('should apply appropriate tax rates for each domain', () => {
            expect(resolveVatRate({ category: 'medical_exempt', consumptionMode: 'dine_in' })).toBe('0.00');
            expect(resolveVatRate({ category: 'service', consumptionMode: 'dine_in' })).toBe('0.20');
            expect(resolveVatRate({ category: 'spare_parts', consumptionMode: 'takeaway' })).toBe('0.20');
            expect(resolveVatRate({ category: 'food', consumptionMode: 'takeaway' })).toBe('0.055');
            expect(resolveVatRate({ category: 'food', consumptionMode: 'dine_in' })).toBe('0.10');
        });
    });

    describe('Dynamic Navigation Matrix (filterByVertical)', () => {
        it('should retain restaurant items for restaurant variant', () => {
            const filtered = filterByVertical(NAV_SECTIONS, 'restaurant');
            const opSection = filtered.find(s => s.id === 'operations');
            const prodSection = filtered.find(s => s.id === 'production');

            expect(opSection?.items.some(i => i.key === 'pos')).toBe(true);
            expect(opSection?.items.some(i => i.key === 'menu_builder')).toBe(true);
            expect(prodSection?.items.some(i => i.key === 'kitchen_management')).toBe(true);
            expect(prodSection?.items.some(i => i.key === 'bar')).toBe(true);
        });

        it('should adapt navigation for garage variant and strip food items', () => {
            const filtered = filterByVertical(NAV_SECTIONS, 'garage');
            const opSection = filtered.find(s => s.id === 'operations');
            const prodSection = filtered.find(s => s.id === 'production');

            expect(opSection?.title).toBe('Atelier & Caisse');
            expect(opSection?.items.find(i => i.key === 'floor_plan')?.label).toBe('Plan Atelier & Baies');
            expect(opSection?.items.find(i => i.key === 'operations')?.label).toBe('Ordres de Réparation (OR)');

            expect(prodSection?.title).toBe('Pièces & Déchets');
            expect(prodSection?.items.find(i => i.key === 'inventory')?.label).toBe('Pièces & Consommables');
            expect(prodSection?.items.find(i => i.key === 'storage_map')?.label).toBe('Rayonnages & Casiers');

            // Must NOT contain culinary items
            expect(prodSection?.items.some(i => i.key === 'kitchen_management')).toBe(false);
            expect(prodSection?.items.some(i => i.key === 'bar')).toBe(false);
        });

        it('should adapt navigation for clinic variant and strip food items', () => {
            const filtered = filterByVertical(NAV_SECTIONS, 'clinic');
            const opSection = filtered.find(s => s.id === 'operations');
            const prodSection = filtered.find(s => s.id === 'production');

            expect(opSection?.title).toBe('Consultations & Caisse');
            expect(opSection?.items.find(i => i.key === 'pos')?.label).toBe('Encaissement Actes CCAM');
            expect(prodSection?.title).toBe('Pharmacie & Matériel');
            expect(prodSection?.items.find(i => i.key === 'inventory')?.label).toBe('Dispositifs & Matériel');

            // Must NOT contain culinary items
            expect(prodSection?.items.some(i => i.key === 'kitchen_management')).toBe(false);
        });

        it('should adapt navigation for luxury_vault variant', () => {
            const filtered = filterByVertical(NAV_SECTIONS, 'luxury_vault');
            const opSection = filtered.find(s => s.id === 'operations');
            const prodSection = filtered.find(s => s.id === 'production');

            expect(opSection?.title).toBe('Chambre Forte & Caisse');
            expect(opSection?.items.find(i => i.key === 'pos')?.label).toBe('Caisse & Souscriptions');
            expect(prodSection?.title).toBe('Expertise & Scellés');
            expect(prodSection?.items.find(i => i.key === 'inventory')?.label).toBe('Inventaire Sacs & Actifs');
        });
    });
});
