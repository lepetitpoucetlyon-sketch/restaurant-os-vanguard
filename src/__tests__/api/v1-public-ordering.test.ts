import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenApiSpecService } from '@/lib/api/OpenApiSpecService';

describe('🌐 API REST v1 & Public Ordering Specification (H2)', () => {
  it('devrait générer une spécification OpenAPI 3.0.3 complète et valide', () => {
    const spec = OpenApiSpecService.getSpec();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toContain('Restaurant OS Enterprise REST API');
    expect(spec.paths['/menu']).toBeDefined();
    expect(spec.paths['/orders']).toBeDefined();
    expect(spec.paths['/orders/{id}']).toBeDefined();
    expect(spec.paths['/tables']).toBeDefined();
  });

  it('devrait exposer les paramètres nécessaires pour le filtrage du menu et des tables', () => {
    const spec = OpenApiSpecService.getSpec();
    const menuGet = spec.paths['/menu'].get;
    expect(menuGet.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'tenantId', in: 'query', required: true }),
      ])
    );
  });
});
