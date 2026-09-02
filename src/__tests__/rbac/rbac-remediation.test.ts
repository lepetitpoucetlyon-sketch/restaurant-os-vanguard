import { describe, it, expect } from 'vitest';
import { normalizeRbacRole, resolveRoleLevel, PERMISSION_ROLE_LEVELS } from '@/kernel/contracts/rbac';
import { DEFAULT_PAGE_ACCESS, DEFAULT_ACTION_ACCESS } from '@/shared/schemas/rbac.schemas';
import { ROLE_LABELS } from '@/lib/AccessPolicyManager';

describe('RBAC Multi-Personas & Remédiation Canonique', () => {
  describe('1. Normalisation & Résolution des Alias Legacy', () => {
    it('traduit correctement les alias anglophones et sectoriels vers les rôles canoniques français', () => {
      expect(normalizeRbacRole('server')).toBe('serveur');
      expect(normalizeRbacRole('floor_manager')).toBe('chef_rang');
      expect(normalizeRbacRole('kitchen_chef')).toBe('chef_cuisinier');
      expect(normalizeRbacRole('chef_cuisine')).toBe('chef_cuisinier');
      expect(normalizeRbacRole('kitchen_line')).toBe('cuisinier');
      expect(normalizeRbacRole('kitchen')).toBe('cuisinier');
      expect(normalizeRbacRole('bartender')).toBe('barman');
      expect(normalizeRbacRole('host')).toBe('hotesse');
      expect(normalizeRbacRole('cashier')).toBe('serveur');
      expect(normalizeRbacRole('super_admin')).toBe('mcc_super_admin');
    });

    it('résout les rôles canoniques directement', () => {
      expect(normalizeRbacRole('serveur')).toBe('serveur');
      expect(normalizeRbacRole('chef_cuisinier')).toBe('chef_cuisinier');
      expect(normalizeRbacRole('plongeur')).toBe('plongeur');
      expect(normalizeRbacRole('comptable')).toBe('comptable');
      expect(normalizeRbacRole('admin')).toBe('admin');
    });

    it('respecte la hiérarchie stricte des niveaux (0-1000)', () => {
      expect(resolveRoleLevel('mcc_super_admin')).toBe(1000);
      expect(resolveRoleLevel('mcc_support')).toBe(900);
      expect(resolveRoleLevel('admin')).toBe(100);
      expect(resolveRoleLevel('directeur')).toBe(90);
      expect(resolveRoleLevel('manager')).toBe(70);
      expect(resolveRoleLevel('comptable')).toBe(60);
      expect(resolveRoleLevel('chef_rang')).toBe(50);
      expect(resolveRoleLevel('chef_cuisinier')).toBe(45);
      expect(resolveRoleLevel('serveur')).toBe(40);
      expect(resolveRoleLevel('cuisinier')).toBe(35);
      expect(resolveRoleLevel('barman')).toBe(35);
      expect(resolveRoleLevel('hotesse')).toBe(30);
      expect(resolveRoleLevel('plongeur')).toBe(10);
    });
  });

  describe('2. Déblocage des Pages Orphelines & Droits Terrain', () => {
    it('/mon-espace est accessible à l\'ensemble des 11 rôles de l\'établissement', () => {
      const allowed = DEFAULT_PAGE_ACCESS['mon_espace'];
      expect(allowed).toBeDefined();
      expect(allowed).toContain('serveur');
      expect(allowed).toContain('cuisinier');
      expect(allowed).toContain('barman');
      expect(allowed).toContain('plongeur');
      expect(allowed).toContain('hotesse');
      expect(allowed).toContain('chef_cuisinier');
      expect(allowed).toContain('chef_rang');
      expect(allowed).toContain('comptable');
      expect(allowed).toContain('manager');
      expect(allowed).toContain('directeur');
      expect(allowed).toContain('admin');
    });

    it('/welcome-staff est accessible à toutes les recrues', () => {
      const allowed = DEFAULT_PAGE_ACCESS['welcome_staff'];
      expect(allowed).toBeDefined();
      expect(allowed).toContain('serveur');
      expect(allowed).toContain('plongeur');
    });

    it('/accounting-portal est accessible au gérant, directeur et expert-comptable', () => {
      const allowed = DEFAULT_PAGE_ACCESS['accounting_portal'];
      expect(allowed).toEqual(['admin', 'directeur', 'comptable']);
    });

    it('le plongeur a accès à la page HACCP pour émarger le Plan de Nettoyage (PND)', () => {
      expect(DEFAULT_PAGE_ACCESS['haccp']).toContain('plongeur');
    });

    it('le barman a accès au plan de salle pour les transferts bar -> table', () => {
      expect(DEFAULT_PAGE_ACCESS['floor_plan']).toContain('barman');
    });
  });

  describe('3. Matrice d\'Actions Réaliste (B2B Restauration)', () => {
    it('le barman peut sortir ses commandes boissons sur le KDS', () => {
      expect(DEFAULT_ACTION_ACCESS['kds']['bump_order']).toContain('barman');
    });

    it('le cuisinier peut rappeler un ticket sorti trop vite par erreur', () => {
      expect(DEFAULT_ACTION_ACCESS['kds']['recall_ticket']).toContain('cuisinier');
    });

    it('le manager de nuit peut sceller le Ticket Z lors de la clôture', () => {
      expect(DEFAULT_ACTION_ACCESS['finance']['seal_zday']).toContain('manager');
    });

    it('l\'action eightysix_ingredient est déclarée et protégée', () => {
      const eightysixRoles = DEFAULT_ACTION_ACCESS['kds']['eightysix_ingredient'];
      expect(eightysixRoles).toBeDefined();
      expect(eightysixRoles).toContain('chef_cuisinier');
      expect(eightysixRoles).toContain('barman');
      expect(eightysixRoles).not.toContain('serveur');
      expect(eightysixRoles).not.toContain('plongeur');
    });

    it('le chef de rang peut annuler une ligne d\'erreur sur son rang', () => {
      expect(DEFAULT_ACTION_ACCESS['pos']['void_line']).toContain('chef_rang');
    });

    it('l\'hôtesse peut enregistrer les réservations de groupe', () => {
      expect(DEFAULT_ACTION_ACCESS['reservations']['create_group']).toContain('hotesse');
    });

    it('l\'expert-comptable n\'a pas le droit d\'ajuster le stock physique en cuisine/magasin', () => {
      expect(DEFAULT_ACTION_ACCESS['inventory']['adjust_stock']).not.toContain('comptable');
    });
  });

  describe('4. Sécurité Anti-Élévation de Privilèges', () => {
    it('un manager (niveau 70) ne peut pas attribuer un rôle >= 70', () => {
      const managerLevel = PERMISSION_ROLE_LEVELS['manager']; // 70
      const adminLevel = PERMISSION_ROLE_LEVELS['admin']; // 100
      const directeurLevel = PERMISSION_ROLE_LEVELS['directeur']; // 90

      expect(adminLevel >= managerLevel).toBe(true);
      expect(directeurLevel >= managerLevel).toBe(true);
      expect(managerLevel >= managerLevel).toBe(true);

      // Rôles autorisés pour un manager (niveaux strictement inférieurs à 70)
      const allowedForManager = ['comptable', 'chef_rang', 'chef_cuisinier', 'serveur', 'cuisinier', 'barman', 'hotesse', 'plongeur'];
      for (const r of allowedForManager) {
        expect(PERMISSION_ROLE_LEVELS[r as keyof typeof PERMISSION_ROLE_LEVELS] < managerLevel).toBe(true);
      }
    });

    it('ROLE_LABELS inclut tous les rôles canoniques sans terme sci-fi', () => {
      expect(ROLE_LABELS['serveur']).toBeDefined();
      expect(ROLE_LABELS['chef_cuisinier']).toBeDefined();
      expect(ROLE_LABELS['cuisinier']).toBeDefined();
      expect(ROLE_LABELS['barman']).toBeDefined();
      expect(ROLE_LABELS['plongeur']).toBeDefined();
      expect(ROLE_LABELS['comptable']).toBeDefined();
      expect(ROLE_LABELS['admin']).not.toContain('Souverain');
    });
  });
});
