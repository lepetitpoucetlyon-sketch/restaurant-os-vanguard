"use client";
import React from "react";
import { StatGrid, StatCard } from "@/shared/components/ui";

interface FinanceKPIBannerProps {
  totalCA: string;
  totalTVA: string;
  totalEcritures: number;
}

export function FinanceKPIBanner({ totalCA, totalTVA, totalEcritures }: FinanceKPIBannerProps) {
  return (
    <StatGrid columns={3}>
      <StatCard label="Chiffre d'Affaires" value={totalCA} />
      <StatCard label="TVA Collectée" value={totalTVA} />
      <StatCard label="Écritures au Grand Livre" value={totalEcritures} />
    </StatGrid>
  );
}
