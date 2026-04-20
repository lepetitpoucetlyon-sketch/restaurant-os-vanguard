"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { getDefaultStaffEmail } from "@/config/instance";
import {
    User,
    Camera,
    Mail,
    Phone,
    Shield,
    Key,
    Save,
    Loader2,
    Check,
    X,
    Edit3,
    Star,
    Award,
    Briefcase,
    Eye,
    EyeOff,
    Fingerprint,
    ScanFace,
    BadgeCheck,
    Terminal,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    pin: string;
    avatar: string;
}

export default function ProfileSettings() {
    const { currentUser, users, updateUserStatus } = useAuth();
    const { showToast } = useToast();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPin, setShowPin] = useState(false);
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
            await updateUserStatus(selectedUser.id, {
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-10 overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                                Personnel Matrix
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                Active Operatives Count: <span className="text-accent">{users.length}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {users.map((user, idx) => (
                            <motion.button
                                key={user.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedUserId(user.id)}
                                className={cn(
                                    "relative p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-4 group/card overflow-hidden text-center",
                                    selectedUserId === user.id || (!selectedUserId && currentUser?.id === user.id)
                                        ? "bg-bg-tertiary border-accent shadow-lg"
                                        : "bg-bg-primary/50 border-border hover:border-accent/50"
                                )}
                            >
                                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />

                                <div className="relative">
                                    <div
                                        className="w-20 h-20 rounded-full p-1 border border-dashed transition-all duration-500 group-hover/card:rotate-180"
                                        style={{ borderColor: ROLE_COLORS[user.role] }}
                                    >
                                        <div className="w-full h-full rounded-full overflow-hidden bg-bg-primary">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-xl font-serif font-bold text-text-muted">{(user.name || '').charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {user.id === currentUser?.id && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-bg-secondary shadow-lg">
                                            <BadgeCheck className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="relative z-10 w-full">
                                    <p className="font-serif font-bold text-text-primary text-sm truncate w-full">
                                        {user.name}
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-bg-primary/50 border border-border/50">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[user.role] }} />
                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                            {ROLE_LABELS[user.role]?.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Neural Identity Core */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-10 overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

                <div className="flex items-center justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <motion.div
                                className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-bg-tertiary shadow-xl"
                                whileHover={{ scale: 1.05, rotate: -2 }}
                            >
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
                                        <User className="w-12 h-12 text-text-muted" />
                                    </div>
                                )}
                            </motion.div>
                            {isEditing && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg border-4 border-bg-secondary text-white hover:bg-accent/90 transition-colors"
                                >
                                    <Camera className="w-5 h-5" />
                                </motion.button>
                            )}
                            <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-accent-gold/20 backdrop-blur-md rounded-xl shadow-sm flex items-center gap-1.5 border border-accent-gold/30">
                                <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
                                <span className="text-xs font-bold text-accent-gold">
                                    {selectedUser?.performanceScore?.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-4xl font-serif text-text-primary uppercase tracking-tight italic">
                                    {formData.name || 'Unknown Operative'}
                                </h2>
                                <span className="px-3 py-1 rounded-lg bg-bg-tertiary text-text-muted text-[10px] font-bold uppercase tracking-widest border border-border">
                                    Lvl {selectedUser?.accessLevel}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-text-muted">
                                <div className="flex items-center gap-2">
                                    <ScanFace className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">ID: {selectedUserId?.slice(0, 8)}</span>
                                </div>
                                <div className="w-1 h-4 bg-border rounded-full" />
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{ROLE_LABELS[selectedUser?.role || 'server']}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border",
                            isEditing
                                ? "bg-error/10 border-error/20 text-error hover:bg-error hover:text-white"
                                : "bg-bg-tertiary border-border text-text-primary hover:bg-bg-primary shadow-sm"
                        )}
                    >
                        {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditing ? 'Abort Edit' : 'Modify Data'}
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div className="space-y-8">
                        {/* Contact Vector */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Contact Vector
                            </h4>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Digital Mail Relay</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            disabled={!isEditing}
                                            className={cn(
                                                "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                                                isEditing
                                                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                                                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                                            )}
                                        />
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Voice Link</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            disabled={!isEditing}
                                            className={cn(
                                                "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                                                isEditing
                                                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                                                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                                            )}
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Security Protocol */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Security Protocol
                            </h4>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Nouveau code PIN (laisser vide pour conserver l&apos;actuel)</label>
                                    <div className="relative">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            value={formData.pin}
                                            onChange={(e) => handleChange('pin', e.target.value)}
                                            disabled={!isEditing}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={4}
                                            placeholder={isEditing ? "4 chiffres" : "PIN masqué"}
                                            className={cn(
                                                "w-full pl-12 pr-12 py-5 rounded-2xl font-serif text-xl tracking-[0.5em] transition-all outline-none border",
                                                isEditing
                                                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                                                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                                            )}
                                        />
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                                        >
                                            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Identity Avatar Relay</label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={formData.avatar}
                                            onChange={(e) => handleChange('avatar', e.target.value)}
                                            disabled={!isEditing}
                                            placeholder="https://..."
                                            className={cn(
                                                "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                                                isEditing
                                                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                                                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                                            )}
                                        />
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Advisory */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 p-6 rounded-2xl bg-accent-gold/5 border border-accent-gold/20 flex items-start gap-4"
                >
                    <div className="w-8 h-8 rounded-lg bg-accent-gold/20 flex items-center justify-center flex-shrink-0 text-accent-gold">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h5 className="font-serif font-bold text-accent-gold text-sm mb-1 uppercase tracking-wide">Security Directive</h5>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">
                            PIN sequences are cryptographically hashed. Unauthorized sharing constitutes a Class 3 protocol violation. Verify all vectors before committing.
                        </p>
                    </div>
                </motion.div>
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
                            className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                        >
                            {isSaving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <div className="relative">
                                    <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
                                </div>
                            )}
                            Commit Identity Profile
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
