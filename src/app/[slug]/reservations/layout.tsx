import { ReactNode } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { notFound } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ReservationWidgetLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  // Resolve tenant by slug — public access, no auth required
  let tenantFound = false;
  try {
    const tenantConfig = await Nexus.adapter.get(`tenants/${slug}/tenantConfig`);
    tenantFound = !!tenantConfig;
  } catch {
    tenantFound = false;
  }

  if (!tenantFound) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="flex flex-col items-center justify-start py-8 px-4">
        {children}
      </div>
    </div>
  );
}
