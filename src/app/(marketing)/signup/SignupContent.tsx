'use client';
// ─────────────────────────────────────────────────────────────────
// /signup — Signup page with form + vertical selector
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { VERTICALS_LANDING } from '../data/verticals';
import { Input } from "@/shared/components/ui/Input";

interface FormState {
  email: string;
  password: string;
  businessName: string;
  variant: string;
  websiteUrl: string;
}

export function SignupPage() {
  const searchParams = useSearchParams();
  const preselectedVertical = searchParams.get('vertical') ?? 'restaurant';
  const cancelled = searchParams.get('cancelled');

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    businessName: '',
    variant: preselectedVertical,
    websiteUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      // If there's a checkout URL, redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Otherwise redirect to welcome
      window.location.href = `/welcome?tenant=${data.tenantId}`;
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <section className="min-h-[100dvh] flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(197,160,89,0.08),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
              R
            </div>
            <span className="text-lg font-semibold">Restaurant<span className="text-amber-400"> OS</span></span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Créez votre compte
          </h1>
          <p className="text-white/50">
            14 jours d&apos;essai gratuit · Pas d&apos;engagement
          </p>
        </div>

        {cancelled && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center">
            Paiement annulé. Vous pouvez réessayer.
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-white/70 mb-1.5">
              Email professionnel
            </label>
            <Input
              id="signup-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="vous@restaurant.fr"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-white/70 mb-1.5">
              Mot de passe
            </label>
            <Input
              id="signup-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="8 caractères minimum"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
            />
          </div>

          {/* Business name */}
          <div>
            <label htmlFor="signup-business" className="block text-sm font-medium text-white/70 mb-1.5">
              Nom de l&apos;établissement
            </label>
            <Input
              id="signup-business"
              type="text"
              required
              value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              placeholder="Le Petit Poucet"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
            />
          </div>

          {/* Vertical selector */}
          <div>
            <label htmlFor="signup-vertical" className="block text-sm font-medium text-white/70 mb-1.5">
              Type d&apos;activité
            </label>
            <select
              id="signup-vertical"
              value={form.variant}
              onChange={(e) => updateField('variant', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all appearance-none cursor-pointer"
            >
              {VERTICALS_LANDING.map((v) => (
                <option key={v.slug} value={v.slug} className="bg-[#1a1a2e] text-white">
                  {v.emoji} {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL (optional) */}
          <div>
            <label htmlFor="signup-website" className="block text-sm font-medium text-white/70 mb-1.5">
              Site web <span className="text-white/30">(optionnel — on en extrait votre branding)</span>
            </label>
            <Input
              id="signup-website"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => updateField('websiteUrl', e.target.value)}
              placeholder="https://votre-site.fr"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Création en cours...
              </span>
            ) : (
              'Créer mon compte gratuitement'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-white/25 mt-6">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/legal/cgu" className="underline hover:text-white/50">CGU</Link>
          {' '}et notre{' '}
          <Link href="/legal/rgpd" className="underline hover:text-white/50">politique de confidentialité</Link>.
        </p>

        <p className="text-center text-sm text-white/40 mt-4">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
