import {
  FaultDiagnosticRule,
  EquipmentCategory,
  FaultSeverity,
} from '../assets/domain/schemas/equipment';
import { EquipmentAssetService } from './EquipmentAssetService';
import { logger } from '@/lib/logger';

/**
 * 📚 Dictionnaire des codes erreurs et arbres de diagnostic constructeurs
 */
export const FAULT_DIAGNOSTIC_DATABASE: FaultDiagnosticRule[] = [
  // ── CUISSON : Fours Mixtes (Rational / Unox / Convotherm) ──────────────────
  {
    id: 'diag_rational_e12',
    equipmentCategory: 'COOKING',
    brand: 'Rational',
    errorCode: 'E12',
    symptom: 'Erreur de sonde de température d ambiance ou surchauffe cuve',
    possibleCauses: [
      'Sonde d ambiance encrassée par des graisses carbonisées',
      'Câble de sonde sectionné ou déconnecté',
      'Ventilateur de brassage bloqué ou ralenti',
    ],
    quickFixSteps: [
      '1. Éteindre le four au disjoncteur mural pendant 2 minutes pour réinitialiser le contrôleur.',
      '2. Vérifier que la turbine du ventilateur tourne librement à la main (four froid !).',
      '3. Nettoyer délicatement la sonde métallique située à l arrière de la cavité avec de l eau tiède savonneuse.',
      '4. Si l erreur persiste au redémarrage, couper l alimentation et contacter le SAV agréé.',
    ],
    technicianRequired: true,
    severity: 'critical',
  },
  {
    id: 'diag_rational_e17',
    equipmentCategory: 'COOKING',
    brand: 'Rational',
    errorCode: 'E17',
    symptom: 'Erreur d alimentation en eau ou débit insuffisant',
    possibleCauses: [
      'Robinet d arrivée d eau fermé ou vanne quart-de-tour pincée',
      'Cartouche d adoucisseur/filtre à eau saturée (baisse de pression)',
      'Électrovanne d admission d eau entartrée',
    ],
    quickFixSteps: [
      '1. Vérifier que le robinet d arrivée d eau général derrière le four est totalement ouvert.',
      '2. Vérifier le manomètre du filtre Brita/BWT : la pression doit être entre 1.5 et 6 bars.',
      '3. Dévisser le tuyau d arrivée d eau et nettoyer le petit filtre tamis à l entrée de l électrovanne.',
    ],
    technicianRequired: false,
    severity: 'degraded',
  },

  // ── FROID : Chambres Froides & Armoires Réfrigérées (True / Foster / Franstal)
  {
    id: 'diag_cold_e01',
    equipmentCategory: 'COLD_STORAGE',
    errorCode: 'E01',
    symptom: 'Température anormale / Alarme haute température (T > +8°C)',
    possibleCauses: [
      'Condenseur extérieur obstrué par la poussière ou la farine',
      'Porte mal fermée ou joint magnétique décollé',
      'Cycle de dégivrage automatique en cours ou résistance de dégivrage bloquée',
    ],
    quickFixSteps: [
      '1. Dépoussiérer la grille du condenseur avec une brosse souple ou un aspirateur.',
      '2. Vérifier la fermeture hermétique du joint de porte (glisser une feuille de papier : elle ne doit pas glisser).',
      '3. Attendre 30 minutes sans ouvrir la porte pour observer si la température redescend.',
      '4. Si la température continue de monter au-delà de +10°C, transférer immédiatement les denrées vers une autre enceinte froide.',
    ],
    technicianRequired: true,
    severity: 'critical',
  },
  {
    id: 'diag_cold_ice',
    equipmentCategory: 'COLD_STORAGE',
    symptom: 'Prise en glace massive de l évaporateur intérieur',
    possibleCauses: [
      'Écoulement des condensats bouché',
      'Entrée d air permanente (joint fuyard)',
      'Sonde de fin de dégivrage défectueuse',
    ],
    quickFixSteps: [
      '1. Lancer un dégivrage manuel forcé en appuyant 5 secondes sur la touche "DEFROST" du régulateur.',
      '2. Vérifier que la pipette d écoulement au fond de l armoire n est pas obstruée.',
      '3. Si la glace persiste, couper le groupe frigorifique pendant 4h en plaçant des bacs de récupération.',
    ],
    technicianRequired: false,
    severity: 'degraded',
  },

  // ── LAVAGE : Lave-vaisselle à capot & Lave-verres (Hobart / Winterhalter / Meiko)
  {
    id: 'diag_wash_err03',
    equipmentCategory: 'WASHING',
    errorCode: 'Err03',
    symptom: 'Vidange impossible / Cuve pleine d eau en fin de cycle',
    possibleCauses: [
      'Filtre de fond de cuve obstrué par des résidus alimentaires (pépins, cure-dents, serviettes)',
      'Tuyau de vidange coudé sous la machine',
      'Pompe de vidange bloquée par un corps étranger',
    ],
    quickFixSteps: [
      '1. Retirer les paniers et les filtres métalliques de la cuve.',
      '2. Nettoyer et brosser le filtre cylindrique sous l eau claire.',
      '3. Vérifier visuellement l entrée de la turbine de pompe au fond du puits (retirer tout débris).',
      '4. Relancer un cycle d auto-nettoyage et vidange.',
    ],
    technicianRequired: false,
    severity: 'degraded',
  },

  // ── CAFÉ & BOISSONS : Machine Espresso (La Marzocco / Sanremo / Conti) ───────
  {
    id: 'diag_coffee_flow',
    equipmentCategory: 'BEVERAGE_COFFEE',
    symptom: 'Débit café goutte-à-goutte ou alarme débitmétrique clignotante',
    possibleCauses: [
      'Mouture de café trop fine ou doseur surdosé',
      'Douchette de groupe complètement entartrée ou colmatée d huiles de café',
      'Pression de pompe rotative insuffisante (< 9 bars)',
    ],
    quickFixSteps: [
      '1. Dévisser la douchette du groupe et la nettoyer dans un bain de Puly Caff.',
      '2. Régler le moulin vers une mouture plus grossière (1 à 2 crans).',
      '3. Effectuer un backflush complet avec filtre aveugle.',
      '4. Vérifier la pression sur le manomètre pendant l extraction (doit se situer à 9 bars).',
    ],
    technicianRequired: false,
    severity: 'minor',
  },

  // ── POS & HARDWARE : TPE & Imprimantes Thermiques ──────────────────────────
  {
    id: 'diag_pos_printer_jam',
    equipmentCategory: 'POS_HARDWARE',
    symptom: 'Imprimante ticket caisse hors-ligne ou voyant rouge clignotant',
    possibleCauses: [
      'Rouleau de papier thermique vide ou mal positionné (papier à l envers)',
      'Capot supérieur mal enclenché',
      'Bourrage papier coincé dans le massicot automatique',
    ],
    quickFixSteps: [
      '1. Ouvrir le capot de l imprimante, retirer le rouleau.',
      '2. Vérifier le sens du papier (la face thermique sensible doit être vers le haut).',
      '3. Retirer tout fragment de papier coincé dans les lames du cutter.',
      '4. Refermer fermement le capot jusqu au "clic" et appuyer sur FEED.',
    ],
    technicianRequired: false,
    severity: 'minor',
  },
];

