"use client";

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { 
    qualityActiveControlAtom, 
    qualityControlStepAtom,
    qualityControlsAtom,
    qualitySelectedDeliveryIdAtom,
    qualityCurrentSessionStatsSelector
} from '@modules/compliance/haccp/store/qualityAtoms';
import { HACCPGauge } from './HACCPGauge';
import { DeliveryItemRow } from './DeliveryItemRow';
import { Button } from "@ui/button";
import { 
    Truck as TruckIcon,
    ShieldCheck as ShieldIcon,
    Camera as CameraIcon,
    PenTool as PenIcon,
    CheckCircle2 as CheckIcon,
    ChevronRight as RightIcon,
    ChevronLeft as LeftIcon,
    Search as SearchIcon,
    AlertTriangle as AlertIcon,
    Loader2 as LoaderIcon
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { motion, AnimatePresence } from 'framer-motion';
import { useQuality } from '../../hooks/useQuality';
import { useRouter } from 'next/navigation';
import { QualityControl, CleanlinessStatus } from '@nexus/contracts';

/**
 * 🛰️ ReceptionWizard - Orchestrator
 * Step-by-step HACCP Protocol Grade VI.
 */
export function ReceptionWizard() {
  const router = useRouter();
  const { submitControl, step, setStep, activeControl, setActiveControl } = useQuality();
  const stats = useAtomValue(qualityCurrentSessionStatsSelector);
  const selectedId = useAtomValue(qualitySelectedDeliveryIdAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const session = activeControl;
  const setSession = setActiveControl;

  const nextStep = async () => {
      if (step === 3) {
          handleFinalSubmit();
      } else {
          setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
      }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3);

  const handleFinalSubmit = async () => {
      setIsSubmitting(true);
      try {
          await submitControl();
          router.push('/quality');
      } catch (error) {
          console.error("Submission failed", error);
      } finally {
          setIsSubmitting(false);
      }
  };

  const updateConditions = (updates: Partial<QualityControl['delivery_conditions']>) => {
    if (!session) return;
    setSession({
      ...session,
      delivery_conditions: { ...session.delivery_conditions, ...updates }
    });
  };

  return (
    <div className="bg-white dark:bg-bg-secondary border border-border rounded-[3rem] p-8 h-full shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

      {/* Wizard Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-border">
        <div>
          <h2 className="text-3xl font-serif font-black italic text-text-primary px-2">
            Protocole d&apos;Agréage<span className="text-emerald-500 not-italic">.</span>
          </h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-2 px-2 flex items-center gap-2">
            <ShieldIcon className="w-3 h-3 text-emerald-500" />
            ID RÉCEPTION: {selectedId?.slice(0, 12) || 'NOUVEAU'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-12 h-1.5 rounded-full transition-all duration-500", 
                step >= s ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-slate-100"
              )} 
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HACCPGauge 
                        label="Température Camion"
                        value={session.delivery_conditions?.vehicle_temperature?.measured || 0}
                        min={0}
                        max={4}
                        unit="°C"
                        type="temperature"
                    />
                    
                    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                        <h4 className="font-bold uppercase text-[10px] tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                            <TruckIcon className="w-4 h-4 text-emerald-500" />
                            Hygiène Véhicule
                        </h4>
                        <div className="flex gap-3">
                            {['clean', 'acceptable', 'dirty'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => updateConditions({ vehicle_cleanliness: status as CleanlinessStatus })}
                                    className={cn(
                                        "flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                                        session.delivery_conditions?.vehicle_cleanliness === status 
                                            ? "bg-slate-900 text-white border-transparent shadow-lg"
                                            : "bg-white border-slate-200 hover:border-emerald-500/40 text-slate-400"
                                    )}
                                >
                                    {status === 'clean' ? 'Propre' : status === 'acceptable' ? 'Correct' : 'Non-conf'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:bg-slate-100 transition-all">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <CameraIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-serif font-black italic text-lg text-slate-900">Photo du Bon de Livraison</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">Preuve numérique HACCP requise</p>
                    </div>
                </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif font-black italic text-slate-900">Contrôle des Articles</h3>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <SearchIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{stats.total} Articles</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {session.items?.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center">
                            <AlertIcon className="w-12 h-12 mb-4" />
                            <p className="font-black text-sm uppercase tracking-widest">Aucun article chargé</p>
                        </div>
                    ) : (
                        session.items?.map((item, i) => (
                            <DeliveryItemRow key={item.id} item={item} index={i} />
                        ))
                    )}
                </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-xl",
                    stats.status === 'pass' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                )}>
                    <CheckIcon className="w-12 h-12" />
                </div>
                
                <h3 className="text-3xl font-serif font-black italic mb-2 tracking-tight">Rapport de Synthèse</h3>
                <p className="text-slate-500 font-medium max-w-sm mb-10">Dernière vérification avant signature et injection en stock.</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                   <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Acceptés</p>
                       <p className="text-3xl font-mono font-bold text-emerald-600">{stats.accepted}</p>
                   </div>
                   <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Rejetés</p>
                       <p className="text-3xl font-mono font-bold text-rose-500">{stats.rejected}</p>
                   </div>
                </div>

                <div className="mt-10 p-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-50 flex items-center gap-4 w-full max-w-md group cursor-pointer hover:bg-emerald-100/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <PenIcon className="w-6 h-6" />
                    </div>
                   <div className="text-left">
                       <p className="font-black text-sm tracking-tight text-slate-900">Signature Électronique</p>
                       <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Validation Finale Grade VI</p>
                   </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 p-2 rounded-2xl">
        <Button 
            variant="ghost" 
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className="rounded-xl px-6 font-black uppercase tracking-widest text-[9px] flex items-center gap-2"
        >
            <LeftIcon className="w-3.5 h-3.5" />
            Retour
        </Button>

        <div className="flex gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Phase {step}/3</span>
        </div>

        <Button
            onClick={nextStep}
            disabled={isSubmitting}
            className={cn(
                "px-8 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-xl transition-all",
                step === 3 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-900 hover:bg-black text-white"
            )}
        >
            {isSubmitting ? (
                <>
                    <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                    Traitement...
                </>
            ) : (
                <>
                    {step === 3 ? "Valider & Terminer" : "Continuer"}
                    {step < 3 && <RightIcon className="w-3.5 h-3.5" />}
                </>
            )}
        </Button>
      </div>
    </div>
  );
}
