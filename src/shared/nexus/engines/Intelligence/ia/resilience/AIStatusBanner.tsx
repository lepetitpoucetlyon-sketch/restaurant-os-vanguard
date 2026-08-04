"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { lightragBreaker, geminiBreaker } from './CircuitBreaker';
import { cn } from '@/lib/ui.foundations';

type ServiceStatus = 'ok' | 'degraded' | 'unavailable';

interface ServiceState {
    name: string;
    status: ServiceStatus;
}

function getStatus(available: boolean): ServiceStatus {
    return available ? 'ok' : 'unavailable';
}

export function AIStatusBanner() {
    const [services, setServices] = useState<ServiceState[]>([]);

    useEffect(() => {
        const check = () => {
            setServices([
                { name: 'LightRAG', status: getStatus(lightragBreaker.isAvailable) },
                { name: 'Gemini', status: getStatus(geminiBreaker.isAvailable) },
            ]);
        };
        check();
        const timer = setInterval(check, 10_000);
        return () => clearInterval(timer);
    }, []);

    const hasIssue = services.some(s => s.status !== 'ok');
    if (!hasIssue) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm border-b",
                "bg-action-primary/10 border-action-primary/20 text-amber-300"
            )}
            role="alert"
            aria-live="polite"
        >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
                Mode dégradé — {services.filter(s => s.status !== 'ok').map(s => s.name).join(', ')} indisponible(s).
                Les écrans fonctionnent sans IA.
            </span>
        </div>
    );
}
