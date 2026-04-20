// @ts-nocheck
"use client";

import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, ChevronDown, CheckCircle2, FileText, Smartphone, Laptop, ChefHat, Database, Box, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
};

export default function WelcomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div ref={containerRef} className="min-h-screen bg-bg-primary font-sans overflow-x-hidden selection:bg-accent selection:text-white">
      
      {/* NAVIGATION / HEADER */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference text-white">
        <div className="font-serif text-2xl tracking-widest uppercase flex items-center gap-2">
           <Box className="w-6 h-6 text-accent" />
           Restaurant <span className="italic opacity-80">OS</span>
        </div>
        <Link href="/">
           <Button variant="ghost" className="uppercase tracking-widest text-xs font-bold hover:bg-white/10">Passer le guide</Button>
        </Link>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[100svh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
         {/* Abstract Background Elements */}
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-gold/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
         
         <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            animate="show" 
            className="z-10 max-w-4xl"
         >
            <motion.p variants={fadeUp} className="text-accent uppercase tracking-[0.5em] text-sm font-bold mb-6">
                L'Excellence Opérationnelle
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-serif font-light text-text-primary leading-[0.9] mb-8">
                Bienvenue dans<br/>
                <span className="italic text-accent-gold">l'ère Restaurant OS.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
                Un système d'exploitation premium, conçu comme l'extension naturelle de votre brigade. La configuration ne vous prendra que quelques minutes.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4 justify-center">
                <Button className="bg-text-primary text-bg-primary w-48 h-14 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-black/10 hover:scale-105 transition-all">
                    Commencer
                </Button>
                <Link href="#migration">
                    <Button variant="outline" className="w-48 h-14 rounded-full font-bold uppercase tracking-widest text-xs border-border hover:bg-bg-secondary text-text-primary transition-all">
                        Voir le Guide
                    </Button>
                </Link>
            </motion.div>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, y: [0, 10, 0] }} 
            transition={{ delay: 2, duration: 2, repeat: Infinity }}
            className="absolute bottom-10"
         >
             <ChevronDown className="w-8 h-8 text-text-muted/50" />
         </motion.div>
      </section>

      {/* SECTION 1: IDENTITY */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
         <div className="grid md:grid-cols-2 gap-16 items-center">
             <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
             >
                 <div className="w-16 h-16 bg-bg-secondary border border-border flex items-center justify-center rounded-2xl">
                     <span className="font-serif text-3xl text-accent">01</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-serif text-text-primary leading-tight">
                     Forgez l'ADN<br/>
                     <span className="italic font-light">de votre Établissement.</span>
                 </h2>
                 <p className="text-text-muted text-lg leading-relaxed">
                     Commencez par définir votre identité. Notre IA utilisera ces informations pour générer vos communications, adapter l'interface (bistrot, gastro, fast-casual) et formater vos tickets de caisse de manière chirurgicale.
                 </p>
                 <ul className="space-y-4">
                     {["Raison sociale & SIRET", "Horaires dynamiques", "Charte & Logo (Atelier Reserve)"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-text-primary">
                             <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                             {item}
                         </li>
                     ))}
                 </ul>
                 <Link href="/settings" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:gap-4 transition-all">
                     Paramétrer l'Identité <ArrowRight className="w-4 h-4" />
                 </Link>
             </motion.div>
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-[600px] w-full rounded-[2.5rem] bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border shadow-premium overflow-hidden group"
             >
                 {/* Decorative Overlay */}
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-primary pointer-events-none" />
                 <div className="absolute inset-0 flex items-center justify-center">
                     <ChefHat className="w-48 h-48 text-border group-hover:text-accent transition-colors duration-700" strokeWidth={0.5} />
                 </div>
             </motion.div>
         </div>
      </section>

      {/* SECTION 2: AI MIGRATION TUNNEL (THE CORE FEATURE) */}
      <section id="migration" className="py-32 px-8 bg-text-primary text-bg-primary relative overflow-hidden">
         {/* Dark Theme Overrides for this section */}
         <div className="max-w-7xl mx-auto relative z-10">
             <div className="text-center mb-24">
                 <motion.p 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="text-accent uppercase tracking-[0.5em] text-sm font-bold mb-4"
                 >
                     L'Outil de Migration
                 </motion.p>
                 <motion.h2 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-5xl md:text-7xl font-serif font-light leading-tight"
                 >
                     Ne saisissez plus <span className="italic text-accent-gold">jamais</span> votre carte à la main.
                 </motion.h2>
             </div>

             <div className="grid lg:grid-cols-3 gap-8">
                 {/* Step A */}
                 <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-md">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-8">
                         <FileText className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-2xl font-serif mb-4">1. Uploadez votre PDF</h3>
                     <p className="text-white/60 mb-8 leading-relaxed">
                         Prenez une photo ou uploadez un PDF / Word du menu existant. Rien à formater.
                     </p>
                 </div>
                 {/* Step B */}
                 <div className="bg-white/5 border border-accent/30 p-10 rounded-3xl backdrop-blur-md relative transform lg:-translate-y-6 shadow-2xl shadow-accent/20">
                     <div className="absolute top-0 right-10 -translate-y-1/2 bg-accent text-bg-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                         L'Oracle Intervient
                     </div>
                     <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-8">
                         <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                     </div>
                     <h3 className="text-2xl font-serif mb-4">2. OCR & IA Générative</h3>
                     <p className="text-white/60 mb-8 leading-relaxed">
                         Le moteur Gemini 3.1 Pro lit, organise et classe intelligemment 100% des plats, descriptions et prix en quelques secondes.
                     </p>
                 </div>
                 {/* Step C */}
                 <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-md">
                     <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mb-8">
                         <Database className="w-6 h-6 text-success" />
                     </div>
                     <h3 className="text-2xl font-serif mb-4">3. Validation Visuelle</h3>
                     <p className="text-white/60 mb-8 leading-relaxed">
                         Vérifiez les tuiles générées. Un clic et l'intégralité de la carte est injectée dans le KDS et la Caisse.
                     </p>
                 </div>
             </div>

             <div className="mt-16 text-center">
                 <Link href="/settings?tab=migration">
                    <Button className="bg-accent text-white w-64 h-14 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-accent/80 transition-all shadow-xl shadow-accent/20">
                        Ouvrir le portail d'import
                    </Button>
                 </Link>
             </div>
         </div>
      </section>

      {/* SECTION 3: ECOSYSTEM */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
         <div className="grid md:grid-cols-2 gap-16 items-center">
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-[600px] w-full rounded-[2.5rem] bg-bg-secondary border border-border shadow-premium overflow-hidden p-12 flex flex-col justify-betweeen"
             >
                 <div className="flex justify-between items-start">
                     <Smartphone className="w-12 h-12 text-text-primary" />
                     <Laptop className="w-12 h-12 text-text-primary" />
                 </div>
                 <div className="mt-auto">
                     <h4 className="font-serif text-3xl mb-4 text-text-primary">Ecosystème Unifié.</h4>
                     <div className="space-y-3">
                         <div className="h-2 w-full bg-border rounded-full overflow-hidden"><div className="w-full h-full bg-success"></div></div>
                         <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                             <span>iPad KDS</span> <span>Sync en 4ms</span>
                         </div>
                     </div>
                 </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
             >
                 <div className="w-16 h-16 bg-bg-secondary border border-border flex items-center justify-center rounded-2xl">
                     <span className="font-serif text-3xl text-accent">02</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-serif text-text-primary leading-tight">
                     Synchronisation<br/>
                     <span className="italic font-light">Matérielle Totale.</span>
                 </h2>
                 <p className="text-text-muted text-lg leading-relaxed">
                     L'OS est conçu "Agnostic". Scannez les QR Codes depuis vos tablettes de cuisine ou téléphones de prise de commande pour lier les appareils instantanément, sans aucune configuration de réseau de bas niveau requise.
                 </p>
                 <div className="bg-bg-tertiary p-6 rounded-2xl border border-border">
                     <h4 className="font-bold text-sm uppercase tracking-widest text-text-primary mb-2">Modules Activables</h4>
                     <div className="flex flex-wrap gap-2">
                         {["POS Principal", "KDS Cuisine", "KDS Bar", "Borne de Commande", "Dashboard Bureau"].map(tag => (
                             <span key={tag} className="px-3 py-1 bg-bg-primary border border-border rounded-full text-xs font-semibold">{tag}</span>
                         ))}
                     </div>
                 </div>
             </motion.div>
         </div>
      </section>

      {/* FINAL SECTION (SANDBOX) */}
      <section className="py-32 px-8">
          <div className="max-w-5xl mx-auto bg-text-primary rounded-[3rem] p-16 text-center text-bg-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/20 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                  <PlayCircle strokeWidth={1} className="w-24 h-24 mx-auto text-accent-gold" />
                  <h2 className="text-5xl md:text-6xl font-serif font-light leading-tight">
                      Prêt pour le test ?<br/>
                      <span className="italic text-accent">Activez le Bac à Sable.</span>
                  </h2>
                  <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto">
                      Simulez un service complet avec des fausses commandes générées par notre IA pour former vos équipes avant le grand jour.
                  </p>
                  <Link href="/" className="inline-block mt-8">
                      <Button className="bg-white text-black w-64 h-16 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:bg-white/90 transition-all shadow-2xl">
                          Aller au Dashboard
                      </Button>
                  </Link>
              </div>
          </div>
      </section>
      
      <footer className="py-10 text-center font-bold text-[10px] uppercase tracking-widest text-text-muted">
          &copy; {new Date().getFullYear()} Restaurant OS — Conçu pour l'excellence.
      </footer>
    </div>
  );
}
