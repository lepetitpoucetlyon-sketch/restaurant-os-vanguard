'use client';

import { Building } from 'lucide-react';
import type { EquipmentCategory } from '../../../assets/domain/schemas/equipment';

interface EquipmentIdentitySectionProps {
  name: string;
  setName: (v: string) => void;
  category: EquipmentCategory;
  setCategory: (v: EquipmentCategory) => void;
  location: string;
  setLocation: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  serialNumber: string;
  setSerialNumber: (v: string) => void;
}

export function EquipmentIdentitySection({
  name,
  setName,
  category,
  setCategory,
  location,
  setLocation,
  brand,
  setBrand,
  model,
  setModel,
  serialNumber,
  setSerialNumber,
}: EquipmentIdentitySectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Building className="w-3.5 h-3.5 text-indigo-400" />
        <span>Identité de la Machine</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Nom d usage de l équipement *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Four Mixte Rational iCombi Pro 10 GN, Lave-verre Hobart..."
            className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Catégorie Métier
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 text-sm"
          >
            <option value="COOKING">🔥 Cuisson & Chaud (Fours, pianos...)</option>
            <option value="COLD_STORAGE">❄️ Froid (Chambres froides, armoires...)</option>
            <option value="WASHING">🧼 Lavage (Lave-vaisselle, plonge...)</option>
            <option value="BEVERAGE_COFFEE">☕ Bar & Café (Machines espresso, tireuses...)</option>
            <option value="FOOD_PREP">🔪 Préparation (Robots, trancheurs...)</option>
            <option value="POS_HARDWARE">🖥️ Caisse & TPE (Imprimantes, écrans...)</option>
            <option value="HVAC_EXTRACTION">💨 Extraction & Climatisation</option>
            <option value="SECURITY_SAFETY">🛡️ Sécurité & ERP (Extincteurs...)</option>
            <option value="OTHER">📦 Autre matériel</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Emplacement
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Cuisine Chaude, Bar Principal, Cave..."
            className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Marque *
          </label>
          <input
            type="text"
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ex: Rational, Hobart, La Marzocco..."
            className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Modèle & N° de Série *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Modèle"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
            />
            <input
              type="text"
              required
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="N° Série (S/N)"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
