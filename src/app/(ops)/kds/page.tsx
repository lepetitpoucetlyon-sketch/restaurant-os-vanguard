"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useOrders } from "@/engines/ops/NexusOpsProvider";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { usePageSetting } from "@/components/settings/ContextualSettings";
import { useRecipes } from "@/engines/ops/NexusOpsProvider";
import { Order, Recipe } from "@/types";

// Components
import { KDSHeader } from "./components/KDSHeader";
import { KDSTicket } from "./components/KDSTicket";
import { KDSEmptyState } from "./components/KDSEmptyState";

// UI Components (Modals)
import { ModificationAlertsPanel } from "@/modules/ops/components/kds/ModificationAlerts";
import { RecipeDetailDialog } from "@/modules/ops/components/kitchen/RecipeDetailDialog";
import { PlateAuditWizard } from "@/modules/ops/components/kitchen/PlateAuditWizard";

// Constants
import { ITEM_STATION_MAP, KitchenStation } from "./constants";

interface AuditTicket {
    id: string;
    recipeName: string;
    standardImage?: string;
}

export default function KDSPage() {
    const { orders, updateOrderStatus, getPendingModifications } = useOrders() as any;
    const { recipes } = useRecipes();
    
    // Core State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeStation, setActiveStation] = useState<KitchenStation>('all');
    const [rushMode, setRushMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // UI State
    const [showModificationAlerts, setShowModificationAlerts] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [auditTicket, setAuditTicket] = useState<AuditTicket | null>(null);
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    // Settings
    const columnsFromSettings = usePageSetting('kds', 'columns', 3);
    const [gridColumns, setGridColumns] = useState(columnsFromSettings);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [lastOrderCount, setLastOrderCount] = useState(orders.length);

    // Sync settings
    useEffect(() => { setGridColumns(columnsFromSettings); }, [columnsFromSettings]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Audio Initialization
    useEffect(() => {
        audioRef.current = new Audio('https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    // Notification Sound
    useEffect(() => {
        if (orders.length > lastOrderCount) {
            audioRef.current?.play().catch(() => {});
        }
        setLastOrderCount(orders.length);
    }, [orders.length, lastOrderCount]);

    // Filtering & Sorting Logic
    const filteredOrders = useMemo(() => {
        const activeOrders = (orders as any[]).filter(o => o?.status !== 'delivered');
        let result = activeOrders;

        if (activeStation !== 'all') {
            result = result.filter(order =>
                order.items.some(item => (ITEM_STATION_MAP[item.name] || 'hot') === activeStation)
            ).map(order => ({
                ...order,
                items: order.items.filter(item => (ITEM_STATION_MAP[item.name] || 'hot') === activeStation)
            }));
        }

        if (searchQuery) {
            result = result.filter(o =>
                o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.serverName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return result.sort((a, b) => {
            const isAReady = a?.status === 'ready';
            const isBReady = b?.status === 'ready';
            if (isAReady && !isBReady) return 1;
            if (!isAReady && isBReady) return -1;
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
    }, [orders, activeStation, searchQuery]) as any[];

    const preparingOrdersCount = orders.filter(o => o?.status === 'preparing' || o?.status === 'new').length;
    const pendingModificationsCount = getPendingModifications().length;

    return (
        <div className={cn(
            "h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex flex-col overflow-hidden animate-fade-in transition-all duration-700",
            "bg-bg-primary text-text-primary",
            rushMode && "bg-error/5"
        )}>
            {/* Rush Mode Atmospheric Overlay */}
            <AnimatePresence>
                {rushMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-error/5 to-transparent animate-pulse"
                    />
                )}
            </AnimatePresence>

            <KDSHeader 
                activeStation={activeStation}
                setActiveStation={setActiveStation}
                ordersCount={orders.length}
                preparingOrdersCount={preparingOrdersCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                gridColumns={gridColumns}
                setGridColumns={setGridColumns}
                currentTime={currentTime}
                rushMode={rushMode}
                setRushMode={setRushMode}
                pendingModificationsCount={pendingModificationsCount}
                setShowModificationAlerts={setShowModificationAlerts}
            />

            {/* Production Display Area */}
            <div className="flex-1 p-4 md:p-10 overflow-auto relative custom-scrollbar bg-bg-primary">
                {/* Immersive Background Decor */}
                <div className="absolute top-[10%] left-[5%] w-[60%] h-[60%] blur-[250px] pointer-events-none rounded-full bg-success-soft/30" />
                <div className="absolute bottom-[10%] right-[5%] w-[50%] h-[50%] blur-[200px] pointer-events-none rounded-full bg-blue-500/5" />

                <AnimatePresence mode="popLayout">
                    {filteredOrders.length === 0 ? (
                        <KDSEmptyState key="empty" />
                    ) : (
                        <motion.div
                            layout
                            className="grid gap-6 md:gap-10 relative z-10"
                            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                        >
                            {filteredOrders.map(ticket => (
                                <KDSTicket 
                                    key={ticket.id}
                                    ticket={ticket as any}
                                    gridColumns={gridColumns}
                                    rushMode={rushMode}
                                    updateOrderStatus={updateOrderStatus}
                                    setSelectedRecipe={setSelectedRecipe}
                                    setIsAuditOpen={setIsAuditOpen}
                                    setAuditTicket={setAuditTicket}
                                    recipes={recipes as any}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <ModificationAlertsPanel
                isOpen={showModificationAlerts}
                onClose={() => setShowModificationAlerts(false)}
            />

            <RecipeDetailDialog
                recipe={selectedRecipe}
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />

            <AnimatePresence>
                {isAuditOpen && auditTicket && (
                    <PlateAuditWizard 
                        recipeName={auditTicket.recipeName}
                        standardImage={auditTicket.standardImage}
                        onClose={() => setIsAuditOpen(false)}
                        onComplete={() => {
                            updateOrderStatus(auditTicket.id, 'ready');
                            setIsAuditOpen(false);
                            setAuditTicket(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
