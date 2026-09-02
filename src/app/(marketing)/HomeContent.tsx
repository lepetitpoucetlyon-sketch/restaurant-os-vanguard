'use client';
// ─────────────────────────────────────────────────────────────────
// Homepage — Landing racine multi-verticale
// Refonte taste-skill v2 : hero asymétrique split, aucun emoji,
// icônes Lucide, pas de gradient text sur H1, CTA plat off-black,
// features en bento 2-col zig-zag, min-h-[100dvh] pour iOS Safari.
// ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  WifiOff,
  Sparkles,
  LineChart,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { VERTICALS_LANDING, PRICING_PLANS } from './data/verticals';

const TOP_FEATURES = [
  { Icon: CreditCard,  title: 'Caisse NF525',       description: 'Encaissement certifié conforme, scellement fiscal inviolable.' },
  { Icon: WifiOff,     title: 'Mode hors ligne',    description: 'Continuez à encaisser sans WiFi. Synchronisation automatique.' },
  { Icon: Sparkles,    title: 'Copilote IA',        description: 'Assistant vocal et textuel qui connaît votre métier.' },
  { Icon: LineChart,   title: 'Analytics temps réel', description: 'Chiffre d\'affaires, marges et tendances en direct.' },
  { Icon: Users,       title: 'Multi-établissements', description: 'Supervisez 1 à 100 points de vente depuis le MCC.' },
  { Icon: ShieldCheck, title: 'RGPD natif',         description: 'Données chiffrées, hébergées en France, isolement par tenant.' },
];

const EASE_EDITORIAL = [0.16, 1, 0.3, 1] as const;

