import { describe, it, expect } from 'vitest';
import { generateVertical } from '@/verticals/_shared/forge';
import {
  validateBlueprint,
  resolveBlueprintCapabilities,
  resolveSubVariant,
} from '@/verticals/_shared/blueprint';
import {
  CAPABILITY_KEYS,
  resolveCapabilityDependencies,
  requiredHardwareFor,
  findUnknownCapabilities,
} from '@/verticals/_shared/catalog';
import { SALON_BLUEPRINT } from '@/verticals/salon/salon.blueprint';

const out = generateVertical(SALON_BLUEPRINT);
const fileMap = new Map(out.files.map(f => [f.path, f.content]));
const get = (suffix: string) => {
  const entry = [...fileMap.entries()].find(([p]) => p.endsWith(suffix));
  if (!entry) throw new Error(`fichier généré introuvable: ${suffix}`);
  return entry[1];
};

describe('Vertical Forge — catalogue universel', () => {
  it('résout les dépendances transitives (mod_kds ⇒ mod_pos)', () => {
    expect(resolveCapabilityDependencies(['mod_kds'])).toEqual(
      expect.arrayContaining(['mod_kds', 'mod_pos']),
    );
  });

  it('agrège le hardware impliqué (mod_pos ⇒ imprimante + tiroir + TPE)', () => {
    expect(requiredHardwareFor(['mod_pos'])).toEqual(
      expect.arrayContaining(['receipt_printer', 'cash_drawer', 'card_terminal']),
    );
  });

  it('détecte les capabilities fantômes', () => {
    expect(findUnknownCapabilities({ mod_pos: true, mod_teleportation: true })).toEqual(['mod_teleportation']);
  });
});

describe('Vertical Forge — blueprint salon', () => {
  it('est valide (aucun problème de cohérence)', () => {
    expect(validateBlueprint(SALON_BLUEPRINT)).toEqual([]);
  });

  it('hérite du socle profil B + universel (reservations, crm, pos)', () => {
    const caps = resolveBlueprintCapabilities(SALON_BLUEPRINT);
    expect(caps.mod_reservations).toBe(true);
    expect(caps.mod_crm).toBe(true);
    expect(caps.mod_pos).toBe(true); // socle universel
    expect(caps.mod_kds).toBe(false); // override explicite
  });

  it('la génération ne remonte aucun problème (hardware cohérent)', () => {
    expect(out.issues).toEqual([]);
  });

  it('refuse une verticale dont routes et événements ne sont pas structurés', () => {
    const invalid = {
      ...SALON_BLUEPRINT,
      routes: [
        ...SALON_BLUEPRINT.routes,
        { ...SALON_BLUEPRINT.routes[0], path: 'agenda', componentExport: '' },
      ],
      events: [
        ...SALON_BLUEPRINT.events,
        { name: 'payment.completed', pillar: 'finance' as const },
        { ...SALON_BLUEPRINT.events[0] },
      ],
      subVariants: [
        { slug: 'spa', label: 'Spa bis' },
        { slug: 'spa', label: 'Spa ter' },
      ],
    };

    expect(validateBlueprint(invalid)).toEqual(expect.arrayContaining([
      'route invalide (doit commencer par /) : "agenda"',
      'route "agenda" : componentPath et componentExport sont requis',
      'événement hors namespace de la verticale : "payment.completed"',
      'événement dupliqué : "salon.appointment_completed"',
      'sous-variante dupliquée: "spa"',
    ]));
  });
});

describe('Vertical Forge — génération L1 reproduit la structure salon', () => {
  it('émet plugin + adapters + tokens + DNA', () => {
    expect(fileMap.has('src/verticals/salon/SalonVertical.ts')).toBe(true);
    expect(fileMap.has('src/verticals/salon/adapters/index.ts')).toBe(true);
    expect(fileMap.has('src/shared/nexus/tokens/verticals/salon.ts')).toBe(true);
    expect(fileMap.has('src/shared/seeds/salon-full-dna.ts')).toBe(true);
  });

  it('le plugin enregistre les 3 routes + le health ping avec métriques à zéro', () => {
    const plugin = get('SalonVertical.ts');
    expect(plugin).toContain('class SalonVertical implements IVerticalPlugin');
    expect(plugin).toContain("registerRoute('/agenda'");
    expect(plugin).toContain("registerRoute('/stylists'");
    expect(plugin).toContain("registerRoute('/cabin-stock'");
    expect(plugin).toContain("'tenant.ready'");
    expect(plugin).toContain('emitHealthPing');
    expect(plugin).toContain('chairsActive: 0');
    expect(plugin).toContain('appointmentsToday: 0');
  });

  it('les adapters composent les factories partagées + deltas', () => {
    expect(get('SalonFinanceAdapter.ts')).toContain('makeFinanceAdapter()');
    expect(get('SalonMccAdapter.ts')).toContain('makeMccAdapter<{ chairsActive: number; appointmentsToday: number }>()');
    const ops = get('SalonOpsAdapter.ts');
    expect(ops).toContain('emitAppointmentCompleted');
    expect(ops).toContain('emitNoShow');
    const commerce = get('SalonCommerceAdapter.ts');
    expect(commerce).toContain('makeCommerceAdapter()');
    expect(commerce).toContain('emitAppointmentBooked');
  });

  it('le DNA porte le variant salon et un capabilities complet', () => {
    const dna = get('salon-full-dna.ts');
    expect(dna).toContain("variant: 'salon'");
    expect(dna).toContain("'mod_pos': true");
    expect(dna).toContain("'mod_kds': false");
    // DNA exhaustif : toutes les capabilities du catalogue présentes.
    for (const k of CAPABILITY_KEYS) expect(dna).toContain(`'${k}':`);
  });
});

describe('Vertical Forge — sous-variantes (Pilier 4)', () => {
  it('aplati barbier en blueprint concret avec deltas', () => {
    const barbier = resolveSubVariant(SALON_BLUEPRINT, 'barbier');
    expect(barbier.slug).toBe('salon_barbier');
    expect(barbier.className).toBe('SalonBarbierVertical');
    expect(barbier.capabilities.mod_quotes).toBe(false);
    expect(barbier.subVariants).toBeUndefined();
  });

  it('spa hérite de la base et surcharge un token', () => {
    const spa = resolveSubVariant(SALON_BLUEPRINT, 'spa');
    expect(spa.capabilities.mod_groups).toBe(true);
    expect(spa.tokens.verticalTokens['--vertical-accent-muted']).toBe('rgba(155, 89, 182, 0.15)');
    // hérite bien de la base
    expect(spa.tokens.verticalTokens['--appointment-booked']).toBe('#D4A5C7');
  });
});
