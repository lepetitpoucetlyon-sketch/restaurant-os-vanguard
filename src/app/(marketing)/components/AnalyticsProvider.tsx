'use client';
// ─────────────────────────────────────────────────────────────────
// AnalyticsProvider — PostHog & privacy-first analytics provider
// Automatically tracks page views and provides custom event helpers.
// Gracefully degrades to no-op when keys are not configured.
// ─────────────────────────────────────────────────────────────────
import { useEffect, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
}

/** Global tracker helper for marketing events */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { posthog?: { capture: (n: string, p?: Record<string, unknown>) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (n: string, p?: Record<string, unknown>) => void } }).posthog.capture(name, properties);
  }
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

    if (posthogKey && typeof window !== 'undefined') {
      // Load PostHog script snippet if configured
      if (!(window as unknown as { posthog?: unknown }).posthog) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = `${posthogHost}/static/array.js`;
        script.onload = () => {
          const ph = (window as unknown as { posthog?: { init: (k: string, opt: unknown) => void } }).posthog;
          if (ph) {
            ph.init(posthogKey, {
              api_host: posthogHost,
              capture_pageview: false,
              capture_pageleave: true,
              autocapture: false,
              persistence: 'memory',
            });
          }
        };
        document.head.appendChild(script);
      }
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      trackEvent('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
