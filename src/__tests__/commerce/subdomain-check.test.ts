import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenant/domain/check/route';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('API /api/tenant/domain/check — Validation et Réservation de Sous-domaines', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete('mcc_domain_registry');
  });

  it('devrait valider un slug conforme et disponible', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenant/domain/check?slug=le-bistrot-parisien');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.slug).toBe('le-bistrot-parisien');
    expect(data.fullDomain).toBe('le-bistrot-parisien.webapp.fr');
  });

  it('devrait refuser les noms de sous-domaines réservés par le système', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenant/domain/check?slug=admin');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
    expect(data.reason).toContain('réservé');
  });

  it('devrait refuser les sous-domaines avec format ou caractères invalides', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenant/domain/check?slug=ab');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
    expect(data.reason).toContain('Format invalide');
  });

  it('devrait détecter si un sous-domaine est déjà attribué dans le registre Nexus', async () => {
    await Nexus.adapter.set('mcc_domain_registry', {
      'mon-resto': 'tenant_12345',
    });

    const req = new NextRequest('http://localhost:3000/api/tenant/domain/check?slug=mon-resto');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
    expect(data.reason).toContain('déjà attribué');
  });
});
