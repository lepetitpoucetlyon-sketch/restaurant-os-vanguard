"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

import {
    MINDMAP_NODES,
    MINDMAP_LINKS,
    type MindMapNode,
    type MindMapLink,
} from './mind-map/mindMapGraphData';
import { MindMapHeader } from './mind-map/MindMapHeader';
import { MindMapSidebar } from './mind-map/MindMapSidebar';
import { MindMapControls } from './mind-map/MindMapControls';

/**
 * EXECUTIVE DATA MAP (TATAMAP)
 * An interactive D3 force-directed graph visualizing the Restaurant OS ecosystem.
 */

export function MindMap() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 1600;
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
        const simulation = d3.forceSimulation<MindMapNode>(MINDMAP_NODES)
            .force('link', d3.forceLink<MindMapNode, MindMapLink>(MINDMAP_LINKS).id(d => d.id).distance(400))
            .force('charge', d3.forceManyBody().strength(-2500))
            .force('x', d3.forceX<MindMapNode>(d =>
                d.side === 'left' ? width * 0.22 :
                d.side === 'right' ? width * 0.78 :
                width / 2
            ).strength(1.2))
            .force('y', d3.forceY<MindMapNode>(height / 2).strength(0.8))
            .force('collision', d3.forceCollide<MindMapNode>().radius(d => d.size + 120));

        // Interaction handlers
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 4])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Links
        const link = container.append('g')
            .selectAll('g')
            .data(MINDMAP_LINKS)
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

        // Glow Filter
        const filter = svg.append('defs').append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

        function dragstarted(event: d3.D3DragEvent<SVGGElement, MindMapNode, MindMapNode>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, MindMapNode, MindMapNode>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, MindMapNode, MindMapNode>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Nodes
        const node = container.append('g')
            .selectAll('g')
            .data(MINDMAP_NODES)
            .join('g')
            .attr('class', 'node-group')
            .style('cursor', 'pointer')
            .on('click', (_event, d) => setSelectedNode(d))
            .call(d3.drag<SVGGElement, MindMapNode>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

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

        // Node Icons center dot
        node.append('circle')
            .attr('r', 4)
            .attr('fill', '#C5A059')
            .attr('opacity', 0.8);

        simulation.on('tick', () => {
            link.selectAll('path')
                .attr('d', (d) => {
                    const l = d as MindMapLink;
                    const source = l.source as MindMapNode;
                    const target = l.target as MindMapNode;
                    const dx = target.x! - source.x!;
                    const dy = target.y! - source.y!;
                    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
                    return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
                });

            linkLabel
                .attr('x', (d) => {
                    const l = d as MindMapLink;
                    const source = l.source as MindMapNode;
                    const target = l.target as MindMapNode;
                    return (source.x! + target.x!) / 2;
                })
                .attr('y', (d) => {
                    const l = d as MindMapLink;
                    const source = l.source as MindMapNode;
                    const target = l.target as MindMapNode;
                    return (source.y! + target.y!) / 2;
                });

            node.attr('transform', (d) => {
                const n = d as MindMapNode;
                return `translate(${n.x},${n.y})`;
            });
        });
    }, []);

    return (
        <div className="flex bg-bg-tertiary h-[calc(100vh-70px)] -m-6 relative overflow-hidden">
            <MindMapHeader />

            {/* Main Visual Canvas */}
            <div className="flex-1 cursor-grab active:cursor-grabbing">
                <svg ref={svgRef} className="w-full h-full" />
            </div>

            <MindMapSidebar
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
            />

            <MindMapControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />
        </div>
    );
}
