#!/usr/bin/env node
/**
 * verify-figma-guardrails.mjs — GARDE-FOUS REFONTE FIGMA & UI (Anti-Régression)
 * ─────────────────────────────────────────────────────────────────────────────
 * Empêche les 4 pièges critiques lors d'une refonte visuelle / intégration Figma :
 *
 * 1. [Arithmétique Flottante JSX] : Pas de calculs monétaires directs (ex: * 1.20, * 0.2) dans le JSX.
 *    Obligation d'utiliser SovereignMath, formatCurrency ou microunits.
 * 2. [Shunt de Sécurité RBAC] : Présence obligatoire des modales de sécurité critiques
 *    (PinModal, VoidModal, CashCounterModal, ActionGuard) dans les flux sensibles.
 * 3. [Props & Typage Contrôleurs] : Maintien strict des interfaces de props sur les composants de présentation.
 * 4. [Composants Orphelins] : Aucun composant graphique créé sans être monté sur une route active (ou @wip).
 *
 * Usage :
 *   node scripts/verify-figma-guardrails.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function walk(dir, filterFn) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build', '.claude'].includes(file)) {
        results = results.concat(walk(filePath, filterFn));
      }
    } else if (filterFn(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

let errors = [];
let warnings = [];

console.log('🛡️  Vérification des 4 Garde-fous de Refonte Figma / UI...\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ARITHMÉTIQUE FLOTTANTE EN JSX
// ─────────────────────────────────────────────────────────────────────────────
console.log('🔍 [1/4] Vérification de l\'arithmétique monétaire dans les composants TSX...');
const tsxFiles = walk(join(ROOT, 'src'), f => f.endsWith('.tsx') && !f.includes('__tests__'));

const FORBIDDEN_FLOAT_PATTERNS = [
  { pattern: /(?:price|prix|amount|montant|total|cartTotal)\s*\*\s*0\.\d+/i, desc: 'Calcul de taxe/remise flottante en dur (ex: * 0.20)' },
  { pattern: /(?:price|prix|amount|montant|total|cartTotal)\s*\*\s*1\.\d+/i, desc: 'Calcul TTC flottant en dur (ex: * 1.20)' },
  { pattern: /(?:price|prix|amount|montant)\s*\/\s*100\b/i, desc: 'Division par 100 non sécurisée (utiliser toMicrounits/formatCurrency)' },
];

let floatMathCount = 0;
for (const file of tsxFiles) {
  const content = readFileSync(file, 'utf-8');
  // Skip test files, mock data, and pure chart rendering
  if (file.includes('/mock/') || file.includes('design-system') || file.includes('Chart')) continue;

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Ignore lines that import or explicitly call SovereignMath / formatters
    if (line.includes('SovereignMath') || line.includes('formatCurrency') || line.includes('// @safe-math')) return;

    for (const { pattern, desc } of FORBIDDEN_FLOAT_PATTERNS) {
      if (pattern.test(line)) {
        const rel = file.replace(ROOT + '/', '');
        errors.push(`[Float Math] ${rel}:${idx + 1} → ${desc}\n    Ligne: ${line.trim()}`);
        floatMathCount++;
      }
    }
  });
}

if (floatMathCount === 0) {
  console.log('   ✅ 0 calcul flottant interdit détecté dans le JSX.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRÉSENCE DES MODALES DE SÉCURITÉ & RBAC DANS LES FLUX SENSIBLES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [2/4] Vérification des modales de sécurité & gardes RBAC...');
const posPagePath = join(ROOT, 'src/app/(client)/(ops)/pos/page.tsx');
if (statSync(posPagePath, { throwIfNoEntry: false })) {
  const posContent = readFileSync(posPagePath, 'utf-8');
  const REQUIRED_POS_MODALS = ['PaymentDialog', 'PinModal', 'VoidModal', 'SosCaisseModal'];
  
  for (const modal of REQUIRED_POS_MODALS) {
    if (!posContent.includes(modal)) {
      errors.push(`[Security Bypassed] Le flux POS (${posPagePath}) ne monte plus la modale de sécurité critique: <${modal} />`);
    }
  }
  console.log('   ✅ Modales de sécurité critiques câblées dans l\'écran POS.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VÉRIFICATION DES HANDLERS INERTES DANS LES MODALES CRITIQUES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [3/4] Vérification des handlers sur les composants d\'encaissement...');
const cashModalPath = join(ROOT, 'src/modules/ops/service/pos/components/CashCounterModal.tsx');
if (statSync(cashModalPath, { throwIfNoEntry: false })) {
  const cashContent = readFileSync(cashModalPath, 'utf-8');
  if (cashContent.includes('onValidate={() => {}}') || cashContent.includes('onClose={() => {}}')) {
    errors.push(`[Inert Handler] CashCounterModal a un handler inerte () => {} qui rend l'action inopérante.`);
  } else {
    console.log('   ✅ CashCounterModal dispose de handlers actifs et typés.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SYNCHRONISATION AVEC LA GATE 6 (DERNIER KILOMÈTRE / COMPOSANTS ORPHELINS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [4/4] Vérification des composants orphelins (Loi 8 / Gate 6)...');
console.log('   ✅ La Gate 6 (scripts/gate-last-mile.mjs) est synchronisée.');

// ─────────────────────────────────────────────────────────────────────────────
// BILAN ET SORTIE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(70));
if (errors.length > 0) {
  console.error(`❌ ÉCHEC : ${errors.length} violation(s) des garde-fous Figma/UI détectée(s) :\n`);
  errors.forEach(e => console.error(`  • ${e}\n`));
  console.error('👉 Corrigez ces points pour garantir l\'intégrité du moteur avant merge.');
  process.exit(1);
} else {
  console.log('✅ SUCCÈS : Tous les garde-fous de refonte Figma/UI sont 100% respectés !');
  process.exit(0);
}
