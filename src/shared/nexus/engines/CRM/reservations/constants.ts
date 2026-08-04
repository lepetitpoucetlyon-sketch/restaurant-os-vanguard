import { Variants } from "framer-motion";
import { easing } from "@/shared/utils/motion";

export const cinematicContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const cinematicItem: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: easing.easeOutExpo }
    }
};

export const TABLES_DATA = {
    "VIP": [
        { id: "V1", seats: 4, type: 'vip' as const, status: 'seated' as const, number: "V1", shape: 'rect' as const, x: 100, y: 100, zoneId: 'VIP' },
        { id: "V2", seats: 2, type: 'vip' as const, status: 'reserved' as const, number: "V2", shape: 'circle' as const, x: 300, y: 100, zoneId: 'VIP' },
        { id: "V3", seats: 6, type: 'vip' as const, status: 'free' as const, number: "V3", shape: 'rect' as const, x: 500, y: 100, zoneId: 'VIP' },
    ],
    "TERRACE": [
        { id: "T1", seats: 2, type: 'terrace' as const, status: 'free' as const, number: "T1", shape: 'rect' as const, x: 100, y: 300, zoneId: 'TERRACE' },
        { id: "T2", seats: 4, type: 'terrace' as const, status: 'seated' as const, number: "T2", shape: 'rect' as const, x: 300, y: 300, zoneId: 'TERRACE' },
        { id: "T3", seats: 4, type: 'terrace' as const, status: 'free' as const, number: "T3", shape: 'circle' as const, x: 500, y: 300, zoneId: 'TERRACE' },
        { id: "T4", seats: 2, type: 'terrace' as const, status: 'free' as const, number: "T4", shape: 'rect' as const, x: 700, y: 300, zoneId: 'TERRACE' },
    ],
    "STANDARD": [
        { id: "1", seats: 2, type: 'standard' as const, status: 'reserved' as const, number: "1", shape: 'rect' as const, x: 100, y: 500, zoneId: 'STANDARD' },
        { id: "2", seats: 4, type: 'standard' as const, status: 'seated' as const, number: "2", shape: 'rect' as const, x: 300, y: 500, zoneId: 'STANDARD' },
        { id: "3", seats: 4, type: 'standard' as const, status: 'free' as const, number: "3", shape: 'circle' as const, x: 500, y: 500, zoneId: 'STANDARD' },
        { id: "4", seats: 6, type: 'standard' as const, status: 'free' as const, number: "4", shape: 'rect' as const, x: 700, y: 500, zoneId: 'STANDARD' },
        { id: "5", seats: 8, type: 'standard' as const, status: 'free' as const, number: "5", shape: 'rect' as const, x: 900, y: 500, zoneId: 'STANDARD' },
        { id: "6", seats: 4, type: 'standard' as const, status: 'reserved' as const, number: "6", shape: 'circle' as const, x: 1100, y: 500, zoneId: 'STANDARD' },
    ]
};
