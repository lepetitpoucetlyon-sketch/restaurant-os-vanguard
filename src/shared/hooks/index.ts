// Responsive hooks
export { useMediaQuery, useResponsive, BREAKPOINTS } from "@/lib/hooks/useMediaQuery";
export { useIsMobile, useIsTablet, useIsDesktop } from "@/lib/hooks/useIsMobile";

// Phase 5 - Custom hooks
export { useAsync } from "@/lib/hooks/useAsync";
export { useDisclosure } from "@/lib/hooks/useDisclosure";
export { usePagination } from "@/lib/hooks/usePagination";
export { useSorting } from "@/lib/hooks/useSorting";
export { useFiltering } from "@/lib/hooks/useFiltering";
export { useDebounce, useDebouncedCallback } from "@/lib/hooks/useDebounce";
export { useClickOutside, useEscapeKey } from "@/lib/hooks/useInteractions";
export { useLocalStorage, useSessionStorage } from "@/lib/hooks/useStorage";
export { useList } from "@/lib/hooks/useList";
export { useHasMounted } from "@/lib/hooks/useHasMounted";

// Phase 6 - Performance hooks
export { useIntersectionObserver, useLazyImage } from "@/lib/hooks/useIntersectionObserver";
export { useEventCallback, useDeepMemo, useRenderCount, usePerformanceMeasure } from "@/lib/hooks/usePerformance";
export { useVirtualizedList, useInfiniteScroll } from "@/lib/hooks/useVirtualization";


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
} from "@/kernel/providers/NexusCoreContext";
export { useTenant } from "@/shared/hooks/useTenant";
// useConnector déplacé vers @/modules/intelligence/connectors/hub/hooks/useConnector
export type { UseConnectorResult } from './useConnector';
