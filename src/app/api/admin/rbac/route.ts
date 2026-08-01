import { NextResponse } from "next/server";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { TenantRBACConfigSchema } from "@/domain/schemas/rbac";
import { requireTenantRole, isDenied } from "@/lib/server/adminAuthGuard";

export async function GET(req: Request) {
    const caller = await requireTenantRole(req, "manager");
    if (isDenied(caller)) return caller;

    try {
        const path = `tenants/${caller.tenantId}/config/rbac`;
        const data = await Nexus.adapter.get(path);
        return NextResponse.json(data || {});
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const caller = await requireTenantRole(req, "directeur");
    if (isDenied(caller)) return caller;

    try {
        const body = await req.json();
        const parsedConfig = TenantRBACConfigSchema.parse(body);
        const path = `tenants/${caller.tenantId}/config/rbac`;
        await Nexus.adapter.set(path, parsedConfig);
        return NextResponse.json({ success: true, config: parsedConfig });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
