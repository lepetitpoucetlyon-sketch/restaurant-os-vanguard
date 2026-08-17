import { startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import type { Table, Reservation, Customer } from "@nexus/contracts";
import type { JsonObject } from "@/shared/types/json";

export const TERRACE_ZONE_IDS = ["zone-terrasse", "terrace"];
export const TERRASSE_SETTINGS_PATH = "settings/terrasse";

export interface ZoneTable {
    id: string;
    seats: number;
    type: "vip" | "terrace" | "standard";
    status: "available" | "occupied" | "reserved";
    number: string;
}

export function computeWeekAnchor(base: Date, weekOffset: number): Date {
    if (weekOffset > 0) return addWeeks(base, weekOffset);
    if (weekOffset < 0) return subWeeks(base, Math.abs(weekOffset));
    return base;
}

export function mapTableToZoneTable(table: Table): ZoneTable {
    const isTerrace = TERRACE_ZONE_IDS.some((z) => table.zoneId?.toLowerCase().includes(z));
    return {
        id: table.number,
        seats: table.seats ?? 4,
        type: table.zoneId === "VIP" ? "vip" : isTerrace ? "terrace" : "standard",
        status: table.status === "free" ? "available" : table.status === "seated" ? "occupied" : "reserved",
        number: table.number,
    };
}

export function groupTablesByZone(tables: Table[]): Record<string, ZoneTable[]> {
    return tables.reduce((acc: Record<string, ZoneTable[]>, table: Table) => {
        const zone = table.zoneId ?? "STANDARD";
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(mapTableToZoneTable(table));
        return acc;
    }, {});
}

export function applyTerraceState(stored: { open?: boolean } | null, setTerraceClosed: (v: boolean) => void): void {
    if (stored != null && typeof stored.open === "boolean") setTerraceClosed(!stored.open);
}

export function getWeekDays(anchor: Date): Date[] {
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function computeTableStatus(res: Reservation, now: number, in15Min: number): string | null {
    const resDateTime = (() => { try { return new Date(`${res.date}T${res.time}:00`).getTime(); } catch { return NaN; } })();
    if (isNaN(resDateTime)) return null;
    if (res.status === "seated") return "occupied";
    if ((res.status as string) === "completed") return "free";
    if (resDateTime <= in15Min && resDateTime >= now) return "reserved";
    return null;
}

export async function recordNoShow(
    reservationId: string, reservations: Reservation[], customers: Customer[],
    tenantId: string, updateReservation: (id: string, data: Partial<Reservation> & Record<string, unknown>) => Promise<void>
) {
    await updateReservation(reservationId, { status: "no_show", noShowAt: Date.now() } as Partial<Reservation> & { noShowAt: number });
    const res = reservations.find((r: Reservation) => r.id === reservationId);

    await NexusEventBus.emitDurable('reservation.no_show', {
        v: 1,
        tenantId,
        reservationId,
        customerId: res?.customerId,
    });

    if (!res?.customerId) return;
    const crmRecord = customers.find((c: Customer) => c.id === res.customerId);
    if (!crmRecord) return;
    const currentNoShows = (crmRecord as JsonObject)["noShows"] as number ?? 0;
    await Nexus.adapter.update(`tenants/${tenantId}/ops_relations/${crmRecord.id}`, { noShows: currentNoShows + 1, updatedAt: new Date().toISOString() });
}

export async function cancelReservationById(
    id: string,
    tenantId: string,
    updateReservation: (id: string, data: Partial<Reservation> & Record<string, unknown>) => Promise<void>
): Promise<void> {
    try {
        await updateReservation(id, { status: "cancelled", cancelledAt: new Date().toISOString() } as Partial<Reservation> & { cancelledAt: string });
        
        await NexusEventBus.emitDurable('reservation.cancelled', {
            v: 1,
            tenantId,
            reservationId: id,
            reason: 'Annulation client',
        });

        toast.success("Réservation annulée");
    } catch { toast.error("Erreur lors de l'annulation"); }
}

export async function syncFloorPlan(reservations: Reservation[], tenantId: string) {
    const now = Date.now();
    const in15Min = now + 15 * 60 * 1000;
    const ts = new Date().toISOString();
    const updates: Array<Promise<void>> = [];
    for (const res of reservations) {
        if (!res.tableId || res.status === "cancelled" || res.status === "no_show") continue;
        const resTime = new Date(`${res.date}T${res.time || "12:00"}`).getTime();
        const path = `tenants/${tenantId}/ops_tables/${res.tableId}`;
        if (isNaN(resTime)) continue;

        if (res.status === "seated") {
            updates.push(Nexus.adapter.update(path, { isOccupied: true, activeReservationId: res.id, status: "occupied", updatedAt: ts }));
        } else if (resTime >= now && resTime <= in15Min) {
            updates.push(Nexus.adapter.update(path, { status: "reserved", activeReservationId: res.id, updatedAt: ts }));
        }
    }
    await Promise.allSettled(updates);
}
