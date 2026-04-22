"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Info,
  ChefHat,
  Utensils,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui.foundations';
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AvailabilityEngine, AvailableSlot } from '@/domain/reservations/AvailabilityEngine';
import { AutomaticAssigner } from '@/domain/reservations/AutomaticAssigner';

// Mock Data for the Demo (until connected to API)
const MOCK_SETTINGS = {
  schedule: [
    { day: 'monday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'tuesday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'wednesday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'thursday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'friday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '23:30' },
    { day: 'saturday', isOpen: true, lunchOpen: '12:00', lunchClose: '15:00', dinnerOpen: '19:00', dinnerClose: '23:30' },
    { day: 'sunday', isOpen: true, lunchOpen: '12:00', lunchClose: '15:00', dinnerOpen: '19:00', dinnerClose: '22:00' },
  ] as import('@/types').DaySchedule[],
  reservationSlots: {
    slotDuration: 30,
    intervalBetweenSlots: 15,
    maxCoversPerSlot: 20
  } as import('@/types').ReservationSlotsConfig
} as any;

const MOCK_TABLES = [
  { id: 't1', number: '1', seats: 2, status: 'free', zoneId: 'main' },
  { id: 't2', number: '2', seats: 2, status: 'free', zoneId: 'main' },
  { id: 't3', number: '3', seats: 4, status: 'free', zoneId: 'main' },
  { id: 't4', number: '4', seats: 4, status: 'free', zoneId: 'main' },
  { id: 't5', number: '5', seats: 6, status: 'seated', zoneId: 'vip' },
  { id: 't6', number: '6', seats: 8, status: 'free', zoneId: 'terrace' },
] as any;

export default function PublicBookingPage({ params }: { params: { tenantId: string } }) {
  const [step, setStep] = useState(1);
  const [covers, setCovers] = useState(2);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  } as any;

  const slots = useMemo(() => {
    return AvailabilityEngine.getAvailableSlots(selectedDate, { schedule: MOCK_SETTINGS.schedule, reservationSlots: MOCK_SETTINGS.reservationSlots } as any, [], MOCK_TABLES);
  }, [selectedDate]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 🚀 INDUSTRIAL SOUDURE: Instantaneous Table Assignment
    const assignedTable = AutomaticAssigner.findBestTable(covers, format(selectedDate, 'yyyy-MM-dd'), selectedSlot!, MOCK_TABLES, []);
    
    setIsSubmitting(false);
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/20">
            <CheckCircle2 className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-4xl font-serif font-light italic text-text-primary">À Bientôt !</h1>
          <p className="text-text-muted font-mono text-sm uppercase tracking-widest leading-loose">
            Votre table pour <span className="text-accent">{covers} personnes</span> est réservée pour le <span className="text-accent">{format(selectedDate, 'dd MMMM', { locale: fr })}</span> à <span className="text-accent">{selectedSlot}</span>.
          </p>
          <div className="bg-bg-tertiary p-6 rounded-[2rem] border border-border">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-4 text-left">Récapitulatif</p>
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm"><span className="text-text-muted">Nom:</span> <span className="text-text-primary font-bold">{guestInfo.firstName} {guestInfo.lastName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Confirmation:</span> <span className="text-accent font-mono">SMS Envoyé</span></div>
            </div>
          </div>
          <Button variant="ghost" className="text-accent hover:text-white" onClick={() => window.location.reload()}>Réserver à nouveau</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent/30 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <motion.div 
          className="w-full max-w-4xl bg-bg-secondary rounded-[4rem] border border-border shadow-[0_32px_128px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row min-h-[700px] relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Left Panel: Context & Branding */}
          <div className="w-full md:w-2/5 p-12 bg-bg-tertiary/50 border-r border-border flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-accent rounded-[1.5rem] flex items-center justify-center mb-10 shadow-xl shadow-accent/20">
                <ChefHat className="w-8 h-8 text-bg-primary" />
              </div>
              <h1 className="text-5xl font-serif font-light italic leading-tight mb-8">
                Le Petit <br/> <span className="text-accent">Poucet</span>
              </h1>
              <p className="text-text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-muted text-sm font-light leading-relaxed mb-10">
                L'art de la table, le respect du produit, et l'excellence du service. Réservez votre expérience culinaire.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-text-muted">
                <Utensils className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cuisine Gastronomique</span>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conformité Compta & Factur-X</span>
              </div>
            </div>
          </div>

          {/* Right Panel: The Funnel */}
          <div className="flex-1 p-8 md:p-16 flex flex-col bg-bg-secondary">
            <div className="flex justify-between items-center mb-16">
               <div className="flex gap-2">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={cn("h-1 rounded-full transition-all duration-500", step >= i ? "w-12 bg-accent" : "w-4 bg-border")} />
                 ))}
               </div>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Étape {step} / 3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                   <div>
                     <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4">Combien d'invités ?</p>
                     <div className="grid grid-cols-4 gap-4">
                       {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                         <button 
                           key={n} 
                           onClick={() => setCovers(n)}
                           className={cn(
                             "h-16 rounded-2xl border transition-all flex items-center justify-center font-serif text-xl italic",
                             covers === n ? "bg-accent border-accent text-bg-primary shadow-lg shadow-accent/20" : "bg-bg-tertiary border-border hover:border-accent/40"
                           )}
                         >
                           {n}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex justify-end pt-8">
                     <Button onClick={() => setStep(2)} className="h-16 px-12 bg-accent text-bg-primary rounded-full hover:bg-white transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl">
                       Continuer <ChevronRight className="ml-2 w-4 h-4" />
                     </Button>
                   </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4">Choisir un créneau</p>
                    <div className="flex gap-4 overflow-x-auto pb-4 elegant-scrollbar">
                       {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                         const d = addDays(new Date(), offset);
                         const active = isSameDay(d, selectedDate);
                         return (
                           <button 
                             key={offset} 
                             onClick={() => setSelectedDate(d)}
                             className={cn(
                               "min-w-[100px] p-6 rounded-3xl border transition-all flex flex-col items-center gap-2",
                               active ? "bg-accent border-accent text-bg-primary" : "bg-bg-tertiary border-border text-text-muted"
                             )}
                           >
                             <span className="text-[10px] font-black uppercase tracking-widest">{format(d, 'EEE', { locale: fr })}</span>
                             <span className="text-2xl font-serif italic">{format(d, 'd')}</span>
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                     {slots.filter(s => s.status !== 'full').slice(0, 12).map(slot => (
                       <button 
                         key={slot.time}
                         onClick={() => setSelectedSlot(slot.time)}
                         className={cn(
                           "py-4 rounded-xl border text-[12px] font-mono transition-all",
                           selectedSlot === slot.time ? "bg-accent border-accent text-bg-primary" : "bg-bg-tertiary border-border text-text-muted hover:text-text-primary"
                         )}
                       >
                         {slot.time}
                       </button>
                     ))}
                  </div>

                  <div className="flex justify-between pt-8">
                    <Button variant="ghost" onClick={() => setStep(1)} className="h-16 px-10 rounded-full border border-border text-[10px] font-black uppercase text-text-muted hover:text-text-primary">Retour</Button>
                    <Button disabled={!selectedSlot} onClick={() => setStep(3)} className="h-16 px-12 bg-accent text-bg-primary rounded-full hover:bg-white transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl">
                      Préciser vos infos <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Prénom</label>
                       <input 
                         className="w-full bg-bg-tertiary border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent/40"
                         value={guestInfo.firstName}
                         onChange={e => setGuestInfo({...guestInfo, firstName: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Nom</label>
                       <input 
                         className="w-full bg-bg-tertiary border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent/40"
                         value={guestInfo.lastName}
                         onChange={e => setGuestInfo({...guestInfo, lastName: e.target.value})}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Email</label>
                     <input 
                        className="w-full bg-bg-tertiary border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent/40"
                        value={guestInfo.email}
                        onChange={e => setGuestInfo({...guestInfo, email: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Téléphone</label>
                     <input 
                        className="w-full bg-bg-tertiary border border-border rounded-2xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-accent/40"
                        value={guestInfo.phone}
                        onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
                     />
                   </div>

                   <div className="flex justify-between pt-8">
                    <Button variant="ghost" onClick={() => setStep(2)} className="h-16 px-10 rounded-full border border-border text-[10px] font-black uppercase text-text-muted hover:text-text-primary">Retour</Button>
                    <Button 
                      className={cn(
                        "flex-1 h-16 bg-accent text-bg-primary rounded-full hover:bg-white transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl ml-4",
                        isSubmitting && "opacity-50 pointer-events-none"
                      )}
                      onClick={handleSubmit} 
                    >
                      {isSubmitting ? "Traitement..." : "Confirmer ma table"} <Sparkles className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Brand Footer */}
        <div className="mt-20 flex flex-col items-center gap-4">
           <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.5em]">Powered by Restaurant OS</p>
           <div className="flex gap-8 opacity-20 hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Privacy Policy</span>
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Terms of Service</span>
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">GDPR Compliant</span>
           </div>
        </div>
    </div>
  );
}
