import React, { useState, useRef, useCallback } from 'react';
import { Barcode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeSearchResult } from './InventoryReceptionTypes';
import { searchBarcode } from './InventoryReceptionService';

async function performBarcodeSearch(
    code: string,
    setBarcodeSearching: (b: boolean) => void,
    setBarcodeResult: (r: BarcodeSearchResult | null) => void,
): Promise<void> {
    if (!code.trim()) return;
    setBarcodeSearching(true);
    setBarcodeResult(null);
    try {
        const found = await searchBarcode(code);
        if (found) { setBarcodeResult(found); toast.success(`Produit trouvé : ${found.name}`); }
        else { toast.warning(`Aucun produit trouvé pour le code : ${code}`); }
    } catch { toast.error('Erreur lors de la recherche par code-barres.'); }
    finally { setBarcodeSearching(false); }
}

function handleBarcodeBuffer(
    key: string, bufferRef: React.MutableRefObject<string>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    onSearch: (code: string) => void
) {
    bufferRef.current += key;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        if (bufferRef.current.length > 3) { onSearch(bufferRef.current); bufferRef.current = ''; }
    }, 100);
}

function onBarcodeKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    barcodeValue: string,
    bufferRef: React.MutableRefObject<string>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    search: (code: string) => void,
): void {
    if (e.key === 'Enter') {
        e.preventDefault();
        const code = bufferRef.current || barcodeValue;
        if (code) { void search(code); bufferRef.current = ''; }
    } else {
        handleBarcodeBuffer(e.key, bufferRef, timerRef, (c) => void search(c));
    }
}

export function BarcodeScannerMode() {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcodeValue, setBarcodeValue] = useState('');
    const [barcodeResult, setBarcodeResult] = useState<BarcodeSearchResult | null>(null);
    const [barcodeSearching, setBarcodeSearching] = useState(false);
    const barcodeBufferRef = useRef('');
    const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
    const handleBarcodeSearch = useCallback(async (code: string) => {
      await performBarcodeSearch(code, setBarcodeSearching, setBarcodeResult);
    }, []);
  
    const handleBarcodeKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
          onBarcodeKeyDown(e, barcodeValue, barcodeBufferRef, barcodeTimerRef, handleBarcodeSearch);
      },
      [barcodeValue, handleBarcodeSearch]
    );

    return (
        <>
            <div className="mb-8 bg-[#161618] border border-border-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary shrink-0">
                    <Barcode className="w-4 h-4 text-status-success" />
                    Scan code-barres
                </div>
                <div className="flex-1 relative">
                    <input
                        ref={barcodeRef}
                        type="text"
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Scannez ou saisissez un code-barres / SKU, puis Entrée…"
                        className="w-full bg-[#0a0a0b] border border-border-default rounded-xl px-4 py-3 text-sm font-medium text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-status-success transition-all"
                        autoComplete="off"
                    />
                    {barcodeSearching && (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-status-success animate-pulse" />
                    )}
                </div>
                <button
                    onClick={() => { if (barcodeValue) { void handleBarcodeSearch(barcodeValue); } }}
                    disabled={!barcodeValue || barcodeSearching}
                    className="px-5 py-3 rounded-xl bg-status-success/10 text-status-success text-xs font-black uppercase tracking-widest hover:bg-status-success/20 disabled:opacity-40 transition-all whitespace-nowrap"
                >
                    Rechercher
                </button>
            </div>

            {barcodeResult && (
                <div className="mb-6 bg-status-success/10 border border-status-success/20 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-status-success mb-1">
                            Produit identifié
                        </p>
                        <p className="font-bold text-text-primary">{barcodeResult.name}</p>
                        <div className="flex gap-4 mt-1 text-[10px] text-text-secondary font-bold uppercase">
                            {barcodeResult.unit && <span>Unité : {barcodeResult.unit}</span>}
                            {barcodeResult.sku && <span>SKU : {barcodeResult.sku}</span>}
                            {barcodeResult.supplier && <span>Fournisseur : {barcodeResult.supplier}</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => { setBarcodeResult(null); setBarcodeValue(''); }}
                        className="text-text-secondary hover:text-text-primary text-xs font-black uppercase tracking-widest shrink-0"
                    >
                        Effacer
                    </button>
                </div>
            )}
        </>
    );
}
