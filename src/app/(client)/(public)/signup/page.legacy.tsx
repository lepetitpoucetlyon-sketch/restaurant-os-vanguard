"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/Button';
import { toast } from 'sonner';

interface SignupForm {
  email: string;
  password: string;
  businessName: string;
  siret: string;
  websiteUrl: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    businessName: '',
    siret: '',
    websiteUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la création du compte');
        return;
      }

      toast.success('Compte créé ! Redirection vers le paiement…');
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/?tenant=${data.tenantId}`);
      }
    } catch {
      toast.error('Erreur réseau — réessayez');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-2xl p-8 shadow-xl border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Créer votre restaurant</h1>
        <p className="text-text-secondary text-sm mb-8">
          Votre instance sera prête en quelques secondes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="businessName">Nom du restaurant</label>
            <input
              id="businessName"
              name="businessName"
              placeholder="Le Petit Poucet"
              required
              value={form.businessName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="siret">SIRET</label>
            <input
              id="siret"
              name="siret"
              placeholder="12345678900010"
              maxLength={14}
              value={form.siret}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="websiteUrl">URL de votre site (optionnel)</label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://monrestaurant.fr"
              value={form.websiteUrl}
              onChange={handleChange}
            />
            <p className="text-text-tertiary text-xs">
              On extrait automatiquement vos couleurs et logo.
            </p>
          </div>

          <hr className="border-border" />

          <div className="space-y-1.5">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-bold rounded-xl"
          >
            {loading ? 'Création en cours…' : 'Créer mon restaurant'}
          </Button>
        </form>
      </div>
    </div>
  );
}
