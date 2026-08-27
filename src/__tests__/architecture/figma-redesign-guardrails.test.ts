import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

describe('V3-GUARD-01: Figma Redesign & UI Invariants (4 Garde-fous)', () => {
  const root = resolve(process.cwd());

  it('Garde-fou 1: prevents raw float multiplier arithmetic in presentation TSX components', () => {
    // POS and Cart components must use SovereignMath / formatCurrency, not raw * 0.20 or * 1.20
    const cartPath = join(root, 'src/modules/ops/service/pos/components/Cart.tsx');
    if (existsSync(cartPath)) {
      const content = readFileSync(cartPath, 'utf-8');
      expect(content).not.toMatch(/price\s*\*\s*0\.\d+/);
      expect(content).not.toMatch(/total\s*\*\s*1\.\d+/);
    }
  });

  it('Garde-fou 2: ensures security modals (PinModal, VoidModal, SosCaisseModal) are preserved in POS', () => {
    const posPagePath = join(root, 'src/app/(client)/(ops)/pos/page.tsx');
    expect(existsSync(posPagePath)).toBe(true);

    const posContent = readFileSync(posPagePath, 'utf-8');
    expect(posContent).toContain('PaymentDialog');
    expect(posContent).toContain('PinModal');
    expect(posContent).toContain('VoidModal');
    expect(posContent).toContain('SosCaisseModal');
  });

  it('Garde-fou 3: verifies that CashCounterModal enforces microunits and does not have inert handlers', () => {
    const cashModalPath = join(root, 'src/modules/ops/service/pos/components/CashCounterModal.tsx');
    expect(existsSync(cashModalPath)).toBe(true);

    const content = readFileSync(cashModalPath, 'utf-8');
    expect(content).toContain('onValidate');
    expect(content).toContain('DENOMINATIONS');
    expect(content).toContain('50_000_000');
    expect(content).not.toContain('onValidate={() => {}}');
  });

  it('Garde-fou 4: verifies globals.css semantic tokens and radius variables are defined', () => {
    const globalsCssPath = join(root, 'src/app/globals.css');
    expect(existsSync(globalsCssPath)).toBe(true);

    const css = readFileSync(globalsCssPath, 'utf-8');
    expect(css).toContain('--color-action-primary');
    expect(css).toContain('--color-surface-card');
    expect(css).toContain('--color-status-success');
    expect(css).toContain('--font-serif');
  });

  it('Garde-fou 5 (INV-25): toute police de marque a un repli effectivement chargé dans layout.tsx', () => {
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf-8');
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf-8');
    for (const m of css.matchAll(/--font-(\w+):\s*var\(--font-\1,\s*'([^']+)'/g)) {
      expect(layout, `police ${m[2]} référencée en repli mais jamais chargée`).toContain(m[2].split(' ')[0]);
    }
  });
});
