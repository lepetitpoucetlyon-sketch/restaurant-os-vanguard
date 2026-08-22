/**
 * POST /api/tenant/onboarding/auto-morphogenesis
 * Body: { websiteUrl?: string, instagramHandle?: string, googleMapsUrl?: string, businessName?: string }
 * -> Exécute la morphogenèse instantanée via DigitalDnaCrawlerService
 */
import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, isDenied } from "@/lib/server/adminAuthGuard";
import { logger } from "@/lib/logger";
import { DigitalDnaCrawlerService } from "@/modules/commerce";
import { toError } from "@/lib/toError";

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const body = await req.json();
        const { websiteUrl, instagramHandle, googleMapsUrl, businessName, adminPin, siren } = body;

        logger.info("[auto-morphogenesis] Lancement morphogenèse", {
            tenantId: caller.tenantId,
            websiteUrl,
            instagramHandle,
            businessName,
        });

        const result = await DigitalDnaCrawlerService.ingestAndMorph({
            tenantId: caller.tenantId,
            adminEmail: "admin@" + caller.tenantId + ".internal",
            websiteUrl,
            instagramHandle,
            googleMapsUrl,
            businessName,
            adminPin,
            siren,
        });

        if (!result.success) {
            return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
        }

        return NextResponse.json({
            ok: true,
            morphogenesis: result,
        });
    } catch (err) {
        logger.error("[auto-morphogenesis] Erreur inattendue", err);
        return NextResponse.json({ ok: false, error: toError(err).message }, { status: 500 });
    }
}