export function MarketingHomePage() {
  return (
    <>
      {/* ─── HERO — Split asymétrique (taste-skill : centered banned quand variance > 4) ─── */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Ambient light + fine grid — pas de neon glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_20%_10%,rgba(197,160,89,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        <div className="relative w-full max-w-[87.5rem] mx-auto px-4 sm:px-6 lg:px-10 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Colonne gauche : texte aligné à gauche */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: EASE_EDITORIAL }}
              className="lg:col-span-7"
            >
              {/* Kicker — pill mono microscopique */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-[0.22em] font-mono text-white/55 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Système d&apos;exploitation des commerces indépendants
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-white mb-6" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Votre commerce,<br />
                <span className="italic text-[#C5A059]">tenu au cordeau.</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/55 leading-relaxed mb-10 max-w-[52ch]">
                Caisse certifiée NF525, analytics temps réel, mode hors ligne, copilote IA.
                Douze métiers couverts, un socle unique — construit une seule fois.
              </p>

              <div className="flex flex-wrap gap-3 items-center">
                {/* CTA primaire — solide off-black, pas gradient */}
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#C5A059] text-[#0B0B0C] text-sm font-medium tracking-tight transition-all duration-500 hover:bg-[#B08D48] active:scale-[0.98]"
                >
                  Essai 14 jours
                  <span className="w-9 h-9 rounded-full bg-[#0B0B0C]/15 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-[2px]">
                    <ArrowUpRight className="w-[15px] h-[15px]" strokeWidth={1.75} />
                  </span>
                </Link>
                <Link
                  href="#verticals"
                  className="inline-flex items-center px-5 py-3 rounded-full border border-white/12 bg-white/[0.02] text-sm font-medium text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors duration-300"
                >
                  Voir les 12 verticales
                </Link>
              </div>

              {/* Trust — desaturated */}
              <div className="mt-10 flex flex-wrap items-center gap-2">
                {['NF525', 'RGPD', 'HACCP', 'Offline-first', 'Souverain'].map((badge) => (
                  <span key={badge} className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-white/40 tracking-tight">
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Colonne droite : device mockup / KPI card — doppelrand nested */}
            <motion.div
              initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE_EDITORIAL }}
              className="lg:col-span-5"
            >
              <div className="relative p-2 rounded-[2rem] bg-white/[0.04] border border-white/10 shadow-[0_40px_80px_-30px_rgba(197,160,89,0.20)]">
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#0F0F11] border border-white/[0.06] p-6 sm:p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {/* Faux window controls */}
                  <div className="flex items-center gap-1.5 mb-6">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/12" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/12" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/12" />
                    <span className="ml-3 text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Tableau · en direct</span>
                  </div>

                  {/* KPI headline tabular */}
                  <div className="mb-6">
                    <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-white/40 mb-2">Chiffre du jour</div>
                    <div className="font-serif text-5xl text-white tabular-nums leading-none tracking-tight">
                      4 187 <span className="text-[#C5A059] text-3xl">€</span>
                    </div>
                    <div className="mt-2 text-xs text-emerald-400/80 tabular-nums">+12,4 % vs. lundi dernier</div>
                  </div>

                  {/* Mini bento — 3 tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { k: 'Couverts', v: '184', hint: 'ce midi' },
                      { k: 'Tables', v: '18/22', hint: 'occupées' },
                      { k: 'Ticket', v: '22,75 €', hint: 'moyen' },
                    ].map((tile) => (
                      <div key={tile.k} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                        <div className="text-[9px] uppercase font-mono tracking-[0.18em] text-white/35">{tile.k}</div>
                        <div className="mt-1 font-serif text-lg text-white tabular-nums leading-none">{tile.v}</div>
                        <div className="text-[10px] text-white/40 mt-1">{tile.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES — Bento asymétrique (taste-skill : 3-col equal cards banned) ─── */}
      <section id="features" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(197,160,89,0.04),transparent)]" />
        <div className="relative max-w-[87.5rem] mx-auto px-4 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
            className="max-w-2xl mb-16"
          >
            <div className="inline-block text-[10px] uppercase tracking-[0.24em] font-mono text-white/45 mb-4">
              Le socle
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight text-white" style={{ textWrap: 'balance' } as React.CSSProperties}>
              Ce qui est commun à tous vos commerces, construit une seule fois — certifié, testé, souverain.
            </h2>
          </motion.div>

          {/* Bento : row 1 = 2 wide (5/7), row 2 = 3 equal, row 3 = 7/5 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {TOP_FEATURES.map((f, i) => {
              // Layout asymétrique : 0=5, 1=7, 2=4, 3=4, 4=4, 5=12
              const span = [ 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-12' ][i];
              return (
                <motion.article
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: EASE_EDITORIAL }}
                  className={`${span} group relative p-7 sm:p-9 rounded-[1.75rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#C5A059]/8 border border-[#C5A059]/18 flex items-center justify-center mb-5 transition-colors duration-500 group-hover:bg-[#C5A059]/15">
                    <f.Icon className="w-5 h-5 text-[#C5A059]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-[42ch]">{f.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── VERTICALES — grille sobre, pas d'emoji ─── */}
      <section id="verticals" className="py-24 sm:py-32">
        <div className="max-w-[87.5rem] mx-auto px-4 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
            className="max-w-2xl mb-14"
          >
            <div className="inline-block text-[10px] uppercase tracking-[0.24em] font-mono text-white/45 mb-4">
              Douze métiers
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight text-white" style={{ textWrap: 'balance' } as React.CSSProperties}>
              Chaque verticale a ses fonctionnalités, son vocabulaire, ses lois métier.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VERTICALS_LANDING.map((v, i) => (
              <motion.div
                key={v.slug}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.5, ease: EASE_EDITORIAL }}
              >
                <Link
                  href={`/verticales/${v.slug}`}
                  className="group block aspect-[4/3] rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-[#C5A059]/25 transition-all duration-500 p-4 flex flex-col justify-between"
                >
                  <div className="w-8 h-8 rounded-lg border border-white/12 flex items-center justify-center font-serif text-sm text-[#C5A059] tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white/85 tracking-tight leading-tight">
                      {v.name}
                    </div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                      Voir →
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING — pas de gradient CTA, tabular numbers ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(197,160,89,0.04),transparent)]" />
        <div className="relative max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
            className="max-w-xl mb-14"
          >
            <div className="inline-block text-[10px] uppercase tracking-[0.24em] font-mono text-white/45 mb-4">
              Tarification
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight text-white">
              Trois formules. Pas de frais cachés, pas d&apos;engagement.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE_EDITORIAL }}
                className={`relative rounded-[1.75rem] p-8 border ${plan.popular ? 'bg-[#C5A059]/[0.04] border-[#C5A059]/25' : 'bg-white/[0.02] border-white/[0.06]'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-8 px-2.5 py-0.5 rounded-md bg-[#C5A059] text-[#0B0B0C] text-[10px] font-mono uppercase tracking-[0.18em]">
                    Recommandé
                  </div>
                )}
                <h3 className="font-serif text-2xl text-white mb-2 tracking-tight">{plan.name}</h3>
                <p className="text-sm text-white/45 mb-8 leading-relaxed">{plan.description}</p>

                <div className="mb-8">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-5xl text-white tabular-nums tracking-tight">{plan.price}</span>
                      <span className="text-2xl text-[#C5A059]">€</span>
                      <span className="text-white/40 text-sm">{plan.period}</span>
                    </div>
                  ) : (
                    <span className="font-serif text-2xl text-white/80">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-10">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                      <Check className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.price !== null ? `/signup?plan=${plan.name.toLowerCase()}` : '/contact'}
                  className={`block w-full text-center py-3 rounded-full text-sm font-medium transition-all duration-300 active:scale-[0.98] ${plan.popular ? 'bg-[#C5A059] text-[#0B0B0C] hover:bg-[#B08D48]' : 'bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white'}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(197,160,89,0.06),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-left sm:text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
          >
            <h2 className="font-serif text-4xl sm:text-6xl leading-[1.02] tracking-tight text-white mb-6" style={{ textWrap: 'balance' } as React.CSSProperties}>
              Passer à la <span className="italic text-[#C5A059]">vitesse supérieure.</span>
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-xl sm:mx-auto">
              Rejoignez les commerçants qui ont choisi l&apos;autonomie numérique.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-3 pl-8 pr-2 py-2 rounded-full bg-[#C5A059] text-[#0B0B0C] font-medium text-base transition-all duration-500 hover:bg-[#B08D48] active:scale-[0.98]"
            >
              Commencer gratuitement
              <span className="w-10 h-10 rounded-full bg-[#0B0B0C]/15 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-[2px]">
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
