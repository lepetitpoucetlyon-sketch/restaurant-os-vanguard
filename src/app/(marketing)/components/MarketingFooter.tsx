// ─────────────────────────────────────────────────────────────────
// MarketingFooter — Dark premium footer with sitemap + legal links
// ─────────────────────────────────────────────────────────────────
import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/#features' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'Verticales', href: '/#verticals' },
      { label: 'Conformité NF525', href: '/legal/nf525' },
    ],
  },
  {
    title: 'Verticales',
    links: [
      { label: 'Restaurant', href: '/verticales/restaurant' },
      { label: 'Boulangerie', href: '/verticales/boulangerie' },
      { label: 'Salon de coiffure', href: '/verticales/salon' },
      { label: 'Hôtel', href: '/verticales/hotel' },
      { label: 'Garage', href: '/verticales/garage' },
      { label: 'Commerce', href: '/verticales/retail' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Statut', href: '/status' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'CGV', href: '/legal/cgv' },
      { label: 'CGU', href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/rgpd' },
      { label: 'DPA', href: '/legal/dpa' },
      { label: 'Sécurité', href: '/legal/security' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#06060A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Grid sitemap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white/90 mb-4 tracking-wide uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-nano">
              R
            </div>
            <span className="text-sm text-white/50">
              © {new Date().getFullYear()} Restaurant OS SAS — Tous droits réservés
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Systèmes opérationnels
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
