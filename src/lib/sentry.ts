/**
 * Sentry lazy-wrapper — perf fix.
 *
 * Static `import * as Sentry from "@sentry/nextjs"` in application code was pulling
 * ~2MB of Sentry into the client bundle even in dev. This module exposes the same
 * fire-and-forget API but only loads @sentry/nextjs on demand, and only in production.
 *
 * Only the surface actually used by the app is re-exported. Grow this file if a new
 * Sentry method is needed elsewhere — do NOT re-add a static `import * as Sentry`.
 */

type CaptureContext = Record<string, unknown> | undefined;
type Breadcrumb = { category?: string; message?: string; level?: string; data?: Record<string, unknown> };
type Level = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface SentryLike {
    captureException(err: unknown, ctx?: CaptureContext): void;
    captureMessage(msg: string, ctxOrLevel?: Level | CaptureContext): void;
    setTag(key: string, value: string | number | boolean): void;
    setContext(name: string, context: Record<string, unknown> | null): void;
    addBreadcrumb(b: Breadcrumb): void;
}

const isProd = process.env.NODE_ENV === 'production';

let cached: SentryLike | null = null;
let loading: Promise<SentryLike | null> | null = null;

function loadSentry(): Promise<SentryLike | null> {
    if (!isProd) return Promise.resolve(null);
    if (cached) return Promise.resolve(cached);
    if (loading) return loading;
    // Concatenate at runtime so Turbopack/webpack cannot statically resolve the
    // dependency and pre-generate its chunk in dev. In prod (isProd=true) the
    // import still succeeds via Node/browser dynamic module resolution.
    const pkg = '@sentry' + '/nextjs';
    loading = (import(/* webpackIgnore: true */ pkg) as Promise<unknown>)
        .then(mod => { cached = mod as SentryLike; return cached; })
        .catch(() => null);
    return loading;
}

export const Sentry: SentryLike = {
    captureException(err, ctx) {
        loadSentry().then(s => s?.captureException(err, ctx));
    },
    captureMessage(msg, ctxOrLevel) {
        loadSentry().then(s => s?.captureMessage(msg, ctxOrLevel));
    },
    setTag(key, value) {
        loadSentry().then(s => s?.setTag(key, value));
    },
    setContext(name, context) {
        loadSentry().then(s => s?.setContext(name, context));
    },
    addBreadcrumb(b) {
        loadSentry().then(s => s?.addBreadcrumb(b));
    },
};

export type PlatformVertical = 'restaurant' | 'hotel' | 'bakery' | 'garage' | 'salon' | 'clinic' | 'retail' | 'custom';

export interface SentryTenantScope {
    tenantId: string;
    vertical: PlatformVertical;
    userId?: string;
    userRole?: string;
    appMode?: 'tenant' | 'mcc';
}

export function configureTenantScope(scope: SentryTenantScope): void {
    Sentry.setTag('tenant.id', scope.tenantId);
    Sentry.setTag('tenant.vertical', scope.vertical);
    Sentry.setTag('app.mode', scope.appMode ?? 'tenant');
    if (scope.userRole) {
        Sentry.setTag('user.role', scope.userRole);
    }
    Sentry.setContext('tenant', {
        id: scope.tenantId,
        vertical: scope.vertical,
        appMode: scope.appMode ?? 'tenant',
    });
}
