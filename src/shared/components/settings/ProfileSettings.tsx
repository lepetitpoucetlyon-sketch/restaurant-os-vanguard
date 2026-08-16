"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/shared/hooks";
import { useToast } from "@ui/Toast";
import { getDefaultStaffEmail } from "@/config/instance";
import { Save, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { ProfileData } from "./profile/types";
import { PersonnelMatrix } from "./profile/PersonnelMatrix";
import { IdentityCoreHeader } from "./profile/IdentityCoreHeader";
import { ContactVectorSection } from "./profile/ContactVectorSection";
import { SecurityProtocolSection, SecurityAdvisoryBox } from "./profile/SecurityProtocolSection";

export default function ProfileSettings() {
  const { currentUser, users, updateUser } = useAuth();
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    pin: '',
    avatar: ''
  });

  const selectedUser = selectedUserId
    ? users.find(u => u.id === selectedUserId)
    : currentUser;

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: getDefaultStaffEmail(selectedUser.name),
        phone: '+33 1 23 45 67 89',
        pin: '',
        avatar: selectedUser.avatar || ''
      });
    }
  }, [selectedUser]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    if (formData.pin && formData.pin.length !== 4) {
      showToast("Le code PIN doit contenir exactement 4 chiffres.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser?.(selectedUser.id, {
        name: formData.name,
        avatar: formData.avatar,
        ...(formData.pin ? { pin: formData.pin } : {})
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
      setFormData(prev => ({ ...prev, pin: '' }));
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast("Impossible d'enregistrer ce profil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <div className="space-y-12 pb-20">
      {/* Personnel Matrix (Admin View) */}
      {isAdmin && (
        <PersonnelMatrix
          users={users}
          currentUser={currentUser}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      )}

      {/* Neural Identity Core */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-10 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

        <IdentityCoreHeader
          selectedUser={selectedUser}
          formData={formData}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <ContactVectorSection
            formData={formData}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <SecurityProtocolSection
            formData={formData}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>

        <SecurityAdvisoryBox />
      </motion.div>

      {/* Global Dispatch */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-end pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-4 px-12 py-6 rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border",
                saveSuccess
                  ? "bg-success text-text-primary border-success"
                  : "bg-text-primary text-bg-primary border-border"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : saveSuccess ? (
                <BadgeCheck className="w-6 h-6" />
              ) : (
                <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
              )}
              {saveSuccess ? "Profil sauvegardé" : "Commit Identity Profile"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
