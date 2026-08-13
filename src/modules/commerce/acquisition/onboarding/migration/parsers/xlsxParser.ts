import type { ParsedRow, ImportWarning } from '../types';

type ExcelJSModule = typeof import('exceljs');

let _exceljs: ExcelJSModule | null = null;

async function loadExcelJS(): Promise<ExcelJSModule> {
  if (_exceljs) return _exceljs;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _exceljs = await (async () => require('exceljs'))() as unknown as ExcelJSModule;
    return _exceljs;
  } catch {
    throw new Error('Module exceljs non installé — exécuter : npm install exceljs');
  }
}

export async function xlsxToRows(file: File): Promise<{ headers: string[]; rows: ParsedRow[]; warnings: ImportWarning[] }> {
  const warnings: ImportWarning[] = [];
  let ExcelJS: ExcelJSModule;

  try {
    ExcelJS = await loadExcelJS();
  } catch (e) {
    return {
      headers: [],
      rows: [],
      warnings: [{ row: 0, field: '', message: (e as Error).message, severity: 'error' }],
    };
  }

  const buf = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buf);

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return { headers: [], rows: [], warnings: [{ row: 0, field: '', message: 'Feuille Excel vide', severity: 'error' }] };
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    headers[colNum - 1] = String(cell.value ?? '').trim();
  });

  const rows: ParsedRow[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const excelRow = sheet.getRow(i);
    const cells: string[] = [];
    excelRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cells[colNum - 1] = String(cell.value ?? '').replace(/ /g, ' ').trim();
    });
    if (cells.every(c => (c ?? '') === '')) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ''; });
    rows.push(row);
  }

  return { headers, rows, warnings };
}
