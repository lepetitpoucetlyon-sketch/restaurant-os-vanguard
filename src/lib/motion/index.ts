// @ts-nocheck
"use client";

export * from "./constants";
export * from "./variants";
export * from "./utilities";

// Re-export specific interactive helpers that were in motion.ts
export const buttonTap = {
    scale: 0.97,
    transition: { duration: 0.1 }
};

export const buttonHover = {
    scale: 1.02,
    transition: { duration: 0.2 }
};

export const cardHover = {
    y: -4,
    boxShadow: "0 20px 50px -15px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
};
