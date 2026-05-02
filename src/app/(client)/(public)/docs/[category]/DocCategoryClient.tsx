"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { DocumentationPortal } from "@/components/system/DocumentationPortal";
import { CATEGORY_DOCS } from "@/lib/docs-data";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function DocCategoryClient() {
    const params = useParams();
    const router = useRouter();
    const category = params.category as string;

    if (!CATEGORY_DOCS[category]) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-8">
                    <span className="text-4xl">⚠️</span>
                </div>
                <h1 className="text-3xl font-serif font-light text-text-primary mb-4 italic">Fiche introuvable</h1>
                <p className="text-text-muted max-w-md mb-10 leading-relaxed">
                    Désolé, la documentation pour la catégorie <span className="font-mono text-accent">"{category}"</span> n'existe pas encore ou a été déplacée.
                </p>
                <Link
                    href="/dashboard"
                    className="px-10 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform"
                >
                    Retour au Dashboard
                </Link>
            </div>
        );
    }

    return (
        <main className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary flex flex-col overflow-hidden">
            {/* Minimal Sticky Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-bg-primary/80 backdrop-blur-md border-b border-neutral-100 dark:border-border px-8 py-4 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour
                </button>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-accent-gold uppercase tracking-[0.3em]">Restaurant OS Documentation</span>
                        <span className="text-[10px] font-serif italic text-text-muted">Système Expert de Gestion</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 overflow-hidden">
                <DocumentationPortal isPage={true} categoryOverride={category} />
            </div>
        </main>
    );
}
