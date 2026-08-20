'use client';
// ─────────────────────────────────────────────────────────────────
// VerticalLandingClient — Assembles all vertical sections
// ─────────────────────────────────────────────────────────────────
import type { VerticalLandingData } from '../../data/verticals';
import { VerticalHero } from '../../components/VerticalHero';
import { VerticalFeatures } from '../../components/VerticalFeatures';
import { VerticalFAQ } from '../../components/VerticalFAQ';
import { PricingTeaser } from '../../components/PricingTeaser';
import { FinalCTA } from '../../components/FinalCTA';

export function VerticalLandingClient({ vertical }: { vertical: VerticalLandingData }) {
  return (
    <>
      <VerticalHero vertical={vertical} />
      <VerticalFeatures vertical={vertical} />
      <PricingTeaser verticalSlug={vertical.slug} />
      <VerticalFAQ vertical={vertical} />
      <FinalCTA verticalSlug={vertical.slug} verticalName={vertical.name} />
    </>
  );
}
