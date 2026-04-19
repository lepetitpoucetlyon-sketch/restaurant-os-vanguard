"use client";

import { Variants } from "framer-motion";
import { easing, duration, springConfig, mobileSpring } from "./constants";

// --- FADE ---
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: duration.fast }
    }
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        y: 10,
        transition: { duration: duration.fast }
    }
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: duration.fast }
    }
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: { duration: duration.fast }
    }
};

// --- SCALE ---
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: duration.fast }
    }
};

export const scaleInBounce: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: springConfig.bouncy
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: duration.fast }
    }
};

// --- SLIDE ---
export const slideInRight: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        x: "100%",
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

export const slideInLeft: Variants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        x: "-100%",
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

export const slideInBottom: Variants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        y: "100%",
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

export const slideInTop: Variants = {
    hidden: { y: "-100%", opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    },
    exit: {
        y: "-100%",
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

// --- STAGGER ---
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.03,
            staggerDirection: -1
        }
    }
};

export const staggerContainerSlow: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15
        }
    }
};

export const cinematicContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
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

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.normal, ease: easing.easeOutExpo }
    }
};

// --- MODAL / OVERLAY ---
export const modalBackdrop: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: duration.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.fast, delay: 0.1 }
    }
};

export const modalContent: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springConfig.gentle
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: duration.fast }
    }
};

export const modalCinematic: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: 100,
        rotateX: 15,
        filter: "blur(10px)"
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 200,
            mass: 0.8
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 50,
        filter: "blur(5px)",
        transition: { duration: duration.normal, ease: easing.easeInExpo }
    }
};

// --- TOAST ---
export const toastVariants: Variants = {
    hidden: {
        opacity: 0,
        x: 50,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: springConfig.snappy
    },
    exit: {
        opacity: 0,
        x: 50,
        scale: 0.95,
        transition: { duration: duration.fast }
    }
};

// --- MOBILE ---
export const drawerVariants: Variants = {
    hidden: {
        y: "100%",
        opacity: 0.8
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: mobileSpring
    },
    exit: {
        y: "100%",
        opacity: 0,
        transition: { duration: duration.fast, ease: easing.easeInExpo }
    }
};

export const fabVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 500, damping: 25 }
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

// --- PAGE TRANSITIONS ---
export const pageTransition: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration.normal,
            ease: easing.easeOutExpo,
            staggerChildren: 0.05
        }
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: { duration: duration.fast }
    }
};
