"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MigrationPlaceholder from '@/modules/onboarding/components/MigrationPlaceholder';

function MigrationContent() {
    const searchParams = useSearchParams();
    const moduleName = searchParams.get('module') || 'Module';
    return <MigrationPlaceholder moduleName={moduleName} />;
}

export default function MigrationPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-serif italic text-text-muted">Initialisation du Nexus...</div>}>
            <MigrationContent />
        </Suspense>
    );
}
