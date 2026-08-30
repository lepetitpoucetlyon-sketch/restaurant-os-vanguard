import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Table } from '@nexus/contracts';

export const dynamic = 'force-dynamic';

/**
 * 🪑 GET /api/v1/tables
 * Retourne la liste des tables d'un restaurant avec leur statut (libre, occupée, réservée).
 */
export async function GET(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const tenantId = caller.tenantId;
    const rawTables = (await Nexus.adapter.get(`tenants/${tenantId}/ops_nodes`)) as
      | Record<string, Table>
      | Table[]
      | null;

    const tables: Table[] = rawTables
      ? Array.isArray(rawTables)
        ? rawTables
        : Object.values(rawTables)
      : [];

    return NextResponse.json(
      {
        tenantId,
        count: tables.length,
        tables: tables.map((t) => ({
          id: t.id,
          number: t.number,
          zone: t.zone || 'salle',
          seats: t.seats || 2,
          status: t.status || 'available',
          currentOrderId: t.currentOrderId || null,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tables' },
      { status: 500 }
    );
  }
}
