'use client';

import React, { useState } from 'react';
import { BookOpen, Menu } from 'lucide-react';
import { TutorialOverlay } from './TutorialOverlay';
import { useUI } from '@/shared/hooks';

interface PageHeaderWithDocsProps {
    categoryId: string;
    title: string;
    className?: string;
    children?: React.ReactNode;
}

export function PageHeaderWithDocs({ categoryId, title, className = '', children }: PageHeaderWithDocsProps) {
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const { openMobileMenu } = useUI();

    return (
        <>
            <div className="flex items-center gap-3">
                <button
                    onClick={openMobileMenu}
                    className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Ouvrir le menu mobile"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setIsTutorialOpen(true)}
                    className="text-text-muted hover:text-accent-gold transition-colors duration-200 p-2 rounded-xl hover:bg-bg-tertiary group"
                    aria-label="Ouvrir le tutoriel de cette page"
                    tabIndex={0}
                >
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <h1 className={className}>
                    {title}
                    {children}
                </h1>
            </div>

            <TutorialOverlay
                categoryId={categoryId}
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />
        </>
    );
}
