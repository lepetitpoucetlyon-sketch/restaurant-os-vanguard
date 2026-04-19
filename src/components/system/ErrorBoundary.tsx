"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-bg-primary p-8">
                    <div className="max-w-md w-full card-premium p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-serif font-black text-text-primary italic">Désolé, une erreur est survenue</h2>
                            <p className="text-text-muted text-sm uppercase tracking-widest font-bold">L'application a rencontré un problème inattendu.</p>
                        </div>
                        <div className="p-4 bg-bg-tertiary rounded-xl text-left overflow-auto max-h-32">
                            <code className="text-[10px] text-error font-mono">{this.state.error?.message}</code>
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-accent hover:bg-black text-white h-12 rounded-xl font-black text-[11px] uppercase tracking-[0.2em]"
                        >
                            <RefreshCcw className="w-4 h-4 mr-3" />
                            Recharger l'application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
