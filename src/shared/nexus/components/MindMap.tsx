"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
    Zap,
    Database,
    Layers,
    Share2,
    Activity,
    X,
    Maximize2,
    Search,
    ArrowRight
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

/**
 * EXECUTIVE DATA MAP (TATAMAP)
 * An interactive D3 force-directed graph visualizing the Restaurant OS ecosystem.
 */

interface Node extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    group: string;
    size: number;
    description: string;
    side: 'left' | 'right' | 'center'; // Control bilateral distribution
    metrics?: { label: string; value: string }[];
}

interface Link extends d3.SimulationLinkDatum<Node> {
    id: string;
    label: string;
    strength: number;
}

// DATA INJECTION LAYER
const REVENUE_CORE = 450000; // Mock base (Cents)
const STOCK_ALERTS = 4; // Mock base

const NODES: Node[] = [
    {
        id: 'pos', label: 'Caisse (POS)', group: 'revenue', size: 65, side: 'center',
        description: 'Moteur transactionnel central gérant les ventes et les encaissements.',
        metrics: [{ label: 'Tickets/j', value: '142' }, { label: 'Revenue Fleet', value: `${(REVENUE_CORE / 100).toLocaleString()}€` }]
    },
    {
        id: 'kds', label: 'Cuisine (KDS)', group: 'production', size: 50, side: 'right',
        description: 'Interface de production temps-réel pour la préparation des commandes.',
        metrics: [{ label: 'Temps Prep', value: '12m' }]
    },
    {
        id: 'inventory', label: 'Stocks', group: 'logistics', size: 45, side: 'left',
        description: 'Gestion des matières premières et suivi HACCP.',
        metrics: [{ label: 'Statut', value: STOCK_ALERTS > 0 ? 'CRITIQUE' : 'NOMINAL' }, { label: 'Alertes LowStock', value: STOCK_ALERTS.toString() }]
    },
    {
        id: 'reservations', label: 'Réservations', group: 'crm', size: 40, side: 'right',
        description: 'CRM et carnet de réservations intelligent.',
        metrics: [{ label: 'Couverts/j', value: '85' }]
    },
    {
        id: 'accounting', label: 'Comptabilité', group: 'finance', size: 55, side: 'left',
        description: 'Pilotage financier et analyse de rentabilité.',
        metrics: [{ label: 'Bénéfice Fleet', value: '+12%' }]
    },
    {
        id: 'staff', label: 'Staff HR', group: 'human', size: 35, side: 'left',
        description: 'Gestion de la brigade, des plannings et du pointage.',
        metrics: [{ label: 'Brigade', value: '8' }]
    },
    {
        id: 'floor', label: 'Plan Salle', group: 'production', size: 30, side: 'right',
        description: 'Visualisation spatiale et occupation des tables.'
    }
];

const LINKS: Link[] = [
    { id: 'pos-kds', source: 'pos', target: 'kds', label: 'Envoi Commandes', strength: 1 },
    { id: 'pos-inv', source: 'pos', target: 'inventory', label: 'Sortie Stock', strength: 0.8 },
    { id: 'pos-acc', source: 'pos', target: 'accounting', label: 'Flux Revenus', strength: 1.2 },
    { id: 'res-floor', source: 'reservations', target: 'floor', label: 'Placement', strength: 0.6 },
    { id: 'staff-pos', source: 'staff', target: 'pos', label: 'Authentification', strength: 0.5 },
    { id: 'inv-acc', source: 'inventory', target: 'accounting', label: 'Dépenses Food', strength: 0.7 },
    { id: 'kds-inv', source: 'kds', target: 'inventory', label: 'Usage Recettes', strength: 0.4 }
];

