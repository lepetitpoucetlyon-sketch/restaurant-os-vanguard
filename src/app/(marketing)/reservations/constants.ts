// @ts-nocheck
import { Variants } from "framer-motion";
import { easing } from "@/lib/motion";

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
        { id: "V1", seats: 4, type: 'vip', status: 'occupied', number: "V1" },
        { id: "V2", seats: 2, type: 'vip', status: 'reserved', number: "V2" },
        { id: "V3", seats: 6, type: 'vip', status: 'available', number: "V3" },
    ],
    "TERRACE": [
        { id: "T1", seats: 2, type: 'terrace', status: 'available', number: "T1" },
        { id: "T2", seats: 4, type: 'terrace', status: 'occupied', number: "T2" },
        { id: "T3", seats: 4, type: 'terrace', status: 'available', number: "T3" },
        { id: "T4", seats: 2, type: 'terrace', status: 'available', number: "T4" },
    ],
    "STANDARD": [
        { id: "1", seats: 2, type: 'standard', status: 'reserved', number: "1" },
        { id: "2", seats: 4, type: 'standard', status: 'occupied', number: "2" },
        { id: "3", seats: 4, type: 'standard', status: 'available', number: "3" },
        { id: "4", seats: 6, type: 'standard', status: 'available', number: "4" },
        { id: "5", seats: 8, type: 'standard', status: 'available', number: "5" },
        { id: "6", seats: 4, type: 'standard', status: 'reserved', number: "6" },
    ]
};
