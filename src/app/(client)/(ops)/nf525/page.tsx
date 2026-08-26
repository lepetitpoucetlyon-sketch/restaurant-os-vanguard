"use client";

import { useState } from "react";
import { FECExportPage } from '@/modules/finance';
import { NF525SelfAudit } from '@/modules/compliance';
import { PageShell } from "@/shared/components/ui/PageShell";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { ShieldCheck, FileSpreadsheet, ClipboardCheck } from "lucide-react";

type Onglet = 'fec' | 'audit';

function NF525Page() {
  // L'auto-audit NF525 existait en code mais n'était monté nulle part et
  // n'était exporté par aucun barrel : il était donc strictement inatteignable.
  // Sa place est ici, aux côtés de l'export FEC — ce sont les deux livrables
  // qu'on présente lors d'un contrôle fiscal.
  const [onglet, setOnglet] = useState<Onglet>('fec');

  return (
    <PageShell
      kicker="Conformité"
      title="NF525 & Export FEC"
      subtitle="Génération du Fichier des Écritures Comptables (FEC) conforme aux exigences DGFIP."
      icon={ShieldCheck}
      breadcrumbs={[{ label: "Opérations" }, { label: "Finance" }, { label: "NF525" }]}
      tabs={
        <>
          <PageShell.Tab
            active={onglet === 'fec'}
            onClick={() => setOnglet('fec')}
            icon={FileSpreadsheet}
          >
            Export FEC
          </PageShell.Tab>
          <PageShell.Tab
            active={onglet === 'audit'}
            onClick={() => setOnglet('audit')}
            icon={ClipboardCheck}
          >
            Auto-audit
          </PageShell.Tab>
        </>
      }
    >
      {onglet === 'fec' ? <FECExportPage /> : <NF525SelfAudit />}
    </PageShell>
  );
}

export default withPageGuard(NF525Page, "finance");
