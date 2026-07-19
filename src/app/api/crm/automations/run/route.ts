import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';

const AutomationConfigSchema = z.object({
    enabled: z.boolean(),
    delayDays: z.number().int().min(0).max(365),
    subject: z.string().min(1).max(200),
    body: z.string().min(1),
});

const BodySchema = z.object({
    automation: z.enum(['birthday', 'winback', 'postvisit']),
    config: AutomationConfigSchema,
});

interface Customer {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    lastVisitDate?: string;
    birthDate?: string;
}

function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function isBirthdayToday(birthDate?: string): boolean {
    if (!birthDate) return false;
    const today = new Date();
    const bd = new Date(birthDate);
    return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
}

function daysSince(date?: string): number {
    if (!date) return 9999;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export async function POST(req: NextRequest) {
    const auth = await requireTenantAdmin(req);
    if (isDenied(auth)) return auth;

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    // tenantId vient TOUJOURS du token (SovereignGuard) — jamais du body client
    const tenantId = auth.tenantId;
    const { automation, config } = parsed.data;

    const raw = await Nexus.adapter.query<Customer>(`tenants/${tenantId}/customers`, {});
    const customers = raw.filter((c): c is Customer & { email: string } => !!c.email);

    let targets: typeof customers = [];

    if (automation === 'birthday') {
        targets = customers.filter(c => isBirthdayToday(c.birthDate));
    } else if (automation === 'winback') {
        targets = customers.filter(c => daysSince(c.lastVisitDate) >= config.delayDays);
    } else if (automation === 'postvisit') {
        const delay = config.delayDays;
        targets = customers.filter(c => {
            const d = daysSince(c.lastVisitDate);
            return d >= delay && d < delay + 1;
        });
    }

    if (!targets.length) {
        return NextResponse.json({ sent: 0, message: 'Aucun client ciblé pour ce scénario' });
    }

    if (!resend) {
        logger.warn('[automations/run] RESEND_API_KEY not set — skipping real send');
        return NextResponse.json({ sent: targets.length, dry: true });
    }

    const BATCH = 50;
    let sent = 0;

    for (let i = 0; i < targets.length; i += BATCH) {
        const batch = targets.slice(i, i + BATCH);
        try {
            await resend.batch.send(
                batch.map(c => ({
                    from: FROM_EMAIL,
                    to: c.email!,
                    subject: interpolate(config.subject, { firstName: c.firstName ?? 'cher client', delayDays: String(config.delayDays) }),
                    text: interpolate(config.body, { firstName: c.firstName ?? 'cher client', delayDays: String(config.delayDays) }),
                }))
            );
            sent += batch.length;
        } catch (err) {
            logger.error('[automations/run] Batch error', err);
        }
    }

    logger.info(`[automations/run] ${automation}: ${sent}/${targets.length} emails sent for tenant ${tenantId}`);
    return NextResponse.json({ sent });
}
