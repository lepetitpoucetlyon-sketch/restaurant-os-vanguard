/**
 * @deprecated ⚠️ Utiliser FECGenerator depuis '@/modules/finance/comptabilite/fec'
 */
import { FECGenerator } from "../../fec/FECGenerator";
import type { JournalEntry } from "@/shared/nexus/contracts";

export class FECExporter {
    static exportToFEC(entries: JournalEntry[]): string {
        return entries.map(e => e.pieceNumber).join("\n");
    }

    static async downloadFEC(entries: JournalEntry[], fileName?: string): Promise<void> {
        await FECGenerator.generateAndDownload(entries);
    }
}
