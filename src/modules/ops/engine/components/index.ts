// Barrel — manual (Grade X Smart Seal removed intentionally).
// './floor-plan' export dropped: it pulls konva + react-reconciler (~1.2MB) into every
// bundle importing @modules/ops. Import FloorPlanEditor directly via next/dynamic instead:
//   const FloorPlanEditor = dynamic(() => import('@modules/ops/engine/components/floor-plan/FloorPlanEditor').then(m => m.FloorPlanEditor), { ssr: false })

export * from './dashboard';
export * from './registre';
