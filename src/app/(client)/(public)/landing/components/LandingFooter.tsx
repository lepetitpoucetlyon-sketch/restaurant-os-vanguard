import Link from "next/link";
import { ChefHat, Twitter, Linkedin, Instagram } from "lucide-react";

export function LandingFooter() {
    return (
        <footer className="relative py-20 px-6 bg-surface-card border-t border-border">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-text-primary" />
                            </div>
                            <span className="text-text-primary font-brand text-xl font-semibold">Restaurant OS</span>
                        </div>
                        <p className="text-text-primary/40 text-sm leading-relaxed mb-6">
                            L'intelligence exécutive pour restaurateurs visionnaires.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Produit</h4>
                        <ul className="space-y-4">
                            <li><Link href="/verticales" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Fonctionnalités</Link></li>
                            <li><Link href="/pricing" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Tarifs</Link></li>
                            <li><Link href="/integrations" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Intégrations</Link></li>
                            <li><Link href="/status" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Statut & Roadmap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Ressources</h4>
                        <ul className="space-y-4">
                            <li><Link href="/aide" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Documentation</Link></li>
                            <li><Link href="/aide" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Guides</Link></li>
                            <li><Link href="/welcome" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Découverte</Link></li>
                            <li><Link href="/aide" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Légal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/legal/cgv" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">CGV</Link></li>
                            <li><Link href="/legal/mentions" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Mentions légales</Link></li>
                            <li><Link href="/legal/cgu" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">CGU</Link></li>
                            <li><Link href="/legal/rgpd" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">RGPD & Confidentialité</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-primary/30 text-sm">
                        © 2026 Restaurant OS. Tous droits réservés.
                    </p>
                    <p className="text-text-primary/30 text-sm">
                        Fait avec ❤️ par des passionnés de gastronomie.
                    </p>
                </div>
            </div>
        </footer>
    );
}
