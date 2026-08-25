'use client';

import { Shield, Clock, Flame, Phone } from 'lucide-react';

export function MaintenanceRecipientsTab() {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white">Matrice des Responsabilités & Canaux de Contact</h3>
        <p className="text-xs text-text-muted">
          Configurez les coordonnées de contact (Email, Mobile) des postes clés pour la réception des alertes d urgence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Directeur / Gérant</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">Reçoit les alertes critiques (Panne bloquante, J-30 fin de garantie, contrôle CERFA).</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>Canaux activés : In-App, Email, SMS</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Manager de Shift</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">Reçoit toutes les alertes de maintenance préventive J-7, pannes dégradées et retards de nettoyage.</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>Canaux activés : In-App, Email</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chef de Cuisine & Barman</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">Reçoit les anomalies de température des chambres froides et les incidents matériel de cuisson/bar.</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>Canaux activés : In-App, SMS</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Technicien SAV d Astreinte</span>
            <Phone className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">Notification immédiate par email/SMS dès la déclaration d une panne critique bloquante.</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>Canaux activés : Email, SMS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