export function MindMap() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [_searchTerm, _setSearchTerm] = useState('');

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 1600; // Expanded width for horizontal spread
        const height = 900; 

        const svg = d3.select(svgRef.current)
            .attr('viewBox', [0, 0, width, height])
            .style('width', '100%')
            .style('height', '100%');

        svg.selectAll('*').remove();

        // Background grid for wide canvas
        svg.append('defs').append('pattern')
            .attr('id', 'grid')
            .attr('width', 40)
            .attr('height', 40)
            .attr('patternUnits', 'userSpaceOnUse')
            .append('circle')
            .attr('cx', 2)
            .attr('cy', 2)
            .attr('r', 1)
            .attr('fill', 'currentColor')
            .attr('class', 'text-border/40');

        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#grid)');

        const container = svg.append('g');

        // Force simulation - BILATERAL BALANCED CONFIG
        const simulation = d3.forceSimulation<Node>(NODES)
            .force('link', d3.forceLink<Node, Link>(LINKS).id(d => d.id).distance(400)) // Wider spread
            .force('charge', d3.forceManyBody().strength(-2500)) // Stronger repulsion to avoid overlap
            .force('x', d3.forceX<Node>(d => 
                d.side === 'left' ? width * 0.22 : 
                d.side === 'right' ? width * 0.78 : 
                width / 2
            ).strength(1.2)) // Deterministic horizontal partitioning
            .force('y', d3.forceY<Node>(height / 2).strength(0.8)) // Vertical balance (height)
            .force('collision', d3.forceCollide<Node>().radius(d => d.size + 120)); // Buffer territory expansion

        // Interaction handlers
        const zoom = d3.zoom<SVGSVGElement, import('@/shared/nexus-contract').SovereignValue>()

            .scaleExtent([0.5, 4])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Links
        const link = container.append('g')
            .selectAll('g')
            .data(LINKS)
            .join('g')
            .attr('class', 'link-group');

        link.append('path')
            .attr('stroke', '#C5A059')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', d => d.strength * 4)
            .attr('fill', 'none')
            .attr('stroke-dasharray', '8,4');

        // Link labels
        const linkLabel = link.append('text')
            .attr('font-size', '10px')
            .attr('font-weight', '700')
            .attr('fill', '#6B7280')
            .attr('text-anchor', 'middle')
            .attr('dy', -5)
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.1em')
            .text(d => d.label);

        // Nodes
        const node = container.append('g')
            .selectAll('g')
            .data(NODES)
            .join('g')
            .attr('class', 'node-group')
            .style('cursor', 'pointer')
            .on('click', (event, d) => setSelectedNode(d))
            .call(d3.drag<SVGGElement, Node>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Glow Filter
        const filter = svg.append('defs').append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

        // Node Circles
        node.append('circle')
            .attr('r', d => d.size)
            .attr('fill', '#0F172A')
            .attr('stroke', '#C5A059')
            .attr('stroke-width', 3)
            .attr('filter', 'url(#glow)');

        // Node Labels
        node.append('text')
            .attr('dy', d => d.size + 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', '900')
            .attr('fill', 'currentColor')
            .attr('class', 'text-text-primary')
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '1px')
            .text(d => d.label);

        // Node Icons (Placeholder simplified)
        node.append('circle')
            .attr('r', 4)
            .attr('fill', '#C5A059')
            .attr('opacity', 0.8);

        simulation.on('tick', () => {
            link.selectAll('path')
                .attr('d', (d) => {
                    const l = d as Link;
                    const source = l.source as Node;
                    const target = l.target as Node;
                    const dx = target.x! - source.x!;
                    const dy = target.y! - source.y!;
                    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; 
                    return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
                });


            linkLabel
                .attr('x', (d) => {
                    const l = d as Link;
                    const source = l.source as Node;
                    const target = l.target as Node;
                    return (source.x! + target.x!) / 2;
                })
                .attr('y', (d) => {
                    const l = d as Link;
                    const source = l.source as Node;
                    const target = l.target as Node;
                    return (source.y! + target.y!) / 2;
                });


            node.attr('transform', (d) => {
                const n = d as Node;
                return `translate(${n.x},${n.y})`;
            });

        });

        function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

    }, []);

    return (
        <div className="flex bg-bg-tertiary h-[calc(100vh-70px)] -m-6 relative overflow-hidden">
            {/* Header / Infobar */}
            <div className="absolute top-8 left-8 z-20 space-y-4">
                <div className="bg-bg-primary/80 dark:bg-bg-secondary/80 text-text-primary p-6 rounded-[2rem] shadow-2xl border border-border/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase">Cartographie Système</h1>
                    </div>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest px-1">Visualisation du Flux de Données</p>
                </div>

                <div className="flex gap-2">
                    <div className="bg-bg-primary/90 dark:bg-bg-tertiary/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sync Active</span>
                    </div>
                    <div className="bg-bg-primary/90 dark:bg-bg-tertiary/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 flex items-center gap-2 shadow-sm">
                        <Activity className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">RT Optimization</span>
                    </div>
                </div>
            </div>

            {/* Main Visual Canvas */}
            <div className="flex-1 cursor-grab active:cursor-grabbing">
                <svg ref={svgRef} className="w-full h-full" />
            </div>

            {/* Sidebar Details Tier */}
            <div className={cn(
                "w-[400px] border-l border-border bg-bg-primary dark:bg-bg-secondary shadow-[-20px_0_40px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out absolute right-0 top-0 bottom-0 z-30 p-10 flex flex-col",
                selectedNode ? "translate-x-0" : "translate-x-full"
            )}>
                {selectedNode && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-text-primary flex items-center justify-center text-accent shadow-xl">
                                <Zap className="w-8 h-8" />
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="w-10 h-10 rounded-2xl bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-3xl font-black text-text-primary tracking-tighter mb-2">{selectedNode.label}</h2>
                        <span className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-8">{selectedNode.group} subsystem</span>

                        <p className="text-sm font-medium text-text-muted leading-relaxed mb-10">
                            {selectedNode.description}
                        </p>

                        <div className="space-y-4 flex-1">
                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-2">Kpis Live</h4>
                            {selectedNode.metrics?.map((m, i) => (
                                <div key={i} className="bg-bg-tertiary p-5 rounded-[2rem] border border-border/50 flex justify-between items-center group hover:bg-accent/5 hover:border-accent/20 transition-all cursor-default">
                                    <span className="text-[12px] font-bold text-text-muted group-hover:text-text-primary transition-colors">{m.label}</span>
                                    <span className="text-lg font-black text-text-primary">{m.value}</span>
                                </div>
                            ))}

                            {!selectedNode.metrics && (
                                <div className="p-8 border-2 border-dashed border-subtle rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                    <Database className="w-8 h-8 text-[#CED4DA] mb-4" />
                                    <p className="text-sm font-bold text-[#ADB5BD]">Aucun KPI en temps réel disponible pour ce module.</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full h-16 bg-text-primary rounded-[2rem] text-white font-black flex items-center justify-center gap-3 hover:bg-surface-sidebar transition-all shadow-2xl group">
                            Dépendances Profondes
                            <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg-primary/80 dark:bg-bg-secondary/80 backdrop-blur-md p-2 rounded-[2rem] border border-border shadow-xl z-20">
                <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
                    <Maximize2 className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-border" />
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30" />
                    <input
                        type="text"
                        placeholder="Rechercher un module..."
                        className="h-12 pl-12 pr-6 rounded-2xl bg-bg-tertiary border-none text-sm placeholder:text-text-muted/40 focus:ring-0 w-64"
                    />
                </div>
                <div className="w-px h-6 bg-border" />
                <button className="bg-text-primary text-white px-6 py-3 rounded-2xl font-black text-[12px] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Vue 3D
                </button>
            </div>
        </div>
    );
}
