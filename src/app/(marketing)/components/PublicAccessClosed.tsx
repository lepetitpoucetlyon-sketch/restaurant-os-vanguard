import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';

interface PublicAccessClosedProps {
    feature: 'landing' | 'signup';
    customMessage?: string;
}

const DEFAULT_MESSAGES: Record<'landing' | 'signup', { title: string; body: string }> = {
    landing: {
        title: 'Site temporairement fermé',
        body: 'Notre plateforme est actuellement en accès restreint. Merci de revenir dans quelques instants ou de contacter l\'équipe.',
    },
    signup: {
        title: 'Inscriptions temporairement fermées',
        body: 'Nous n\'acceptons pas de nouveaux comptes en ce moment. Vous pouvez nous laisser vos coordonnées et nous vous préviendrons dès la réouverture.',
    },
};

/**
 * Page de repli quand le MCC a désactivé landing ou signup public.
 * Server component pur — aucun JS embarqué côté client.
 */
export function PublicAccessClosed({ feature, customMessage }: PublicAccessClosedProps) {
    const { title, body } = DEFAULT_MESSAGES[feature];
    return (
        <section className="min-h-[80vh] flex items-center justify-center px-4 py-24">
            <div className="max-w-md text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-white/60" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
                <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                    {customMessage?.trim() || body}
                </p>
                <div className="pt-4">
                    <Link
                        href="/legal/mentions"
                        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                        Mentions légales <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
