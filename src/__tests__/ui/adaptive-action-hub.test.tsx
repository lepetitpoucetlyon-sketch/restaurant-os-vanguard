import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdaptiveActionHub, type ActionHubItem } from "@/shared/components/ui/AdaptiveActionHub";
import { AutoSafeLayout } from "@/shared/components/ui/AutoSafeLayout";

vi.mock("@/shared/providers/NexusCoreContext", () => ({
  useAuth: () => ({
    currentUser: { id: "user_1", role: "admin" },
    isAuthLoading: false,
  }),
}));

vi.mock("@/shared/hooks/useActionAccess", () => ({
  useActionAccess: () => true,
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Adaptive UI Suite — AdaptiveActionHub & AutoSafeLayout", () => {
  const sampleActions: ActionHubItem[] = [
    {
      id: "checkout",
      label: "Encaisser",
      variant: "primary",
      onClick: vi.fn(),
      shortcut: "cmd+e",
    },
    {
      id: "split",
      label: "Partager",
      variant: "secondary",
      onClick: vi.fn(),
    },
    {
      id: "void_order",
      label: "Annuler",
      variant: "danger",
      disabled: true,
      disabledReason: "Réservé au gérant",
      security: {
        page: "pos",
        action: "void_line",
      },
    },
  ];

  it("renders AdaptiveActionHub in floating dock mode with action items", () => {
    render(<AdaptiveActionHub items={sampleActions} variant="dock" />);

    expect(screen.getByText("Encaisser")).toBeDefined();
    expect(screen.getByText("Partager")).toBeDefined();
    expect(screen.getByText("Annuler")).toBeDefined();
  });

  it("renders AdaptiveActionHub in bottom-bar mode with context summary", () => {
    render(
      <AdaptiveActionHub
        items={sampleActions}
        variant="bottom-bar"
        contextSummary={<span>Total: 45,00 €</span>}
      />
    );

    expect(screen.getByText("Total: 45,00 €")).toBeDefined();
    expect(screen.getByText("Encaisser")).toBeDefined();
  });

  it("executes action callback on click when enabled", () => {
    render(<AdaptiveActionHub items={sampleActions} variant="dock" />);

    const checkoutBtn = screen.getByText("Encaisser").closest("button");
    expect(checkoutBtn).not.toBeNull();
    fireEvent.click(checkoutBtn!);
    expect(sampleActions[0].onClick).toHaveBeenCalled();
  });

  it("renders AutoSafeLayout with header, main content, and adaptive actions", () => {
    render(
      <AutoSafeLayout
        header={<div>Header POS</div>}
        actions={sampleActions}
        dataState="data"
      >
        <div data-testid="main-content">Catalogue Produits</div>
      </AutoSafeLayout>
    );

    expect(screen.getByText("Header POS")).toBeDefined();
    expect(screen.getByTestId("main-content")).toBeDefined();
    expect(screen.getByText("Encaisser")).toBeDefined();
  });

  it("renders AutoSafeLayout in empty state when dataState='empty'", () => {
    render(
      <AutoSafeLayout
        dataState="empty"
        empty={{
          title: "Aucun produit en rayon",
          description: "Veuillez importer votre carte",
          action: {
            label: "Importer",
            onClick: vi.fn(),
          },
        }}
      >
        <div>Should not be visible</div>
      </AutoSafeLayout>
    );

    expect(screen.getByText("Aucun produit en rayon")).toBeDefined();
    expect(screen.getByText("Importer")).toBeDefined();
    expect(screen.queryByText("Should not be visible")).toBeNull();
  });
});
