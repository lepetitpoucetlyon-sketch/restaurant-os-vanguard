/**
 * 🏭 SYNTHETIC DATASET GENERATOR FOR RESTAURANT OS SLM
 * 
 * Génère des milliers de paires d'entraînement (User Query -> Strict Tool Call JSON)
 * couvrant l'ensemble du catalogue d'actions de Restaurant OS avec contrôle RBAC.
 */

import * as fs from 'fs';
import * as path from 'path';
import { UNIVERSAL_ASSISTANT_TOOLS } from '../../src/modules/intelligence/services/AssistantActionDispatcher';

export interface TrainingSample {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

const SYSTEM_PROMPT = `Tu es l'IA Souveraine de Restaurant OS. Ton rôle est d'analyser l'instruction en français de l'utilisateur et d'émettre un appel d'outil JSON strict valide correspondant aux fonctions du système.
Tu dois TOUJOURS respecter les permissions RBAC (10: Opérateur, 40: Employé/Praticien, 70: Manager, 100: Propriétaire).
Format de sortie attendu: {"tool": "<tool_id>", "params": {<parameters>}} ou {"error": "RBAC_INSUFFICIENT_PERMISSION", "minRole": <level>} si le rôle est insuffisant.`;

const PROMPT_TEMPLATES: Record<string, (params: Record<string, any>) => string[]> = {
  get_stock_by_location: (p) => [
    `Qu'est-ce qu'il reste dans le ${p.locationName} ?`,
    `Fais-moi l'état du stock pour l'emplacement ${p.locationName}`,
    `Regarde dans ${p.locationName} ce qu'on a en réserve`,
    `Affiche les produits du ${p.locationName}`,
  ],
  fire_course_sequence: (p) => [
    `Envoie la suite pour la table ${p.tableId} : ${p.course}`,
    `Cuisine, envoyez les ${p.course} table ${p.tableId}`,
    `Passe la commande des ${p.course} pour la table ${p.tableId}`,
  ],
  get_haccp_temperatures: (p) => [
    `Donne-moi la température actuelle du ${p.equipmentName}`,
    `Quelle est la température relevée pour le ${p.equipmentName} ?`,
    `Vérifie la sonde IoT de ${p.equipmentName}`,
  ],
  query_financial_snapshot: (p) => [
    `Quel est le chiffre d'affaires de ${p.period} ?`,
    `Donne-moi le bilan financier pour ${p.period}`,
    `Affiche les ventes et la marge pour ${p.period}`,
    `Consulte le rapport financier ${p.period}`,
  ],
  trigger_stock_reorder: (p) => [
    `Recommande ${p.quantity} unités de l'article ${p.itemId}`,
    `Prépare un bon de commande fournisseur pour ${p.quantity} de ${p.itemId}`,
    `Il nous manque ${p.quantity} de ${p.itemId}, passe commande`,
  ],
  create_maintenance_ticket: (p) => [
    `Le ${p.equipmentName} est en panne, gravité ${p.severity} : ${p.description}`,
    `Signale un incident sur ${p.equipmentName} (${p.description})`,
    `Urgent : panne sur ${p.equipmentName} (${p.severity}), ${p.description}`,
  ],
  lock_space_or_table: (p) => [
    `Verrouille la table ${p.spaceId} pour ${p.reason}`,
    `Bloque l'espace ${p.spaceId} motif ${p.reason}`,
    `Passe la table ${p.spaceId} en indisponible car ${p.reason}`,
  ],
  navigate_to_module: (p) => [
    `Ouvre le module ${p.label || p.targetPath}`,
    `Emmène-moi sur ${p.targetPath}`,
    `Affiche l'écran ${p.targetPath}`,
  ],
};

const MOCK_VALUES = {
  locations: ['Frigo 1', 'Frigo 4', 'Chambre Froide Positive', 'Chambre Négative', 'Cave à Vins', 'Réserve Sèche'],
  courses: ['plats', 'desserts', 'entrées', 'fromages', 'cafés'],
  tables: ['1', '4', '12', '14', 'VIP-1', 'Terrasse-3'],
  periods: ['today', 'yesterday', 'this_week', 'this_month', '2026-08'],
  items: ['saumon_label_rouge', 'steak_hache_150g', 'creme_fraiche_35', 'beurre_aop', 'tomates_grappe', 'farine_t65'],
  equipment: ['Fournil Principal', 'Machine Espresso', 'TPE Caisse 1', 'Friteuse Double', 'Chambre Froide N°2'],
  severities: ['low', 'medium', 'critical'],
  descriptions: ['ne s\'allume plus', 'fuite d\'eau', 'température anormale (+8°C)', 'bruit suspect du moteur'],
  reasons: ['Réservation VIP', 'Nettoyage en cours', 'Table réservée au gérant', 'Maintenance'],
  paths: ['/pos', '/inventory', '/fec', '/staff', '/haccp', '/operations', '/marketing'],
};

export function generateSyntheticDataset(samplesCount = 5000): TrainingSample[] {
  const dataset: TrainingSample[] = [];

  for (let i = 0; i < samplesCount; i++) {
    const toolKeys = Object.keys(UNIVERSAL_ASSISTANT_TOOLS);
    const toolId = toolKeys[Math.floor(Math.random() * toolKeys.length)];
    const toolDef = UNIVERSAL_ASSISTANT_TOOLS[toolId];

    // Génération de paramètres factices
    const params: Record<string, any> = {};
    if (toolId === 'get_stock_by_location') params.locationName = MOCK_VALUES.locations[i % MOCK_VALUES.locations.length];
    else if (toolId === 'fire_course_sequence') {
      params.tableId = MOCK_VALUES.tables[i % MOCK_VALUES.tables.length];
      params.course = MOCK_VALUES.courses[i % MOCK_VALUES.courses.length];
    } else if (toolId === 'get_haccp_temperatures') params.equipmentName = MOCK_VALUES.locations[i % MOCK_VALUES.locations.length];
    else if (toolId === 'query_financial_snapshot') params.period = MOCK_VALUES.periods[i % MOCK_VALUES.periods.length];
    else if (toolId === 'trigger_stock_reorder') {
      params.itemId = MOCK_VALUES.items[i % MOCK_VALUES.items.length];
      params.quantity = Math.floor(Math.random() * 20) + 1;
    } else if (toolId === 'create_maintenance_ticket') {
      params.equipmentName = MOCK_VALUES.equipment[i % MOCK_VALUES.equipment.length];
      params.severity = MOCK_VALUES.severities[i % MOCK_VALUES.severities.length];
      params.description = MOCK_VALUES.descriptions[i % MOCK_VALUES.descriptions.length];
    } else if (toolId === 'lock_space_or_table') {
      params.spaceId = MOCK_VALUES.tables[i % MOCK_VALUES.tables.length];
      params.reason = MOCK_VALUES.reasons[i % MOCK_VALUES.reasons.length];
    } else if (toolId === 'navigate_to_module') {
      params.targetPath = MOCK_VALUES.paths[i % MOCK_VALUES.paths.length];
      params.label = params.targetPath.replace('/', '');
    } else {
      params.targetPath = '/pos';
    }

    // Détermination du rôle utilisateur simulé (10, 40, 70 ou 100)
    const userRole = [10, 40, 70, 100][Math.floor(Math.random() * 4)];
    const isPermissionGranted = userRole >= toolDef.minRoleLevel;

    // Formulation du prompt
    const templateFn = PROMPT_TEMPLATES[toolId] || PROMPT_TEMPLATES.navigate_to_module;
    const prompts = templateFn(params);
    const userPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    let assistantResponse = '';
    if (isPermissionGranted) {
      assistantResponse = JSON.stringify({
        tool: toolDef.id,
        params,
      });
    } else {
      assistantResponse = JSON.stringify({
        error: 'RBAC_INSUFFICIENT_PERMISSION',
        requiredMinRole: toolDef.minRoleLevel,
        userRole,
        message: `Accès refusé : votre rôle (${userRole}) est insuffisant pour exécuter cette action (requis: ${toolDef.minRoleLevel}).`,
      });
    }

    dataset.push({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${userPrompt} [UserRoleLevel: ${userRole}]` },
        { role: 'assistant', content: assistantResponse },
      ],
    });
  }

  return dataset;
}

if (require.main === module) {
  const outputDir = path.resolve(__dirname, '../../data/slm-dataset');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'restaurant_os_slm_train.jsonl');
  const dataset = generateSyntheticDataset(5000);

  const fileStream = fs.createWriteStream(outputPath);
  for (const sample of dataset) {
    fileStream.write(JSON.stringify(sample) + '\n');
  }
  fileStream.end();

  console.log(`✅ Dataset généré avec succès : ${dataset.length} exemples écrits dans ${outputPath}`);
}
