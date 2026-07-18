'use client';

import { motion, Variants } from 'framer-motion';
import {
  Download,
  FileText,
  Upload,
  CheckCircle2,
  Zap,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  iconBg: string;
  iconColor: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: Download,
    title: 'Exporter depuis TheFork / Zenchef',
    description:
      'Dans votre ancien logiciel, rendez-vous dans Parametres > Export > Reservations. Choisissez le format CSV ou XLSX et exportez l\'historique complet (clients + reservations passees).',
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-500',
  },
  {
    id: 2,
    icon: FileText,
    title: 'Format attendu',
    description:
      'Le systeme accepte CSV, XLSX et JSON. Les colonnes requises sont : prenom, nom, email, telephone, date, heure, couverts. Les colonnes supplementaires sont ignorees automatiquement.',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconColor: 'text-purple-500',
  },
  {
    id: 3,
    icon: Upload,
    title: 'Glisser-Deposer dans Migration',
    description:
      'Ouvrez la page Migration, selectionnez la categorie dans le menu de gauche (ex. "8. Reservations passees"), puis faites glisser votre fichier dans la zone de depot.',
    cta: { label: 'Ouvrir Migration', href: '/admin/settings?tab=migration' },
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-500',
  },
  {
    id: 4,
    icon: CheckCircle2,
    title: 'Verification',
    description:
      'Apres l\'import, un rapport affiche le nombre d\'enregistrements crees, mis a jour et ignores. Corrigez les erreurs eventuelles dans votre fichier source avant de recommencer.',
    iconBg: 'bg-green-50 dark:bg-green-950/40',
    iconColor: 'text-green-500',
  },
  {
    id: 5,
    icon: Zap,
    title: 'Activation',
    description:
      'Une fois vos donnees importees, activez le widget de reservation en ligne depuis l\'onglet Widget. Vos clients pourront immediatement reserver depuis votre site web.',
    cta: { label: 'Parametres widget', href: '/admin/settings?tab=reservations' },
    iconBg: 'bg-orange-50 dark:bg-orange-950/40',
    iconColor: 'text-orange-500',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function MigrationGuide() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-serif font-semibold text-text-primary">
          Guide d'import
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Suivez ces 5 etapes pour migrer vos reservations depuis TheFork, Zenchef ou tout autre logiciel.
        </p>
      </motion.div>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[1.625rem] top-10 bottom-10 w-px bg-border" aria-hidden />

        <ol className="space-y-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.id}
                variants={itemVariants}
                className="relative flex gap-5"
              >
                {/* Step number + icon */}
                <div className="flex-shrink-0 z-10">
                  <div
                    className={`w-[3.25rem] h-[3.25rem] rounded-2xl flex flex-col items-center justify-center border border-border ${step.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${step.iconColor}`} />
                    <span className={`text-[9px] font-bold mt-0.5 ${step.iconColor}`}>
                      0{step.id}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-bg-secondary border border-border rounded-2xl px-5 py-4 space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
                  {step.cta && (
                    <Link
                      href={step.cta.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {step.cta.label}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}
