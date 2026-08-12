// ==========================================================================
// lib/hooks — hooks utilitaires génériques (sans dépendance pilier/nexus)
// Rapatriés depuis src/shared/hooks/ (étape 3 vidage shared/).
// ==========================================================================

// Responsive
export { useMediaQuery, useResponsive, BREAKPOINTS } from "./useMediaQuery";
export { useIsMobile, useIsTablet, useIsDesktop } from "./useIsMobile";

// State / async
export { useAsync } from "./useAsync";
export { useDisclosure } from "./useDisclosure";
export { usePagination } from "./usePagination";
export { useSorting } from "./useSorting";
export { useFiltering } from "./useFiltering";
export { useDebounce, useDebouncedCallback } from "./useDebounce";
export { useClickOutside, useEscapeKey } from "./useInteractions";
export { useLocalStorage, useSessionStorage } from "./useStorage";
export { useList } from "./useList";
export { useHasMounted } from "./useHasMounted";

// Performance
export { useIntersectionObserver, useLazyImage } from "./useIntersectionObserver";
export { useEventCallback, useDeepMemo, useRenderCount, usePerformanceMeasure } from "./usePerformance";
export { useVirtualizedList, useInfiniteScroll } from "./useVirtualization";
export { useVisibilityPurge } from "./useVisibilityPurge";
