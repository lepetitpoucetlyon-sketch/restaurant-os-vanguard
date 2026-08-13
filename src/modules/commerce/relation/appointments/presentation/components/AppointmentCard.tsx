"use client";

import { Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../../domain/types/appointment';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'En attente',  color: 'text-yellow-500',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
  confirmed: { label: 'Confirmé',    color: 'text-green-500',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Annulé',      color: 'text-red-500',     icon: <XCircle className="w-3.5 h-3.5" /> },
  completed: { label: 'Terminé',     color: 'text-text-muted',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  no_show:   { label: 'No-show',     color: 'text-orange-500',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function AppointmentCard({ appointment, onConfirm, onCancel, onComplete }: AppointmentCardProps) {
  const { label, color, icon } = STATUS_CONFIG[appointment.status];
  const time = new Date(appointment.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text-primary">{appointment.clientName}</p>
          <p className="text-xs text-text-muted">{appointment.serviceName}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
          {icon}
          {label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {time} · {appointment.durationMinutes} min
        </span>
        {appointment.staffName && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {appointment.staffName}
          </span>
        )}
      </div>

      {appointment.notes && (
        <p className="text-xs text-text-muted bg-bg-tertiary rounded-xl px-3 py-2">{appointment.notes}</p>
      )}

      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <div className="flex items-center gap-2 pt-1">
          {appointment.status === 'pending' && onConfirm && (
            <button
              onClick={() => onConfirm(appointment.id)}
              className="flex-1 py-1.5 rounded-xl bg-accent text-text-on-accent text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Confirmer
            </button>
          )}
          {appointment.status === 'confirmed' && onComplete && (
            <button
              onClick={() => onComplete(appointment.id)}
              className="flex-1 py-1.5 rounded-xl bg-bg-tertiary border border-border text-text-primary text-xs font-bold hover:bg-bg-secondary transition-colors"
            >
              Terminer
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-red-500 text-xs font-bold hover:opacity-80 transition-opacity"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  );
}
