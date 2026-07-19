import { describe, it, expect } from 'vitest';
import { GenomeValidator, genomeValidator } from '@/domain/services/GenomeValidator';

describe('GenomeValidator', () => {
  describe('singleton', () => {
    it('returns the same instance', () => {
      const a = GenomeValidator.getInstance();
      const b = GenomeValidator.getInstance();
      expect(a).toBe(b);
      expect(genomeValidator).toBe(a);
    });
  });

  describe('validatePower', () => {
    it('allows a registered power on a GREEN module', () => {
      const result = genomeValidator.validatePower('POS', 'CREATE_TRANSACTION');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('AUTHORIZED');
    });

    it('blocks an unregistered module', () => {
      const result = genomeValidator.validatePower('NONEXISTENT' as 'POS', 'READ_ONLY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('UNREGISTERED_MODULE');
    });

    it('blocks a power not in module DNA (DNA_CORRUPTION)', () => {
      // DASHBOARD can SYNC_STATE and READ_ONLY, but NOT CREATE_TRANSACTION
      const result = genomeValidator.validatePower('DASHBOARD', 'CREATE_TRANSACTION');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DNA_CORRUPTION');
    });

    it('blocks a RED module (STATUS_IMMUNITY)', () => {
      // Temporarily set a module to RED
      genomeValidator.mutateNodeStatus('MAP_3D', 'RED');
      const result = genomeValidator.validatePower('MAP_3D', 'READ_ONLY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('MODULE_RED');
      // Restore
      genomeValidator.mutateNodeStatus('MAP_3D', 'GREEN');
    });

    it('blocks when a mandatory dependency is RED (CIRCUIT_BREAKER)', () => {
      // POS depends on REGISTERS (mandatory) and KDS (mandatory)
      genomeValidator.mutateNodeStatus('REGISTERS', 'RED');
      const result = genomeValidator.validatePower('POS', 'CREATE_TRANSACTION');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('LINK_BROKEN');
      expect(result.blockedDependency).toBe('REGISTERS');
      // Restore
      genomeValidator.mutateNodeStatus('REGISTERS', 'GREEN');
    });

    it('allows when non-mandatory dependency is RED', () => {
      // POS depends on CRM (non-mandatory)
      genomeValidator.mutateNodeStatus('CRM', 'RED');
      const result = genomeValidator.validatePower('POS', 'CREATE_TRANSACTION');
      expect(result.allowed).toBe(true);
      // Restore
      genomeValidator.mutateNodeStatus('CRM', 'GREEN');
    });
  });

  describe('getModuleGenome', () => {
    it('returns genome for registered module', () => {
      const genome = genomeValidator.getModuleGenome('HACCP');
      expect(genome).toBeDefined();
      expect(genome!.id).toBe('HACCP');
      expect(genome!.powers).toContain('RECORD_TEMPERATURE');
    });

    it('returns undefined for unknown module', () => {
      expect(genomeValidator.getModuleGenome('PHANTOM' as 'HACCP')).toBeUndefined();
    });
  });

  describe('mutateNodeStatus', () => {
    it('changes module status', () => {
      genomeValidator.mutateNodeStatus('BAR', 'YELLOW');
      expect(genomeValidator.getModuleGenome('BAR')!.status).toBe('YELLOW');
      genomeValidator.mutateNodeStatus('BAR', 'GREEN');
    });

    it('does nothing for unknown modules', () => {
      // Should not throw
      genomeValidator.mutateNodeStatus('GHOST' as 'BAR', 'RED');
    });
  });

  describe('getRegistryVersion', () => {
    it('returns a semver string', () => {
      expect(genomeValidator.getRegistryVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
