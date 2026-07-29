import React from 'react';

interface LegalCertificateA4Props {
  instanceName: string;
  instanceId: string;
  tenantName?: string; // Gérant du restaurant
  issuedAt: string;
  softwareVersion?: string;
}

export function LegalCertificateA4({
  instanceName,
  instanceId,
  tenantName = "______________________",
  issuedAt,
  softwareVersion = "Nexus CORE v16"
}: LegalCertificateA4Props) {
  const formattedDate = new Date(issuedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="print-certificate-container bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-none md:shadow-2xl font-serif text-left">
      <div className="text-center mb-10 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase mb-2">Attestation Individuelle de Conformité</h1>
        <p className="text-sm italic">Article 286, I-3° bis du code général des impôts (CGI)</p>
        <p className="text-xs font-bold mt-1">Modèle officiel : BOI-LETTRE-000242</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-justify">
        {/* VOLET 1 : Éditeur */}
        <section className="border border-gray-400 p-6 relative">
          <div className="absolute -top-3 left-4 bg-white px-2 font-bold uppercase text-xs">Volet 1 - Rempli par l'éditeur du logiciel</div>
          <p className="mb-4 mt-2">
            Je soussigné(e) <strong>Restaurant OS Empire</strong>, agissant en qualité de représentant légal de la société éditrice, certifie que le logiciel ou système de caisse désigné ci-après :
          </p>
          <ul className="list-disc ml-8 mb-4 font-bold">
            <li>Nom du logiciel : Restaurant OS</li>
            <li>Version : {softwareVersion}</li>
          </ul>
          <p className="mb-4">
            respecte les conditions d'inaltérabilité, de sécurisation, de conservation et d'archivage des données en vue du contrôle de l'administration fiscale, prévues au 3° bis du I de l'article 286 du CGI.
          </p>
          <p className="mb-6">
            Cette attestation est délivrée pour l'instance système identifiée sous la référence :<br/>
            <strong>{instanceId} ({instanceName})</strong>
          </p>
          
          <div className="flex justify-between items-end mt-8">
             <div>
                <p>Fait à : <strong>Lyon</strong></p>
                <p>Le : <strong>{formattedDate}</strong></p>
             </div>
             <div className="text-center">
                <p className="mb-2">Signature de l'éditeur et cachet :</p>
                <div className="w-48 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center rotate-[-2deg]">
                    <span className="font-bold text-gray-500 uppercase text-xs text-center leading-tight">
                        Restaurant OS Empire<br/>
                        Signé Électroniquement
                    </span>
                </div>
             </div>
          </div>
        </section>

        {/* VOLET 2 : Client */}
        <section className="border border-gray-400 p-6 relative">
          <div className="absolute -top-3 left-4 bg-white px-2 font-bold uppercase text-xs">Volet 2 - Rempli par l'utilisateur (Le Client)</div>
          <p className="mb-4 mt-2">
            Je soussigné(e) <strong>{tenantName}</strong>, agissant en qualité de représentant légal de l'entreprise utilisatrice, certifie avoir acquis le logiciel de caisse mentionné au volet 1.
          </p>
          <p className="mb-4">
            Je m'engage à utiliser ce logiciel pour enregistrer les règlements de mes clients conformément à la réglementation fiscale en vigueur (article 286, I-3° bis du CGI).
          </p>
          
          <div className="flex justify-between items-end mt-12">
             <div>
                <p>Fait à : __________________</p>
                <p>Le : ___________________</p>
             </div>
             <div className="text-center">
                <p className="mb-8">Signature du client et cachet de l'entreprise :</p>
                <p className="text-gray-400 italic text-xs">(Faire précéder de la mention "Lu et approuvé")</p>
             </div>
          </div>
        </section>

        <section className="bg-gray-100 p-4 border border-gray-300 text-xs italic">
          <p className="font-bold text-center uppercase mb-2 text-red-600">Avertissement Légal</p>
          <p>
            L'établissement d'une fausse attestation ou l'usage d'une fausse attestation constituent le délit de faux et d'usage de faux, passible de trois ans d'emprisonnement et de 45 000 euros d'amende (article 441-1 du Code pénal). Ce document doit être présenté à l'administration fiscale sur simple demande lors d'un contrôle.
          </p>
        </section>
      </div>
    </div>
  );
}
