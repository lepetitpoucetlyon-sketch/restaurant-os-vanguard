// src/shared/nexus/tokens/motion.ts
// MOTION PROFILE — Taste-Skill §1 MOTION_INTENSITY cadran.
// Centralizes all animation parameters. Respects prefers-reduced-motion (WCAG 2.3.3).

export type MotionIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface MotionProfile {
  /** Taste-Skill cadran value 1-10 */
  intensity: MotionIntensity;
  /** Whether the user prefers reduced motion */
  prefersReduced: boolean;

  /** Standard transition durations in ms */
  duration: {
    instant: number;
    fast:    number;
    normal:  number;
    slow:    number;
  };

  /** CSS easing curves */
  easing: {
    smooth: string;
    bounce: string;
    sharp:  string;
  };

  /** Scale factor on active/tap — Taste-Skill §4.5 "Tactile Feedback" */
  tapScale: number;

  /** Translate-Y on hover for lift effect */
  hoverLift: string;

  /** Page transition style */
  pageTransition: 'none' | 'fade' | 'slide';
}

/**
 * Resolves a MotionProfile from an intensity level.
 * If prefersReduced is true, motion is minimized regardless of intensity.
 */
export function resolveMotionProfile(
  intensity: MotionIntensity,
  prefersReduced: boolean,
): MotionProfile {
  if (prefersReduced) {
    return {
      intensity: 1,
      prefersReduced: true,
      duration:  { instant: 0, fast: 0, normal: 0, slow: 0 },
      easing:    { smooth: 'linear', bounce: 'linear', sharp: 'linear' },
      tapScale:  1,
      hoverLift: '0px',
      pageTransition: 'none',
    };
  }

  // Scale durations based on intensity (higher = more dramatic)
  const baseDuration = 100 + (intensity * 20); // 120ms at 1, 300ms at 10

  return {
    intensity,
    prefersReduced: false,
    duration: {
      instant: Math.round(baseDuration * 0.3),
      fast:    Math.round(baseDuration * 0.6),
      normal:  baseDuration,
      slow:    Math.round(baseDuration * 2),
    },
    easing: {
      smooth: intensity <= 5
        ? 'cubic-bezier(0.4, 0, 0.2, 1)'
        : 'cubic-bezier(0.22, 1, 0.36, 1)',
      bounce: intensity >= 7
        ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        : 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 1, 1)',
    },
    tapScale: intensity <= 4 ? 0.98 : 0.97,
    hoverLift: intensity >= 5 ? '-2px' : '0px',
    pageTransition: intensity <= 3 ? 'none' : intensity <= 7 ? 'fade' : 'slide',
  };
}

/**
 * Maps UXProfileType to a default motion intensity cadran.
 */
export function resolveMotionIntensityFromProfile(profileType: string): MotionIntensity {
  switch (profileType) {
    case 'dark_kitchen':   return 3;
    case 'fast_food':      return 4;
    case 'gastronomic':    return 5;
    case 'custom':         return 5;
    case 'bar_nightclub':
    case 'cocktail_bar':   return 7;
    case 'street_food':    return 4;
    default:               return 5;
  }
}
