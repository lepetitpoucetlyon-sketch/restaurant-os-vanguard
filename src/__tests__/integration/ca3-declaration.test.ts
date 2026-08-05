import { GenerateCA3DeclarationUseCase } from '@/modules/finance/fiscalite/core/application/use-cases/GenerateCA3Declaration';
import { InMemoryLedgerRepository } from '@/modules/finance/fiscalite/core/infrastructure/repositories/InMemoryLedgerRepository';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TVA CA3 (DGFiP) Auto-generation', () => {
  let repository: InMemoryLedgerRepository;
  let useCase: GenerateCA3DeclarationUseCase;

  beforeEach(() => {
    repository = new InMemoryLedgerRepository();
    useCase = new GenerateCA3DeclarationUseCase(repository);
  });

  it('should calculate correct VAT totals and generate valid EDI payload', async () => {
    const tenantId = 'resto-789';
    const siret = '12345678901234';
    const month = 10;
    const year = 2026;
    const date = new Date(year, month - 1, 15); // Oct 15, 2026

    // 1. Arrange: Insert sales (Collected VAT)
    repository.addEntry({ type: 'SALE', date, baseAmount: 100, vatRate: 10, vatAmount: 10 });
    repository.addEntry({ type: 'SALE', date, baseAmount: 50, vatRate: 10, vatAmount: 5 });
    repository.addEntry({ type: 'SALE', date, baseAmount: 200, vatRate: 20, vatAmount: 40 });

    // Total Collected: 15 (at 10%) + 40 (at 20%) = 55

    // 2. Arrange: Insert purchases (Deductible VAT)
    // E.g., buying raw ingredients where VAT is deductible
    repository.addEntry({ type: 'PURCHASE', date, baseAmount: 150, vatRate: 20, vatAmount: 30 });

    // Total Deductible: 30
    // Total To Pay = 55 - 30 = 25

    // 3. Act: Generate CA3
    const result = await useCase.execute(tenantId, siret, month, year);

    // 4. Assert
    expect(result.success).toBe(true);
    expect(result.ediPayload).toBeDefined();

    const edi = result.ediPayload!;
    
    // Check EDI headers
    expect(edi).toContain(`UNB+UNOA:3+12345678901234+DGFIP+`);
    expect(edi).toContain(`UNH+1+TAXCON:D:96A:UN:EDI-TDFC'`);
    
    // Check period (202610)
    expect(edi).toContain(`DTM+324:202610:610'`);

    // Check collected VAT amounts (15 and 40)
    expect(edi).toContain(`MOA+124:15.00'`);
    expect(edi).toContain(`MOA+124:40.00'`);

    // Check deductible VAT amount (30)
    expect(edi).toContain(`TAX+7+VAT+++:::DEDUCTIBLE'`);
    expect(edi).toContain(`MOA+124:30.00'`);

    // Check final to pay amount (25)
    expect(edi).toContain(`MOA+PAYABLE:25.00'`);
  });

  it('should block generation if SIRET is invalid', async () => {
    const result = await useCase.execute('resto-123', 'INVALID', 10, 2026);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing or invalid SIRET');
  });
});
