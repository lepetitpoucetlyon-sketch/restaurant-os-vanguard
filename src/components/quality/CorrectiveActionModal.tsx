// @ts-nocheck
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CorrectiveActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (action: string) => void;
    itemName: string;
}

export const CorrectiveActionModal: React.FC<CorrectiveActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Action Corrective HACCP">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-error">
                    <AlertTriangle className="w-6 h-6" />
                    <p className="font-bold">Alerte Non-Conformité : {itemName}</p>
                </div>
                <p className="text-sm text-text-muted">La température ou l'état visuel est hors seuil. Quelle action corrective souhaitez-vous appliquer ?</p>
                <div className="grid grid-cols-1 gap-2">
                    {['Retour Fournisseur', 'Mise en Quarantaine', 'Utilisation Prioritaire', 'Destruction'].map(action => (
                        <Button key={action} variant="outline" onClick={() => onConfirm(action)}>{action}</Button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
