/**
 * 💾 ExportImportModal — Export/Import JSON .pen & Code React TSX / Tailwind
 */

"use client";

import React, { useState } from 'react';
import { PageDocument, PenDocument } from '@/kernel/open-pencil/schema/PenDocument';
import { PageSceneGraphCompiler } from '@/kernel/open-pencil/engine/PageSceneGraphCompiler';
import { 
    Download, Copy, Check, Code, FileJson, 
    Upload, X, Sparkles, Save 
} from 'lucide-react';

interface ExportImportModalProps {
    page: PageDocument;
    isOpen: boolean;
    onClose: () => void;
    onImportPen: (doc: PenDocument) => void;
    onSaveToTenant: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
    page,
    isOpen,
    onClose,
    onImportPen,
    onSaveToTenant,
}) => {
    const [tab, setTab] = useState<'tsx' | 'pen' | 'import'>('tsx');
    const [copied, setCopied] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    if (!isOpen) return null;

    const generatedTSX = PageSceneGraphCompiler.compileToReactTSX(page);
    const generatedPenJson = PageSceneGraphCompiler.serialize({
        version: '1.0.0',
        name: `Export — ${page.name}`,
        author: 'OpenPencil Studio',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [page],
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExecuteImport = () => {
        setImportError(null);
        try {
            const parsed = PageSceneGraphCompiler.parse(importJson);
            onImportPen(parsed);
            onClose();
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'JSON invalide');
        }
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="export-modal-title" className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 id="export-modal-title" className="text-base font-bold text-text-primary font-brand">
                                Export & Import Design-as-Code &bull; {page.name}
                            </h3>
                            <p className="text-xs text-text-muted font-mono">{page.route}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fermer la boîte de dialogue"
                        className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-white/5 flex gap-2">
                    <button
                        onClick={() => setTab('tsx')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                            tab === 'tsx'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                    >
                        <Code className="w-4 h-4" />
                        <span>Code React TSX</span>
                    </button>
                    <button
                        onClick={() => setTab('pen')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                            tab === 'pen'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                    >
                        <FileJson className="w-4 h-4" />
                        <span>Document OpenPencil (.pen JSON)</span>
                    </button>
                    <button
                        onClick={() => setTab('import')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                            tab === 'import'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                    >
                        <Upload className="w-4 h-4" />
                        <span>Importer un .pen</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {tab === 'tsx' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted">
                                    Composant Next.js / Tailwind compilé à partir du SceneGraph
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCopy(generatedTSX)}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Copié !' : 'Copier'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownload(generatedTSX, `${page.id}.tsx`, 'text/typescript')}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Télécharger .tsx</span>
                                    </button>
                                </div>
                            </div>
                            <pre className="p-4 rounded-2xl bg-bg-primary/80 border border-white/10 text-xs font-mono text-text-secondary overflow-x-auto max-h-[360px] scrollbar-thin">
                                <code>{generatedTSX}</code>
                            </pre>
                        </div>
                    )}

                    {tab === 'pen' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted">
                                    AST OpenPencil SceneGraph (.pen format standard JSON)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCopy(generatedPenJson)}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Copié !' : 'Copier'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownload(generatedPenJson, `${page.id}.pen`, 'application/json')}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Télécharger .pen</span>
                                    </button>
                                </div>
                            </div>
                            <pre className="p-4 rounded-2xl bg-bg-primary/80 border border-white/10 text-xs font-mono text-text-secondary overflow-x-auto max-h-[360px] scrollbar-thin">
                                <code>{generatedPenJson}</code>
                            </pre>
                        </div>
                    )}

                    {tab === 'import' && (
                        <div className="space-y-4">
                            <label className="text-xs text-text-muted">
                                Collez ci-dessous le contenu JSON d un fichier .pen exporté
                            </label>
                            <textarea
                                value={importJson}
                                onChange={e => setImportJson(e.target.value)}
                                placeholder="Collez le document .pen JSON ici..."
                                className="w-full h-64 p-4 rounded-2xl bg-bg-primary/80 border border-white/10 text-xs font-mono text-text-primary placeholder-neutral-600 focus:outline-none focus:border-amber-400/50"
                            />
                            {importError && (
                                <p className="text-xs text-red-400 font-mono">{importError}</p>
                            )}
                            <button
                                onClick={handleExecuteImport}
                                disabled={!importJson.trim()}
                                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-40 transition-colors"
                            >
                                Importer dans le Canvas
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Save Action */}
                <div className="p-6 border-t border-white/10 bg-bg-tertiary flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                        Les personnalisations sont stockées avec isolation multi-tenant
                    </span>
                    <button
                        onClick={() => {
                            onSaveToTenant();
                            onClose();
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer pour ce Client</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
