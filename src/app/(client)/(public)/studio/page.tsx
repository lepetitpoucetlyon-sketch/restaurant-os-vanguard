'use client';

import React from 'react';
import { OpenPencilStudio } from '@/shared/components/open-pencil';

export default function PublicStudioPage() {
    return (
        <main className="w-full h-[100dvh] bg-bg-primary">
            <OpenPencilStudio />
        </main>
    );
}
