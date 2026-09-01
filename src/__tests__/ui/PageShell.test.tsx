import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  PageShell,
  PageShellActionCTA,
  PageShellActionGroup,
  PageShellTab,
  PageShellFraction,
} from "@/shared/components/ui/PageShell";

describe("PageShell — Snapshot & Behaviour Tests", () => {
  it("renders default variant with title, kicker, and subtitle", () => {
    const { container, getByText } = render(
      <PageShell
        title="Commandes & Tables"
        kicker="Service en Salle"
        subtitle="Vue temps réel des commandes actives"
      >
        <div>Contenu principal</div>
      </PageShell>
    );

    expect(getByText("Commandes & Tables")).toBeDefined();
    expect(getByText("Service en Salle")).toBeDefined();
    expect(getByText("Vue temps réel des commandes actives")).toBeDefined();
    expect(getByText("Contenu principal")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders compact variant with status and breadcrumbs", () => {
    const { container, getByText } = render(
      <PageShell
        variant="compact"
        title="KDS Cuisine"
        breadcrumbs={[
          { label: "Opérations", href: "/operations" },
          { label: "Cuisine" },
        ]}
        status={{ label: "Rush Actif", tone: "rush" }}
        alert="rush"
      >
        <div>Grille des tickets</div>
      </PageShell>
    );

    expect(getByText("KDS Cuisine")).toBeDefined();
    expect(getByText("Rush Actif")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders hero variant with actions and tabs", () => {
    const { container, getByText } = render(
      <PageShell
        variant="hero"
        title="Tour de Contrôle"
        kicker="Pilotage Global"
        actions={
          <PageShellActionGroup>
            <PageShellActionCTA onClick={() => {}}>Exporter</PageShellActionCTA>
          </PageShellActionGroup>
        }
        tabs={
          <>
            <PageShellTab active={true} onClick={() => {}}>Vue Générale</PageShellTab>
            <PageShellTab active={false} onClick={() => {}}>Performances</PageShellTab>
          </>
        }
      >
        <div>Dashboard analytique</div>
      </PageShell>
    );

    expect(getByText("Tour de Contrôle")).toBeDefined();
    expect(getByText("Vue Générale")).toBeDefined();
    expect(getByText("Performances")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders flush variant with fraction metric", () => {
    const { container, getByText } = render(
      <PageShell
        variant="flush"
        title="Plan de Salle"
        actions={<PageShellFraction numerator={18} denominator={24} label="Couverts" />}
      >
        <div id="canvas-root">Canvas interactif</div>
      </PageShell>
    );

    expect(getByText("Plan de Salle")).toBeDefined();
    expect(getByText("18")).toBeDefined();
    expect(getByText("24")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });
});
