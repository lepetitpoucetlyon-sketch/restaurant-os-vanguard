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
export { useFocusTrap } from "./useFocusTrap";

// Phase 6 - Performance hooks
export { useIntersectionObserver, useLazyImage } from "./useIntersectionObserver";
export { useEventCallback, useDeepMemo, useRenderCount, usePerformanceMeasure } from "./usePerformance";
export { useVirtualizedList, useInfiniteScroll } from "./useVirtualization";


// Permissions
export { useActionPermission } from "./useActionPermission";
export { useTabAccess } from "./useTabAccess";

// 🏛️ Sovereign Core Hooks (Grade X)
export { useNexusStatus } from "./useNexusStatus";
export {
    useNexusCore,
    useAuth,
    useUI,
    useSettings,
    useLanguage,
    useNotifications
} from "@/shared/providers/NexusCoreContext";
export { useTenant } from "@/shared/hooks/useTenant";
export { useConnector } from './useConnector';
export type { UseConnectorResult } from './useConnector';
