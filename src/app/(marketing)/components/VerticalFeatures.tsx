'use client';
// ─────────────────────────────────────────────────────────────────
// VerticalFeatures — 6-feature grid with glassmorphism cards
// ─────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import type { VerticalLandingData } from '../data/verticals';

export function VerticalFeatures({ vertical }: { vertical: VerticalLandingData }) {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(197,160,89,0.06),transparent)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Tout ce dont votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {vertical.name.toLowerCase()}
            </span>{' '}
            a besoin
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Des fonctionnalités pensées pour votre métier, pas un logiciel générique adapté en surface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vertical.features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500">
                {/* Icon */}
                <div className="text-3xl mb-4">{feature.icon}</div>
                {/* Title */}
                <h3 className="text-lg font-semibold mb-2 text-white/90 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                {/* Description */}
                <p className="text-sm text-white/45 leading-relaxed group-hover:text-white/60 transition-colors">
                  {feature.description}
                </p>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
