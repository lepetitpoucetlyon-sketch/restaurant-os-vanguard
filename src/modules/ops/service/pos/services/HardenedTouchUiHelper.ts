export interface TouchTargetDimensions {
  widthPx: number;
  heightPx: number;
}

export interface TouchValidationResult {
  isValid: boolean;
  minSizeRequiredPx: number;
  widthPx: number;
  heightPx: number;
  violationMessage?: string;
}

/**
 * HardenedTouchUiHelper — Angle mort L43.
 * Garantit que toutes les zones tactiles d'action en cuisine et caisse respectent le gabarit durci (min 64x64px) pour manipulation mains mouillées/gantées.
 */
export class HardenedTouchUiHelper {
  public static readonly MIN_HARDENED_TOUCH_SIZE_PX = 64;

  static validateTargetSize(dim: TouchTargetDimensions): TouchValidationResult {
    const isValid = dim.widthPx >= this.MIN_HARDENED_TOUCH_SIZE_PX && dim.heightPx >= this.MIN_HARDENED_TOUCH_SIZE_PX;

    return {
      isValid,
      minSizeRequiredPx: this.MIN_HARDENED_TOUCH_SIZE_PX,
      widthPx: dim.widthPx,
      heightPx: dim.heightPx,
      violationMessage: isValid
        ? undefined
        : `Touch target (${dim.widthPx}x${dim.heightPx}px) is below hardened standard (${this.MIN_HARDENED_TOUCH_SIZE_PX}x${this.MIN_HARDENED_TOUCH_SIZE_PX}px)`,
    };
  }

  /**
   * Filtre anti-rebond (debounce) tactile pour éviter les doubles taps involontaires causés par des gouttes d'eau.
   */
  static isDebounceAllowed(lastTapTimestamp: number, minIntervalMs = 300): boolean {
    return Date.now() - lastTapTimestamp >= minIntervalMs;
  }
}
