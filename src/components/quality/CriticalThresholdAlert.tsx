import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CriticalThresholdAlertProps {
    title: string;
    message: string;
}

export const CriticalThresholdAlert: React.FC<CriticalThresholdAlertProps> = ({ title, message }) => {
    return (
        <div className="p-6 bg-error/5 border border-error/20 rounded-[2rem] flex items-start gap-6">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-error uppercase text-xs tracking-widest">{title}</h4>
                <p className="text-sm text-text-primary mt-1">{message}</p>
                <Button variant="link" className="p-0 h-auto mt-3 text-error font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
                    Ouvrir le Protocole de Crise <ArrowRight className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
};
