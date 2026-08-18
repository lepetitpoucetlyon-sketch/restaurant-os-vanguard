'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  ChefHat,
  MapPin,
  Laptop,
  Tablet,
  LayoutGrid,
  Bell,
  Check,
  AlertTriangle,
  Flame,
  Award,
  Layers,
  Lock,
  ExternalLink
} from 'lucide-react';

// Real assets from ombellule.fr
const LOGO_URL = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/6d930cea-1b04-48d5-a0e7-c0bf0f81bea8/ombellule-web.png';
const CHEFS_PHOTO = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/a22ea432-0963-4993-8006-6a1a3b958cf9/DSC06884.jpg';
const AMBIANCE_PHOTO = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/eb0318e3-1d87-4c9c-bc21-4944b3b65dfd/%28c%29+Agence+Camille+Carlier+-+A.+Battut+%2852%29.jpg';
const DISH_PHOTO = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/c17b0c50-cbf3-47e0-adb7-236bbc0279e0/%28c%29+Agence+Camille+Carlier+-+A.+Battut+%2862%29.jpg';
const FLEUR_GAUCHE = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/9a06bc44-ce3d-4335-b625-2e14d52528bf/fleur-gauche.png';
const FLEUR_DROITE = 'https://images.squarespace-cdn.com/content/v1/66bb65ffb1ca390f18a94351/5e2af39f-13e2-42bd-b0e3-bb07d4ede674/fleur-droite.png';

interface LiveReservation {
  id: string;
  name: string;
  covers: number;
  date: string;
  time: string;
  service: 'dejeuner' | 'diner';
  table: string;
  allergies: string[];
  status: 'confirmed' | 'pending' | 'seated';
  imprintSecured: boolean;
  notes?: string;
  timestamp: string;
}

