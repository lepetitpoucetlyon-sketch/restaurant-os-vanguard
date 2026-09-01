import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { PremiumCard } from "@/shared/components/ui/PremiumCard";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import { StatCard } from "@/shared/components/ui/StatCard";
import { SectionCard } from "@/shared/components/ui/SectionCard";

describe("Card Family — Baseline Snapshot & Rendering Tests", () => {
  it("renders Card with default and elevated intents", () => {
    const { container: cDefault } = render(
      <Card intent="default">
        <CardHeader>
          <CardTitle>Titre Standard</CardTitle>
        </CardHeader>
        <CardContent>Contenu</CardContent>
      </Card>
    );
    expect(cDefault.firstChild).toMatchSnapshot();

    const { container: cElevated } = render(
      <Card intent="elevated" size="lg">
        <CardContent>Contenu Élevé</CardContent>
      </Card>
    );
    expect(cElevated.firstChild).toMatchSnapshot();
  });

  it("renders PremiumCard with glass and elevated variants", () => {
    const { container } = render(
      <PremiumCard variant="elevated" hoverEffect padding="lg" rounded="2xl" glowColor="accent">
        <div>Contenu Premium</div>
      </PremiumCard>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders GlassCard with inset and default variants", () => {
    const { container } = render(
      <GlassCard variant="default" padding="md" rounded="xl">
        <div>Contenu Verre</div>
      </GlassCard>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders StatCard with value and trend", () => {
    const { container, getByText } = render(
      <StatCard
        label="Chiffre d'affaires"
        value="14 500 €"
        intent="brand"
        trend={{ value: 15, direction: "up" }}
      />
    );
    expect(getByText("Chiffre d'affaires")).toBeDefined();
    expect(getByText("14 500 €")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders SectionCard with header actions and subtitle", () => {
    const { container, getByText } = render(
      <SectionCard
        title="Paramètres de Caisse"
        subtitle="Configuration du terminal"
        variant="premium"
        headerActions={<button type="button">Sauvegarder</button>}
      >
        <div>Formulaire</div>
      </SectionCard>
    );
    expect(getByText("Paramètres de Caisse")).toBeDefined();
    expect(getByText("Configuration du terminal")).toBeDefined();
    expect(container.firstChild).toMatchSnapshot();
  });
});
