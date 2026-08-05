import { VatDeclaration } from '../../domain/entities/VatDeclaration';
import { InMemoryLedgerRepository } from '../../infrastructure/repositories/InMemoryLedgerRepository';
import { EdiDgfipAdapter } from '../../infrastructure/adapters/EdiDgfipAdapter';

export class GenerateCA3DeclarationUseCase {
  private ledgerRepository: InMemoryLedgerRepository;

  constructor(ledgerRepository: InMemoryLedgerRepository) {
    this.ledgerRepository = ledgerRepository;
  }

  /**
   * Generates a CA3 VAT declaration for a specific month and returns the EDI string.
   */
  public async execute(tenantId: string, siret: string, month: number, year: number): Promise<{ success: boolean; ediPayload?: string; error?: string }> {
    try {
      if (!siret || siret.length !== 14) {
        return { success: false, error: "Missing or invalid SIRET for this tenant. Cannot generate DGFiP EDI." };
      }

      // 1. Create the base declaration entity
      const declaration = new VatDeclaration(tenantId, month, year);

      // 2. Fetch all collected VAT lines from the ledger (Sales)
      const collectedVatLines = await this.ledgerRepository.getCollectedVat(tenantId, month, year);
      declaration.collectedVat = collectedVatLines;

      // 3. Fetch all deductible VAT from the ledger (Purchases)
      const deductibleVat = await this.ledgerRepository.getDeductibleVat(tenantId, month, year);
      declaration.deductibleVat = deductibleVat;

      // 4. Generate the EDI payload using the Adapter
      const ediPayload = EdiDgfipAdapter.generateEdiFormat(declaration, siret);

      // In a real scenario, we would also save the `declaration` entity to a relational database here for history.

      return { success: true, ediPayload };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[GenerateCA3DeclarationUseCase] Error:', msg);
      return { success: false, error: msg };
    }
  }
}
