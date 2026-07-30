import React from 'react';
import { whiteLabelInstanceConfig } from '@/config/instance';

interface LegalCertificateA4Props {
  instanceName: string;
  instanceId:   string;
  issuedAt:     string;
  tenantName?:          string;
  tenantSiret?:         string;
  tenantCity?:          string;
  tenantAcquisitionDate?: string;
  softwareVersion?:     string;
  publisherName?:       string;
  publisherRepName?:    string;
  publisherAddress?:    string;
  publisherCity?:       string;
  publisherSiret?:      string;
  softwareLaunchDate?:  string;
  licenseNumber?:       string;
}

export function LegalCertificateA4({
  instanceName,
  instanceId,
  issuedAt,
  tenantName          = '______________________________________',
  tenantSiret         = '___________________',
  tenantCity          = '______________________',
  tenantAcquisitionDate,
  softwareVersion     = `${whiteLabelInstanceConfig.appName} v${whiteLabelInstanceConfig.version}`,
  publisherName       = process.env.NEXT_PUBLIC_PUBLISHER_NAME    ?? '',
  publisherRepName    = process.env.NEXT_PUBLIC_PUBLISHER_REP_NAME ?? '',
  publisherAddress    = process.env.NEXT_PUBLIC_PUBLISHER_ADDRESS  ?? '',
  publisherCity       = process.env.NEXT_PUBLIC_PUBLISHER_CITY     ?? '',
  publisherSiret      = process.env.NEXT_PUBLIC_PUBLISHER_SIRET    ?? '',
  softwareLaunchDate  = process.env.NEXT_PUBLIC_SOFTWARE_LAUNCH_DATE ?? '',
  licenseNumber       = instanceId,
}: LegalCertificateA4Props) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const signatureDate    = fmt(issuedAt);
  const acquisitionDate  = tenantAcquisitionDate ? fmt(tenantAcquisitionDate) : '___________________';
  const launchDateFmt    = softwareLaunchDate
    ? new Date(softwareLaunchDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '___________________';

  return (
    <>
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 15mm; }
        body > * { visibility: hidden !important; }
        .print-certificate-container,
        .print-certificate-container * { visibility: visible !important; }
        .print-certificate-container {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
          font-size: 11pt !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `}</style>
    <div className="print-certificate-container bg-white text-black font-serif text-[11pt] leading-relaxed text-justify">
      {/* En-tête */}
      <div className="text-center mb-8 pb-4 border-b-2 border-black">
        <p className="text-[8pt] uppercase tracking-widest mb-1">Direction Générale des Finances Publiques</p>
        <h1 className="text-[16pt] font-bold uppercase tracking-tight mb-1">
          Attestation Individuelle de Conformité
        </h1>
        <p className="text-[9pt] italic">
          En application de l'article 286, I-3° bis du Code Général des Impôts
        </p>
        <p className="text-[8pt] font-bold mt-1">Référence : BOI-LETTRE-000242</p>
      </div>

      {/* ──────────────── VOLET 1 ──────────────── */}
      <section className="border border-gray-700 p-5 mb-6 relative">
        <div className="absolute -top-[11px] left-4 bg-white px-2 text-[8pt] font-bold uppercase tracking-wider">
          📋 VOLET 1 — Partie à remplir par l'éditeur du logiciel
        </div>

        <div className="mt-2 space-y-3">
          <p>
            Je soussigné(e),{' '}
            <strong>{publisherRepName || '______________________________'}</strong>,
            agissant en qualité de représentant légal de la société{' '}
            <strong>{publisherName || '______________________________'}</strong>,
            située au <strong>{publisherAddress || '______________________________'}</strong>
            {publisherSiret
              ? <> (SIRET&nbsp;: <strong>{publisherSiret}</strong>)</>
              : ' (SIRET : ___________________)'}
            , éditeur du logiciel ou système de caisse désigné ci-après&nbsp;:
          </p>

          <ul className="ml-6 space-y-1 text-[10.5pt]">
            <li>
              Nom du logiciel&nbsp;/ système de caisse&nbsp;:{' '}
              <strong>{whiteLabelInstanceConfig.appName}</strong>
            </li>
            <li>
              Version du logiciel concernée&nbsp;:{' '}
              <strong>{softwareVersion}</strong>
            </li>
            <li>
              Numéro de licence&nbsp;:{' '}
              <strong>{licenseNumber}</strong>
            </li>
          </ul>

          <p>
            Atteste que ce logiciel, mis sur le marché le{' '}
            <strong>{launchDateFmt}</strong>,
            {' '}respecte les conditions d'inaltérabilité, de sécurisation, de conservation et
            d'archivage des données en vue du contrôle de l'administration fiscale, prévues
            au 3° bis du I de l'article 286 du CGI.
          </p>
        </div>

        {/* Signature éditeur */}
        <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-300">
          <div className="space-y-1 text-[10.5pt]">
            <p>Fait à&nbsp;: <strong>{publisherCity || '______________________'}</strong></p>
            <p>Le&nbsp;: <strong>{signatureDate}</strong></p>
          </div>
          <div className="text-center text-[9pt]">
            <p className="mb-2 font-semibold">Signature et cachet de l'éditeur&nbsp;:</p>
            <div className="w-52 h-20 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
              <span className="text-gray-400 italic text-[8pt]">(Signature + cachet)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── VOLET 2 ──────────────── */}
      <section className="border border-gray-700 p-5 mb-6 relative">
        <div className="absolute -top-[11px] left-4 bg-white px-2 text-[8pt] font-bold uppercase tracking-wider">
          👤 VOLET 2 — Partie à remplir par l'utilisateur (le client)
        </div>

        <div className="mt-2 space-y-3">
          <p>
            Je soussigné(e),{' '}
            <strong>{tenantName}</strong>,
            représentant <strong>{instanceName}</strong>
            {tenantSiret && tenantSiret !== '___________________'
              ? <> (SIRET&nbsp;: <strong>{tenantSiret}</strong>)</>
              : ' (SIRET : ___________________)'}
            , certifie avoir acquis le{' '}
            <strong>{acquisitionDate}</strong>{' '}
            le logiciel désigné au Volet 1.
          </p>

          <p>
            J'atteste l'utiliser pour mes transactions depuis le{' '}
            <strong>{acquisitionDate}</strong>,
            en conformité avec la réglementation fiscale en vigueur
            (article 286, I-3° bis du CGI).
          </p>
        </div>

        {/* Signature client */}
        <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-300">
          <div className="space-y-1 text-[10.5pt]">
            <p>Fait à&nbsp;: <strong>{tenantCity !== '______________________' ? tenantCity : '______________________'}</strong></p>
            <p>Le&nbsp;: ___________________</p>
          </div>
          <div className="text-center text-[9pt]">
            <p className="mb-1 font-semibold">Signature du client et cachet&nbsp;:</p>
            <p className="mb-2 text-[8pt] text-gray-500 italic">
              (Faire précéder de la mention «&nbsp;Lu et approuvé&nbsp;»)
            </p>
            <div className="w-52 h-20 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
              <span className="text-gray-400 italic text-[8pt]">(Signature)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Avertissement légal */}
      <section className="bg-gray-50 border border-gray-300 p-4 text-[8.5pt] italic">
        <p className="font-bold text-center uppercase mb-2 not-italic text-red-700">
          Avertissement légal
        </p>
        <p>
          L'établissement d'une fausse attestation ou l'usage d'une fausse attestation constituent
          le délit de faux et d'usage de faux, passible de trois ans d'emprisonnement et de
          45&nbsp;000&nbsp;€ d'amende (article 441-1 du Code pénal). Ce document doit être
          présenté à l'administration fiscale sur simple demande lors d'un contrôle.
        </p>
      </section>

      {/* Pied de page */}
      <div className="mt-6 text-center text-[7.5pt] text-gray-400 border-t border-gray-200 pt-3">
        Instance&nbsp;: {instanceId} · Généré le {signatureDate} · {whiteLabelInstanceConfig.appName} · Conforme BOI-LETTRE-000242
      </div>
    </div>
    </>
  );
}
