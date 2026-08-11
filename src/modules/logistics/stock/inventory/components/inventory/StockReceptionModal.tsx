'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Modal } from "@ui/Modal";
import { PremiumSelect } from "@ui/PremiumSelect";
import { Package, MapPin, Calendar, AlertTriangle, RefreshCw, Plus, Check, X, Truck } from "lucide-react";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useInventory } from "@/modules/ops";
// import { receiveStockAction } from "@/app/actions/inventory";
import { useAtomValue } from "jotai";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { IngredientCategory, IngredientUnit, DEFAULT_STORAGE_LOCATIONS } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/logger";
import { receiveStockAction } from "../../actions/inventory.action";
import { VisionScanner } from "@/shared/components/VisionScanner";
import type { ExtractedInvoice } from "@nexus/contracts";

interface SupplierRecord {
    id: string;
    name: string;
    [key: string]: unknown;
};

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
    produce: 'Fruits & Légumes',
    dairy: 'Produits Laitiers',
    meat: 'Viandes',
    poultry: 'Volailles',
    seafood: 'Poissons & Fruits de mer',
    charcuterie: 'Charcuterie',
    bakery: 'Boulangerie',
    dry: 'Épicerie sèche',
    condiment: 'Condiments',
    spice: 'Épices',
    oil: 'Huiles & Vinaigres',
    beverage: 'Boissons',
    wine: 'Vins',
    spirits: 'Spiritueux',
    frozen: 'Surgelés',
    other: 'Autre'
};

const UNIT_OPTIONS: IngredientUnit[] = ['kg', 'g', 'l', 'ml', 'cl', 'unit', 'piece', 'bunch', 'crate', 'box', 'bottle', 'can'];

interface StockReceptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StockReceptionModal({ isOpen, onClose }: StockReceptionModalProps) {
    const { ingredients, storageLocations } = useInventory();
    const tenantId = useAtomValue(tenantIdAtom);

