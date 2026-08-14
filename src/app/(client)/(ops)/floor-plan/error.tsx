"use client";

import { useEffect } from "react";

export default function FloorPlanError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[FloorPlan/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-text-primary p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-sm uppercase tracking-widest text-text-muted">Plan de salle</div>
        <h1 className="text-xl font-semibold">Le plan de salle n&apos;a pas pu être affiché</h1>
        <p className="text-sm text-text-secondary">
          La configuration du plan est intacte. Rechargez pour retrouver vos tables et réservations.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-lg bg-action-primary text-action-primary-fg font-medium hover:opacity-90"
        >
          Recharger le plan
        </button>
      </div>
    </div>
  );
}
