// Barrel — manual (Grade X Smart Seal removed intentionally).
// './floor-plan' export dropped: it pulls konva + react-reconciler (~1.2MB) into every
// bundle importing @modules/ops. Import FloorPlanEditor directly via next/dynamic instead:
//   const FloorPlanEditor = dynamic(() => import('@modules/ops/workflow/engine/components/floor-plan/FloorPlanEditor').then(m => m.FloorPlanEditor), { ssr: false })

export * from './dashboard';
// Re-export from canonical location (facility pillar)
// eslint-disable-next-line no-restricted-imports
// eslint-disable-next-line no-restricted-imports -- cycle prevention: facility/spaces/hooks re-exports from ops barrel
export * from '@/modules/facility/maintenance/registre';
