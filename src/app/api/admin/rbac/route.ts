import { NextResponse } from "next/server";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { TenantRBACConfigSchema } from "@/domain/schemas/rbac";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json({ error: "tenantId required" }, { status: 400 });
        }

        const path = `tenants/${tenantId}/config/rbac`;
        const data = await Nexus.adapter.get(path);

        return NextResponse.json(data || {});
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json({ error: "tenantId required" }, { status: 400 });
        }

        const body = await req.json();
        
        // Validate with Zod
        const parsedConfig = TenantRBACConfigSchema.parse(body);

        const path = `tenants/${tenantId}/config/rbac`;
        await Nexus.adapter.set(path, parsedConfig);

        return NextResponse.json({ success: true, config: parsedConfig });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
