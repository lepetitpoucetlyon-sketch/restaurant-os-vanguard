"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette, Globe, Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@ui/button';
import { useSettings } from '@/context/SettingsContext';
import { BrandingUI } from '@domain/services/BrandingUI';
import { BrandInput } from '@nexus/contracts';
// import { extractBrandingFromUrl } from '@/app/actions/branding';
import { cn } from '@/lib/ui.foundations';

export default function ProspectingDashboard() {
  const { updateIdentity, updateConfig } = useSettings();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<import('@nexus/contracts').ThemeSettings | null>(null);

  const handleApplySauce = async (input: BrandInput) => {
    const newTheme = BrandingUI.generateThemeFromBrand(input);
    await updateConfig('theme', newTheme as any);
    if (updateIdentity) await updateIdentity({ name: input.name, id: 'identity_suture', updatedAt: new Date().toISOString() } as any);
    setLastGenerated(newTheme);
  };

    const handleMagicScan = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    try {
      // Simulation pour l'export statique
      await new Promise(resolve => setTimeout(resolve, 2000));
      await handleApplySauce({ name: "Branding Simulé", primaryColor: "#C5A059", atmosphere: 'luxury' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-accent">
          <Sparkles className="w-6 h-6" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Propulsion Commerciale</span>
        </div>
        <h1 className="text-5xl font-serif italic">Mettre à sa sauce.</h1>
        <p className="text-text-muted max-w-xl">
          Industrialise ton démarchage. Entre l'identité d'un prospect et transforme cette instance en sa propre application en moins de 60 secondes.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Magic Input */}
        <div className="bg-bg-secondary border border-border/40 rounded-[2rem] p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Magic URL Scan</h2>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="https://le-bistrot-du-chef.fr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-bg-primary border border-border/60 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
            />
            <Button 
              onClick={handleMagicScan}
              disabled={isAnalyzing || !url}
              className="w-full h-14 bg-accent text-bg-primary rounded-xl font-bold flex items-center justify-center gap-2 group"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyser & Brander</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Manual Tweak */}
        <div className="bg-bg-secondary border border-border/40 rounded-[2rem] p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Sauce Manuelle</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleApplySauce({ name: "Luxury Bistro", primaryColor: "#C5A059", atmosphere: 'luxury' })}
              className="p-4 rounded-xl border border-border hover:border-accent transition-all text-left space-y-2 group"
            >
              <div className="w-6 h-6 rounded-full bg-[#C5A059]" />
              <span className="text-xs font-bold block">Gold Luxury</span>
            </button>
            <button 
              onClick={() => handleApplySauce({ name: "Bistrot Rouge", primaryColor: "#E11D48", atmosphere: 'bistro' })}
              className="p-4 rounded-xl border border-border hover:border-accent transition-all text-left space-y-2 group"
            >
              <div className="w-6 h-6 rounded-full bg-[#E11D48]" />
              <span className="text-xs font-bold block">Bistrot Rouge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Feedback Zone */}
      {lastGenerated && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Branding Appliqué avec succès !</p>
              <p className="text-xs text-text-muted">Ton instance a été mise à "la sauce" client instantanément.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Voir le résultat
          </Button>
        </motion.div>
      )}
    </div>
  );
}
