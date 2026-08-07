import { ChefHat, Twitter, Linkedin, Instagram } from "lucide-react";

export function LandingFooter() {
    return (
        <footer className="relative py-20 px-6 bg-surface-sidebar border-t border-border-subtle">
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
                            <a href="#" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center text-text-primary/40 hover:text-text-primary hover:bg-surface-card transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Produit</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Fonctionnalités</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Tarifs</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Intégrations</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Ressources</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Guides</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Blog</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Support</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-text-primary font-bold text-sm uppercase tracking-widest mb-6">Légal</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">CGV</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Mentions légales</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">Confidentialité</a></li>
                            <li><a href="#" className="text-text-primary/40 hover:text-text-primary text-sm transition-colors">RGPD</a></li>
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
