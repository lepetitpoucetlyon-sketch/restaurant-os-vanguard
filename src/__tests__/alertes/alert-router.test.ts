import { describe, it, expect } from 'vitest';
import {
  resolveResponsibility,
  DEFAULT_RESPONSIBILITY_ROLES,
  type AlertRoutingEntry,
} from '@/kernel/alerts/AlertRouter';

describe('AlertRouter — routage par responsabilité (N6/N7)', () => {
  it('sans table de routage : rôles par défaut de la responsabilité', () => {
    const r = resolveResponsibility('RESP_HYGIENE');
    expect(r.userIds).toEqual([]);
    expect(r.roles).toEqual(DEFAULT_RESPONSIBILITY_ROLES.RESP_HYGIENE.map(String));
    expect(r.routingMissing).toBe(false);
    // Le chef est bien destinataire de l'hygiène.
    expect(r.roles).toContain('chef_cuisinier');
  });

  it('destinataires nommés dans la table : prioritaires', () => {
    const routings: AlertRoutingEntry[] = [
      { responsibility: 'RESP_FISCAL', recipients: ['u_claire'], enabled: true },
    ];
    const r = resolveResponsibility('RESP_FISCAL', routings);
    expect(r.userIds).toEqual(['u_claire']);
    expect(r.routingMissing).toBe(false);
  });

  it('rôles configurés (même non canoniques) : normalisés', () => {
    const routings: AlertRoutingEntry[] = [
      { responsibility: 'RESP_STOCK', roles: ['MANAGER', 'kitchen_chef'], enabled: true },
    ];
    const r = resolveResponsibility('RESP_STOCK', routings);
    expect(r.roles).toContain('manager');
    expect(r.roles).toContain('chef_cuisinier'); // 'kitchen_chef' résolu
    expect(r.roles).not.toContain('MANAGER');
    expect(r.roles).not.toContain('kitchen_chef');
  });

  it('entrée désactivée : coupe la responsabilité (muted), pas de repli sur les défauts', () => {
    const routings: AlertRoutingEntry[] = [
      { responsibility: 'RESP_RH', recipients: ['u_x'], enabled: false },
    ];
    const r = resolveResponsibility('RESP_RH', routings);
    expect(r.muted).toBe(true);
    expect(r.userIds).toEqual([]);
    expect(r.roles).toEqual([]);
  });

  it('responsabilité inconnue (typo) : repli direction + routingMissing', () => {
    const r = resolveResponsibility('RESP_INEXISTANTE');
    expect(r.routingMissing).toBe(true);
    expect(r.roles).toEqual(DEFAULT_RESPONSIBILITY_ROLES.RESP_DIRECTION.map(String));
  });

  it('entrée coupée (enabled:false) : muted, aucun destinataire, pas de repli', () => {
    const routings: AlertRoutingEntry[] = [
      { responsibility: 'RESP_SERVICE', roles: ['manager'], enabled: false },
    ];
    const r = resolveResponsibility('RESP_SERVICE', routings);
    expect(r.muted).toBe(true);
    expect(r.roles).toEqual([]);
    expect(r.userIds).toEqual([]);
  });

  it('compat contrat legacy : matching par eventType', () => {
    const routings: AlertRoutingEntry[] = [
      { eventType: 'RESP_TECHNIQUE', recipients: ['u_tech'], enabled: true },
    ];
    const r = resolveResponsibility('RESP_TECHNIQUE', routings);
    expect(r.userIds).toEqual(['u_tech']);
  });
});
