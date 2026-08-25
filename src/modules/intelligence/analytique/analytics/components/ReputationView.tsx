"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { Button } from '@ui/Button';

export interface Review {
    id: string;
    author: string;
    content: string;
    rating: number;
    platform: 'google' | 'tripadvisor' | 'thefork' | 'instagram';
    date: string;
    replied: boolean;
    suggestedReply?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ReputationViewProps {
    reviews: Review[];
}

export const ReputationView: React.FC<ReputationViewProps> = ({ reviews }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-card dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-2">Score Global</h4>
                    <div className="text-4xl font-serif font-black italic">4.8<span className="text-lg opacity-40">/5</span></div>
                </div>
                <div className="bg-surface-card dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-2">Avis Noirs</h4>
                    <div className="text-4xl font-serif font-black italic text-error">{reviews.filter(r => !r.replied).length}</div>
                </div>
            </div>
            
            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="bg-surface-card dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-accent-gold">{review.author[0]}</div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-tight text-text-primary">{review.author}</p>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("w-2 h-2", i < review.rating ? "text-accent-gold fill-accent-gold" : "text-border")} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm italic font-serif leading-relaxed text-text-secondary opacity-80 mb-4">"{review.content}"</p>
                        {review.suggestedReply && (
                            <div className="bg-bg-tertiary/50 p-4 rounded-2xl border border-accent-gold/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-accent-gold mb-2">Oracle Brain :</p>
                                <p className="text-xs italic opacity-70 mb-3 text-text-muted">{review.suggestedReply}</p>
                                <Button size="sm" className="h-9 w-full bg-text-primary text-text-primary rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-surface-sidebar transition-colors">
                                    Approuver la Réponse
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
