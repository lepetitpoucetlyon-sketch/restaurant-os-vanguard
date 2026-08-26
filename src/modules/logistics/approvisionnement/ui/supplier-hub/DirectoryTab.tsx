'use client';

import { Search, Building2, Phone, ChevronRight } from 'lucide-react';

interface DirectoryTabProps {
  searchFilter: string;
  setSearchFilter: (v: string) => void;
}

export function DirectoryTab({ searchFilter, setSearchFilter }: DirectoryTabProps) {
  const suppliers = [
    {
      id: 'tg',
      name: 'Transgourmet Rhône-Alpes',
      category: 'Épicerie, Frais & Surgelé',
      franco: '250,00 €',
      cutOff: '22h00 (J-1)',
      deliveryDays: 'Mar, Jeu, Ven',
      primaryContact: 'Jérôme B. (+33 6 12 34 56 78)',
      payment: 'LCR 30j Fin de Mois',
      iban: 'FR76 3000 2005 ... 99',
      channel: 'WHATSAPP',
    },
    {
      id: 'pomona',
      name: 'Pomona TerreAzur',
      category: 'Fruits, Légumes & Marée Fraîche',
      franco: '180,00 €',
      cutOff: '23h30 (J-1)',
      deliveryDays: 'Lun, Mar, Mer, Jeu, Ven, Sam',
      primaryContact: 'Céline V. (+33 6 98 76 54 32)',
      payment: 'Prélèvement SEPA 30j',
      iban: 'FR76 1005 8890 ... 12',
      channel: 'WHATSAPP',
    },
    {
      id: 'fb',
      name: 'France Boissons',
      category: 'Bières fûts, Vins & Spiritueux',
      franco: '400,00 €',
      cutOff: '17h00 (J-2)',
      deliveryDays: 'Mardi, Vendredi',
      primaryContact: 'Alexandre M. (+33 4 72 00 11 22)',
      payment: 'LCR 45j',
      iban: 'FR76 1027 8001 ... 44',
      channel: 'EMAIL_PDF',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer fournisseurs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-surface-glass border border-border-default rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs tracking-wider uppercase hover:bg-amber-400 transition-colors flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Nouveau Fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-surface-card border border-border-default hover:border-border-focus transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-text-primary text-base">{s.name}</h3>
                  <p className="text-micro text-text-muted">{s.category}</p>
                </div>
                <span className="text-nano font-bold px-2 py-0.5 rounded bg-surface-glass text-amber-300 border border-amber-500/20">
                  {s.channel}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-text-secondary">
                <div className="flex items-center justify-between py-1 border-b border-border-default/40">
                  <span className="text-text-muted">Franco de port :</span>
                  <span className="font-bold text-text-primary">{s.franco}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-default/40">
                  <span className="text-text-muted">Cut-off commande :</span>
                  <span className="font-bold text-amber-400">{s.cutOff}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-default/40">
                  <span className="text-text-muted">Jours de passage :</span>
                  <span className="font-semibold text-text-primary">{s.deliveryDays}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-default/40">
                  <span className="text-text-muted">Règlement :</span>
                  <span className="text-text-primary">{s.payment}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2 text-micro text-text-muted">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{s.primaryContact}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
