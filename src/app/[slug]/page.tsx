import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantConfigSchema } from '@/domain/schemas/tenant';
import { MapPin, Phone, Mail, Clock, CalendarCheck } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface LandingConfig {
  heroImageUrl?: string;
  tagline?: string;
  hours?: Array<{ label: string; value: string }>;
  phone?: string;
  address?: string;
  email?: string;
}

async function getTenantData(slug: string) {
  const raw = await Nexus.adapter.get(`tenants/${slug}/tenantConfig`);
  if (!raw) return null;
  const parsed = TenantConfigSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { config: parsed.data, raw: raw as Record<string, unknown> };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTenantData(slug).catch(() => null);
  if (!data) return { title: 'Restaurant' };

  const { config } = data;
  const name = config.name ?? config.metadata?.name ?? 'Restaurant';
  const description = config.metadata?.description ?? `Découvrez ${name} — réservez en ligne`;
  const logoUrl = config.branding?.logoUrl ?? config.theme?.logoUrl;

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      type: 'website',
      ...(logoUrl ? { images: [{ url: logoUrl, alt: name }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: name, description },
  };
}

export default async function RestaurantLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getTenantData(slug);
  if (!data) notFound();

  const { config, raw } = data;
  const landing = raw.landingConfig as LandingConfig | undefined;

  const name = config.name ?? config.metadata?.name ?? 'Restaurant';
  const description = config.metadata?.description;
  const logoUrl = config.branding?.logoUrl ?? config.theme?.logoUrl;
  const primaryColor = config.branding?.primaryColor ?? config.theme?.primaryColor ?? '#C5A059';
  const heroImageUrl = landing?.heroImageUrl;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Hero */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center overflow-hidden px-6 py-20"
        style={{ background: 'linear-gradient(160deg, #1A2350 0%, #0d1428 100%)' }}
      >
        {heroImageUrl && (
          <div className="absolute inset-0">
            <Image src={heroImageUrl} alt="" fill className="object-cover opacity-20" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1428] via-transparent to-transparent" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-7 max-w-xl mx-auto text-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={name}
              className="h-20 w-auto object-contain rounded-2xl shadow-2xl"
            />
          )}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-tight">
              {name}
            </h1>
            {landing?.tagline && (
              <p className="text-lg md:text-xl text-text-primary/70 font-medium">{landing.tagline}</p>
            )}
            {description && !landing?.tagline && (
              <p className="text-base text-text-primary/60 max-w-sm mx-auto">{description}</p>
            )}
          </div>

          <Link
            href={`/${slug}/reservations`}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-text-primary text-sm uppercase tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <CalendarCheck className="w-4 h-4" />
            Réserver une table
          </Link>
        </div>
      </section>

      {/* Info section */}
      {(landing?.hours?.length || landing?.phone || landing?.address || landing?.email) ? (
        <section className="max-w-lg mx-auto px-6 py-14 space-y-10">
          {landing.hours && landing.hours.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-text-secondary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Horaires</h2>
              </div>
              <ul className="space-y-2.5 divide-y divide-gray-100">
                {landing.hours.map((h, i) => (
                  <li key={i} className="flex justify-between pt-2.5 first:pt-0 text-sm">
                    <span className="text-gray-600">{h.label}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{h.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(landing.address || landing.phone || landing.email) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-text-secondary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Contact</h2>
              </div>
              <dl className="space-y-3 text-sm">
                {landing.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                    <dd className="text-gray-700">{landing.address}</dd>
                  </div>
                )}
                {landing.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <dd>
                      <a href={`tel:${landing.phone}`} className="font-semibold text-gray-900 hover:underline">
                        {landing.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {landing.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <dd>
                      <a href={`mailto:${landing.email}`} className="text-gray-600 hover:underline">
                        {landing.email}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <Link
            href={`/${slug}/reservations`}
            className="flex w-full items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-text-primary text-sm uppercase tracking-widest shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <CalendarCheck className="w-4 h-4" />
            Réserver une table
          </Link>
        </section>
      ) : (
        <section className="max-w-sm mx-auto px-6 py-14 text-center">
          <Link
            href={`/${slug}/reservations`}
            className="flex w-full items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-text-primary text-sm uppercase tracking-widest shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <CalendarCheck className="w-4 h-4" />
            Réserver une table
          </Link>
        </section>
      )}

      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-text-secondary">Propulsé par <span className="font-semibold text-gray-600">Restaurant OS</span></p>
      </footer>
    </div>
  );
}
