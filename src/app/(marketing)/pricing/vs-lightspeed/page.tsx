import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Restaurant OS vs Lightspeed — Comparatif caisse enregistreuse NF525',
  description: 'Comparez Restaurant OS et Lightspeed Restaurant : fonctionnalités, tarifs, conformité NF525, mode hors ligne.',
};

export default function VsLightspeedPage() {
  const features = [
    { feature: 'Certifié NF525', ros: true, competitor: true },
    { feature: 'Mode hors ligne natif', ros: true, competitor: false },
    { feature: 'Copilote IA intégré', ros: true, competitor: false },
    { feature: 'Multi-vertical (8+ métiers)', ros: true, competitor: false },
    { feature: 'KDS cuisine', ros: true, competitor: true },
    { feature: 'Multi-caisse', ros: true, competitor: true },
    { feature: 'Programme fidélité', ros: true, competitor: true },
    { feature: 'Export FEC comptable', ros: true, competitor: true },
    { feature: 'API ouverte', ros: true, competitor: true },
    { feature: 'Plan de salle interactif', ros: true, competitor: true },
    { feature: 'Stock & recettes', ros: true, competitor: true },
    { feature: 'Données hébergées en France', ros: true, competitor: false },
    { feature: 'Pas de frais de résiliation', ros: true, competitor: false },
    { feature: 'Pas de commission sur les ventes', ros: true, competitor: false },
    { feature: 'Tarif de départ', ros: '49€/mois', competitor: '69€/mois' },
  ];

  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-center">
          Restaurant OS vs <span className="text-amber-400">Lightspeed</span>
        </h1>
        <p className="text-lg text-white/50 text-center mb-12 max-w-2xl mx-auto">
          Deux solutions POS professionnelles. Une seule est souveraine et indépendante.
        </p>

        <div className="rounded-2xl border border-white/[0.06] overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="text-left px-6 py-4 font-medium text-white/60">Fonctionnalité</th>
                <th className="text-center px-6 py-4 font-semibold text-amber-400">Restaurant OS</th>
                <th className="text-center px-6 py-4 font-medium text-white/60">Lightspeed</th>
              </tr>
            </thead>
            <tbody>
              {features.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                  <td className="px-6 py-3 text-white/70">{row.feature}</td>
                  <td className="px-6 py-3 text-center">
                    {typeof row.ros === 'boolean' ? (
                      row.ros ? <span className="text-emerald-400">✓</span> : <span className="text-white/20">✗</span>
                    ) : (
                      <span className="text-amber-400 font-medium">{row.ros}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {typeof row.competitor === 'boolean' ? (
                      row.competitor ? <span className="text-white/50">✓</span> : <span className="text-white/20">✗</span>
                    ) : (
                      <span className="text-white/50">{row.competitor}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
          >
            Essayer Restaurant OS gratuitement →
          </Link>
        </div>
      </div>
    </section>
  );
}
