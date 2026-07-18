// NO 'use client' — Server Component.
// Wraps all (public) routes and injects the schema.org Menu JSON-LD block.
import { ReactNode, Suspense } from 'react';
import MenuJsonLd from '@/components/seo/MenuJsonLd';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Schema.org structured data for search engines */}
      <Suspense fallback={null}>
        <MenuJsonLd />
      </Suspense>
      {children}
    </>
  );
}
