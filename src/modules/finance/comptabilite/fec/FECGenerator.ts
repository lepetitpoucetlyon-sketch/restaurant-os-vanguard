import { JournalEntry } from "@/shared/nexus/contracts/finance.types";
import { FECMapper } from "./FECMapper";
import type { FECExportResult, FECLine } from "./types";
import { CryptoService } from "@/lib/CryptoService";
import { NexusTelemetryService } from "@/lib/NexusTelemetryService";

/**
 * 🏛️ FECGenerator - Grade X+++
 * Génération et scellage cryptographique NF525 des exports comptables DGFiP (Art. L.47 A-I).
 */
export class FECGenerator {
    /**
     * Génère un fichier FEC complet et le scelle
     */
    static async generate(entries: JournalEntry[], siren: string = "000000000", yearMonth: string = new Date().toISOString().slice(0, 7).replace("-", "")): Promise<FECExportResult> {
        const validatedEntries = entries.filter(e => !e.status || e.status === "validated");
        
        let previousHash = "";
        const fecLines: FECLine[] = [];

        validatedEntries.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA === dateB) return a.pieceNumber.localeCompare(b.pieceNumber);
            return dateA - dateB;
        });

        for (const entry of validatedEntries) {
            for (const line of entry.lines) {
                const partialFecLine = FECMapper.mapLine(entry, line);
                const lineDataString = Object.values(partialFecLine).join("|");
                const currentHash = await CryptoService.generateHash(lineDataString, previousHash);
                
                const completeFecLine: FECLine = {
                    ...partialFecLine,
                    EcritureHash: currentHash
                };
                
                fecLines.push(completeFecLine);
                previousHash = currentHash;
            }
        }

        const headers = [
            "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib",
            "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
            "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise", "EcritureHash"
        ];

        const rows = fecLines.map(line => headers.map(h => line[h as keyof FECLine] ?? "").join("|"));
        const content = [headers.join("|"), ...rows].join("\r\n") + "\r\n";
        const filename = `FEC_${siren}_${yearMonth}.txt`;

        const result = {
            content,
            filename,
            lineCount: fecLines.length,
            finalHash: previousHash
        };
        NexusTelemetryService.emitAuditPulse("FINANCE", "FEC_GENERATION_SUCCESS", { siren, yearMonth, lineCount: fecLines.length });
        return result;
    }

    /**
     * Déclenche le téléchargement du fichier FEC dans le navigateur
     */
    static downloadFEC(result: FECExportResult): void {
        if (typeof window === "undefined") return;
        const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", result.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Helper combiné : génère et télécharge le FEC directement
     */
    static async generateAndDownload(entries: JournalEntry[], siren?: string, yearMonth?: string): Promise<FECExportResult> {
        const result = await this.generate(entries, siren, yearMonth);
        this.downloadFEC(result);
        return result;
    }
}
