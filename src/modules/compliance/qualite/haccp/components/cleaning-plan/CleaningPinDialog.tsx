import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import type { PinDialogState } from './cleaningPlanConstants';

interface CleaningPinDialogProps {
    pinDialog: PinDialogState;
    onClose: () => void;
    nameInput: string;
    setNameInput: (v: string) => void;
    pinInput: string;
    setPinInput: (v: string) => void;
    onSign: () => Promise<void>;
}

export function CleaningPinDialog({
    pinDialog,
    onClose,
    nameInput,
    setNameInput,
    pinInput,
    setPinInput,
    onSign,
}: CleaningPinDialogProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div 
                role="dialog"
                aria-modal="true"
                aria-label="Signature numérique de tâche HACCP"
                className="bg-surface-base rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm mx-4"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-action-primary" />
                    <h3 className="font-bold text-text-primary">Signature numérique</h3>
                </div>
                <p className="text-sm text-text-muted mb-1">Tâche :</p>
                <p className="text-sm font-medium text-text-primary mb-4 bg-surface-glass rounded-lg px-3 py-2">
                    {pinDialog.taskLabel}
                </p>
                <label className="block text-xs text-text-muted mb-1">Votre nom</label>
                <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Prénom Nom"
                    className="w-full mb-3 px-3 py-2 rounded-lg border border-border bg-surface-glass text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
                />
                <label className="block text-xs text-text-muted mb-1">Code PIN (4+ chiffres)</label>
                <input
                    type="password"
                    inputMode="numeric"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="••••"
                    className="w-full mb-4 px-3 py-2 rounded-lg border border-border bg-surface-glass text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary tracking-widest"
                />
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text-primary transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onSign}
                        disabled={pinInput.length < 4 || !nameInput.trim()}
                        className="flex-1 px-4 py-2 rounded-lg bg-action-primary text-text-primary text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                        Signer
                    </button>
                </div>
            </div>
        </div>
    );
}
