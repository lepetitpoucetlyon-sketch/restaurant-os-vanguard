'use client';

/**
 * SplashScreen — Écran de démarrage branded (mode custom uniquement)
 *
 * Affiché une fois par session si le tenant a activé splashEnabled.
 * Logo + fond couleur charte + animation de fondu vers l'app.
 * DB-agnostique : lit uniquement les atoms Jotai (tenantBrandTokensAtom).
 */

import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { tenantBrandTokensAtom } from '@/bootstrap/store/pillars/sovereign';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';

interface SplashScreenProps {
    onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
    const rawTokens   = useAtomValue(tenantBrandTokensAtom);
    const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

    const result = BrandTokensSchema.safeParse(rawTokens ?? defaultBrandTokens);
    const tokens = result.success ? result.data : defaultBrandTokens;

    const primary   = tokens.primaryColor ?? '#C5A059';
    const logoUrl   = tokens.logoUrl;
    const brandName = tokens.brandName ?? 'Restaurant OS';
    const tagline   = tokens.tagline;

    useEffect(() => {
        // enter → hold (300ms) → exit (2200ms) → done
        const t1 = setTimeout(() => setPhase('hold'), 300);
        const t2 = setTimeout(() => setPhase('exit'), 2400);
        const t3 = setTimeout(onDone, 2900);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone]);

    const opacity = phase === 'enter' ? 0 : phase === 'hold' ? 1 : 0;

    return (
        <div
            aria-hidden="true"
            style={{
                position:       'fixed',
                inset:          0,
                zIndex:         9999,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '24px',
                // Fond : couleur primaire très sombre dérivée de la charte
                background: `radial-gradient(ellipse at 50% 30%, ${primary}18 0%, ${primary}06 50%, #09090C 100%)`,
                backgroundColor: '#09090C',
                opacity,
                transition: `opacity ${phase === 'exit' ? '500ms' : '300ms'} ease-in-out`,
                pointerEvents: phase === 'exit' ? 'none' : 'all',
            }}
        >
            {/* Orbe d'ambiance */}
            <div style={{
                position:     'absolute',
                width:        '400px',
                height:       '400px',
                borderRadius: '50%',
                background:   `radial-gradient(circle, ${primary}20 0%, transparent 70%)`,
                filter:       'blur(60px)',
                pointerEvents: 'none',
            }} />

            {/* Logo ou initiale */}
            <div style={{
                width:           logoUrl ? 'auto' : '80px',
                height:          logoUrl ? 'auto' : '80px',
                maxWidth:        '220px',
                maxHeight:       '120px',
                borderRadius:    logoUrl ? '0' : '20px',
                background:      logoUrl ? 'transparent' : `linear-gradient(145deg, ${primary} 0%, ${adjustBrightness(primary, -30)} 100%)`,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                boxShadow:       logoUrl ? 'none' : `0 20px 60px ${primary}40`,
                transform:       phase === 'hold' ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(10px)',
                transition:      'transform 600ms cubic-bezier(0.16,1,0.3,1)',
            }}>
                {logoUrl ? (
                     
                    <img src={logoUrl} alt={brandName} style={{ maxWidth: '220px', maxHeight: '120px', objectFit: 'contain' }} />
                ) : (
                    <span style={{
                        fontFamily:    'Georgia, "Playfair Display", serif',
                        fontSize:      '32px',
                        fontWeight:    700,
                        color:         '#fff',
                        letterSpacing: '-0.02em',
                    }}>
                        {brandName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>

            {/* Nom + tagline */}
            <div style={{ textAlign: 'center', transform: phase === 'hold' ? 'translateY(0)' : 'translateY(8px)', transition: 'transform 600ms 100ms cubic-bezier(0.16,1,0.3,1)' }}>
                <p style={{
                    fontFamily:    'Georgia, "Playfair Display", serif',
                    fontSize:      '22px',
                    fontWeight:    600,
                    color:         'rgba(255,255,255,0.92)',
                    letterSpacing: '-0.02em',
                    margin:        0,
                }}>
                    {brandName}
                </p>
                {tagline && (
                    <p style={{
                        fontFamily:    'system-ui, -apple-system, sans-serif',
                        fontSize:      '12px',
                        color:         'rgba(255,255,255,0.38)',
                        marginTop:     '6px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}>
                        {tagline}
                    </p>
                )}
            </div>

            {/* Indicateur de chargement */}
            <div style={{
                position:   'absolute',
                bottom:     '40px',
                display:    'flex',
                gap:        '6px',
                opacity:    phase === 'hold' ? 0.4 : 0,
                transition: 'opacity 400ms',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width:        '5px',
                        height:       '5px',
                        borderRadius: '50%',
                        background:   primary,
                        animation:    `splash-pulse 1.2s ease-in-out ${i * 200}ms infinite`,
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes splash-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}

/** Assombrit ou éclaircit une couleur hex d'un delta [-255, 255] */
function adjustBrightness(hex: string, delta: number): string {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    const r = clamp(parseInt(clean.slice(0, 2), 16) + delta);
    const g = clamp(parseInt(clean.slice(2, 4), 16) + delta);
    const b = clamp(parseInt(clean.slice(4, 6), 16) + delta);
    return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}
