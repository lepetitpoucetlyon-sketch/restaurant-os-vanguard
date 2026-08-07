import { redirect } from 'next/navigation';

/**
 * /demo → redirigé vers /landing
 * Ancien système : créait un tenant éphémère `demo-pouce-${Date.now()}` à chaque visite.
 * Remplacé par le système de démo structuré (versionbase.md + landingpage.md).
 */
export default function DemoPage() {
  redirect('/landing');
}
