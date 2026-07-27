const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /@\/modules\/ops\/contexts\/FloorContext/g, to: '@/modules/ops/engine/contexts/FloorContext' },
  { from: /@\/modules\/ops\/prep\/prepForecast/g, to: '@/modules/ops/engine/services/prepForecast' },
  { from: /@\/modules\/ops\/providers\/nexus-contract/g, to: '@/modules/ops/providers/ops-contract' },
  { from: /@\/modules\/compliance\/contexts\/RegistreContext/g, to: '@/modules/compliance/haccp/contexts/RegistreContext' },
  { from: /@\/modules\/compliance\/hooks\/useHaccpPage/g, to: '@/modules/compliance/haccp/hooks/useHaccpPage' },
  { from: /@\/modules\/compliance\/components\/CleaningPlan/g, to: '@/modules/compliance/haccp/components/CleaningPlan' },
  { from: /@\/modules\/compliance\/components\/DLCTracker/g, to: '@/modules/compliance/haccp/components/DLCTracker' },
  { from: /@\/modules\/compliance\/components\/NF525SelfAudit/g, to: '@/modules/compliance/haccp/components/NF525SelfAudit' },
  { from: /@\/modules\/compliance\/components\/NonConformityForm/g, to: '@/modules/compliance/haccp/components/NonConformityForm' },
  { from: /@\/modules\/human\/domain\/hr\/LiquidStaffingEngine/g, to: '@/modules/human/hr/services/LiquidStaffingEngine' },
  { from: /@\/modules\/human\/hooks\/useStaffPage/g, to: '@/modules/human/hr/hooks/useStaffPage' },
  { from: /@\/modules\/human\/contexts\/PlanningContext/g, to: '@/modules/human/hr/contexts/PlanningContext' },
  { from: /@\/modules\/intelligence\/contexts\/IntelligenceContext/g, to: '@/modules/intelligence/analytics/contexts/IntelligenceContext' },
  { from: /@\/modules\/intelligence\/fleet\/providers\/NexusFleetProvider/g, to: '@/modules/intelligence/fleet/NexusFleetProvider' },
  { from: /@\/modules\/intelligence\/fleet\/providers\/MarketOracle/g, to: '@/modules/intelligence/fleet/MarketOracle' },
  { from: /@\/modules\/logistics\/migration\/ReservationHistoryImporter/g, to: '@/modules/commerce/reservations/migration/ReservationHistoryImporter' },
  { from: /@\/modules\/logistics\/hooks\/useOraclePrediction/g, to: '@/modules/logistics/hooks/useStockPrediction' },
  { from: /useOraclePrediction/g, to: 'useStockPrediction' } // Also replace the hook name call
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

processDirectory(directoryPath);
console.log("Done updating imports for Phase D.");
