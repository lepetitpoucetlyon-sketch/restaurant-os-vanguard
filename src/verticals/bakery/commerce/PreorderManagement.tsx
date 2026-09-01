'use client';

import React, { useState } from 'react';
import { Calendar, ShoppingBag, Clock, CheckCircle2, User, Euro, Plus, AlertCircle } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface Preorder {
  id: string;
  customerName: string;
  phone: string;
  pickupTime: string;
  items: { name: string; quantity: number }[];
  totalInMicrounits: number;
  depositPaidInMicrounits: number;
  status: 'pending' | 'preparing' | 'ready' | 'collected';
  specialNote?: string;
}

const INITIAL_PREORDERS: Preorder[] = [
  {
    id: 'cmd-101',
    customerName: 'Mme Dupont',
    phone: '06 12 34 56 78',
    pickupTime: '11:30',
    items: [
      { name: 'Pièce montée 30 pers. (Choux vanille)', quantity: 1 },
      { name: 'Pains surprises cocktail', quantity: 2 },
    ],
    totalInMicrounits: 145_000_000,
    depositPaidInMicrounits: 50_000_000,
    status: 'preparing',
    specialNote: 'Écriture glaçage : "Joyeux Anniversaire Léa"',
  },
  {
    id: 'cmd-102',
    customerName: 'Entreprise Nexis',
    phone: '04 72 00 11 22',
    pickupTime: '08:00',
    items: [
      { name: 'Mini-croissants pur beurre', quantity: 40 },
      { name: 'Mini-pains chocolat', quantity: 40 },
      { name: 'Thermos café bio 5L', quantity: 1 },
    ],
    totalInMicrounits: 98_000_000,
    depositPaidInMicrounits: 98_000_000,
    status: 'ready',
  },
  {
    id: 'cmd-103',
    customerName: 'M. Laurent',
    phone: '06 99 88 77 66',
    pickupTime: '17:00',
    items: [
      { name: 'Baguettes tradition', quantity: 6 },
      { name: 'Tarte citron meringuée 6 pers.', quantity: 1 },
    ],
    totalInMicrounits: 28_000_000,
    depositPaidInMicrounits: 0,
    status: 'pending',
  },
];

export function PreorderManagement() {
  const { activeTenantId } = useTenant();
  const [preorders, setPreorders] = useState<Preorder[]>(INITIAL_PREORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = preorders.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const handleUpdateStatus = (id: string, newStatus: Preorder['status']) => {
    setPreorders(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const totalRevenueMu = preorders.reduce((acc, p) => acc + p.totalInMicrounits, 0);
  const depositsCollectedMu = preorders.reduce((acc, p) => acc + p.depositPaidInMicrounits, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"📋"}</span>
            <h1 className="text-xl font-bold font-serif">{"Précommandes & Traiteur Boulangerie"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Gestion des commandes spéciales, gâteaux d'anniversaire, petits-déjeuners d'entreprise et retraits."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-card font-medium">
            {"Retraits du jour : "}<strong className="text-amber-600">{preorders.length}</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            {"Commandes en cours"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">
            {preorders.filter(p => p.status !== 'collected').length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {"Prêtes au retrait"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">
            {preorders.filter(p => p.status === 'ready').length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-blue-500" />
            {"Chiffre d'affaires précommandes"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalRevenueMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            {"Acomptes encaissés"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">
            {((depositsCollectedMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>
      </div>

      {/* Filtres de statut */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Tous les statuts' },
          { id: 'pending', label: 'En attente' },
          { id: 'preparing', label: 'En préparation' },
          { id: 'ready', label: 'Prête en boutique' },
          { id: 'collected', label: 'Retirée' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s.id
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Cartes des commandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(order => {
          const totalEur = (order.totalInMicrounits / 1_000_000).toFixed(2);
          const depositEur = (order.depositPaidInMicrounits / 1_000_000).toFixed(2);
          const remainingEur = ((order.totalInMicrounits - order.depositPaidInMicrounits) / 1_000_000).toFixed(2);

          const statusBadge = {
            pending: { label: 'En attente', bg: 'bg-zinc-500/10 text-zinc-600' },
            preparing: { label: 'En préparation labo', bg: 'bg-amber-500/10 text-amber-600' },
            ready: { label: 'Prêt au retrait', bg: 'bg-emerald-500/10 text-emerald-600' },
            collected: { label: 'Retirée & Soldée', bg: 'bg-blue-500/10 text-blue-600' },
          }[order.status];

          return (
            <div key={order.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-text-muted">{order.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{order.customerName}</h3>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {"Retrait à"} <strong className="text-text-primary">{order.pickupTime}</strong> · {order.phone}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-base border border-border/60 text-xs space-y-1">
                  <p className="text-[10px] font-medium text-text-muted uppercase">{"Contenu de la commande :"}</p>
                  <ul className="space-y-0.5">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between text-text-secondary">
                        <span>{it.name}</span>
                        <span className="font-mono font-semibold">x{it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.specialNote && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {order.specialNote}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{"Total TTC :"}</span>
                  <span className="font-mono font-bold text-sm">{totalEur} {"€"}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>{"Acompte versé :"} {depositEur} {"€"}</span>
                  <span className="font-medium text-amber-600">{"Reste :"} {remainingEur} {"€"}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
                    >
                      {"Démarrer préparation"}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                    >
                      {"Marquer prêt en vitrine"}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'collected')}
                      className="w-full py-1.5 rounded-md bg-accent text-text-on-accent text-xs font-medium transition-colors"
                    >
                      {"Valider remise client"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
