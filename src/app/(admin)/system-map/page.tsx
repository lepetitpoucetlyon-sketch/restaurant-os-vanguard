"use client";

import { MindMap } from "@modules/intelligence";

export default function SystemMapPage() {
    return (
        <div className="w-full h-[calc(100vh)] bg-bg-primary overflow-hidden relative">
            <iframe 
                src="/blueprint/index.html" 
                className="absolute inset-0 w-full h-full border-0 outline-none"
                title="Atlas 3D"
            />
        </div>
    );
}
