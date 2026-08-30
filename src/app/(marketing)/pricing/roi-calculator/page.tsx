'use client';
// ─────────────────────────────────────────────────────────────────
// /pricing/roi-calculator — Calculateur de retour sur investissement
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from "@/shared/components/ui/Input";

export default function RoiCalculatorPage() {
  const [ticketAverage, setTicketAverage] = useState<number>(25);
  const [dailyCovers, setDailyCovers] = useState<number>(80);
  const [openingDaysPerMonth, setOpeningDaysPerMonth] = useState<number>(26);
  const [currentSoftwareCost, setCurrentSoftwareCost] = useState<number>(120);

  // Computations
  const monthlyRevenue = ticketAverage * dailyCovers * openingDaysPerMonth;
  // Estimated time saved: 1.5 hours per day across order taking, stock, accounting
  const hoursSavedPerMonth = 1.5 * openingDaysPerMonth;
  // Financial value of time saved (estimated @ 20€/h)
  const timeValueSaved = hoursSavedPerMonth * 20;
  // Direct software savings (Pro plan @ 99€/mo vs current)
  const rosProPrice = 99;
  const softwareSavings = Math.max(0, currentSoftwareCost - rosProPrice);
  // Total estimated monthly gain
  const totalMonthlyGain = timeValueSaved + softwareSavings;
  // Annual gain
  const annualGain = totalMonthlyGain * 12;

  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(197,160,89,0.08),transparent)]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Calculateur de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              ROI
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Estimez le temps et l&apos;argent que Restaurant OS vous fera économiser chaque mois.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Inputs */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-6">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Vos chiffres actuels</h2>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Ticket moyen (€)</span>
                <span className="font-semibold text-amber-400">{ticketAverage} €</span>
              </div>
              <Input
                type="range"
                min="5"
                max="150"
                step="1"
                value={ticketAverage}
                onChange={(e) => setTicketAverage(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Couverts / clients par jour</span>
                <span className="font-semibold text-amber-400">{dailyCovers}</span>
              </div>
              <Input
                type="range"
                min="10"
                max="500"
                step="5"
                value={dailyCovers}
                onChange={(e) => setDailyCovers(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Jours d&apos;ouverture par mois</span>
                <span className="font-semibold text-amber-400">{openingDaysPerMonth} j</span>
              </div>
              <Input
                type="range"
                min="15"
                max="31"
                step="1"
                value={openingDaysPerMonth}
                onChange={(e) => setOpeningDaysPerMonth(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">Coût mensuel logiciel actuel (€)</span>
                <span className="font-semibold text-amber-400">{currentSoftwareCost} €</span>
              </div>
              <Input
                type="range"
                min="0"
                max="300"
                step="10"
                value={currentSoftwareCost}
                onChange={(e) => setCurrentSoftwareCost(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-white/5 text-xs text-white/40">
              CA mensuel estimé : <span className="text-white/80 font-medium">{monthlyRevenue.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          {/* Results */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] border border-amber-500/20 space-y-6">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Gains estimés avec Restaurant OS</h2>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider">Temps gagné par mois</div>
              <div className="text-3xl font-bold text-amber-400">
                {Math.round(hoursSavedPerMonth)} heures
              </div>
              <div className="text-xs text-white/40">
                Clôture de caisse Z automatique, saisie vocale, export FEC 1-clic.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider">Valeur financière mensuelle</div>
              <div className="text-3xl font-bold text-emerald-400">
                +{Math.round(totalMonthlyGain).toLocaleString('fr-FR')} € / mois
              </div>
              <div className="text-xs text-white/40">
                Valorisation du temps de gestion + économie d&apos;abonnement.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Impact annuel estimé</div>
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                +{Math.round(annualGain).toLocaleString('fr-FR')} € / an
              </div>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02]"
            >
              Démarrer l&apos;essai gratuit 14 jours →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
