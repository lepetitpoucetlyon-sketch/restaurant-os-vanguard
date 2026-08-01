'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    BellRing, CreditCard, CalendarClock, PackageOpen, 
    ChefHat, Building2, Server, CheckCircle2, Activity
} from 'lucide-react';

const STAGES = [
    {
        id: 'order',
        title: 'La Prise de Commande',
        subtitle: 'L\'étincelle',
        icon: <BellRing className="w-5 h-5 text-amber-500" />,
        color: 'from-amber-500/20 to-amber-500/5',
        border: 'border-amber-500/30',
        branches: [
            {
                name: 'Sur place (Serveur / Caisse)',
                steps: [
                    { label: 'Saisie serveur', actor: 'Caisse', action: 'order.placed' },
                    { label: 'Réclames & Alertes Rush', actor: 'KDS Cuisine', action: 'kds.course_fired' },
                    { label: 'Déduction stock (86 auto)', actor: 'Logistique', action: 'stock.deducted' }
                ]
            },
            {
                name: 'UberEats / Deliveroo',
                steps: [
                    { label: 'Filtre Anti-Corruption (ACL)', actor: 'Webhook', action: 'integration.received' },
                    { label: 'Acceptation Auto (KDS direct)', actor: 'Cerveau', action: 'order.placed' },
                    { label: 'Acceptation Manuelle (Alarme POS)', actor: 'Serveur', action: 'order.pending' }
                ]
            }
        ]
    },
    {
        id: 'payment',
        title: 'L\'Encaissement',
        subtitle: 'La Sécurité',
        icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
        color: 'from-emerald-500/20 to-emerald-500/5',
        border: 'border-emerald-500/30',
        branches: [
            {
                name: 'Sécurisation Financière',
                steps: [
                    { label: 'Séparation Addition & Offerts', actor: 'Caisse', action: 'payment.split' },
                    { label: 'Coffre-Fort (Sceau NF525)', actor: 'Fiscal', action: 'ledger.sealed' },
                    { label: 'Points de Fidélité (CRM) & Anonymisation RGPD', actor: 'Marketing', action: 'crm.points_added' }
                ]
            }
        ]
    },
    {
        id: 'reservation',
        title: 'La Réservation',
        subtitle: 'L\'Anticipation',
        icon: <CalendarClock className="w-5 h-5 text-blue-500" />,
        color: 'from-blue-500/20 to-blue-500/5',
        border: 'border-blue-500/30',
        branches: [
            {
                name: 'Gestion de Salle',
                steps: [
                    { label: 'Plan de Salle & Surbooking Shield', actor: 'Yield', action: 'reservation.created' },
                    { label: 'Pénalité No-Show', actor: 'Manager', action: 'reservation.no_show' },
                    { label: 'Chronomètre de rotation (IA)', actor: 'Tracker', action: 'table.released' }
                ]
            }
        ]
    },
    {
        id: 'backoffice',
        title: 'L\'Arrière-Boutique',
        subtitle: 'Hygiène & Fournisseurs',
        icon: <PackageOpen className="w-5 h-5 text-purple-500" />,
        color: 'from-purple-500/20 to-purple-500/5',
        border: 'border-purple-500/30',
        branches: [
            {
                name: 'Traçabilité',
                steps: [
                    { label: 'Facture Fournisseur', actor: 'Scan', action: 'invoice.approved' },
                    { label: 'Purge Périmés (DLC automatique)', actor: 'HACCP', action: 'stock.waste' },
                    { label: 'Alerte Sonde Frigo Offline', actor: 'IoT', action: 'haccp.alert' }
                ]
            }
        ]
    },
    {
        id: 'team',
        title: 'L\'Équipe',
        subtitle: 'Paie & Pointage',
        icon: <ChefHat className="w-5 h-5 text-rose-500" />,
        color: 'from-rose-500/20 to-rose-500/5',
        border: 'border-rose-500/30',
        branches: [
            {
                name: 'Ressources Humaines',
                steps: [
                    { label: 'Pointage (Clock-In)', actor: 'Salarie', action: 'hr.shift_started' },
                    { label: 'Calcul Labor Cost / Rentabilité', actor: 'Finance', action: 'hr.labor_cost' },
                    { label: 'Alerte Heures Sup', actor: 'Manager', action: 'hr.overtime_alert' },
                    { label: 'Verrouillage Paie (Silae)', actor: 'RH', action: 'hr.payroll_exported' }
                ]
            }
        ]
    },
    {
        id: 'accounting',
        title: 'La Fermeture',
        subtitle: 'Le Bilan',
        icon: <Building2 className="w-5 h-5 text-indigo-500" />,
        color: 'from-indigo-500/20 to-indigo-500/5',
        border: 'border-indigo-500/30',
        branches: [
            {
                name: 'Comptabilité',
                steps: [
                    { label: 'Ticket Z (Clôture Scellée)', actor: 'Manager', action: 'pos.z_report' },
                    { label: 'Synchronisation Bancaire (API)', actor: 'Banque', action: 'finance.bank_synced' },
                    { label: 'Lettrage Automatique', actor: 'IA Compta', action: 'finance.reconciled' },
                    { label: 'Export FEC (Expert-Comptable)', actor: 'Comptable', action: 'finance.fec_exported' }
                ]
            }
        ]
    }
];

