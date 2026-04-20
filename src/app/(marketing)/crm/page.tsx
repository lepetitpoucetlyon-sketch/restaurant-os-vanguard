"use client";

import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { PageHeaderWithDocs } from "@/components/ui/PageHeaderWithDocs";
import { useIsMobile } from "@/hooks";
import { SecurityPinModal } from "@/components/ui";

// Atomic Components
import { CRMSidebar } from "@/components/crm/CRMSidebar";
import { CRMList } from "@/components/crm/CRMList";
import { CRMDetailView } from "@/components/crm/CRMDetailView";
import { CRMContactForm } from "@/components/crm/CRMContactForm";

// State
import { 
    crmSearchQueryAtom, 
    crmFilterSegmentAtom, 
    crmNewCustomerModalAtom,
    crmSecurityModalAtom,
    crmCustomerToDeleteAtom
} from "@/store/crmAtoms";
import { customersAtom, customersNodeAtom } from "@/store/operationalAtoms";

/**
 * 🏛️ CRM PAGE - ALPHA-7 STABILIZED
 * Surgical Purge complete: Reduced useState density to 0%. 
 * All domain state migrated to Nexus Ops (Jotai Atoms).
 */
export default function CRMPage() {
    const isMobile = useIsMobile();
    const { t } = useLanguage();
    const { canDo } = useAuth();
    
    // Atomic UI States
    const [searchQuery, setSearchQuery] = useAtom(crmSearchQueryAtom);
    const [filterSegment, setFilterSegment] = useAtom(crmFilterSegmentAtom);
    const [, setShowNewCustomer] = useAtom(crmNewCustomerModalAtom);
    const [showSecurityModal, setShowSecurityModal] = useAtom(crmSecurityModalAtom);
    const [customerToDelete] = useAtom(crmCustomerToDeleteAtom);
    
    // Domain Data
    const [customers, setCustomers] = useAtom(customersAtom);
    const [, setCustomersNode] = useAtom(customersNodeAtom);

    // Mock Intelligence Initialization (If data is empty)
    useEffect(() => {
        if (customers.length === 0) {
            const mockCustomers = [
                { id: '1', firstName: 'Jean', lastName: 'Dupont', phone: '0612345678', email: 'jean@dupont.com', segment: 'vip', visitCount: 12, totalSpentInCents: 45000, createdAt: new Date().toISOString(), preferences: [], tags: [] },
                { id: '2', firstName: 'Marie', lastName: 'Curie', phone: '0623456789', email: 'marie@science.fr', segment: 'regular', visitCount: 5, totalSpentInCents: 18000, createdAt: new Date().toISOString(), preferences: [], tags: [] },
                { id: '3', firstName: 'Alpha', lastName: 'Techno', phone: '0634567890', email: 'alpha@enterprise.com', segment: 'new', visitCount: 1, totalSpentInCents: 4500, createdAt: new Date().toISOString(), preferences: [], tags: [] },
            ];
            (setCustomers as any)(mockCustomers as any);
            setCustomersNode(prev => ({ ...prev, loading: false }));
        }
    }, [customers.length, setCustomers, setCustomersNode]);

    const confirmDeleteCustomer = () => {
        // Implementation for deletion if security PIN is correct
        setShowSecurityModal(false);
    };

    return (
        <div className="flex h-screen bg-bg-primary overflow-hidden">
            {/* 1. Sidebar - Desktop Only */}
            {!isMobile && <CRMSidebar />}

            {/* 2. Main Content Area */}
            <div className="flex-1 overflow-auto bg-bg-primary p-6 md:p-12 md:pt-16 elegant-scrollbar flex flex-col pb-32 md:pb-0">
                <div className="max-w-7xl mx-auto w-full">
                    
                    {/* Header: Mobile vs Desktop */}
                    {isMobile ? (
                        <div className="mb-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <PageHeaderWithDocs categoryId="crm" title={t('crm.concierge_title') || 'Conciergerie CRM'} className="text-4xl font-serif text-text-primary italic tracking-tight" />
                                <button onClick={() => setShowNewCustomer(true)} className="w-12 h-12 rounded-full bg-text-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {/* Mobile Mobile Search Overlay Pattern */}
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30 group-focus-within:text-accent-gold transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('crm.search_placeholder') || 'Chercher un profil...'}
                                    className="w-full h-14 pl-14 pr-6 bg-bg-tertiary/50 rounded-2xl border-none text-[10px] font-black uppercase tracking-widest outline-none focus:bg-bg-tertiary transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between mb-16 px-4">
                            <PageHeaderWithDocs 
                                categoryId="crm" 
                                title={filterSegment ? t(`crm.segments.${filterSegment}`) || filterSegment : t('crm.all_clients') || 'Tous les clients'} 
                                className="text-6xl font-serif text-text-primary italic tracking-tighter"
                            />
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowNewCustomer(true)} 
                                    className="h-14 bg-text-primary dark:bg-white hover:bg-black dark:hover:bg-neutral-100 rounded-2xl text-bg-secondary dark:text-bg-primary text-[10px] font-black uppercase tracking-[0.2em] px-10 shadow-2xl transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4 mr-3 inline-block" strokeWidth={3} />
                                    {t('crm.new_profile') || 'Nouveau Profil'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Operational Grid */}
                    <CRMList />
                </div>
            </div>

            {/* 4. Overlays & Detail Panels */}
            <CRMDetailView />
            <CRMContactForm />

            <SecurityPinModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                onSuccess={confirmDeleteCustomer}
            />
        </div>
    );
}
