import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BentoGrid, BentoCell } from "@/shared/components/ui/BentoGrid";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Package } from "lucide-react";

describe("BentoGrid & EmptyState — Layout Primitives Tests", () => {
  it("renders BentoGrid with hero-2col layout", () => {
    const { container } = render(
      <BentoGrid layout="hero-2col">
        <BentoCell span={2}><div>Hero Content</div></BentoCell>
        <BentoCell><div>Cell 1</div></BentoCell>
        <BentoCell><div>Cell 2</div></BentoCell>
      </BentoGrid>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders BentoGrid with asymmetric-4 layout", () => {
    const { container } = render(
      <BentoGrid layout="asymmetric-4">
        <BentoCell span={2}><div>Wide Cell 1</div></BentoCell>
        <BentoCell span={2}><div>Wide Cell 2</div></BentoCell>
        <BentoCell><div>Narrow Cell 1</div></BentoCell>
        <BentoCell><div>Narrow Cell 2</div></BentoCell>
      </BentoGrid>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders EmptyState in compact and full variants", () => {
    const { container: cCompact, getByText: getByTextCompact } = render(
      <EmptyState
        variant="compact"
        icon={Package}
        title="Aucun article"
        description="Le stock est vide"
      />
    );
    expect(getByTextCompact("Aucun article")).toBeDefined();
    expect(cCompact.firstChild).toMatchSnapshot();

    const { container: cFull, getByText: getByTextFull } = render(
      <EmptyState
        variant="full"
        emoji="📦"
        title="Centre logistique inactif"
        description="Aucune expédition en cours"
        action={<button type="button">Créer un bon de commande</button>}
      />
    );
    expect(getByTextFull("Centre logistique inactif")).toBeDefined();
    expect(cFull.firstChild).toMatchSnapshot();
  });
});
