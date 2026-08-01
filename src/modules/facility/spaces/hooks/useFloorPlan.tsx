// Proxy : le hook floor-plan reste dans ops/ car il dépend de guardedAction + store atoms ops
// facility/ expose le contrat public pour les consommateurs externes
// eslint-disable-next-line no-restricted-imports
export { useOperationalNodes, useTables, useFloorOpsValue } from '@/modules/ops';
