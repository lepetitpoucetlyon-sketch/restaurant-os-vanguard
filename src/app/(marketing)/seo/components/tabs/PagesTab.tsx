import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { PageCard } from "@/app/(marketing)/seo/components/PageCard";
import { MarketingEngine } from '@/lib/marketing-engine';

export const PagesTab = () => {
    const pages = MarketingEngine.getLivePageAnalysis();
    
    return (
        <motion.div
            key="pages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#00D9A6]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#00D9A6]" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Toutes les pages</h3>
            </div>
            <div className="space-y-4" id="seo-pages-list">
                {pages.map((page, idx) => (
                    <PageCard
                        key={page.id}
                        page={page as any}
                        onEdit={() => { }}
                        id={idx === 0 ? "seo-edit-page-0" : undefined}
                    />
                ))}
            </div>
        </motion.div>
    );
};
