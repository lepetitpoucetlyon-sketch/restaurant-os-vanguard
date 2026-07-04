// Responsive hooks
export { useMediaQuery, useResponsive, BREAKPOINTS } from "./useMediaQuery";
export { useIsMobile, useIsTablet, useIsDesktop } from "./useIsMobile";

// Phase 5 - Custom hooks
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

// Phase 6 - Performance hooks
export { useIntersectionObserver, useLazyImage } from "./useIntersectionObserver";
export { useEventCallback, useDeepMemo, useRenderCount, usePerformanceMeasure } from "./usePerformance";
export { useVirtualizedList, useInfiniteScroll } from "./useVirtualization";


// 🏛️ Sovereign Core Hooks (Grade X)
export { 
    useNexusCore,
    useAuth,
    useUI,
    useTenant,
    useSettings,
    useLanguage,
    useNotifications
} from "@/engines/core/NexusCoreProvider";
