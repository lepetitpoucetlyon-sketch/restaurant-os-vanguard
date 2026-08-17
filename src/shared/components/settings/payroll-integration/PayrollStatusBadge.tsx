'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export function StatusBadge({ status, label }: { status: AsyncStatus; label?: string }) {
    if (status === 'idle' || status === 'loading') return null;
    return (
        <div className={cn(
            'flex items-center gap-2 text-sm',
            status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-status-danger',
        )}>
            {status === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
            {label ?? (status === 'success' ? 'Opération réussie' : 'Erreur — voir la notification')}
        </div>
    );
}