export interface DiagnosticEvaluationResult {
  matchedRule?: FaultDiagnosticRule;
  confidence: 'EXACT_ERROR_CODE' | 'SYMPTOM_MATCH' | 'GENERAL_ADVICE';
  recommendedActions: string[];
  severity: FaultSeverity;
  technicianRequired: boolean;
  message: string;
}

/**
 * 🚨 EquipmentDiagnosticService — Moteur Intelligent de Diagnostic de Pannes
 */
export class EquipmentDiagnosticService {
  /**
   * Analyse une panne d'après un code erreur constructeur ou une description de symptôme.
   */
  static diagnoseFault(
    category: EquipmentCategory,
    errorCode?: string,
    symptomQuery?: string
  ): DiagnosticEvaluationResult {
    const rules = FAULT_DIAGNOSTIC_DATABASE.filter((r) => r.equipmentCategory === category);

    // 1. Recherche par Code Erreur Exact
    if (errorCode && errorCode.trim()) {
      const cleanCode = errorCode.trim().toUpperCase();
      const match = rules.find((r) => r.errorCode?.toUpperCase() === cleanCode);
      if (match) {
        return {
          matchedRule: match,
          confidence: 'EXACT_ERROR_CODE',
          recommendedActions: match.quickFixSteps,
          severity: match.severity,
          technicianRequired: match.technicianRequired,
          message: `Code erreur ${match.errorCode} identifié : ${match.symptom}.`,
        };
      }
    }

    // 2. Recherche intelligente par Mots-Clés dans les Symptômes & Causes
    if (symptomQuery && symptomQuery.trim()) {
      const q = symptomQuery.toLowerCase();
      const queryWords = q
        .split(/[\s,./;:!?]+/)
        .filter((w) => w.length >= 3);

      // Score de pertinence basé sur le nombre de mots-clés correspondants
      let bestMatch: FaultDiagnosticRule | undefined;
      let highestScore = 0;

      for (const r of rules) {
        const textToSearch = [
          r.symptom.toLowerCase(),
          r.errorCode?.toLowerCase() || '',
          ...r.possibleCauses.map((c) => c.toLowerCase()),
        ].join(' ');

        let matchCount = 0;
        for (const word of queryWords) {
          if (textToSearch.includes(word)) {
            matchCount++;
          }
        }

        if (matchCount > highestScore && matchCount >= 1) {
          highestScore = matchCount;
          bestMatch = r;
        }
      }

      if (bestMatch && highestScore >= 1) {
        return {
          matchedRule: bestMatch,
          confidence: 'SYMPTOM_MATCH',
          recommendedActions: bestMatch.quickFixSteps,
          severity: bestMatch.severity,
          technicianRequired: bestMatch.technicianRequired,
          message: `Diagnostic potentiel trouvé : ${bestMatch.symptom}.`,
        };
      }
    }

    // 3. Conseils généraux de sécurité
    return {
      confidence: 'GENERAL_ADVICE',
      recommendedActions: [
        '1. Couper l alimentation électrique de l appareil pendant 60 secondes pour réinitialiser la carte électronique.',
        '2. Inspecter visuellement l appareil (pas de fuite d eau, de fumée, de câble endommagé ou d odeur de brûlé).',
        '3. Vérifier les arrivées d eau, de gaz ou de réseau selon la nature de l équipement.',
        '4. Si le problème persiste, déclarer l incident sur Restaurant OS pour alerter le manager et le technicien.',
      ],
      severity: 'degraded',
      technicianRequired: true,
      message: 'Aucun code spécifique répertorié. Suivez les consignes de sécurité standard.',
    };
  }

  /**
   * Diagnostique une panne et génère automatiquement un ticket d'incident si nécessaire.
   */
  static async diagnoseAndReport(
    tenantId: string,
    equipmentId: string,
    data: {
      category: EquipmentCategory;
      errorCode?: string;
      symptom: string;
      operatorId: string;
      createBreakdownTicket?: boolean;
    }
  ) {
    const result = this.diagnoseFault(data.category, data.errorCode, data.symptom);

    let breakdownTicket = null;
    if (data.createBreakdownTicket) {
      breakdownTicket = await EquipmentAssetService.declareBreakdown(tenantId, equipmentId, {
        symptom: data.symptom,
        severity: result.severity,
        errorCode: data.errorCode,
        declaredBy: data.operatorId,
      });
    }

    logger.info(`[Diagnostic] Diagnostic exécuté pour équipement ${equipmentId} (${result.confidence})`);
    return {
      evaluation: result,
      breakdownTicket,
    };
  }
}
