import { Nexus } from '@/lib/nexus/NexusAdapter';
import { notFound } from 'next/navigation';
import { TenantConfigSchema } from '@/modules/system';
import { ReservationWidget } from '@/modules/commerce';
import { JsonObject } from "@/shared/types/json";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const raw = await Nexus.adapter.get(`tenants/${slug}/tenantConfig`);
    if (!raw) return { title: 'Reservations' };
    const parsed = TenantConfigSchema.safeParse(raw);
    const name = parsed.success ? (parsed.data.name ?? parsed.data.metadata?.name ?? 'Restaurant') : 'Restaurant';
    return { title: `Reservations — ${name}` };
  } catch {
    return { title: 'Reservations' };
  }
}

export default async function ReservationWidgetPage({ params }: PageProps) {
  const { slug } = await params;

  const raw = await Nexus.adapter.get(`tenants/${slug}/tenantConfig`);
  if (!raw) notFound();

  const parsed = TenantConfigSchema.safeParse(raw);
  if (!parsed.success) notFound();

  const tenantData = parsed.data;
  const businessName =
    tenantData.name ??
    tenantData.metadata?.name ??
    'Restaurant';
  const logoUrl =
    tenantData.branding?.logoUrl ??
    tenantData.theme?.logoUrl ??
    null;

  // Forward card-imprint config so the widget can show the guarantee step
  const resaRaw = (tenantData as JsonObject).reservationConfig as JsonObject | undefined;
  const cardImprintConfig = {
    enabled: resaRaw?.cardImprintEnabled === true,
    condition: (resaRaw?.cardImprintCondition as string | undefined) ?? 'group',
    groupMin: (resaRaw?.cardImprintGroupMin as number | undefined) ?? 5,
    penaltyAmount: (resaRaw?.cardImprintPenaltyAmount as number | undefined) ?? 20,
    cancelHours: (resaRaw?.cardImprintCancelHours as number | undefined) ?? 24,
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Branding header */}
      <div className="flex flex-col items-center mb-6 gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={businessName}
            className="h-16 w-auto object-contain rounded-xl"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-serif text-2xl font-bold select-none">
            {businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-serif font-semibold text-gray-900 text-center tracking-tight">
          {businessName}
        </h1>
        <p className="text-sm text-text-muted">Réserver une table</p>
      </div>

      <ReservationWidget
        tenantId={slug}
        businessName={businessName}
        cardImprintConfig={cardImprintConfig}
      />
    </div>
  );
}
