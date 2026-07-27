"use client";

import { Transition } from "framer-motion";

export const easing = {
    easeOutExpo: [0.16, 1, 0.3, 1] as const,
    easeOutBack: [0.34, 1.56, 0.64, 1] as const,
    easeInOutQuint: [0.83, 0, 0.17, 1] as const,
    easeInExpo: [0.7, 0, 0.84, 0] as const,
    easeOutQuart: [0.25, 1, 0.5, 1] as const,
    spring: [0.4, 0.5, 0.3, 1.4] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    cinematic: [0.16, 1, 0.3, 1] as const,
};

export const duration = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.35,
    slow: 0.5,
    dramatic: 0.7,
};

export const springConfig = {
    gentle: { type: "spring", stiffness: 120, damping: 14 } as Transition,
    snappy: { type: "spring", stiffness: 300, damping: 20 } as Transition,
    bouncy: { type: "spring", stiffness: 400, damping: 10 } as Transition,
    smooth: { type: "spring", stiffness: 100, damping: 20 } as Transition,
};

export const mobileSpring = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.8
} as Transition;
