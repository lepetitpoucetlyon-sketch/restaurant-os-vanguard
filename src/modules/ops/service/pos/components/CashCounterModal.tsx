import React, { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/formatters';

export interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedAmountInCents: number; // Montant théorique (si non aveugle)
  isBlindMode: boolean; // Si true, le manager ne voit pas le théorique
  onValidate: (countedAmountInCents: number, discrepancyInCents: number) => Promise<void>;
  type: 'EOD_CLOSE' | 'SKIM' | 'DROP';
}

const DENOMINATIONS = [
  { value: 50000, label: '500€', type: 'bill' },
  { value: 20000, label: '200€', type: 'bill' },
  { value: 10000, label: '100€', type: 'bill' },
  { value: 5000, label: '50€', type: 'bill' },
  { value: 2000, label: '20€', type: 'bill' },
  { value: 1000, label: '10€', type: 'bill' },
  { value: 500, label: '5€', type: 'bill' },
  { value: 200, label: '2€', type: 'coin' },
  { value: 100, label: '1€', type: 'coin' },
  { value: 50, label: '0.50€', type: 'coin' },
  { value: 20, label: '0.20€', type: 'coin' },
  { value: 10, label: '0.10€', type: 'coin' },
  { value: 5, label: '0.05€', type: 'coin' },
  { value: 2, label: '0.02€', type: 'coin' },
  { value: 1, label: '0.01€', type: 'coin' },
];

/**
 * 🏦 C4.2: Cash Counter Modal (Comptage avancé par dénominations)
 * Supporte le comptage aveugle (Blind Mode) imposé par les règles de contrôle (Vague 4).
 */
export const CashCounterModal: React.FC<CashCounterModalProps> = ({
  isOpen,
  onClose,
  expectedAmountInCents,
  isBlindMode,
  onValidate,
  type
}) => {
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCounted = useMemo(() => {
    return Object.entries(counts).reduce((acc, [val, qty]) => {
      return acc + (Number(val) * qty);
    }, 0);
  }, [counts]);

  const discrepancy = totalCounted - expectedAmountInCents;

  const handleQtyChange = (value: number, qty: string) => {
    const num = parseInt(qty, 10);
    setCounts(prev => ({
      ...prev,
      [value]: isNaN(num) ? 0 : num
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      logger.info(`[CashCounter] Validation de comptage (${type}). Montant: ${totalCounted}¢, Écart: ${discrepancy}¢`);
      await onValidate(totalCounted, discrepancy);
      onClose();
    } catch (e) {
      logger.error('[CashCounter] Erreur lors de la validation', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-xl w-full max-w-4xl shadow-2xl flex overflow-hidden border border-border">
        
        {/* Colonne Dénominations */}
        <div className="w-2/3 p-6 flex flex-col max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Comptage Tiroir Caisse 
            {type === 'SKIM' && ' (Prélèvement)'}
            {type === 'DROP' && ' (Dépôt)'}
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <h3 className="font-semibold text-text-secondary mb-3 border-b border-border pb-2">Billets</h3>
              {DENOMINATIONS.filter(d => d.type === 'bill').map(denom => (
                <div key={denom.value} className="flex items-center justify-between mb-2">
                  <span className="text-lg w-16">{denom.label}</span>
                  <span className="text-text-secondary mx-2">×</span>
                  <input 
                    type="number"
                    min="0"
                    className="w-20 bg-bg-secondary border border-border rounded px-3 py-2 text-right focus:border-accent"
                    value={counts[denom.value] || ''}
                    onChange={(e) => handleQtyChange(denom.value, e.target.value)}
                  />
                  <span className="w-24 text-right font-mono">
                    {formatCurrency(((counts[denom.value] || 0) * denom.value) / 100)}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold text-text-secondary mb-3 border-b border-border pb-2">Pièces</h3>
              {DENOMINATIONS.filter(d => d.type === 'coin').map(denom => (
                <div key={denom.value} className="flex items-center justify-between mb-2">
                  <span className="text-lg w-16">{denom.label}</span>
                  <span className="text-text-secondary mx-2">×</span>
                  <input 
                    type="number"
                    min="0"
                    className="w-20 bg-bg-secondary border border-border rounded px-3 py-2 text-right focus:border-accent"
                    value={counts[denom.value] || ''}
                    onChange={(e) => handleQtyChange(denom.value, e.target.value)}
                  />
                  <span className="w-24 text-right font-mono">
                    {formatCurrency(((counts[denom.value] || 0) * denom.value) / 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Résumé */}
        <div className="w-1/3 bg-bg-secondary p-6 border-l border-border flex flex-col">
          <h3 className="text-xl font-semibold mb-6">Récapitulatif</h3>
          
          <div className="bg-bg-primary rounded-lg p-4 mb-4 border border-border">
            <p className="text-sm text-text-secondary mb-1">Total Compté</p>
            <p className="text-3xl font-bold text-accent">{formatCurrency(totalCounted / 100)}</p>
          </div>

          {!isBlindMode && (
            <>
              <div className="bg-bg-primary rounded-lg p-4 mb-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Attendu (Théorique)</p>
                <p className="text-2xl font-mono">{formatCurrency(expectedAmountInCents / 100)}</p>
              </div>

              <div className={`rounded-lg p-4 mb-4 border ${discrepancy === 0 ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                <p className="text-sm text-text-secondary mb-1">Écart</p>
                <p className={`text-2xl font-bold ${discrepancy === 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {discrepancy > 0 ? '+' : ''}{formatCurrency(discrepancy / 100)}
                </p>
              </div>
            </>
          )}

          {isBlindMode && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <span className="text-xl">🛡️</span> Comptage Aveugle Actif.
                L'écart sera calculé par le système.
              </p>
            </div>
          )}

          <div className="mt-auto space-y-3">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/80 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Validation...' : 'Valider le Comptage'}
            </button>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full bg-transparent hover:bg-bg-primary text-text-secondary border border-border font-medium py-3 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
