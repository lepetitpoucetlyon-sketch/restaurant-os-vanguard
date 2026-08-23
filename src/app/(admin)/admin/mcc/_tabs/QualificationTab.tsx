'use client';

import React, { useState } from 'react';
import { Target, Sliders, Shield, Cpu, Sparkles, UserCheck, Scale } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { defaultAnswers, QualificationEngine } from '@/modules/commerce';

export function QualificationTab() {
  const [tier, setTier] = useState<'L0' | 'L1' | 'L2' | 'L3'>('L2');
  const [displayDepth, setDisplayDepth] = useState<'essential' | 'manager' | 'enterprise'>('manager');
  const [aiLevel, setAiLevel] = useState<'none' | 'copilot' | 'autonomous'>('copilot');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              Forge Stack P2a • Qualification Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-white">Matrice de Qualification & Calibration de Tier</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Moteur d'inférence des 7 axes de provisioning, calibrage du display depth et suggestions contextuelles.
          </p>
        </div>

        <div className="flex gap-2">
          {(['L0', 'L1', 'L2', 'L3'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold transition-all",
                tier === t
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              Tier {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid 7 Axes & Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paramètres de Calibration */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Calibration des 7 Axes</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Display Depth</label>
              <div className="grid grid-cols-3 gap-2">
                {(['essential', 'manager', 'enterprise'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisplayDepth(d)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold capitalize transition-all",
                      displayDepth === d
                        ? "bg-slate-700 text-white border border-cyan-500/50"
                        : "bg-slate-950 border border-slate-800 text-slate-400"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Niveau IA & Autonomie</label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'copilot', 'autonomous'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setAiLevel(lvl)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold capitalize transition-all",
                      aiLevel === lvl
                        ? "bg-slate-700 text-white border border-cyan-500/50"
                        : "bg-slate-950 border border-slate-800 text-slate-400"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profil Dérivé */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Profil de Qualification Résolu</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
              Tier {tier} Recommandé
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Rôles RBAC Dérivés</span>
              </div>
              <p className="text-sm font-bold text-white mt-2">DIRECTOR · CHEF · WAITER · CASHIER</p>
              <p className="text-[11px] text-slate-500">Matrice de permission et double validation PIN</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Règles Métier (Business Laws)</span>
              </div>
              <p className="text-sm font-bold text-white mt-2">NF525 Strict · HACCP DGAL · Pas de stock négatif</p>
              <p className="text-[11px] text-slate-500">Validation d'inaltérabilité et scellage Z</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Hardware Profilé pour ce Tier</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                🖨️ Imprimante ESC/POS Thermique (Pass Cuisine)
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                💳 TPE Sans Contact (Réseau IP / Bancaire)
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                🌡️ Sonde Bluetooth HACCP (Froid positif/négatif)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
