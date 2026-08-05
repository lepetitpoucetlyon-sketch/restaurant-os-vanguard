import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

type JournalEntry = {
  id: string;
  type: string;
  description: string;
  amountInMicrounits: number;
  timestamp: string;
  tvaRates?: Record<string, number>;
};

function formatFECDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function microunitsToEuros(mu: number): string {
  return (mu / 1_000_000).toFixed(2).replace('.', ',');
}

function buildFECLines(entries: JournalEntry[], _month: string): string {
  const header = [
    'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
    'CompteNum', 'CompteLib', 'PieceRef', 'PieceDate',
    'EcritureLib', 'Debit', 'Credit',
  ].join('\t');

  const lines = entries.map((e, i) => {
    const isRefund = e.type === 'EXTOURNE';
    const amount = Math.abs(e.amountInMicrounits);
    const euros = microunitsToEuros(amount);
    const date = formatFECDate(e.timestamp);
    const debit = isRefund ? '0,00' : euros;
    const credit = isRefund ? euros : '0,00';
    const compteNum = isRefund ? '709000' : '707000';
    const compteLib = isRefund ? 'Remises accordées' : 'Ventes de marchandises';

    return [
      'VTE', 'Ventes', String(i + 1).padStart(8, '0'), date,
      compteNum, compteLib, e.id, date,
      (e.description ?? e.type).slice(0, 50), debit, credit,
    ].join('\t');
  });

  return [header, ...lines].join('\n');
}

export function registerMonthlyFECExportHandler() {
  return NexusEventBus.on(
    'finance.month_closed',
    async (payload) => {
      const { tenantId, month } = payload;

      logger.info(`[FECExport] Génération export FEC pour ${month}...`);

      const [year, mo] = month.split('-');
      const startDate = `${year}-${mo}-01T00:00:00.000Z`;
      const lastDay = new Date(Number(year), Number(mo), 0).getDate();
      const endDate = `${year}-${mo}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

      const entries = await Nexus.adapter.query(
        `tenants/${tenantId}/journalEntries`,
        { where: [
          { field: 'timestamp', operator: '>=', value: startDate },
          { field: 'timestamp', operator: '<=', value: endDate },
        ]}
      ) as JournalEntry[];

      if (entries.length === 0) {
        logger.warn(`[FECExport] Aucune écriture pour ${month} — export vide.`);
      }

      const fecContent = buildFECLines(entries, month);
      const storageKey = `${tenantId}/fec/${month}.txt`;

      await Nexus.adapter.set(`tenants/${tenantId}/fecExports/${month}`, {
        month,
        generatedAt: new Date().toISOString(),
        entriesCount: entries.length,
        storageKey,
        content: fecContent,
      });

      logger.info(`[FECExport] FEC généré : ${entries.length} écritures pour ${month}`);

      empireAudit.log({
        module: 'accounting',
        action: 'FEC_EXPORT_GENERATED',
        details: { month, entriesCount: entries.length, storageKey },
        severity: 'low',
        timestamp: new Date(),
      });

      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: `fec-notif-${month}`,
        type: 'info',
        title: 'Export FEC disponible',
        message: `L'export comptable FEC pour ${month} est prêt (${entries.length} écriture(s)).`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'monthly-fec-export-handler', priority: 'BACKGROUND' }
  );
}
