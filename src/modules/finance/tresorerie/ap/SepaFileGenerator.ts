interface SepaPayment {
    endToEndId: string;
    creditorName: string;
    creditorIban: string;
    creditorBic?: string;
    amountEurCents: number;
    remittanceInfo: string;
}

interface SepaBatch {
    initiatorName: string;
    initiatorIban: string;
    initiatorBic: string;
    requestedExecutionDate: string;
    payments: SepaPayment[];
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const SepaFileGenerator = {
    generatePain001(batch: SepaBatch): string {
        const msgId = `MSG-${Date.now()}`;
        const creDtTm = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
        const nbOfTxs = batch.payments.length;
        const ctrlSum = (batch.payments.reduce((s, p) => s + p.amountEurCents, 0) / 100).toFixed(2);

        const pmtInfId = `PMT-${Date.now()}`;

        const txBlocks = batch.payments.map(p => {
            const amt = (p.amountEurCents / 100).toFixed(2);
            return `        <CdtTrfTxInf>
          <PmtId>
            <EndToEndId>${escapeXml(p.endToEndId)}</EndToEndId>
          </PmtId>
          <Amt>
            <InstdAmt Ccy="EUR">${amt}</InstdAmt>
          </Amt>
          ${p.creditorBic ? `<CdtrAgt><FinInstnId><BIC>${escapeXml(p.creditorBic)}</BIC></FinInstnId></CdtrAgt>` : ''}
          <Cdtr>
            <Nm>${escapeXml(p.creditorName)}</Nm>
          </Cdtr>
          <CdtrAcct>
            <Id><IBAN>${escapeXml(p.creditorIban)}</IBAN></Id>
          </CdtrAcct>
          <RmtInf>
            <Ustrd>${escapeXml(p.remittanceInfo)}</Ustrd>
          </RmtInf>
        </CdtTrfTxInf>`;
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${escapeXml(msgId)}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(batch.initiatorName)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(pmtInfId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <ReqdExctnDt>${escapeXml(batch.requestedExecutionDate)}</ReqdExctnDt>
      <Dbtr>
        <Nm>${escapeXml(batch.initiatorName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id><IBAN>${escapeXml(batch.initiatorIban)}</IBAN></Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId><BIC>${escapeXml(batch.initiatorBic)}</BIC></FinInstnId>
      </DbtrAgt>
${txBlocks}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
    },
};
