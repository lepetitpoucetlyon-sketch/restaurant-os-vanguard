'use client';

import { useMCCLocale } from './LocaleContext';

export function LocaleToggle() {
    const { locale, setLocale } = useMCCLocale();

    return (
        <div className="flex items-center gap-1 bg-surface-card border border-border-subtle rounded-xl p-1">
            <button
                onClick={() => setLocale('fr')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    locale === 'fr'
                        ? 'bg-action-primary/15 text-brand'
                        : 'text-secondary hover:text-text-primary'
                }`}
            >
                🇫🇷 FR
            </button>
            <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    locale === 'en'
                        ? 'bg-action-primary/15 text-brand'
                        : 'text-secondary hover:text-text-primary'
                }`}
            >
                🇬🇧 EN
            </button>
        </div>
    );
}
