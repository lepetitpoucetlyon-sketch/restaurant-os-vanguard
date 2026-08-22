#!/usr/bin/env node
/**
 * install-hooks.mjs — s'exécute AUTOMATIQUEMENT via `npm install` (script "prepare").
 * Câble les hooks git de vérité sans aucune étape manuelle. Ne casse JAMAIS l'install.
 */
import { execSync } from 'node:child_process';
import { chmodSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

try {
  if (!existsSync('.git')) process.exit(0);          // pas un repo git (ex: installé en dépendance)
  if (!existsSync('.githooks')) { console.warn('ℹ️  .githooks absent — hooks non câblés.'); process.exit(0); }

  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  for (const f of readdirSync('.githooks')) {
    try { chmodSync(join('.githooks', f), 0o755); } catch { /* Windows: noop */ }
  }
  console.log('🔗 Hooks de vérité câblés (core.hooksPath=.githooks). Lois : AGENTS.md.');
} catch (e) {
  console.warn('ℹ️  install-hooks: câblage ignoré (' + (e && e.message ? e.message : e) + ')');
}
process.exit(0);
