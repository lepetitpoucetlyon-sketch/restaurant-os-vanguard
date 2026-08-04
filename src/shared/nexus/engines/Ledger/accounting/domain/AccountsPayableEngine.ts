        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { SupplierInvoice } from '@/modules/logistics';
import { logger } from '@/lib/logger';

export interface SEPAConfig {
    companyName: string;
    companyIban: string;
    companyBic: string;
    msgId: string; // Unique message ID
}

export interface SEPATransaction {
    invoiceId: string;
    supplierName: string;
    supplierIban: string;
    supplierBic: string;
    amountInCents: number;
    remittanceInformation: string;
}

/**
 * 🏛️ AccountsPayableEngine - Grade X
 * Gère le cycle AP (Accounts Payable) et la génération SEPA (pain.001.001.03).
 */
export class AccountsPayableEngine {
    
    /**
     * Génère un fichier XML SEPA Credit Transfer (pain.001.001.03) souverain.
     */
    static generateSEPACreditTransfer(
        transactions: SEPATransaction[],
        config: SEPAConfig
    ): string {
        const totalAmount = transactions.reduce((sum, t) => sum + t.amountInCents, 0) / 100;
        const creationDtTm = new Date().toISOString().substring(0, 19);
        const reqdExctnDt = new Date().toISOString().substring(0, 10);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${config.msgId}</MsgId>
      <CreDtTm>${creationDtTm}</CreDtTm>
      <NbOfTxs>${transactions.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(config.companyName)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${config.msgId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${transactions.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${reqdExctnDt}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escapeXml(config.companyName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${config.companyIban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${config.companyBic}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>`;

        for (const tx of transactions) {
            const amount = (tx.amountInCents / 100).toFixed(2);
            
            xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${this.escapeXml(tx.invoiceId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${amount}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${tx.supplierBic}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${this.escapeXml(tx.supplierName)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${tx.supplierIban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${this.escapeXml(tx.remittanceInformation)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
        }

        xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

        logger.info(`[AccountsPayable] Génération fichier SEPA (MsgId: ${config.msgId}, Txs: ${transactions.length})`);
        return xml;
    }

    private static escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    /**
     * Calcule l'aging (ancienneté) d'une facture fournisseur.
     */
    static calculateAgingDays(invoice: SupplierInvoice): number {
        const now = new Date();
        const dueDate = new Date(invoice.dueDate);
        
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        return diffDays > 0 ? diffDays : 0;
    }
}
