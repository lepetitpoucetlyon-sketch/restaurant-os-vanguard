import fs from 'fs';
import path from 'path';

/**
 * 🎨 MARQUE BLANCHE MIGRATION ENGINE
 * Remplace les classes Tailwind statiques par leurs équivalents sémantiques.
 * 
 * Usage: npx tsx scripts/migrate-semantic-tokens.ts [--dry-run]
 */

const SRC_PATH = path.join(process.cwd(), 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', '.git'];

// Fichiers à ne PAS modifier (tokens source, they define the colors)
const EXCLUDE_FILES = [
  'colors.ts', 'brand.ts', 'semantic.ts', 'uxProfile.ts',
  'globals.css', 'tailwind.config',
];

// ─── MAPPING : Tailwind Statique → Token Sémantique ───────────────────────
const COLOR_MAP: Record<string, string> = {
  // ── Backgrounds ──
  'bg-slate-950': 'bg-surface-bg',
  'bg-slate-900': 'bg-surface-bg',
  'bg-gray-950': 'bg-surface-bg',
  'bg-gray-900': 'bg-surface-bg',
  'bg-zinc-950': 'bg-surface-bg',
  'bg-zinc-900': 'bg-surface-bg',
  'bg-neutral-950': 'bg-surface-bg',
  'bg-neutral-900': 'bg-surface-bg',

  'bg-slate-800': 'bg-surface-card',
  'bg-gray-800': 'bg-surface-card',
  'bg-zinc-800': 'bg-surface-card',
  'bg-neutral-800': 'bg-surface-card',

  'bg-slate-700': 'bg-surface-elevated',
  'bg-gray-700': 'bg-surface-elevated',
  'bg-zinc-700': 'bg-surface-elevated',
  'bg-neutral-700': 'bg-surface-elevated',

  // ── Primary Actions ──
  'bg-amber-500': 'bg-action-primary',
  'bg-amber-600': 'bg-action-primary',
  'bg-amber-400': 'bg-action-primary',
  'bg-yellow-500': 'bg-action-primary',
  'bg-yellow-600': 'bg-action-primary',

  // ── Hover States ──
  'hover:bg-amber-600': 'hover:bg-action-primary-hover',
  'hover:bg-amber-500': 'hover:bg-action-primary-hover',
  'hover:bg-amber-400': 'hover:bg-action-primary-hover',

  // ── Status Colors ──
  'bg-emerald-500': 'bg-status-success',
  'bg-green-500': 'bg-status-success',
  'bg-emerald-600': 'bg-status-success',
  'bg-green-600': 'bg-status-success',

  'bg-red-500': 'bg-status-danger',
  'bg-red-600': 'bg-status-danger',
  'bg-rose-500': 'bg-status-danger',

  'bg-blue-500': 'bg-status-info',
  'bg-blue-600': 'bg-status-info',
  'bg-sky-500': 'bg-status-info',
  'bg-indigo-500': 'bg-status-info',

  // ── Text Colors ──
  'text-white': 'text-text-primary',
  'text-slate-100': 'text-text-primary',
  'text-gray-100': 'text-text-primary',

  'text-slate-300': 'text-text-secondary',
  'text-gray-300': 'text-text-secondary',
  'text-zinc-300': 'text-text-secondary',
  'text-neutral-300': 'text-text-secondary',
  'text-slate-400': 'text-text-secondary',
  'text-gray-400': 'text-text-secondary',
  'text-zinc-400': 'text-text-secondary',
  'text-neutral-400': 'text-text-secondary',

  'text-slate-500': 'text-text-muted',
  'text-gray-500': 'text-text-muted',
  'text-zinc-500': 'text-text-muted',
  'text-neutral-500': 'text-text-muted',

  'text-amber-500': 'text-action-primary',
  'text-amber-400': 'text-action-primary',
  'text-yellow-500': 'text-action-primary',

  'text-emerald-500': 'text-status-success',
  'text-green-500': 'text-status-success',
  'text-emerald-400': 'text-status-success',

  'text-red-500': 'text-status-danger',
  'text-red-400': 'text-status-danger',
  'text-rose-500': 'text-status-danger',

  // ── Borders ──
  'border-slate-700': 'border-border-default',
  'border-gray-700': 'border-border-default',
  'border-zinc-700': 'border-border-default',
  'border-neutral-700': 'border-border-default',
  'border-slate-800': 'border-border-default',
  'border-gray-800': 'border-border-default',

  'border-slate-600': 'border-border-subtle',
  'border-gray-600': 'border-border-subtle',

  'border-amber-500': 'border-action-primary',
  'border-amber-600': 'border-action-primary',

  // ── Ring / Focus ──
  'ring-amber-500': 'ring-action-primary',
  'ring-amber-400': 'ring-action-primary',
  'focus:ring-amber-500': 'focus:ring-action-primary',

  // ── Gradients ──
  'from-slate-900': 'from-surface-bg',
  'to-slate-900': 'to-surface-bg',
  'from-slate-800': 'from-surface-card',
  'to-slate-800': 'to-surface-card',
};

interface MigrationResult {
  file: string;
  replacements: number;
  details: string[];
}

const results: MigrationResult[] = [];
let totalReplacements = 0;

function processFile(filePath: string) {
  const relative = path.relative(process.cwd(), filePath);
  const basename = path.basename(filePath);

  if (EXCLUDE_FILES.some(ex => basename.includes(ex))) return;
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let fileReplacements = 0;
  const details: string[] = [];

  for (const [staticClass, semanticClass] of Object.entries(COLOR_MAP)) {
    // Match as whole word in className strings (avoid partial replacements)
    const regex = new RegExp(`\\b${staticClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, semanticClass);
      fileReplacements += matches.length;
      details.push(`  ${staticClass} → ${semanticClass} (${matches.length}x)`);
    }
  }

  if (fileReplacements > 0) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    results.push({ file: relative, replacements: fileReplacements, details });
    totalReplacements += fileReplacements;
  }
}

function walkDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        walkDirectory(fullPath);
      }
    } else {
      processFile(fullPath);
    }
  }
}

console.log(`🎨 Marque Blanche Migration Engine ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
console.log(`📂 Scanning: ${SRC_PATH}\n`);

walkDirectory(SRC_PATH);

// Report
console.log(`\n${'═'.repeat(60)}`);
console.log(`📊 MIGRATION REPORT`);
console.log(`${'═'.repeat(60)}`);
console.log(`📁 Files modified: ${results.length}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);
console.log(`${'─'.repeat(60)}`);

for (const r of results) {
  console.log(`\n📄 ${r.file} (${r.replacements} replacements)`);
  r.details.forEach(d => console.log(d));
}

if (DRY_RUN) {
  console.log(`\n⚠️  DRY RUN — No files were modified. Run without --dry-run to apply.`);
} else {
  console.log(`\n✅ Migration complete. ${totalReplacements} static classes replaced with semantic tokens.`);
}
