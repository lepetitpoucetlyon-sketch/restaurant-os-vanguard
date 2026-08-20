'use client';
// ─────────────────────────────────────────────────────────────────
// Homepage — Landing racine multi-verticale
// ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { motion } from 'framer-motion';
import { VERTICALS_LANDING, PRICING_PLANS } from './data/verticals';

const TOP_FEATURES = [
  { icon: '💳', title: 'Caisse NF525', description: 'Encaissement certifié conforme, scellement fiscal inviolable.' },
  { icon: '📴', title: 'Mode hors ligne', description: 'Continuez à encaisser sans WiFi. Synchronisation automatique.' },
  { icon: '🤖', title: 'Copilote IA', description: 'Assistant vocal et textuel qui connaît votre métier.' },
  { icon: '📊', title: 'Analytics temps réel', description: 'CA, marges, tendances — en direct sur votre tableau de bord.' },
  { icon: '👥', title: 'Multi-établissements', description: 'Supervisez 1 ou 100 points de vente depuis le MCC.' },
  { icon: '🔒', title: 'RGPD natif', description: 'Données chiffrées, hébergées en France, isolement par tenant.' },
];

export default function MarketingHomePage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(197,160,89,0.12),transparent)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Le système d&apos;exploitation des commerces indépendants
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Votre commerce.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                Augmenté par l&apos;IA.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 leading-relaxed mb-10 max-w-2xl mx-auto">
              Caisse certifiée NF525, analytics temps réel, mode hors ligne et copilote IA —
              pour restaurants, boulangeries, salons et 8 autres métiers.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Essai gratuit 14 jours
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link
                href="#verticals"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/80 font-medium hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
              >
                Découvrir les verticales
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['NF525', 'RGPD', 'HACCP', 'Offline-first'].map((badge) => (
                <span key={badge} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(197,160,89,0.05),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Un socle{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">industriel</span>
              {' '}pour chaque métier
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Ce qui est commun à tous vos commerces, construit une seule fois, certifié, testé.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOP_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white/90">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VERTICAL SELECTOR ─── */}
      <section id="verticals" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Adapté à{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                votre métier
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Chaque verticale a ses propres fonctionnalités, vocabulaire et workflows.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {VERTICALS_LANDING.map((v, i) => (
              <motion.div
                key={v.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/verticales/${v.slug}`}
                  className="group block p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300 text-center"
                >
                  <div className="text-4xl mb-3">{v.emoji}</div>
                  <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                    {v.name}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING TEASER ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(197,160,89,0.05),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Tarifs{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">transparents</span>
            </h2>
            <p className="text-white/50 text-lg">Pas de frais cachés. Pas d'engagement.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] border-2 border-amber-500/30' : 'bg-white/[0.02] border border-white/[0.06]'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-semibold">
                    Populaire
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-white/40 mb-6">{plan.description}</p>
                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}€</span>
                      <span className="text-white/40 text-sm">{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-white/80">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                      <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price !== null ? `/signup?plan=${plan.name.toLowerCase()}` : '/contact'}
                  className={`block w-full text-center py-3 rounded-full text-sm font-medium transition-all ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/25' : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'}`}
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(197,160,89,0.08),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              Prêt à passer à la vitesse supérieure ?
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
              Rejoignez les commerçants qui ont choisi l&apos;autonomie numérique.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]"
            >
              Commencer gratuitement
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
