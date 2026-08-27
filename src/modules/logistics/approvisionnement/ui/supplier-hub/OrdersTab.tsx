'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingCart, MessageSquare, Clock, Loader2, AlertCircle, Mail, Copy, Check } from 'lucide-react';
import { SupplierHubService } from '../../../services/SupplierHubService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from '@/lib/toError';
import type { SupplierOrder, SupplierOrderStatus } from '@nexus/contracts';

const eur = (mu: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mu / 1_000_000);

/** Les commandes anciennes ne portent que des centimes : on convertit à la lecture. */
const orderTotalMicrounits = (o: SupplierOrder) =>
    o.totalCostInMicrounits ?? (o.totalCostInCents ?? 0) * 10_000;

const STATUS_META: Record<SupplierOrderStatus, { label: string; tone: string }> = {
    draft: { label: 'Brouillon', tone: 'bg-surface-glass text-text-secondary border-border-default' },
    pending: { label: 'En attente', tone: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
    confirmed: { label: 'Confirmée', tone: 'bg-status-info/10 text-status-info border-status-info/20' },
    shipped: { label: 'Livraison en cours', tone: 'bg-status-info/10 text-status-info border-status-info/20' },
    delivered: { label: 'Livrée', tone: 'bg-status-success/10 text-status-success border-status-success/20' },
    cancelled: { label: 'Annulée', tone: 'bg-status-danger/10 text-status-danger border-status-danger/20' },
};

interface SupplierContact { id: string; name: string; phone?: string; email?: string }

export function OrdersTab() {
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [contacts, setContacts] = useState<Record<string, SupplierContact>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [rows, supplierRows] = await Promise.all([
                SupplierHubService.listOrders(),
                Nexus.adapter.query<SupplierContact>('suppliers'),
            ]);
            setOrders(rows);
            setContacts(Object.fromEntries((supplierRows ?? []).map(s => [s.id, s])));
        } catch (err) {
            setError(`Chargement impossible : ${toError(err).message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const drafts = useMemo(() => orders.filter(o => o.status === 'draft' || o.status === 'pending'), [orders]);
    const sent = useMemo(() => orders.filter(o => o.status !== 'draft' && o.status !== 'pending'), [orders]);

    const sendWhatsApp = (order: SupplierOrder) => {
        const contact = contacts[order.supplierId];
        const message = SupplierHubService.formatOrderMessage(order);
        // Sans numéro, wa.me ouvre le sélecteur de contact plutôt que d'échouer.
        const digits = contact?.phone?.replace(/\D/g, '') ?? '';
        window.open(
            digits
                ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
                : `https://wa.me/?text=${encodeURIComponent(message)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    const sendEmail = (order: SupplierOrder) => {
        const contact = contacts[order.supplierId];
        const message = SupplierHubService.formatOrderMessage(order);
        window.location.href =
            `mailto:${contact?.email ?? ''}` +
            `?subject=${encodeURIComponent(`Bon de commande ${order.id}`)}` +
            `&body=${encodeURIComponent(message)}`;
    };

    const copyOrder = async (order: SupplierOrder) => {
        try {
            await navigator.clipboard.writeText(SupplierHubService.formatOrderMessage(order));
            setCopied(order.id);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            setError("Copie impossible : votre navigateur a refusé l'accès au presse-papiers.");
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des commandes…
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* À envoyer */}
                    <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
                        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-status-warning" />
                            Commandes à transmettre
                        </h3>

                        {drafts.length === 0 ? (
                            <p className="text-xs text-text-muted py-6 text-center">
                                Aucune commande en préparation. Les besoins détectés au réapprovisionnement
                                apparaîtront ici avant envoi.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {drafts.map(order => (
                                    <div key={order.id} className="p-3 rounded-xl bg-surface-glass border border-border-default space-y-2">
                                        <div className="flex items-start justify-between gap-2 text-xs">
                                            <span className="font-bold text-text-primary">{order.supplierName}</span>
                                            <span className="font-bold text-text-primary tabular-nums shrink-0">
                                                {eur(orderTotalMicrounits(order))} HT
                                            </span>
                                        </div>
                                        <div className="text-micro text-text-muted">
                                            {order.items.length === 0
                                                ? 'Aucune ligne'
                                                : order.items.map(i => `${i.quantity} ${i.unit} ${i.ingredientName}`).join(', ')}
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => sendWhatsApp(order)}
                                                className="px-3 py-2 min-h-[44px] rounded-xl bg-status-success text-text-on-primary font-bold text-xs uppercase flex items-center gap-2 hover:opacity-90 transition-opacity"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => sendEmail(order)}
                                                className="px-3 py-2 min-h-[44px] rounded-xl border border-border-default text-text-secondary hover:text-text-primary font-bold text-xs uppercase flex items-center gap-2"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void copyOrder(order)}
                                                className="px-3 py-2 min-h-[44px] rounded-xl border border-border-default text-text-secondary hover:text-text-primary font-bold text-xs uppercase flex items-center gap-2"
                                            >
                                                {copied === order.id ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                                                {copied === order.id ? 'Copié' : 'Copier'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Historique */}
                    <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
                        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-status-info" />
                            Dernières commandes émises
                        </h3>

                        {sent.length === 0 ? (
                            <p className="text-xs text-text-muted py-6 text-center">
                                Aucune commande émise pour l&apos;instant.
                            </p>
                        ) : (
                            <div className="space-y-2 text-xs">
                                {sent.slice(0, 8).map(order => {
                                    const meta = STATUS_META[order.status];
                                    return (
                                        <div key={order.id} className="p-3 rounded-xl bg-surface-glass border border-border-default flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-bold text-text-primary truncate">
                                                    {order.id} — {order.supplierName}
                                                </div>
                                                <div className="text-micro text-text-muted">
                                                    {order.deliveryDate
                                                        ? `Livr. prévue ${new Date(order.deliveryDate).toLocaleDateString('fr-FR')}`
                                                        : `Émise le ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`}
                                                    {' · '}{eur(orderTotalMicrounits(order))} HT
                                                </div>
                                            </div>
                                            <span className={`text-nano font-bold px-2 py-0.5 rounded border shrink-0 uppercase ${meta.tone}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
