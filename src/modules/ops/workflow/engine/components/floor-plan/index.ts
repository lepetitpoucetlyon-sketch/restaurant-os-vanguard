// Re-export from canonical location (facility pillar) via root barrel.
// FloorPlanEditor est volontairement absent : il tire konva + react-konva.
// Le charger via next/dynamic depuis l'ecran qui l'affiche.
export { type FloorPlanEditorRef, FloorPlanHeader } from '@/modules/facility';
