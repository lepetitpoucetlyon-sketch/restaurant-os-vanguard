/**
 * 🏛️ INVARIANTS ARCHITECTURAUX & ZERO-CLAIM POLICY
 *
 * Ce fichier de tests verrouille les invariants système majeurs du projet.
 * Toute régression structurelle ou affirmation documentaire fausse fera échouer cette suite.
 *
 * Invariants couverts :
 * - INV-1 : Agnosticisme LLM (aucun SDK direct dans src/)
 * - INV-2 : Agnosticisme DB (Firestore confiné à la couche adapters)
 * - INV-3 : Ratchet de couplage Auth (maximum 17 fichiers couplés Firebase Auth)
 * - INV-8 : Conformité Documentation ↔ Structure réelle (8 piliers, 17 ADRs, 12 variantes)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PLATFORM_VARIANTS } from '@/modules/system/domain/schemas/tenant';

const ROOT = path.resolve(__dirname, '../../..');

function walk(dir: string, filter: (filePath: string) => boolean): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walk(filePath, filter));
      }
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

function getSrcFiles(exts = ['.ts', '.tsx']): string[] {
  return walk(path.join(ROOT, 'src'), (fp) => exts.some(e => fp.endsWith(e)));
}

describe('🏛️ Invariants Architecturaux (Zero-Claim Policy)', () => {

  describe('INV-1 — Agnosticisme LLM', () => {
    it('aucun SDK LLM tiers n’est importé directement dans src/ (tout passe par AIProviderRouter)', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const bannedSdkRegex = /from\s+['"](@anthropic-ai\/sdk|openai|@google\/generative-ai|mistralai)['"]|import\s+['"](@anthropic-ai\/sdk|openai|@google\/generative-ai|mistralai)['"]/;

      const violations: string[] = [];
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (bannedSdkRegex.test(content)) {
          violations.push(path.relative(ROOT, file));
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('INV-2 — Agnosticisme Base de Données', () => {
    it('Firestore reste confiné strictement aux fichiers d’adapters et d’initialisation', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const allowedFiles = [
        'src/lib/firebase.ts',
        'src/lib/adapters/FirestoreAdapter.ts',
        'src/lib/adapters/FirestoreBatch.ts',
        'src/lib/adapters/FirestoreDocumentStore.ts',
        'src/e2e/vanguard/mocks.ts',
      ];

      const violations: string[] = [];
      for (const file of srcFiles) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        if (allowedFiles.includes(rel)) continue;
        const content = fs.readFileSync(file, 'utf-8');
        if (/from\s+['"]firebase\/firestore['"]/.test(content)) {
          violations.push(rel);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('INV-3 — Ratchet de Couplage Auth', () => {
    it('le nombre de fichiers sources couplés à Firebase Auth ne dépasse pas le seuil de 17', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const authFiles: string[] = [];

      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (/from\s+['"]firebase(-admin)?\/(auth|app)['"]|getAuth|initFirebaseAdmin/.test(content)) {
          authFiles.push(path.relative(ROOT, file).replace(/\\/g, '/'));
        }
      }

      // Ratchet bloquant : max 17 fichiers
      expect(authFiles.length).toBeLessThanOrEqual(17);
    });
  });

  describe('INV-8 — Synchronisation Structure ↔ Documentation', () => {
    it('les 8 piliers métier existent sous src/modules/', () => {
      const EXPECTED_PILLARS = [
        'commerce',
        'compliance',
        'facility',
        'finance',
        'human',
        'intelligence',
        'logistics',
        'ops',
      ];

      const modulesDir = path.join(ROOT, 'src/modules');
      const existingDirs = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory());

      for (const pillar of EXPECTED_PILLARS) {
        expect(existingDirs).toContain(pillar);
      }
    });

    it('les 17 ADRs documentés existent sous docs/adrs/', () => {
      const adrsDir = path.join(ROOT, 'docs/adrs');
      const existingAdrs = fs.readdirSync(adrsDir).filter(f => f.startsWith('ADR-') && f.endsWith('.md'));

      expect(existingAdrs.length).toBe(17);
      for (let i = 1; i <= 17; i++) {
        const prefix = `ADR-${String(i).padStart(3, '0')}`;
        const match = existingAdrs.find(a => a.startsWith(prefix));
        expect(match, `ADR ${prefix} manquant`).toBeDefined();
      }
    });

    it('les 12 variantes du schéma PLATFORM_VARIANTS correspondent exactement aux dossiers dans src/verticals/', () => {
      const verticalsDir = path.join(ROOT, 'src/verticals');
      const existingVerticals = fs.readdirSync(verticalsDir)
        .filter(f => f !== '_shared' && fs.statSync(path.join(verticalsDir, f)).isDirectory());

      expect(existingVerticals.sort()).toEqual([...PLATFORM_VARIANTS].sort());
      expect(PLATFORM_VARIANTS.length).toBe(12);
    });

    it('les fichiers clés documentés dans CLAUDE.md existent sur disque', () => {
      const KEY_FILES = [
        'src/modules/finance/comptabilite/FinancialNexusBridge.ts',
        'src/modules/finance/fiscalite/FiscalAdapter.ts',
        'src/modules/ops/domain/schemas/pos.ts',
        'src/modules/finance/domain/schemas/finance.ts',
        'src/lib/nexus/NexusAdapter.ts',
        'src/modules/finance/providers/NexusFiscalProvider.tsx',
        'src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts',
        'src/modules/intelligence/knowledge/rag/LightRAGClient.ts',
      ];

      for (const file of KEY_FILES) {
        expect(fs.existsSync(path.join(ROOT, file)), `Fichier clé manquant : ${file}`).toBe(true);
      }
    });
  });

});
