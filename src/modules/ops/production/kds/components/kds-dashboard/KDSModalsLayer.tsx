"use client";

import { AnimatePresence } from "framer-motion";
import type { Order, OrderStatus, Recipe } from "@nexus/contracts";
import { ModificationAlertsPanel } from "../../../kitchen/components/ModificationAlerts";
import { RecipeDetailDialog } from "../../../kitchen/components/RecipeDetailDialog";
import { PlateAuditWizard } from "../../../kitchen/components/PlateAuditWizard";
import { pushToUser, pushToRole } from '@/lib/push/pushClient';

export interface AuditTicket {
    id: string;
    recipeName: string;
    standardImage?: string;
}

interface KDSModalsLayerProps {
    showModificationAlerts: boolean;
    setShowModificationAlerts: (v: boolean) => void;
    selectedRecipe: Recipe | null;
    setSelectedRecipe: (v: Recipe | null) => void;
    isAuditOpen: boolean;
    setIsAuditOpen: (v: boolean) => void;
    auditTicket: AuditTicket | null;
    setAuditTicket: (v: AuditTicket | null) => void;
    displayOrders: Order[];
    tenantId: string | undefined;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export function KDSModalsLayer({
    showModificationAlerts,
    setShowModificationAlerts,
    selectedRecipe,
    setSelectedRecipe,
    isAuditOpen,
    setIsAuditOpen,
    auditTicket,
    setAuditTicket,
    displayOrders,
    tenantId,
    updateOrderStatus,
}: KDSModalsLayerProps) {
    return (
        <>
            <ModificationAlertsPanel
                isOpen={showModificationAlerts}
                onClose={() => setShowModificationAlerts(false)}
            />

            {selectedRecipe && (
                <RecipeDetailDialog
                    recipe={selectedRecipe}
                    isOpen={true}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}

            <AnimatePresence>
                {isAuditOpen && auditTicket && (
                    <PlateAuditWizard
                        recipeName={auditTicket.recipeName}
                        standardImage={auditTicket.standardImage}
                        onClose={() => setIsAuditOpen(false)}
                        onComplete={() => {
                            void (async () => {
                                await updateOrderStatus(auditTicket.id, 'ready');
                                const fullTicket = displayOrders.find(o => o.id === auditTicket.id);
                                if (fullTicket) {
                                    const serverId = (fullTicket as unknown as { serverId?: string }).serverId;
                                    const pushPayload = {
                                        title: 'Plat prêt !',
                                        body: (fullTicket.items || []).slice(0, 3).map((i: { name?: string }) => i.name || 'Article').join(', '),
                                        url: '/pos',
                                    };
                                    if (serverId) {
                                        pushToUser(tenantId ?? '', serverId, pushPayload);
                                    } else {
                                        pushToRole(tenantId ?? '', 'serveur', pushPayload);
                                    }
                                    if (process.env.NODE_ENV !== 'production') {
                                        console.info('[KDS] Push envoyé pour ticket', auditTicket.id);
                                    }
                                }
                                setIsAuditOpen(false);
                                setAuditTicket(null);
                            })();
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
