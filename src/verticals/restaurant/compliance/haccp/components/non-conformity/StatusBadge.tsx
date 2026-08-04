import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { NonConformity } from './types';

export function StatusBadge({ status }: { status: NonConformity['status'] }) {
    if (status === 'resolved') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" /> Résolu
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger text-xs font-medium animate-pulse">
            <Clock className="w-3 h-3" /> Ouvert
        </span>
    );
}
