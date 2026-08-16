import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import {
  EquipmentGuide,
  EquipmentGuideSchema,
  EquipmentCategory,
} from '../assets/domain/schemas/equipment';

/**
 * Modèles pré-configurés de guides & tutos pour la restauration professionnelle
 */
export const DEFAULT_EQUIPMENT_GUIDE_TEMPLATES: Array<Omit<EquipmentGuide, 'id' | 'equipmentId' | 'tenantId' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'Protocole de Nettoyage Automatique & Détartrage Quotidien',
    type: 'CLEANING_PROCEDURE',
    authorType: 'VENDOR',
    authorName: 'Standard Restauration Pro',
    contentMarkdown: `### 🧼 Étapes de Nettoyage Quotidien :
1. Laisser refroidir la machine ou lancer le mode "Cool Down".
2. Insérer les pastilles détergentes / détartrantes dans les compartiments dédiés.
3. Lancer le programme automatique de lavage (cycle intensif en fin de service).
4. Essuyer les joints de porte avec un chiffon microfibre humide sans produit corrosif.
5. Vider et rincer le bac de récupération et le filtre d'évacuation.`,
    tags: ['nettoyage', 'quotidien', 'hygiène', 'haccp'],
  },
  {
    title: 'Guide d Entretien Hebdomadaire & Dégivrage Chambre Froide',
    type: 'CLEANING_PROCEDURE',
    authorType: 'RESTAURATEUR',
    authorName: 'Chef de Cuisine',
    contentMarkdown: `### ❄️ Protocole Hebdomadaire Froid :
1. Vérifier l'absence de givre sur les évaporateurs.
2. Nettoyer les grilles de ventilation et dépoussiérer le condenseur.
3. Contrôler l'étanchéité des joints magnétiques de porte.
4. Relever et vérifier la sonde de température connectée IoT.`,
    tags: ['froid', 'chambre-froide', 'hebdomadaire', 'dégivrage'],
  },
  {
    title: 'Backflush & Nettoyage des Groupes Machine Espresso',
    type: 'CLEANING_PROCEDURE',
    authorType: 'VENDOR',
    authorName: 'Barista Master',
    contentMarkdown: `### ☕ Backflush Quotidien Machine à Café :
1. Insérer le filtre aveugle dans le porte-filtre avec 1 dose de détergent spécial café (Puly Caff).
2. Enclencher le groupe pendant 10 secondes, puis stopper 10 secondes. Répéter 5 fois.
3. Retirer le porte-filtre, rincer abondamment à l'eau chaude.
4. Nettoyer la buse vapeur et purger 3 secondes.
5. Laisser tremper les douchettes et filtres dans de l'eau tiède savonneuse toute la nuit.`,
    tags: ['bar', 'café', 'espresso', 'backflush'],
  },
  {
    title: 'Vue Éclatée & Commande de Pièces Détachées Agréées',
    type: 'SPARE_PARTS_LINK',
    authorType: 'VENDOR',
    authorName: 'Portail Pièces SAV',
    url: 'https://www.pieces-restauration.com',
    contentMarkdown: `Accès direct au catalogue de pièces certifiées constructeur (résistances, joints, thermostats, pompes de vidange, électrovannes).`,
    tags: ['pièces', 'sav', 'rechange', 'vue-éclatée'],
  },
];

/**
 * 📚 EquipmentKnowledgeService — Base de Connaissances, Guides, Tutos & Manuels
 */
export class EquipmentKnowledgeService {
  private static basePath(tenantId: string): string {
    return `tenants/${tenantId}/equipmentGuides`;
  }

  /**
   * Associe un nouveau guide ou tuto à un équipement.
   */
  static async addGuide(
    tenantId: string,
    equipmentId: string,
    data: Omit<EquipmentGuide, 'id' | 'equipmentId' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    operatorId: string = 'system'
  ): Promise<EquipmentGuide> {
    const id = `guide_${Date.now()}_${Math.random().toString(36).substring(6)}`;
    const now = new Date().toISOString();

    const guide: EquipmentGuide = EquipmentGuideSchema.parse({
      ...data,
      id,
      equipmentId,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    await Nexus.adapter.set(`${this.basePath(tenantId)}/${id}`, guide);

    NexusEventBus.emitDurable('facility.guide_attached', {
      tenantId,
      equipmentId,
      guideId: id,
      guideType: guide.type,
      title: guide.title,
      addedBy: operatorId,
    } as never);

    empireAudit.log({
      module: 'facility',
      action: 'EQUIPMENT_GUIDE_ADDED',
      details: { equipmentId, guideId: id, title: guide.title, type: guide.type },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[Knowledge] Guide "${guide.title}" attaché à l'équipement ${equipmentId}`);
    return guide;
  }

  /**
   * Récupère tous les guides et tutoriels associés à un équipement spécifique.
   */
  static async getGuidesForEquipment(tenantId: string, equipmentId: string): Promise<EquipmentGuide[]> {
    const all = await Nexus.adapter.query<EquipmentGuide>(this.basePath(tenantId), {
      where: [{ field: 'equipmentId', operator: '==', value: equipmentId }],
    });
    return all || [];
  }

  /**
   * Récupère un guide par son ID.
   */
  static async getGuideById(tenantId: string, guideId: string): Promise<EquipmentGuide | null> {
    return Nexus.adapter.get<EquipmentGuide>(`${this.basePath(tenantId)}/${guideId}`);
  }

  /**
   * Supprime un guide ou tutoriel.
   */
  static async deleteGuide(tenantId: string, guideId: string): Promise<boolean> {
    await Nexus.adapter.delete(`${this.basePath(tenantId)}/${guideId}`);
    return true;
  }

  /**
   * Initialise les guides et procédures par défaut adaptés à la catégorie d'une machine.
   */
  static async seedDefaultGuidesForCategory(
    tenantId: string,
    equipmentId: string,
    category: EquipmentCategory
  ): Promise<EquipmentGuide[]> {
    const created: EquipmentGuide[] = [];

    for (const template of DEFAULT_EQUIPMENT_GUIDE_TEMPLATES) {
      // Filtrage intelligent selon la catégorie
      if (category === 'BEVERAGE_COFFEE' && !template.tags.includes('café') && !template.tags.includes('pièces')) continue;
      if (category === 'COLD_STORAGE' && !template.tags.includes('froid') && !template.tags.includes('pièces')) continue;
      if (category === 'COOKING' && !template.tags.includes('quotidien') && !template.tags.includes('pièces')) continue;

      const guide = await this.addGuide(tenantId, equipmentId, template, 'system-seed');
      created.push(guide);
    }

    return created;
  }
}
