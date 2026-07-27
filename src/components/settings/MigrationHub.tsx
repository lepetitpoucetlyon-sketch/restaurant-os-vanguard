'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, BookOpen, Mail, LayoutGrid, FileDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const MigrationSettings = dynamic(() => import('./MigrationSettings'), { ssr: false });
const MigrationGuide = dynamic(() => import('./MigrationGuide'), { ssr: false });
const MigrationEmailTemplate = dynamic(() => import('./MigrationEmailTemplate'), { ssr: false });
const FloorPlanSetupWizard = dynamic(() => import('@/lib/migration/FloorPlanSetupWizard'), { ssr: false });
const CSVTemplateDownloads = dynamic(() => import('@/lib/migration/CSVTemplateDownloads'), { ssr: false });

type MigrationTab = 'import' | 'guide' | 'email' | 'floorplan' | 'templates';

const TABS: { id: MigrationTab; label: string; icon: React.ElementType }[] = [
  { id: 'import', label: 'Import & Migration', icon: Upload },
  { id: 'floorplan', label: 'Plan de salle', icon: LayoutGrid },
  { id: 'templates', label: 'Templates CSV', icon: FileDown },
  { id: 'guide', label: "Guide d'import", icon: BookOpen },
  { id: 'email', label: 'Email migration', icon: Mail },
];

export default function MigrationHub() {
  const [activeTab, setActiveTab] = useState<MigrationTab>('import');

  return (
    <div className="space-y-6">
      {/* Sub-tab bar */}
      <div className="flex gap-1 p-1 bg-bg-secondary border border-border rounded-2xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-text-primary text-bg-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'import' && <MigrationSettings />}
          {activeTab === 'floorplan' && <FloorPlanSetupWizard />}
          {activeTab === 'templates' && <CSVTemplateDownloads />}
          {activeTab === 'guide' && <MigrationGuide />}
          {activeTab === 'email' && <MigrationEmailTemplate />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
