'use client';

import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Euro, Calculator } from 'lucide-react';

const OUR_FLAT_FEE = 149; // €/mois
const COMMISSION_PER_COVER = 2; // € estimation

export default function ROICalculator() {
  const [monthlyFee, setMonthlyFee] = useState<number>(250);
  const [covers, setCovers] = useState<number>(80);

  const calc = useMemo(() => {
    const theForkCost = monthlyFee + covers * COMMISSION_PER_COVER;
    const ourCost = OUR_FLAT_FEE;
    const monthlySavings = theForkCost - ourCost;
    const annualSavings = monthlySavings * 12;
    // Payback: months of our sub to recoup the savings delta (always 1 since savings are monthly)
    const paybackMonths = monthlySavings > 0 ? Math.ceil(ourCost / monthlySavings) : null;

    return { theForkCost, monthlySavings, annualSavings, paybackMonths };
  }, [monthlyFee, covers]);

  const inputClass =
    'w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition';

  return (
    <div className="rounded-3xl border border-border bg-bg-secondary p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-accent border border-border">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-semibold text-text-primary">Calculateur ROI</h3>
          <p className="text-xs text-text-muted">Comparez avec TheFork / LaFourchette</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">
            Budget TheFork / mois (€)
          </label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="number"
              min={0}
              max={5000}
              step={10}
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(Number(e.target.value))}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">
            Couverts via plateforme / mois
          </label>
          <input
            type="number"
            min={0}
            max={2000}
            step={5}
            value={covers}
            onChange={(e) => setCovers(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 space-y-1">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">TheFork / mois</p>
          <p className="text-2xl font-serif font-bold text-red-600">
            {calc.theForkCost.toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-red-400">
            {monthlyFee} € fixe + {covers} × {COMMISSION_PER_COVER} € comm.
          </p>
        </div>
        <div className="rounded-2xl bg-green-50 border border-green-100 p-4 space-y-1">
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Restaurant OS / mois</p>
          <p className="text-2xl font-serif font-bold text-green-700">
            {OUR_FLAT_FEE} €
          </p>
          <p className="text-xs text-green-500">Forfait tout inclus, sans commission</p>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-bg-primary border border-border divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Economie mensuelle
          </div>
          <span className={`font-bold font-mono text-base ${calc.monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {calc.monthlySavings >= 0 ? '+' : ''}{calc.monthlySavings.toLocaleString('fr-FR')} €
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Economie annuelle
          </div>
          <span className={`font-bold font-mono text-base ${calc.annualSavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {calc.annualSavings >= 0 ? '+' : ''}{calc.annualSavings.toLocaleString('fr-FR')} €
          </span>
        </div>
        {calc.paybackMonths !== null && calc.monthlySavings > 0 && (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calculator className="w-4 h-4 text-accent" />
              Retour sur investissement
            </div>
            <span className="font-bold font-mono text-base text-accent">
              {calc.paybackMonths === 1 ? 'Des le 1er mois' : `${calc.paybackMonths} mois`}
            </span>
          </div>
        )}
      </div>

      {calc.monthlySavings <= 0 && (
        <p className="text-xs text-text-muted text-center">
          Augmentez votre budget TheFork ou le nombre de couverts pour voir les economies possibles.
        </p>
      )}
    </div>
  );
}
