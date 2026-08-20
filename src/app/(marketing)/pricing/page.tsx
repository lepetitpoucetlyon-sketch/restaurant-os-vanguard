'use client';
// ─────────────────────────────────────────────────────────────────
// /pricing — Full pricing page with plan comparison
// ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PRICING_PLANS } from '../data/verticals';

const COMPARISONS = [
  { name: 'Zelty', href: '/pricing/vs-zelty' },
  { name: 'Lightspeed', href: '/pricing/vs-lightspeed' },
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-32 pb-24 sm:pt-40 sm:pb-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(197,160,89,0.08),transparent)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Des tarifs{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                simples et transparents
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Pas de frais cachés. Pas d&apos;engagement. Commencez avec 14 jours gratuits.
            </p>
          </motion.div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] border-2 border-amber-500/30 scale-[1.02]'
                    : 'bg-white/[0.02] border border-white/[0.06]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-semibold">
                    Le plus choisi
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-white/40 mb-6 min-h-[40px]">{plan.description}</p>

                <div className="mb-8">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}€</span>
                      <span className="text-white/40 text-sm">{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-white/80">{plan.period}</span>
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
                  className={`block w-full text-center py-3.5 rounded-full text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/25'
                      : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Competitor comparison links */}
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-6 text-white/70">
              Comparez avec la concurrence
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {COMPARISONS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                >
                  Restaurant OS vs {c.name} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-10 text-center">Questions sur les tarifs</h2>
          <div className="space-y-6">
            {[
              { q: 'Y a-t-il des frais d\'installation ?', a: 'Non. Inscrivez-vous, configurez et commencez à encaisser en 5 minutes.' },
              { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui. L\'upgrade est instantané, le downgrade prend effet à la fin du mois.' },
              { q: 'Qu\'est-ce qui est inclus dans l\'essai gratuit ?', a: 'Toutes les fonctionnalités du plan Pro pendant 14 jours. Carte bancaire requise mais non prélevée.' },
              { q: 'Y a-t-il un engagement minimum ?', a: 'Non. Facturation mensuelle, résiliable à tout moment en 1 clic.' },
              { q: 'Acceptez-vous les paiements annuels ?', a: 'Oui. -20% sur le tarif mensuel avec facturation annuelle.' },
              { q: 'Des frais de transaction ?', a: 'Aucun. Restaurant OS ne prend pas de commission sur vos ventes. Seuls les frais Stripe standards s\'appliquent.' },
            ].map((item) => (
              <div key={item.q} className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="font-medium text-white/85 mb-2">{item.q}</h3>
                <p className="text-sm text-white/45">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