export function LifecycleTreePanel() {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-12 pb-24">
            <div className="text-center space-y-4 mb-16">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-action-primary/10 border border-action-primary/20 text-brand text-xs font-black uppercase tracking-widest"
                >
                    <Server className="w-4 h-4" /> Restaurant OS
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl lg:text-5xl font-black tracking-tight uppercase"
                >
                    Arborescence de Vie
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-secondary max-w-2xl mx-auto text-lg"
                >
                    Cartographie de &quot;l'Effet Papillon&quot;. Visualisez comment chaque action se propage de manière asynchrone dans le moteur (Event-Sourcing).
                </motion.p>
            </div>

            <div className="relative">
                {/* Ligne verticale de connexion (Timeline) */}
                <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent -translate-x-1/2" />

                <div className="space-y-12">
                    {STAGES.map((stage, index) => {
                        const isEven = index % 2 === 0;
                        return (
                            <motion.div 
                                key={stage.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative flex flex-col lg:flex-row gap-8 items-start ${isEven ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Nœud central sur la timeline */}
                                <div className="absolute left-8 lg:left-1/2 top-8 w-12 h-12 bg-surface-bg border border-border-subtle rounded-2xl flex items-center justify-center -translate-x-1/2 z-10 shadow-xl">
                                    {stage.icon}
                                </div>

                                {/* Contenu de l'étape */}
                                <div className={`w-full lg:w-1/2 pl-24 lg:pl-0 ${isEven ? 'lg:pr-16 text-left lg:text-right' : 'lg:pl-16 text-left'}`}>
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-black uppercase tracking-tight">{stage.title}</h3>
                                        <p className="text-muted font-mono text-sm">{stage.subtitle}</p>
                                    </div>

                                    <div className="space-y-6">
                                        {stage.branches.map((branch, bIdx) => (
                                            <div key={bIdx} className={`bg-gradient-to-br ${stage.color} border ${stage.border} rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group text-left`}>
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                                    {stage.icon}
                                                </div>
                                                
                                                <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-text-primary">
                                                    {branch.name}
                                                </h4>
                                                
                                                <div className="space-y-3">
                                                    {branch.steps.map((step, sIdx) => (
                                                        <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl bg-surface-bg/50 border border-border-subtle/50 hover:border-focus/30 transition-colors">
                                                            <div className="flex items-center gap-2 min-w-[120px]">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted bg-surface-hover px-2 py-1 rounded-lg">
                                                                    {step.actor}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-text-primary">{step.label}</p>
                                                            </div>
                                                            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-brand bg-action-primary/10 px-2 py-1 rounded-lg">
                                                                <Activity className="w-3 h-3" />
                                                                {step.action}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="pt-16 flex justify-center"
            >
                <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-status-success/10 border border-status-success/30 text-status-success">
                    <CheckCircle2 className="w-6 h-6" />
                    <div>
                        <h4 className="font-black uppercase tracking-widest text-sm">Audit 100% Complété</h4>
                        <p className="text-xs opacity-80">Les 53 promesses sont validées et scellées par l'architecture Grade X.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
