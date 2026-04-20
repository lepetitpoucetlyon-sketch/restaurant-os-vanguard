// @ts-nocheck
"use client";
import { QualityModuleLayout } from "@/components/quality/QualityModuleLayout";
import { useQualityBridge } from "@/hooks/useQualityBridge";

export default function SupplierScoringPage() {
    const { supplierScores } = useQualityBridge();

    return (
        <QualityModuleLayout 
            title="Scoring Fournisseurs" 
            subtitle="Analyse de fiabilité et performance logistique"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supplierScores.map(score => (
                    <div key={score.supplierId} className="p-6 bg-bg-secondary border border-border rounded-2xl">
                        <h4 className="font-bold">{score.supplierName}</h4>
                        <p className="text-2xl font-mono text-accent-gold">{score.reliabilityScore}/100</p>
                    </div>
                ))}
            </div>
        </QualityModuleLayout>
    );
}
