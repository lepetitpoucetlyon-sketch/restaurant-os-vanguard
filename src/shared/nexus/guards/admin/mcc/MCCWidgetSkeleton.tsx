import React from 'react';

export function MCCWidgetSkeleton() {
    return (
        <div className="w-full h-[300px] bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse flex flex-col p-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl" />
                <div className="space-y-2">
                    <div className="w-24 h-3 bg-white/5 rounded-full" />
                    <div className="w-32 h-4 bg-white/5 rounded-full" />
                </div>
            </div>
            <div className="flex-1 space-y-4">
                <div className="w-full h-4 bg-white/5 rounded-full" />
                <div className="w-full h-4 bg-white/5 rounded-full" />
                <div className="w-2/3 h-4 bg-white/5 rounded-full" />
            </div>
        </div>
    );
}
