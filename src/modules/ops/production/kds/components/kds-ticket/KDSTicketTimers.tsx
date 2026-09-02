'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Timer, Bell } from 'lucide-react';
import type { Order, OrderItem } from '@nexus/contracts';
import { cn } from '@/lib/ui.foundations';
import {
    MeatRestingTimerService,
    type CookingDoneness,
} from '../../services/MeatRestingTimerService';
import { PassPickupReminderService } from '../../services/PassPickupReminderService';
import { HotColdSyncKdsService } from '../../services/HotColdSyncKdsService';
import { resolveStation } from '../../contracts/kds-constants';

/** Durées de préparation indicatives par poste (secondes) pour la synchro chaud/froid. */
const STATION_PREP_SECONDS: Record<string, number> = { hot: 600, cold: 180, pastry: 300, bar: 60 };

/** Coupes nécessitant un repos post-cuisson + épaisseur indicative (cm). */
const MEAT_CUTS: Array<{ kw: string; thicknessCm: number }> = [
    { kw: 'côte de b', thicknessCm: 5 }, { kw: 'cote de b', thicknessCm: 5 },
    { kw: 'entrecôte', thicknessCm: 3 }, { kw: 'entrecote', thicknessCm: 3 },
    { kw: 'faux-filet', thicknessCm: 3 }, { kw: 'filet', thicknessCm: 4 },
    { kw: 'magret', thicknessCm: 2.5 }, { kw: 'onglet', thicknessCm: 2 },
    { kw: 'bavette', thicknessCm: 2 }, { kw: 'rumsteck', thicknessCm: 3 },
    { kw: 'gigot', thicknessCm: 6 }, { kw: 'carré d\'agneau', thicknessCm: 3 },
    { kw: 'pavé', thicknessCm: 3 }, { kw: 'pave', thicknessCm: 3 },
    { kw: 'tomahawk', thicknessCm: 5 },
];

const DONENESS_MAP: Record<string, CookingDoneness> = {
    bleu: 'bleu', saignant: 'saignant', 'à point': 'a_point', 'a point': 'a_point',
    'bien cuit': 'bien_cuit', 'well done': 'bien_cuit', rare: 'saignant', medium: 'a_point',
};

function detectMeat(items: OrderItem[] = []): { cutName: string; thicknessCm: number; doneness: CookingDoneness } | null {
    for (const item of items) {
        const lower = (item.name || '').toLowerCase();
        const cut = MEAT_CUTS.find(c => lower.includes(c.kw));
        if (!cut) continue;
        const mods = (item.modifiers ?? []).map(m => (typeof m === 'string' ? m : (m as { name?: string }).name ?? '')).join(' ').toLowerCase();
        const note = (item.notes ?? '').toLowerCase();
        const hay = `${mods} ${note}`;
        const doneness = (Object.keys(DONENESS_MAP).find(k => hay.includes(k)) && DONENESS_MAP[Object.keys(DONENESS_MAP).find(k => hay.includes(k))!]) || 'a_point';
        return { cutName: item.name, thicknessCm: cut.thicknessCm, doneness };
    }
    return null;
}

