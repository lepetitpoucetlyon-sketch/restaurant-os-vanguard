import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const reportPath = path.resolve(process.cwd(), '.antigravity/sentinel-report.json');
    
    if (!fs.existsSync(reportPath)) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = fs.readFileSync(reportPath, 'utf8');
    const report = JSON.parse(reportData);

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read report' }, { status: 500 });
  }
}