export default function OmbellulePreviewPage() {
  const [viewMode, setViewMode] = useState<'site' | 'split' | 'pos'>('split');
  const [modalOpen, setModalOpen] = useState(false);

  // Widget Booking State
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [service, setService] = useState<'dejeuner' | 'diner'>('diner');
  const [covers, setCovers] = useState<number>(2);
  const [date, setDate] = useState<string>('2026-08-20');
  const [timeSlot, setTimeSlot] = useState<string>('20:00');
  const [firstName, setFirstName] = useState<string>('Alexandre');
  const [lastName, setLastName] = useState<string>('Boyer');
  const [email, setEmail] = useState<string>('alexandre.boyer@luxury-dining.fr');
  const [phone, setPhone] = useState<string>('+33 6 12 34 56 78');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['Sans Gluten']);
  const [notes, setNotes] = useState<string>('Table calme pour anniversaire de mariage si possible.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<LiveReservation | null>(null);

  // POS Live Feed State (simulates real-time synchronization)
  const [posReservations, setPosReservations] = useState<LiveReservation[]>([
    {
      id: 'RES-8821',
      name: 'Claire Dupont',
      covers: 4,
      date: '2026-08-20',
      time: '19:30',
      service: 'diner',
      table: 'Table 6 (Alcôve)',
      allergies: ['Crustacés'],
      status: 'confirmed',
      imprintSecured: true,
      timestamp: 'Il y a 12 min'
    },
    {
      id: 'RES-8820',
      name: 'Jean-Marc V.',
      covers: 2,
      date: '2026-08-20',
      time: '20:15',
      service: 'diner',
      table: 'Table 2 (Baie vitrée)',
      allergies: [],
      status: 'confirmed',
      imprintSecured: true,
      timestamp: 'Il y a 45 min'
    }
  ]);

  const [activeTable, setActiveTable] = useState<string>('Table 4');
  const [newResaAlert, setNewResaAlert] = useState<boolean>(false);

  const ALLERGY_OPTIONS = [
    'Sans Gluten',
    'Sans Lactose',
    'Végétarien',
    'Crustacés / Fruits de mer',
    'Fruits à coque / Arachides',
    'Femme enceinte'
  ];

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleCompleteBooking = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
      const assignedTable = 'Table 4 (Vue Chefs)';
      const resa: LiveReservation = {
        id: newId,
        name: `${firstName} ${lastName}`,
        covers,
        date,
        time: timeSlot,
        service,
        table: assignedTable,
        allergies: selectedAllergies,
        status: 'confirmed',
        imprintSecured: true,
        notes,
        timestamp: 'À l’instant'
      };

      setConfirmedReservation(resa);
      setPosReservations(prev => [resa, ...prev]);
      setActiveTable('Table 4');
      setNewResaAlert(true);
      setIsSubmitting(false);
      setBookingStep(4); // Confirmation step
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#111315] text-[#ECECEC] font-sans antialiased flex flex-col">
      {/* ─── TOP CONTROL BAR (FOR THE LIVE DEMO) ─── */}
      <header className="sticky top-0 z-50 bg-[#16181B]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center text-[#C5A880] font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white tracking-wide">
                  Démonstration Live : Ombellule (Lyon 6e) × Restaurant OS
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Temps Réel Actif
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Remplacement Zenchef ➔ Widget Glassmorphism Restaurant OS + Liaison directe Plan de Salle
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0D0E10] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('site')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'site'
                  ? 'bg-[#C5A880] text-black shadow-md font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Site Ombellule
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-[#C5A880] text-black shadow-md font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Split-Screen (Site + Caisse iPad)
            </button>
            <button
              onClick={() => setViewMode('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'pos'
                  ? 'bg-[#C5A880] text-black shadow-md font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Plan de Salle Restaurant OS
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: THE OMBELLULE WEBSITE REPLICA */}
        {(viewMode === 'site' || viewMode === 'split') && (
          <div
            className={`flex-1 overflow-y-auto bg-[#FDFBF7] text-[#2C2926] transition-all duration-300 ${
              viewMode === 'split' ? 'border-r border-white/10 max-w-[58%]' : 'w-full'
            }`}
          >
            {/* Real Ombellule Header */}
            <nav className="border-b border-[#EBE6DD] px-8 py-5 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur sticky top-0 z-30">
              <div className="flex items-center gap-6">
                <img
                  src={LOGO_URL}
                  alt="Ombellule Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-widest font-medium text-[#4A453E]">
                <a href="#accueil" className="hover:text-[#C5A880] transition">Accueil</a>
                <a href="#chefs" className="hover:text-[#C5A880] transition">Les Chefs</a>
                <a href="#menus" className="hover:text-[#C5A880] transition">Menus</a>
                <a href="#reservation" className="text-[#C5A880] font-semibold">Réservations</a>
                <a href="#offrir" className="hover:text-[#C5A880] transition">Offrir</a>
                <a href="#contact" className="hover:text-[#C5A880] transition">Contact</a>
              </div>
              <div>
                <button
                  onClick={() => {
                    const el = document.getElementById('reservation-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#1E1E1E] text-[#FDFBF7] text-xs uppercase tracking-widest font-semibold hover:bg-[#C5A880] hover:text-black transition-all shadow-md"
                >
                  Réserver une table
                </button>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="relative px-8 pt-12 pb-16 text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-xs uppercase tracking-widest text-[#8C8275] flex items-center gap-1.5 font-medium">
                  <Award className="w-4 h-4 text-[#C5A880]" />
                  Restaurant Gastronomique Étoilé Michelin • Lyon 6e
                </span>
              </div>

              <h2 className="text-3xl lg:text-5xl font-serif font-light text-[#1E1E1E] tracking-tight leading-snug mb-6">
                L’harmonie subtile de la nature <br />
                <span className="italic font-serif text-[#8C8275]">au service d'émotions sincères</span>
              </h2>

              <p className="text-sm lg:text-base text-[#5A534B] leading-relaxed max-w-2xl mx-auto mb-8 font-light">
                Imaginé par les chefs <strong>Tabata et Ludovic Mey</strong>, Ombellule vous invite à vous laisser porter à travers un univers d’art, de haute gastronomie et de créativité végétale et marine.
              </p>

              {/* Decorative Flowers */}
              <div className="flex items-center justify-center gap-6 my-6 opacity-80">
                <img src={FLEUR_GAUCHE} alt="" className="h-6 w-auto object-contain" />
                <span className="h-px w-20 bg-[#D8D0C3]" />
                <img src={FLEUR_DROITE} alt="" className="h-6 w-auto object-contain" />
              </div>

              {/* Photos Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
                <div className="rounded-2xl overflow-hidden shadow-lg h-60 group relative">
                  <img
                    src={AMBIANCE_PHOTO}
                    alt="Salle Ombellule"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-serif italic">La Salle & L'Art de la Table</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg h-60 group relative">
                  <img
                    src={CHEFS_PHOTO}
                    alt="Tabata & Ludovic Mey"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-serif italic">Chefs Tabata & Ludovic Mey</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg h-60 group relative">
                  <img
                    src={DISH_PHOTO}
                    alt="Création Culinaire"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-serif italic">Haute Création Gastronomique</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── EMBEDDED RESTAURANT OS BOOKING WIDGET ─── */}
            <section id="reservation-section" className="px-6 py-12 bg-[#F5F0E6] border-y border-[#E2DACB] relative">
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5DCB8] text-[#5C532B] text-xs font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#A38734]" />
                    Module de Réservation Restaurant OS
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-serif text-[#1E1E1E]">
                    Réserver votre expérience à Ombellule
                  </h3>
                  <p className="text-xs text-[#7A7165] mt-1">
                    Confirmation immédiate • Empreinte bancaire sécurisée • Gestion en direct du plan de table
                  </p>
                </div>

                {/* The Widget Container */}
                <div className="bg-white rounded-3xl shadow-xl border border-[#E3DACD] p-6 md:p-8 relative overflow-hidden">
                  {/* Step Progress Bar */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    {[
                      { num: 1, label: 'Date & Couverts' },
                      { num: 2, label: 'Créneau & Service' },
                      { num: 3, label: 'Coordonnées & Préférences' },
                      { num: 4, label: 'Confirmation' }
                    ].map(st => (
                      <div key={st.num} className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            bookingStep === st.num
                              ? 'bg-[#1E1E1E] text-white shadow-md'
                              : bookingStep > st.num
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {bookingStep > st.num ? <Check className="w-3.5 h-3.5" /> : st.num}
                        </div>
                        <span className="text-[11px] font-medium hidden md:inline text-gray-600">
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* STEP 1: DATE & COVERS */}
                  {bookingStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Service selector */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                          Service
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setService('dejeuner')}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              service === 'dejeuner'
                                ? 'border-[#C5A880] bg-[#FAF6EE] text-gray-900 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <div className="font-serif font-bold text-sm">Déjeuner</div>
                            <div className="text-[11px] text-gray-500">12:15 à 13:30 (Menu 3 ou 4 temps)</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setService('diner')}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              service === 'diner'
                                ? 'border-[#C5A880] bg-[#FAF6EE] text-gray-900 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <div className="font-serif font-bold text-sm">Dîner</div>
                            <div className="text-[11px] text-gray-500">19:30 à 21:00 (Menu Dégustation)</div>
                          </button>
                        </div>
                      </div>

                      {/* Number of guests */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                          Nombre de Couverts
                        </label>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCovers(n)}
                              className={`w-11 h-11 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center flex-shrink-0 ${
                                covers === n
                                  ? 'bg-[#1E1E1E] text-white shadow-md scale-105'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                          Date du Repas
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={date}
                            min="2026-08-18"
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                          />
                          <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        onClick={() => setBookingStep(2)}
                        className="w-full py-3.5 rounded-2xl bg-[#1E1E1E] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#C5A880] hover:text-black transition-all shadow-md mt-4"
                      >
                        Voir les horaires disponibles
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2: TIME SLOTS */}
                  {bookingStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Créneaux Disponibles ({service === 'dejeuner' ? 'Midi' : 'Soir'})
                          </label>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Disponibilité en direct
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {(service === 'dejeuner'
                            ? ['12:15', '12:30', '12:45', '13:00', '13:15']
                            : ['19:30', '19:45', '20:00', '20:15', '20:30', '20:45']
                          ).map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setTimeSlot(slot)}
                              className={`py-3 rounded-2xl font-semibold text-sm transition-all border ${
                                timeSlot === slot
                                  ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Atmosphere choice */}
                      <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                          <ChefHat className="w-4 h-4 text-[#A38734]" />
                          Expérience Gastronomique
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Pour {covers} personnes le <strong>{date}</strong> à <strong>{timeSlot}</strong>. Un accord mets et vins pourra être choisi directement sur place avec notre sommelière.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep(1)}
                          className="px-4 py-3.5 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingStep(3)}
                          className="flex-1 py-3.5 rounded-2xl bg-[#1E1E1E] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#C5A880] hover:text-black transition shadow-md"
                        >
                          Continuer la réservation
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: CONTACT & ALLERGIES */}
                  {bookingStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                          />
                        </div>
                      </div>

                      {/* Allergens & Preferences */}
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                          Régimes & Allergies (Transmission Cuisine)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {ALLERGY_OPTIONS.map(alg => {
                            const active = selectedAllergies.includes(alg);
                            return (
                              <button
                                key={alg}
                                type="button"
                                onClick={() => toggleAllergy(alg)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                                  active
                                    ? 'bg-[#C5A880] text-black font-semibold'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {alg}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bank Guarantee Box */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 text-xs text-gray-600 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          Garantie Bancaire Anti-No-Show (Stripe 3D-Secure)
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          <strong>0,00 € débité aujourd’hui</strong>. Une simple empreinte de 30 € / couvert est conservée pour garantir votre table. Annulation gratuite jusqu'à 24h avant.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep(2)}
                          className="px-4 py-3.5 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          onClick={handleCompleteBooking}
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 rounded-2xl bg-[#1E1E1E] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span>Transmission en cours...</span>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              Confirmer ma réservation
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: CONFIRMATION SUCCESS */}
                  {bookingStep === 4 && confirmedReservation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4 space-y-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>

                      <div>
                        <h4 className="text-xl font-serif font-bold text-gray-900">
                          Réservation Confirmée !
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Référence : <strong>{confirmedReservation.id}</strong> • Un email & SMS de confirmation vous ont été transmis.
                        </p>
                      </div>

                      <div className="bg-[#FAF6EE] border border-[#E8DFD0] rounded-2xl p-4 text-left text-xs space-y-2 text-gray-700">
                        <div className="flex justify-between border-b border-[#E8DFD0] pb-2">
                          <span className="text-gray-500">Convives :</span>
                          <span className="font-semibold text-gray-900">{confirmedReservation.covers} personnes</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8DFD0] pb-2">
                          <span className="text-gray-500">Date & Heure :</span>
                          <span className="font-semibold text-gray-900">{confirmedReservation.date} à {confirmedReservation.time}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8DFD0] pb-2">
                          <span className="text-gray-500">Table assignée :</span>
                          <span className="font-semibold text-emerald-700">{confirmedReservation.table}</span>
                        </div>
                        {confirmedReservation.allergies.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Régimes notés :</span>
                            <span className="font-semibold text-amber-800">{confirmedReservation.allergies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setBookingStep(1);
                          setConfirmedReservation(null);
                        }}
                        className="text-xs font-semibold text-gray-600 underline hover:text-black pt-2 block mx-auto"
                      >
                        Faire une autre réservation de test
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#EBE6DD] py-12 px-8 text-center text-xs text-[#8C8275] space-y-2">
              <p className="font-serif italic">Ombellule Restaurant — 36 cours Franklin Roosevelt, 69006 Lyon</p>
              <p>© 2026 Ombellule • Propulsé par Restaurant OS Vanguard</p>
            </footer>
          </div>
        )}

        {/* RIGHT COLUMN: RESTAURANT OS COCKPIT / POS FLOOR PLAN IN REAL-TIME */}
        {(viewMode === 'pos' || viewMode === 'split') && (
          <div
            className={`flex-1 bg-[#0F1115] text-[#ECECEC] flex flex-col overflow-y-auto ${
              viewMode === 'split' ? 'max-w-[42%]' : 'w-full'
            }`}
          >
            {/* POS Header */}
            <div className="border-b border-white/10 px-6 py-4 bg-[#14171D] flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Cockpit Restaurant OS • Ombellule
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Plan de Salle & Réservations Connectées
                  </p>
                </div>
              </div>

              {/* Notification badge */}
              <div className="relative">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                  <Bell className="w-4 h-4" />
                </div>
                {newResaAlert && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Alert banner when reservation arrives */}
              <AnimatePresence>
                {newResaAlert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-start justify-between shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Nouvelle Réservation Web Réceptionnée !
                        </div>
                        <div className="text-[11px] text-emerald-200/80 mt-0.5">
                          {confirmedReservation?.name} ({confirmedReservation?.covers} pers) • Table 4 assignée automatiquement • Empreinte CB validée.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewResaAlert(false)}
                      className="text-xs text-emerald-400 hover:text-white font-bold ml-2"
                    >
                      Fermer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floor Plan Miniature Representation */}
              <div className="bg-[#14171D] rounded-3xl p-5 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                    Plan de Salle Interactif (Service Soir)
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Capacité : <strong className="text-white">28/34 couverts</strong>
                  </span>
                </div>

                {/* Tables Grid Simulation */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Table 1', cap: 2, status: 'occupied', guest: 'M. Laurent (2p)' },
                    { id: 'Table 2', cap: 2, status: 'reserved', guest: 'Jean-Marc V. (2p)' },
                    { id: 'Table 3', cap: 4, status: 'free', guest: 'Disponible' },
                    {
                      id: 'Table 4',
                      cap: 2,
                      status: confirmedReservation ? 'new' : 'free',
                      guest: confirmedReservation ? `${confirmedReservation.name} (${confirmedReservation.covers}p)` : 'Disponible'
                    },
                    { id: 'Table 5', cap: 6, status: 'free', guest: 'Disponible' },
                    { id: 'Table 6', cap: 4, status: 'reserved', guest: 'Claire Dupont (4p)' },
                  ].map(tbl => {
                    const isNew = tbl.status === 'new';
                    const isOccupied = tbl.status === 'occupied';
                    const isReserved = tbl.status === 'reserved';
                    const isSelected = activeTable === tbl.id;

                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setActiveTable(tbl.id)}
                        className={`p-3.5 rounded-2xl text-left border transition-all relative ${
                          isNew
                            ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 ring-2 ring-emerald-500/50 animate-pulse'
                            : isOccupied
                            ? 'bg-red-950/30 border-red-800/40 text-red-200'
                            : isReserved
                            ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        } ${isSelected ? 'shadow-lg ring-1 ring-white' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{tbl.id}</span>
                          <span className="text-[10px] text-gray-400">{tbl.cap}p</span>
                        </div>
                        <div className="text-[11px] font-medium truncate">{tbl.guest}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Reservations Feed */}
              <div className="bg-[#14171D] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Flux des Réservations du Soir
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    0 € Commission Zenchef
                  </span>
                </div>

                <div className="space-y-2.5">
                  {posReservations.map(res => (
                    <div
                      key={res.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        res.id === confirmedReservation?.id
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{res.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-300">
                            {res.covers} pers
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#C5A880]">{res.time}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>{res.table}</span>
                        <div className="flex items-center gap-2">
                          {res.imprintSecured && (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]">
                              <ShieldCheck className="w-3 h-3" />
                              CB Garanti
                            </span>
                          )}
                          <span className="text-gray-500">{res.timestamp}</span>
                        </div>
                      </div>

                      {res.allergies.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
                          <Flame className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="text-[10px] text-amber-300 font-medium truncate">
                            KDS Alerte Cuisine : {res.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
