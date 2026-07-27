import type { ParsedRow, ImportWarning } from '../types';

interface XLSXModule {
  read: (data: ArrayBuffer, opts: { type: string }) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: (sheet: unknown, opts?: { header?: number; defval?: string }) => unknown[];
  };
}

let _xlsx: XLSXModule | null = null;

async function loadXLSX(): Promise<XLSXModule> {
  if (_xlsx) return _xlsx;
  try {
    // Requires: npm install xlsx
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _xlsx = await (async () => require('xlsx'))() as unknown as XLSXModule;
    return _xlsx;
  } catch {
    throw new Error('Module xlsx non installé — exécuter : npm install xlsx');
  }
}

export async function xlsxToRows(file: File): Promise<{ headers: string[]; rows: ParsedRow[]; warnings: ImportWarning[] }> {
  const warnings: ImportWarning[] = [];
  let xlsx: XLSXModule;

  try {
    xlsx = await loadXLSX();
  } catch (e) {
    return {
      headers: [],
      rows: [],
      warnings: [{ row: 0, field: '', message: (e as Error).message, severity: 'error' }],
    };
  }

  const buf = await file.arrayBuffer();
  const workbook = xlsx.read(buf, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

  if (!raw || raw.length < 2) {
    return { headers: [], rows: [], warnings: [{ row: 0, field: '', message: 'Feuille Excel vide', severity: 'error' }] };
  }

  const headers = (raw[0] as string[]).map(h => String(h ?? '').trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const cells = raw[i] as string[];
    if (cells.every(c => String(c ?? '').trim() === '')) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = String(cells[idx] ?? '').replace(/ /g, ' ').trim(); });
    rows.push(row);
  }

  return { headers, rows, warnings };
}
