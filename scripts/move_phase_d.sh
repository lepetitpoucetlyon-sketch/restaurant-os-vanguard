#!/bin/bash
set -e

echo "Phase D1: OPS"
mkdir -p src/modules/ops/engine/contexts
mkdir -p src/modules/ops/engine/services
mv src/modules/ops/contexts/FloorContext.tsx src/modules/ops/engine/contexts/ 2>/dev/null || true
mv src/modules/ops/prep/prepForecast.ts src/modules/ops/engine/services/ 2>/dev/null || true
rm -rf src/modules/ops/prep
mv src/modules/ops/providers/nexus-contract.ts src/modules/ops/providers/ops-contract.ts 2>/dev/null || true

echo "Phase D2: COMPLIANCE"
mkdir -p src/modules/compliance/haccp/contexts
mkdir -p src/modules/compliance/haccp/hooks
mkdir -p src/modules/compliance/haccp/components
mv src/modules/compliance/contexts/RegistreContext.tsx src/modules/compliance/haccp/contexts/ 2>/dev/null || true
mv src/modules/compliance/hooks/useHaccpPage.ts src/modules/compliance/haccp/hooks/ 2>/dev/null || true
mv src/modules/compliance/components/CleaningPlan.tsx src/modules/compliance/haccp/components/ 2>/dev/null || true
mv src/modules/compliance/components/DLCTracker.tsx src/modules/compliance/haccp/components/ 2>/dev/null || true
mv src/modules/compliance/components/NF525SelfAudit.tsx src/modules/compliance/haccp/components/ 2>/dev/null || true
mv src/modules/compliance/components/NonConformityForm.tsx src/modules/compliance/haccp/components/ 2>/dev/null || true

echo "Phase D3: HUMAN"
mkdir -p src/modules/human/hr/services
mkdir -p src/modules/human/hr/hooks
mkdir -p src/modules/human/hr/contexts
mv src/modules/human/domain/hr/LiquidStaffingEngine.ts src/modules/human/hr/services/ 2>/dev/null || true
mv src/modules/human/hooks/useStaffPage.ts src/modules/human/hr/hooks/ 2>/dev/null || true
mv src/modules/human/contexts/PlanningContext.tsx src/modules/human/hr/contexts/ 2>/dev/null || true

echo "Phase D4: INTELLIGENCE"
mkdir -p src/modules/intelligence/analytics/contexts
mv src/modules/intelligence/contexts/IntelligenceContext.tsx src/modules/intelligence/analytics/contexts/ 2>/dev/null || true
mv src/modules/intelligence/fleet/providers/* src/modules/intelligence/fleet/ 2>/dev/null || true
rm -rf src/modules/intelligence/fleet/providers

echo "Phase D5: LOGISTICS"
mkdir -p src/modules/commerce/reservations/migration
mv src/modules/logistics/migration/ReservationHistoryImporter.ts src/modules/commerce/reservations/migration/ 2>/dev/null || true
mv src/modules/logistics/hooks/useOraclePrediction.ts src/modules/logistics/hooks/useStockPrediction.ts 2>/dev/null || true

echo "Phase D completed"
