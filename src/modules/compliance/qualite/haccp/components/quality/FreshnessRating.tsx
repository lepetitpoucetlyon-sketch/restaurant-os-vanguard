import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface FreshnessRatingProps {
    value: number;
    onChange?: (value: number) => void;
    className?: string;
}

export const FreshnessRating: React.FC<FreshnessRatingProps> = ({ value, onChange, className }) => {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <p className="text-nano font-black text-muted uppercase tracking-widest ml-1">Score Fraîcheur</p>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onChange?.(star)}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            star <= value ? "bg-status-warning text-status-warning shadow-inner" : "bg-surface-bg text-muted hover:bg-surface-tertiary"
                        )}
                    >
                        <Star className={cn("w-5 h-5", star <= value && "fill-amber-500")} />
                    </button>
                ))}
            </div>
        </div>
    );
};