function fmt(seconds: number): string {
    const s = Math.max(0, seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
    ticket: Order;
    tenantId: string;
}

/**
 * Minuteurs opérationnels du ticket KDS — câble bout-en-bout :
 *  - MeatRestingTimerService : repos post-cuisson des viandes (ticket `ready`)
 *  - PassPickupReminderService : alerte plat qui attend au passe (ticket `ready`)
 * Les services sont appelés une fois au passage `ready` (ils émettent sur le bus),
 * puis le décompte s'égrène localement à la seconde.
 */
export function KDSTicketTimers({ ticket, tenantId }: Props) {
    const isReady = ticket.status === 'ready';
    const isCooking = ticket.status === 'cooking' || ticket.status === 'preparing';
    const [now, setNow] = useState(() => Date.now());

    const meat = useMemo(() => detectMeat(ticket.items), [ticket.items]);

    // Synchro chaud/froid : calculée une fois quand un ticket mixte entre en préparation.
    const coldSyncRef = useRef<{ coldStartAt: number } | null>(null);
    useEffect(() => {
        if (!isCooking || coldSyncRef.current) return;
        const stations = (ticket.items ?? []).map(i => resolveStation(i.name || ''));
        const hasHot = stations.includes('hot');
        const hasCold = stations.includes('cold') || stations.includes('pastry');
        if (!hasHot || !hasCold) return;
        const specs = (ticket.items ?? []).map((i, idx) => {
            const st = resolveStation(i.name || '');
            return {
                itemId: String(i.id ?? idx),
                name: i.name ?? '',
                type: (st === 'cold' || st === 'pastry' ? 'cold' : 'hot') as 'hot' | 'cold',
                prepTimeSeconds: STATION_PREP_SECONDS[st] ?? 300,
            };
        });
        const plan = HotColdSyncKdsService.planCourseSync(tenantId, ticket.id, specs);
        coldSyncRef.current = { coldStartAt: Date.now() + plan.coldStartTimeOffsetSeconds * 1000 };
        setNow(Date.now());
    }, [isCooking, tenantId, ticket.id, ticket.items]);
    if (!isCooking) coldSyncRef.current = null;

    // readyAt : figé au premier rendu où le ticket est `ready`.
    const readyAtRef = useRef<number | null>(null);
    if (isReady && readyAtRef.current === null) {
        readyAtRef.current = Number(ticket.updatedAt) || Date.now();
    }
    if (!isReady) readyAtRef.current = null;

    // Plan de repos viande : calculé une seule fois au passage `ready`.
    const restPlanRef = useRef<{ readyToCarveTimestamp: number; recommendedRestDurationSeconds: number } | null>(null);
    useEffect(() => {
        if (!isReady || !meat || restPlanRef.current) return;
        const plan = MeatRestingTimerService.calculateRestingPlan({
            tenantId,
            orderId: ticket.id,
            cutName: meat.cutName,
            thicknessCm: meat.thicknessCm,
            doneness: meat.doneness,
            cookedEndTimestamp: readyAtRef.current ?? Date.now(),
        });
        restPlanRef.current = plan;
        setNow(Date.now());
    }, [isReady, meat, tenantId, ticket.id]);

    // Relance passe : ré-évaluée toutes les 20 s tant que le ticket est `ready`.
    const [passAlert, setPassAlert] = useState<'none' | 'warning' | 'critical'>('none');
    useEffect(() => {
        if (!isReady || !readyAtRef.current) { setPassAlert('none'); return; }
        const evaluate = () => {
            const status = PassPickupReminderService.evaluatePassStatus(tenantId, {
                orderId: ticket.id,
                tableNumber: String(ticket.tableNumber ?? '?'),
                serverName: String(ticket.serverName ?? ''),
                readyAtTimestamp: readyAtRef.current!,
            });
            setPassAlert(status.alertLevel);
        };
        evaluate();
        const id = setInterval(evaluate, 20_000);
        return () => clearInterval(id);
    }, [isReady, tenantId, ticket.id, ticket.tableNumber, ticket.serverName]);

    // Tick d'affichage à la seconde tant qu'un décompte est actif.
    useEffect(() => {
        if (!isReady && !isCooking) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isReady, isCooking]);

    const restRemaining = restPlanRef.current
        ? Math.max(0, Math.floor((restPlanRef.current.readyToCarveTimestamp - now) / 1000))
        : 0;
    const passElapsed = readyAtRef.current ? Math.floor((now - readyAtRef.current) / 1000) : 0;
    const coldStartRemaining = coldSyncRef.current
        ? Math.max(0, Math.floor((coldSyncRef.current.coldStartAt - now) / 1000))
        : 0;

    const showCold = isCooking && coldSyncRef.current !== null && coldStartRemaining > 0;
    if (!showCold && !restPlanRef.current && passAlert === 'none') return null;

    return (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
            {showCold && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums bg-info/15 text-info">
                    <Timer className="h-3.5 w-3.5" />
                    Lancer le froid dans {fmt(coldStartRemaining)}
                </span>
            )}
            {restPlanRef.current && isReady && (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums',
                        restRemaining > 0
                            ? 'bg-warning/15 text-warning'
                            : 'bg-status-success/15 text-status-success',
                    )}
                >
                    <Timer className="h-3.5 w-3.5" />
                    {restRemaining > 0
                        ? `Repos ${meat?.cutName ?? 'viande'} — ${fmt(restRemaining)}`
                        : `${meat?.cutName ?? 'Viande'} prête à trancher`}
                </span>
            )}
            {passAlert !== 'none' && (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
                        passAlert === 'critical'
                            ? 'bg-error/20 text-error animate-pulse'
                            : 'bg-warning/20 text-warning',
                    )}
                >
                    <Bell className="h-3.5 w-3.5" />
                    Au passe depuis {fmt(passElapsed)}
                </span>
            )}
        </div>
    );
}
