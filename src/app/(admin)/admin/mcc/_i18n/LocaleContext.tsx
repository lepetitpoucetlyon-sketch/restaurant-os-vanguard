'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { mccTranslations, type MCCLocale, type MCCTranslations } from './translations';

interface MCCLocaleContextValue {
    locale: MCCLocale;
    t: MCCTranslations;
    setLocale: (l: MCCLocale) => void;
    toggle: () => void;
}

const MCCLocaleContext = createContext<MCCLocaleContextValue | null>(null);

const STORAGE_KEY = 'mcc-locale';

export function MCCLocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<MCCLocale>('fr');

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as MCCLocale | null;
        if (stored === 'fr' || stored === 'en') setLocaleState(stored);
    }, []);

    const setLocale = useCallback((l: MCCLocale) => {
        setLocaleState(l);
        localStorage.setItem(STORAGE_KEY, l);
    }, []);

    const toggle = useCallback(() => {
        setLocale(locale === 'fr' ? 'en' : 'fr');
    }, [locale, setLocale]);

    return (
        <MCCLocaleContext.Provider value={{ locale, t: mccTranslations[locale] as MCCTranslations, setLocale, toggle }}>
            {children}
        </MCCLocaleContext.Provider>
    );
}

export function useMCCLocale(): MCCLocaleContextValue {
    const ctx = useContext(MCCLocaleContext);
    if (!ctx) throw new Error('useMCCLocale must be used inside MCCLocaleProvider');
    return ctx;
}
