// ─────────────────────────────────────────────────────────────────
// Dynamic vertical landing page — /verticales/[slug]
// SSG with generateStaticParams for all 8 verticals
// ─────────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VERTICALS_LANDING } from '../../data/verticals';
import { VerticalLandingClient } from './VerticalLandingClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return VERTICALS_LANDING.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vertical = VERTICALS_LANDING.find((v) => v.slug === slug);
  if (!vertical) return {};

  return {
    title: vertical.metaTitle,
    description: vertical.metaDescription,
    openGraph: {
      title: vertical.metaTitle,
      description: vertical.metaDescription,
      type: 'website',
      locale: 'fr_FR',
    },
    alternates: {
      canonical: `/verticales/${slug}`,
    },
  };
}

export default async function VerticalLandingPage({ params }: Props) {
  const { slug } = await params;
  const vertical = VERTICALS_LANDING.find((v) => v.slug === slug);
  if (!vertical) notFound();

  return <VerticalLandingClient vertical={vertical} />;
}
