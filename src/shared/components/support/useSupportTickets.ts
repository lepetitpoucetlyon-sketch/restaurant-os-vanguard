"use client";
import { useState, useEffect, useCallback } from 'react';
import type { SupportTicket } from '@/domain/schemas';

export function useSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/support/tickets');
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

    // Poll every 15s if any ticket is in analyzing status
    const hasAnalyzing = tickets.some(t => t.status === 'analyzing' || t.status === 'new');
    if (!hasAnalyzing) return;

    const timer = setInterval(fetchTickets, 15000);
    return () => clearInterval(timer);
  }, [fetchTickets, tickets]);

  const submitTicket = async (description: string, screenshotUrl?: string) => {
    const res = await fetch('/api/tenant/support/tickets', {
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
