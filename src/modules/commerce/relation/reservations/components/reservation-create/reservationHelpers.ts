import type { Table } from "@/domain/schemas/ops";

export const TERRACE_ZONE_IDS = ["zone-terrasse", "TERRACE", "terrace"];

export function filterAvailableTables(tables: Table[], terraceClosed: boolean, minCovers = 0): Table[] {
    return tables.filter((t) => {
        const isAvailable = t.status === "free" || t.status === "available";
        if (!isAvailable || (t.seats ?? 0) < minCovers) return false;
        if (terraceClosed && TERRACE_ZONE_IDS.some((z) => t.zoneId?.toLowerCase().includes(z.toLowerCase()))) return false;
        return true;
    });
}
