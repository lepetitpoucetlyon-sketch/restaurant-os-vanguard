"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';
import type { SupportTicket } from '@/shared/schemas';

export function useSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour lire l'état courant dans le setInterval sans le mettre en dep de l'effect
  const ticketsRef = useRef<SupportTicket[]>(tickets);
  ticketsRef.current = tickets;

  const fetchTickets = useCallback(async () => {
    try {
      const res = await authedFetch('/api/tenant/support/tickets');
      if (!res.ok) throw new Error('Impossible de charger les tickets');
      const data = await res.json() as { tickets: SupportTicket[] };
      setTickets(data.tickets || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();

    // Poll toutes les 15s uniquement si des tickets sont en cours d'analyse.
    // On lit ticketsRef pour éviter d'ajouter `tickets` aux deps (boucle de recréation d'interval).
    const timer = setInterval(() => {
      const hasAnalyzing = ticketsRef.current.some(
        t => t.status === 'analyzing' || t.status === 'new'
      );
      if (hasAnalyzing) fetchTickets();
    }, 15000);

    return () => clearInterval(timer);
  }, [fetchTickets]);

  const submitTicket = async (description: string, screenshotUrl?: string) => {
    const res = await authedFetch('/api/tenant/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, screenshotUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || 'Échec de la création du ticket');
    }

    const data = await res.json() as { ticketId: string; status: string; draft?: unknown };
    await fetchTickets();
    return data;
  };

  return { tickets, loading, error, refresh: fetchTickets, submitTicket };
}
