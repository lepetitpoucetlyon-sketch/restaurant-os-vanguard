/**
 * 🏛️ Script: Audit Telemetry - Grade X+++
 * Vérifie que les fichiers critiques appellent NexusTelemetryService.
 */
import fs from 'fs';
import path from 'path';

const CRITICAL_PATTERNS = [
  'src/domain/finance/',
  'src/domain/procurement/',
  'src/domain/billing/',
  'src/infrastructure/banking/',
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDirectory(fullPath, fileList);
        } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('types.ts')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

let silentCount = 0;
let silentFiles: string[] = [];

for (const pattern of CRITICAL_PATTERNS) {
    const files = scanDirectory(pattern);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('NexusTelemetryService')) {
            silentCount++;
            silentFiles.push(file);
        }
    }
}

if (silentCount > 0) {
    console.error(`🚨 FATAL: ${silentCount} critical services are missing telemetry (AuditPulse).`);
    silentFiles.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
} else {
    console.log(`✅ SUCCESS: Telemetry coverage is 100% on critical patterns.`);
    process.exit(0);
}
