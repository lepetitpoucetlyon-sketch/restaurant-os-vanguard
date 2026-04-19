"use client";

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';

interface SecurityPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
    requiredLevel?: number;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Autorisation Requise",
    description = "Veuillez saisir votre code PIN pour valider cette action.",
    requiredLevel = 70
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const { verifyPin, logAction } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            const resetTimer = window.setTimeout(() => {
                setPin('');
                setError(false);
            }, 0);

            return () => window.clearTimeout(resetTimer);
        }
    }, [isOpen]);

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            const nextPin = pin + digit;
            setPin(nextPin);
            setError(false);

            if (nextPin.length === 4) {
                void submitPin(nextPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const submitPin = async (candidatePin: string) => {
        const isValid = await verifyPin(candidatePin, requiredLevel);
        if (isValid) {
            await logAction('pin_validated', { title });
            onSuccess();
            onClose();
        } else {
            setError(true);
            setPin('');
            showToast("Code PIN invalide ou accès refusé", "error");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-accent" />
                </div>

                <h3 className="text-xl font-serif font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-muted mb-8 max-w-[280px] mx-auto">{description}</p>

                <div className="flex justify-center gap-4 mb-10">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-300 ${pin.length > i
                                    ? 'border-accent bg-accent/5 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]'
                                    : error
                                        ? 'border-error bg-error/5'
                                        : 'border-border bg-bg-tertiary/50'
                                }`}
                        >
                            {pin.length > i ? '•' : ''}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePinInput(num.toString())}
                            className="h-16 rounded-xl bg-bg-tertiary border border-border text-xl font-bold hover:bg-bg-secondary active:scale-95 transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={onClose}
                        className="h-16 rounded-xl bg-bg-tertiary/50 border border-border text-sm font-bold text-text-muted hover:bg-error/10 hover:text-error transition-all"
                    >
                        ANNULER
                    </button>
                    <button
                        onClick={() => handlePinInput('0')}
                        className="h-16 rounded-xl bg-bg-tertiary border border-border text-xl font-bold hover:bg-bg-secondary active:scale-95 transition-all"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-16 rounded-xl bg-bg-tertiary/50 border border-border text-sm font-bold text-text-muted hover:bg-accent/10 hover:text-accent transition-all"
                    >
                        EFFACER
                    </button>
                </div>
            </div>
        </Modal>
    );
};
