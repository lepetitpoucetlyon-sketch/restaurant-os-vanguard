import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLexicon } from "@/shared/hooks/useLexicon";
import {
  DEFAULT_RESTAURANT_LEXICON,
  GARAGE_LEXICON,
  SALON_LEXICON,
  CLINIC_LEXICON,
  BAKERY_LEXICON,
} from "@/shared/plugins/IVerticalLexicon";

const mockUseTenant = vi.fn();

vi.mock("@/shared/providers/NexusCoreProvider", () => ({
  useTenant: () => mockUseTenant(),
}));

describe("🎯 useLexicon Hook", () => {
  it("retourne GARAGE_LEXICON lorsque activeTenantConfig.variant est garage", () => {
    mockUseTenant.mockReturnValue({
      activeTenantConfig: { id: "garage-1", variant: "garage" },
    });

    const { result } = renderHook(() => useLexicon());
    expect(result.current).toEqual(GARAGE_LEXICON);
    expect(result.current.tableLabel).toBe("Pont Élévateur");
    expect(result.current.recipeLabel).toBe("Forfait Réparation");
  });

  it("retourne BAKERY_LEXICON lorsque activeTenantConfig.variant est bakery", () => {
    mockUseTenant.mockReturnValue({
      activeTenantConfig: { id: "bakery-1", variant: "bakery" },
    });

    const { result } = renderHook(() => useLexicon());
    expect(result.current).toEqual(BAKERY_LEXICON);
    expect(result.current.tableLabel).toBe("Comptoir / Vitrine");
  });

  it("retourne CLINIC_LEXICON lorsque activeTenantConfig.variant est clinic", () => {
    mockUseTenant.mockReturnValue({
      activeTenantConfig: { id: "clinic-1", variant: "clinic" },
    });

    const { result } = renderHook(() => useLexicon());
    expect(result.current).toEqual(CLINIC_LEXICON);
    expect(result.current.customerLabel).toBe("Patient");
  });

  it("supporte la rétro-compatibilité avec platformVariant si variant est absent", () => {
    mockUseTenant.mockReturnValue({
      activeTenantConfig: { id: "salon-1", platformVariant: "salon" },
    });

    const { result } = renderHook(() => useLexicon());
    expect(result.current).toEqual(SALON_LEXICON);
    expect(result.current.tableLabel).toBe("Poste / Fauteuil");
  });

  it("retourne DEFAULT_RESTAURANT_LEXICON par défaut ou pour le restaurant", () => {
    mockUseTenant.mockReturnValue(null);

    const { result } = renderHook(() => useLexicon());
    expect(result.current).toEqual(DEFAULT_RESTAURANT_LEXICON);
    expect(result.current.tableLabel).toBe("Table");
  });
});