    const [selectedIngredient, setSelectedIngredient] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [unit, setUnit] = useState<IngredientUnit>('kg');
    const [storageLocation, setStorageLocation] = useState<string>('');
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [lotNumber, setLotNumber] = useState<string>('');
    const [unitCost, setUnitCost] = useState<string>('');
    const [receptionDate, setReceptionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dlc, setDlc] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // log-1: Dynamic supplier loading from Nexus (no hardcoded DEFAULT_SUPPLIER)
    const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;
        const path = tenantId ? `tenants/${tenantId}/suppliers` : Nexus.getTenantPath('suppliers');
        Nexus.adapter
            .query<SupplierRecord>(path)
            .then((results) => setSuppliers(results ?? []))
            .catch((err) => logger.warn('[StockReceptionModal] Failed to load suppliers', err));
    }, [isOpen, tenantId]);

    // Auto-fill based on selected ingredient
    const handleIngredientChange = (ingredientId: string) => {
        setSelectedIngredient(ingredientId);
        const ing = ingredients.find(i => i.id === ingredientId);
        if (ing) {
            setUnit(ing.unit as IngredientUnit);
            setStorageLocation(String(ing.defaultStorageLocation || ''));
            const costMu = Number(ing.costInMicrounits ?? (Number(ing.costInCents || 0) * 10_000));
            setUnitCost((costMu / 1_000_000).toString());
            // Auto-select supplier if ingredient has a supplierId that matches a loaded supplier
            if (ing.supplierId) {
                setSelectedSupplierId(String(ing.supplierId));
            }

            // Calculate default DLC
            const dlcDate = new Date();
            dlcDate.setDate(dlcDate.getDate() + (Number(ing.shelfLifeDays) || 7));
            setDlc(dlcDate.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedIngredient || !quantity || !storageLocation || !dlc || !tenantId) return;

        setIsSubmitting(true);

        const ing = ingredients.find(i => i.id === selectedIngredient);
        if (!ing) { setIsSubmitting(false); return; }

        try {
            await receiveStockAction(tenantId, {
                ingredientId: selectedIngredient,
                ingredientName: ing.name,
                category: ing.category,
                quantity: parseFloat(quantity),
                unit,
                storageLocationId: storageLocation,
                receptionDate,
                dlc,
                unitCost: parseFloat(unitCost) || 0,
                ...(batchNumber && { batchNumber }),
                ...(lotNumber && { lotNumber }),
                ...(selectedSupplierId && { supplierId: selectedSupplierId }),
                status: 'available',
                createdAt: new Date().toISOString(),
            });

            setSuccess(true);
            setSelectedIngredient('');
            setQuantity('');
            setBatchNumber('');
            setLotNumber('');
            setUnitCost('');
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1200);
        } catch (error) {
            logger.error('[StockReceptionModal] Reception failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeLocations = storageLocations.length > 0 ? storageLocations : DEFAULT_STORAGE_LOCATIONS;

    // log-4 : préremplissage depuis facture scannée (Vision AI).
    // On tente de matcher le premier article de la facture à un ingrédient existant par nom
    // (contains, case-insensitive). Le supplier est repris du champ "supplierName" si un
    // fournisseur portant ce nom existe déjà. Le reste (quantité/coût) est toujours utilisable.
    const handleInvoiceScanned = (invoice: ExtractedInvoice) => {
        const firstItem = invoice.items[0];
        if (firstItem) {
            const nameLower = firstItem.name.toLowerCase();
            const matched = ingredients.find(i => i.name.toLowerCase().includes(nameLower) || nameLower.includes(i.name.toLowerCase()));
            if (matched) handleIngredientChange(matched.id);
            setQuantity(String(firstItem.quantity));
            if (firstItem.unit) setUnit(firstItem.unit as IngredientUnit);
            setUnitCost(String(firstItem.unitPriceHT));
            if (firstItem.expirationDate) setDlc(firstItem.expirationDate);
            if (firstItem.batchNumber) setBatchNumber(firstItem.batchNumber);
        }
        if (invoice.supplierName) {
            const matchedSupplier = suppliers.find(s => s.name.toLowerCase() === invoice.supplierName.toLowerCase());
            if (matchedSupplier) setSelectedSupplierId(matchedSupplier.id);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            showClose={false}
            className="p-0 border-none bg-transparent"
        >
            <div className="relative bg-bg-primary border border-white/40 rounded-[3rem] shadow-premium w-full max-h-[90vh] flex flex-col overflow-hidden group/modal">
                {/* Cinematic Background Elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />

                {/* Header */}
                <div className="p-10 border-b border-border/40 bg-surface-card/40 backdrop-blur-md relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[22px] bg-text-primary flex items-center justify-center shadow-premium">
                                <Package className="w-8 h-8 text-text-primary" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-serif font-black text-text-primary italic tracking-tight">Réception Archive.</h2>
                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-2">Scellement de nouvelles ressources</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-surface-card/60 hover:bg-surface-card flex items-center justify-center transition-all border border-border/40 hover:rotate-90 hover:scale-110 shadow-soft"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 elegant-scrollbar relative z-10">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-24 rounded-[2.5rem] bg-text-primary flex items-center justify-center mb-10 shadow-premium"
                            >
                                <Check className="w-12 h-12 text-text-primary" strokeWidth={3} />
                            </motion.div>
                            <p className="text-4xl font-serif font-black text-text-primary italic">Stock Scellé avec Succès.</p>
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-4">Les ressources ont été intégrées à l&apos;archive maître</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Vision Scanner — scan invoice to auto-fill (log-4) */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                                    SCAN AUTOMATIQUE (OPTIONNEL)
                                </label>
                                <VisionScanner
                                    onAnalysisComplete={handleInvoiceScanned}
                                    label="Scanner le bon de livraison"
                                />
                            </div>

                            {/* Ingredient Selection */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                                    IDENTITÉ DE LA RESSOURCE *
                                </label>
                                <PremiumSelect
                                    value={selectedIngredient}
                                    onChange={handleIngredientChange}
                                    options={ingredients.map(ing => ({
                                        value: String(ing.id),
                                        label: String(ing.name || '').toUpperCase(),
                                        description: String(CATEGORY_LABELS[ing.category as IngredientCategory] || ing.category || 'Autre').toUpperCase()
                                    }))}
                                />
                            </div>

                            {/* Quantity & Unit */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                        MASSE / VOLUME *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-8 py-5 bg-surface-card border border-border/40 rounded-2xl text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                        MESURE PROTOCOLE
                                    </label>
                                    <PremiumSelect
                                        value={unit}
                                        onChange={(val) => setUnit(val as IngredientUnit)}
                                        options={UNIT_OPTIONS.map(u => ({
                                            value: u,
                                            label: u?.toUpperCase() || ''
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Supplier dropdown (log-1: dynamic from Nexus) */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                    <Truck className="w-3.5 h-3.5 text-accent-gold" />
                                    FOURNISSEUR
                                </label>
                                <PremiumSelect
                                    value={selectedSupplierId}
                                    onChange={setSelectedSupplierId}
                                    options={[
                                        { value: '', label: suppliers.length === 0 ? '— Aucun fournisseur enregistré —' : '— Sélectionner un fournisseur —' },
                                        ...suppliers.map(s => ({
                                            value: s.id,
                                            label: String(s.name || s.id).toUpperCase(),
                                        })),
                                    ]}
                                />
                            </div>

                            {/* Storage Location */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                    <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                                    DESTINATION D&apos;ARCHIVAGE *
                                </label>
                                <PremiumSelect
                                    value={storageLocation}
                                    onChange={setStorageLocation}
                                    options={activeLocations.filter(l => l.isActive).map(loc => ({
                                        value: String(loc.id),
                                        label: String(loc.name || '').toUpperCase(),
                                        description: loc.temperature !== undefined ? `${loc.temperature}°C` : undefined
                                    }))}
                                />
                            </div>

                            {/* Dates Section */}
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] px-2 outline-none">
                                        <Calendar className="w-4 h-4 text-accent-gold" />
                                        RÉCEPTION PROTOCOLÉE
                                    </label>
                                    <input
                                        type="date"
                                        value={receptionDate}
                                        onChange={(e) => setReceptionDate(e.target.value)}
                                        className="w-full px-8 py-5 bg-surface-card/60 border border-border/40 rounded-2xl text-[14px] font-black text-text-primary focus:outline-none focus:border-accent-gold transition-all shadow-soft"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-error uppercase tracking-[0.4em] px-2 outline-none">
                                        <AlertTriangle className="w-4 h-4" />
                                        EXPIRATION (DLC) *
                                    </label>
                                    <input
                                        type="date"
                                        value={dlc}
                                        onChange={(e) => setDlc(e.target.value)}
                                        className="w-full px-8 py-5 bg-error/5 border border-error/20 rounded-2xl text-[14px] font-black text-error focus:outline-none focus:border-error transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] focus:ring-4 focus:ring-error/5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-10 border-t border-border/40 bg-surface-card/40 backdrop-blur-md flex items-center justify-between gap-6 relative z-10">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.5em] text-text-muted hover:text-text-primary transition-all rounded-[22px]"
                        >
                            ANNULATION
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={!selectedIngredient || !quantity || !storageLocation || !dlc || isSubmitting}
                            className={cn(
                                "flex items-center gap-6 px-16 py-6 rounded-[30px] text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 shadow-premium",
                                selectedIngredient && quantity && storageLocation && dlc
                                    ? "bg-text-primary text-text-primary hover:bg-accent-gold"
                                    : "bg-text-muted/10 text-text-muted/20 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <Plus className="w-6 h-6" />
                            )}
                            {isSubmitting ? "SCELLAGE..." : "SCELLER DANS L'ARCHIVE"}
                        </motion.button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
