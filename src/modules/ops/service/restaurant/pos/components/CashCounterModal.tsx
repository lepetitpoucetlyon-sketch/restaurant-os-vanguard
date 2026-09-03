import React, { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks';

export interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedAmountInMicrounits: number; // Montant théorique (si non aveugle)
  isBlindMode?: boolean; // Si true, le manager ne voit pas le théorique
  onValidate: (countedAmountInMicrounits: number, discrepancyInMicrounits: number) => Promise<void>;
  type: 'EOD_CLOSE' | 'SKIM' | 'DROP';
}

const DENOMINATIONS = [
  { value: 500_000_000, label: '500 €', type: 'bill' },
  { value: 200_000_000, label: '200 €', type: 'bill' },
  { value: 100_000_000, label: '100 €', type: 'bill' },
  { value: 50_000_000, label: '50 €', type: 'bill' },
  { value: 20_000_000, label: '20 €', type: 'bill' },
  { value: 10_000_000, label: '10 €', type: 'bill' },
  { value: 5_000_000, label: '5 €', type: 'bill' },
  { value: 2_000_000, label: '2 €', type: 'coin' },
  { value: 1_000_000, label: '1 €', type: 'coin' },
  { value: 500_000, label: '0,50 €', type: 'coin' },
  { value: 200_000, label: '0,20 €', type: 'coin' },
  { value: 100_000, label: '0,10 €', type: 'coin' },
  { value: 50_000, label: '0,05 €', type: 'coin' },
  { value: 20_000, label: '0,02 €', type: 'coin' },
  { value: 10_000, label: '0,01 €', type: 'coin' },
];

/**
 * 🏦 C4.2: Cash Counter Modal (Comptage avancé par dénominations)
 * Supporte le comptage aveugle (Blind Mode) imposé par les règles de contrôle (Vague 4).
 */
export const CashCounterModal: React.FC<CashCounterModalProps> = ({
  isOpen,
  onClose,
  expectedAmountInMicrounits,
  isBlindMode = false,
  onValidate,
  type
}) => {
  const { t } = useLanguage();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalCounted = useMemo(() => {
    return Object.entries(counts).reduce((acc, [val, qty]) => {
      return acc + (Number(val) * qty);
    }, 0);
  }, [counts]);

  const discrepancy = totalCounted - expectedAmountInMicrounits;

  const handleQtyChange = (value: number, qty: string) => {
    const num = Math.max(0, parseInt(qty, 10) || 0);
    setCounts(prev => ({
      ...prev,
      [value]: num
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      logger.info(`[CashCounter] Validation de comptage (${type}). Montant: ${totalCounted}µ, Écart: ${discrepancy}µ`);
      await onValidate(totalCounted, discrepancy);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la validation du comptage';
      logger.error('[CashCounter] Erreur lors de la validation', e);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }} 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Comptage Tiroir Caisse"
        className="bg-bg-primary rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-border max-h-[90vh]"
      >
        
        {/* Colonne Dénominations */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
          <h2 className="text-xl lg:text-2xl font-bold text-text-primary mb-4">
            Comptage Tiroir Caisse 
            {type === 'SKIM' && ' (Prélèvement)'}
            {type === 'DROP' && ' (Dépôt)'}
            {type === 'EOD_CLOSE' && ' (Clôture de Journée)'}
          </h2>

          {errorMessage && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-text-secondary mb-3 border-b border-border pb-2 text-sm uppercase tracking-wider">Billets</h3>
              <div className="space-y-2">
                {DENOMINATIONS.filter(d => d.type === 'bill').map(denom => (
                  <div key={denom.value} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-16 text-text-primary">{denom.label}</span>
                    <span className="text-text-secondary mx-2">×</span>
                    <input 
                      type="number"
                      min="0"
                      value={counts[denom.value] || ''}
                      onChange={(e) => handleQtyChange(denom.value, e.target.value)}
                      placeholder="0"
                      className="w-20 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-right font-mono text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-text-secondary mb-3 border-b border-border pb-2 text-sm uppercase tracking-wider">{t('pos.flow.cash.coins')}</h3>
              <div className="space-y-2">
                {DENOMINATIONS.filter(d => d.type === 'coin').map(denom => (
                  <div key={denom.value} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-16 text-text-primary">{denom.label}</span>
                    <span className="text-text-secondary mx-2">×</span>
                    <input 
                      type="number"
                      min="0"
                      value={counts[denom.value] || ''}
                      onChange={(e) => handleQtyChange(denom.value, e.target.value)}
                      placeholder="0"
                      className="w-20 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-right font-mono text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Récapitulatif */}
        <div className="w-full lg:w-80 bg-bg-secondary border-t lg:border-t-0 lg:border-l border-border p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary">{t('pos.flow.cash.summary')}</h3>
            
            <div className="p-4 bg-bg-tertiary rounded-xl border border-border space-y-3">
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider block">{t('pos.flow.cash.totalCounted')}</span>
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {formatCurrency(totalCounted / 1_000_000)}
                </span>
              </div>

              {!isBlindMode && (
                <>
                  <div className="border-t border-border/50 pt-2">
                    <span className="text-xs text-text-muted uppercase tracking-wider block">{t('pos.flow.cash.expectedTheoretical')}</span>
                    <span className="text-sm font-medium font-mono text-text-secondary">
                      {formatCurrency(expectedAmountInMicrounits / 1_000_000)}
                    </span>
                  </div>

                  <div className="border-t border-border/50 pt-2">
                    <span className="text-xs text-text-muted uppercase tracking-wider block">{t('pos.flow.cash.variance')}</span>
                    <span className={`text-lg font-bold font-mono ${discrepancy === 0 ? 'text-emerald-400' : discrepancy > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {discrepancy > 0 ? '+' : ''}{formatCurrency(discrepancy / 1_000_000)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Validation...' : 'Valider'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CashCounterModal;
