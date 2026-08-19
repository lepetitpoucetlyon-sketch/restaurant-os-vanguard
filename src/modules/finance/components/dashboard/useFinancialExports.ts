import { useCallback, useState } from "react";
import { toast } from "sonner";

interface FinancialExportsState {
  pnlExporting: boolean;
  bilanExporting: boolean;
  payrollExporting: boolean;
  payrollMonth: string;
  setPayrollMonth: (month: string) => void;
  handleExportPnL: () => Promise<void>;
  handleExportBilan: () => Promise<void>;
  handleExportPayroll: () => Promise<void>;
}

/**
 * useFinancialExports — encapsule les 3 handlers d'export P&L / Bilan / Variables de paie.
 * Extrait du god file FinanceDashboard.tsx (dynamic import AccountingReportService
 * n'apparaît plus dans le fan-out du dashboard).
 */
export function useFinancialExports(): FinancialExportsState {
  const [pnlExporting, setPnlExporting] = useState(false);
  const [bilanExporting, setBilanExporting] = useState(false);
  const [payrollExporting, setPayrollExporting] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const handleExportPnL = useCallback(async () => {
    setPnlExporting(true);
    try {
      const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
      const start = new Date(`${payrollMonth}-01T00:00:00Z`).getTime();
      const end = Date.now();
      const data = await AccountingReportService.buildPnL(start, end);
      await AccountingReportService.exportPnLPDF(data);
      toast.success("P&L exporté en PDF.");
    } catch {
      toast.error("Erreur lors de l'export P&L.");
    } finally {
      setPnlExporting(false);
    }
  }, [payrollMonth]);

  const handleExportBilan = useCallback(async () => {
    setBilanExporting(true);
    try {
      const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
      const data = await AccountingReportService.buildBalanceSheet(Date.now());
      await AccountingReportService.exportBalanceSheetPDF(data);
      toast.success("Bilan exporté en PDF.");
    } catch {
      toast.error("Erreur lors de l'export Bilan.");
    } finally {
      setBilanExporting(false);
    }
  }, []);

  const handleExportPayroll = useCallback(async () => {
    setPayrollExporting(true);
    try {
      const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
      await AccountingReportService.exportPayrollCSV(payrollMonth);
      toast.success(`Variables de paie ${payrollMonth} exportées.`);
    } catch {
      toast.error("Erreur lors de l'export variables de paie.");
    } finally {
      setPayrollExporting(false);
    }
  }, [payrollMonth]);

  return {
    pnlExporting,
    bilanExporting,
    payrollExporting,
    payrollMonth,
    setPayrollMonth,
    handleExportPnL,
    handleExportBilan,
    handleExportPayroll,
  };
}
