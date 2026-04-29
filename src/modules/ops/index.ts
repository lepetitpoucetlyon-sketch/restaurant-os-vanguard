/**
 * 🍱 Ops Bridge Module - Public API
 * Orchestrates orders, reservations, and real-time floor operations.
 */

export { 
  useOrders, 
  useReservations, 
  useTables, 
  useKitchen, 
  usePOSController, 
  useNexusOps,
  useOperationalNodes,
  useFloorOps,
  useRecipes,
  useMarketing,
  useHR,
  useCRM,
  useProducts,
  useCategories,
  useFiscal,
  useInventory,
  useIntelligence,
  useManagement,
  useQuotes,
  useAllocations,
  useGroups
} from '@/engines/ops/NexusOpsProvider';

export * from './types';
export * from './store/orderAtoms';
export * from './store/posAtoms';
export * from './store/reservationAtoms';
