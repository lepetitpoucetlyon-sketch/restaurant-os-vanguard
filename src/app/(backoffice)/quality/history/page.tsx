"use client";
import { QualityModuleLayout } from "@/modules/haccp/components/quality/QualityModuleLayout";
import { useQualityBridge } from "@/hooks/useQualityBridge";

export default function QualityHistoryPage() {
    const { controls } = useQualityBridge();

    return (
        <QualityModuleLayout 
            title="Historique HACCP" 
            subtitle="Archives des contrôles de réception et préparation"
        >
            <div className="space-y-4">
                {controls.map(control => (
                    <div key={control.id} className="p-4 bg-bg-secondary border border-border rounded-xl">
                        <p className="font-bold">{control.supplier_name}</p>
                        <p className="text-xs text-text-muted">{control.controlled_at}</p>
                    </div>
                ))}
            </div>
        </QualityModuleLayout>
    );
}
