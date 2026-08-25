'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { searchMetroProducts } from './MetroCatalog';
import { searchPomonaProducts } from './PomonaCatalog';
import type { SupplierProduct } from './MetroCatalog';

type CatalogSource = 'metro' | 'pomona' | 'all';

interface SupplierProductAutocompleteProps {
  onSelect: (product: SupplierProduct) => void;
  placeholder?: string;
  sources?: CatalogSource;
}

export function SupplierProductAutocomplete({
  onSelect,
  placeholder = 'Rechercher un produit fournisseur…',
  sources = 'all',
}: SupplierProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const metro = sources !== 'pomona' ? searchMetroProducts(q, 6) : [];
    const pomona = sources !== 'metro' ? searchPomonaProducts(q, 6) : [];
    const combined = [...metro, ...pomona].slice(0, 10);
    setResults(combined);
    setOpen(combined.length > 0);
    setFocused(-1);
  }, [sources]);

  useEffect(() => { search(query); }, [query, search]);

  const handleSelect = (product: SupplierProduct) => {
    setQuery(product.name);
    setOpen(false);
    onSelect(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); handleSelect(results[focused]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  const supplierBadge = (id: string) => id === 'metro'
    ? <span className="text-nano bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Metro</span>
    : <span className="text-nano bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium">Pomona</span>;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((product, i) => (
            <li
              key={`${product.supplierId}-${product.name}`}
              onClick={() => handleSelect(product)}
              className={[
                'flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm transition-colors',
                i === focused ? 'bg-indigo-50' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              <div>
                <div className="font-medium text-gray-800">{product.name}</div>
                <div className="text-xs text-gray-400">{product.category} · {product.unit}</div>
              </div>
              {supplierBadge(product.supplierId)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
