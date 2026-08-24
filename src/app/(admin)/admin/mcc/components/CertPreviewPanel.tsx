'use client';

import { motion } from 'framer-motion';
import { whiteLabelInstanceConfig } from '@/config/instance';

interface CertPreviewPanelProps {
  selectedInstance: { id: string; name: string } | undefined;
}

export function CertPreviewPanel({ selectedInstance }: CertPreviewPanelProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: 30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
      }}
      className="relative"
    >
      <motion.div
        animate={{ opacity: selectedInstance ? 1 : 0.4, scale: selectedInstance ? 1 : 0.99 }}
        transition={{ duration: 0.5 }}
        className="aspect-[1/1.414] bg-white text-black rounded-sm shadow-2xl overflow-hidden flex flex-col font-serif text-[7px] leading-relaxed border border-gray-300"
      >
        <div className="text-center pb-2 mb-2 border-b-2 border-black px-4 pt-4">
          <p className="text-[5px] uppercase tracking-widest text-gray-500 mb-0.5">Direction Générale des Finances Publiques</p>
          <p className="text-[9px] font-bold uppercase tracking-tight leading-tight">Attestation Individuelle de Conformité</p>
          <p className="text-[5.5px] italic text-gray-600">Art. 286, I-3° bis du CGI · Réf. BOI-LETTRE-000242</p>
        </div>

        <div className="flex-1 px-4 pb-4 space-y-2 overflow-hidden">
          <div className="border border-gray-600 p-2 relative">
            <div className="absolute -top-[7px] left-2 bg-white px-1 text-[5px] font-bold uppercase tracking-wide">
              📋 VOLET 1 — Éditeur du logiciel
            </div>
            <p className="mt-1 text-[6px] text-gray-700 leading-snug">
              Je soussigné(e), <span className="font-bold">{process.env.NEXT_PUBLIC_PUBLISHER_REP_NAME || '______________________'}</span>,
              représentant légal de <span className="font-bold">{process.env.NEXT_PUBLIC_PUBLISHER_NAME || '______________________'}</span>
              {process.env.NEXT_PUBLIC_PUBLISHER_SIRET
                ? <> (SIRET&nbsp;: <span className="font-bold">{process.env.NEXT_PUBLIC_PUBLISHER_SIRET}</span>)</>
                : ' (SIRET : _______________)'}
              , atteste que le logiciel ci-après respecte les conditions d'inaltérabilité, sécurisation,
              conservation et archivage des données (art. 286 CGI)&nbsp;:
            </p>
            <ul className="ml-3 mt-1 space-y-0.5 text-[6px]">
              <li>Logiciel&nbsp;: <span className="font-bold">{whiteLabelInstanceConfig.appName} v{whiteLabelInstanceConfig.version}</span></li>
              <li>Licence&nbsp;: <span className="font-bold font-mono">{selectedInstance?.id ?? '___________________'}</span></li>
            </ul>
            <div className="flex justify-between items-end mt-2 pt-1 border-t border-gray-200">
              <p className="text-[5.5px] text-gray-600">
                Fait à <span className="font-bold">{process.env.NEXT_PUBLIC_PUBLISHER_CITY || '______'}</span>,
                le <span className="font-bold">{new Date().toLocaleDateString('fr-FR')}</span>
              </p>
              <div className="border border-dashed border-gray-400 w-16 h-8 flex items-center justify-center">
                <span className="text-[4.5px] text-gray-400 italic">Signature + cachet</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-600 p-2 relative">
            <div className="absolute -top-[7px] left-2 bg-white px-1 text-[5px] font-bold uppercase tracking-wide">
              👤 VOLET 2 — Utilisateur (le client)
            </div>
            <p className="mt-1 text-[6px] text-gray-700 leading-snug">
              Je soussigné(e), <span className="font-bold">{selectedInstance ? selectedInstance.name : '______________________'}</span>
              {' '}(SIRET : _______________), certifie avoir acquis le logiciel désigné au Volet 1
              et l'utiliser pour mes transactions en conformité avec la réglementation fiscale.
            </p>
            <div className="flex justify-between items-end mt-2 pt-1 border-t border-gray-200">
              <p className="text-[5.5px] text-gray-600">Fait à ________________, le ___________</p>
              <div className="border border-dashed border-gray-400 w-16 h-8 flex items-center justify-center">
                <span className="text-[4.5px] text-gray-400 italic">Lu et approuvé</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 p-1.5 text-[5px] italic text-gray-600 leading-snug">
            <span className="font-bold not-italic text-red-700 uppercase">Avertissement&nbsp;: </span>
            Fausse attestation = délit de faux, 3 ans d'emprisonnement et 45&nbsp;000&nbsp;€ d'amende (art. 441-1 CP).
            À présenter sur demande lors de tout contrôle fiscal.
          </div>
        </div>

        <div className="text-center text-[4.5px] text-gray-400 border-t border-gray-200 py-1 px-4">
          {selectedInstance?.id ?? '—'} · {whiteLabelInstanceConfig.appName} · BOI-LETTRE-000242
        </div>
      </motion.div>

      {!selectedInstance && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-chip-label text-secondary bg-surface-card/80 px-4 py-2 rounded-xl border border-border-subtle backdrop-blur-sm">
            Sélectionner une instance
          </p>
        </div>
      )}
    </motion.div>
  );
}
