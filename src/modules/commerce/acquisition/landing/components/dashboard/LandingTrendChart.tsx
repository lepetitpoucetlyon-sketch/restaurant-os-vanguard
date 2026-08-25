'use client';

import { motion } from "framer-motion";
import { fadeInUp } from "@/shared/utils/motion";

interface LandingTrendChartProps {
  chartPath: string;
  isMobile: boolean;
}

export function LandingTrendChart({ chartPath, isMobile }: LandingTrendChartProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="xl:col-span-2 card-premium p-6 md:p-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-light text-text-primary tracking-tight">Tendance CA — 7 Jours</h3>
          <p className="text-nano text-text-muted mt-1 uppercase tracking-widest font-black">Données Réelles • Firestore</p>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-gold" />
              <span className="text-nano font-black text-accent-gold uppercase">CA Journalier</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-[200px] md:h-[300px] w-full relative">
        <svg viewBox="0 0 800 300" className="w-full h-full relative z-10 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-gold)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-accent-gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={chartPath}
            fill="transparent"
            stroke="var(--color-accent-gold)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
