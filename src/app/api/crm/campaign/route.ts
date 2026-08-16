import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { requireTenantAdmin, isDenied } from "@/lib/server/adminAuthGuard";
import { logger } from "@/lib/logger";

// NOTE: Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local to enable real sends.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@restaurant-os.app";

const CampaignPayloadSchema = z.object({
  segment: z.enum(["all_active", "inactive_3m", "birthdays_this_month"]),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
});

interface CustomerRecord {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  lastVisitDate?: string;
  birthDate?: string;
  visitCount?: number;
}

async function getCustomersForSegment(
  tenantId: string,
  segment: z.infer<typeof CampaignPayloadSchema>["segment"]
): Promise<CustomerRecord[]> {
  // Dynamic import to avoid bundling Nexus in a cold-start context
  const { Nexus } = await import("@/lib/nexus/NexusAdapter");
  // Scoping tenant explicite : jamais la collection racine (fuite cross-tenant)
  const all = await Nexus.adapter
    .query<CustomerRecord>(`tenants/${tenantId}/customers`)
    .catch(() => [] as CustomerRecord[]);
  const withEmail = all.filter((c) => Boolean(c.email?.trim()));

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth();

  if (segment === "all_active") {
    return withEmail.filter((c) => (c.visitCount ?? 0) > 0);
  }
  if (segment === "inactive_3m") {
    return withEmail.filter((c) => {
      if (!c.lastVisitDate) return true;
      return new Date(c.lastVisitDate) < threeMonthsAgo;
    });
  }
  // birthdays_this_month
  return withEmail.filter((c) => {
    if (!c.birthDate) return false;
    return new Date(c.birthDate).getMonth() === currentMonth;
  });
}

export async function POST(request: NextRequest) {
  const caller = await requireTenantAdmin(request);
  if (isDenied(caller)) return caller;

  try {
    const json = await request.json();
    const parse = CampaignPayloadSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json({ success: false, message: "Payload invalide", errors: parse.error.flatten() }, { status: 400 });
    }

    const { segment, subject, body } = parse.data;
    const customers = await getCustomersForSegment(caller.tenantId, segment);

    if (customers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "Aucun destinataire" });
    }

    if (!resend) {
      // RESEND_API_KEY absent — simulation mode (set in .env.local to enable real sends)
      console.info(`[CRM Campaign] RESEND not configured — would send to ${customers.length} recipients. Subject: "${subject}"`);
      return NextResponse.json({ success: true, sent: customers.length, simulated: true });
    }

    // Batch sends — Resend supports up to 100 per call; chunk if needed
    const BATCH_SIZE = 50;
    let sent = 0;

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const chunk = customers.slice(i, i + BATCH_SIZE);
      const emails = chunk.map((c) => ({
        from: FROM_EMAIL,
        to: c.email as string,
        subject,
        html: body
          .replace(/{{prenom}}/g, c.firstName ?? "")
          .replace(/{{nom}}/g, c.lastName ?? "")
          .replace(/{{email}}/g, c.email ?? ""),
      }));

      const { error } = await resend.batch.send(emails);
      if (error) {
        logger.error("[CRM Campaign] Resend batch error:", error);
        // Continue — partial send is better than full abort
      } else {
        sent += chunk.length;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    logger.error("[CRM Campaign] Unexpected error:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur interne" }, { status: 500 });
  }
}
