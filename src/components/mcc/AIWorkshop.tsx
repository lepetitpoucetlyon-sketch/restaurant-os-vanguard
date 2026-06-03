"use client";

import React, { useState } from 'react';
import { Ticket_v1 } from '@/shared/validation/TicketSchema';

interface AIWorkshopProps {
  initialTicket?: Ticket_v1;
}

export function AIWorkshop({ initialTicket }: AIWorkshopProps) {
  const [ticketStatus, setTicketStatus] = useState<string>('En attente de patch');
  const [analysisResult, setAnalysisResult] = useState<{ confidenceScore: number; suggestedPatch: string } | null>(null);

  const handleDeployPatch = () => {
    console.log("[AI WORKSHOP] Déploiement du patch NAM en cours...");
    // Simulation du déploiement
    setTimeout(() => {
      setTicketStatus('Deploye et Valide (NEXUS)');
    }, 1500);
  };

  const handleRunAnalysis = async () => {
    if (!initialTicket) return;
    try {
      const res = await fetch('/api/nam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialTicket)
      });
      const data = await res.json();
      setAnalysisResult(data.analysis);
      setTicketStatus('Analyse');
    } catch (error) {
      console.error("Erreur d'analyse", error);
    }
  };

  return (
    <div className="p-6 bg-surface-sidebar text-white rounded-xl shadow-2xl max-w-2xl border border-focus/30">
      <h2 className="text-2xl font-bold text-brand mb-4">🧠 NEXUS AI Workshop (NAM)</h2>
      
      {initialTicket ? (
        <div className="space-y-4">
          <div className="p-4 bg-surface-sidebar rounded border border-default">
            <h3 className="font-semibold text-lg">{initialTicket.title}</h3>
            <p className="text-muted text-sm mt-1">{initialTicket.description}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-1 text-xs bg-status-danger/50 text-status-danger rounded border border-red-800">
                Priority: {initialTicket.priority}
              </span>
              <span className="px-2 py-1 text-xs bg-status-success/50 text-status-success rounded border border-emerald-800">
                Category: {initialTicket.category}
              </span>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <button 
              onClick={handleRunAnalysis}
              className="bg-action-primary hover:bg-action-primary px-4 py-2 rounded font-medium transition-colors"
            >
              Lancer l'Analyse NAM
            </button>
            <span className="text-sm font-mono text-muted">Statut: {ticketStatus}</span>
          </div>

          {analysisResult && (
            <div className="p-4 mt-4 bg-action-primary/20 border border-focus/30 rounded">
              <h4 className="font-semibold text-brand mb-2">📊 Rapport d'Analyse</h4>
              <p className="text-sm text-muted">Confiance: {(analysisResult.confidenceScore * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted mt-2">Suggestion: {analysisResult.suggestedPatch}</p>
              
              <button 
                onClick={handleDeployPatch}
                className="mt-4 w-full bg-status-success hover:bg-status-success px-4 py-2 rounded font-bold transition-colors"
              >
                Approuver et Deployer le Patch (Trinite Securisee)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-secondary">
          Aucun ticket Forensic selectionne.
        </div>
      )}
    </div>
  );
}
