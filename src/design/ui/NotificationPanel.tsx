"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    Bell,
    AlertTriangle,
    Info,
    CheckCircle2,
    Trash2,
    CheckCheck,
    ChevronDown,
    Zap,
    Layers
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useNotifications } from "@/kernel/hooks";
import type { Notification, NotificationType } from "@nexus/contracts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; bgColor: string; textColor: string; borderColor: string; badgeColor: string; animate: boolean }> = {
    critical: {
        icon: Zap,
        bgColor: 'bg-status-danger/10 dark:bg-status-danger/20',
        textColor: 'text-status-danger dark:text-status-danger',
        borderColor: 'border-l-red-500',
        badgeColor: 'bg-status-danger',
        animate: true
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-status-warning/10 dark:bg-status-warning/20',
        textColor: 'text-status-warning dark:text-status-warning',
        borderColor: 'border-l-orange-500',
        badgeColor: 'bg-status-warning',
        animate: false
    },
    info: {
        icon: Info,
        bgColor: 'bg-action-primary/10 dark:bg-action-primary/20',
        textColor: 'text-brand dark:text-brand',
        borderColor: 'border-l-blue-500',
        badgeColor: 'bg-action-primary',
        animate: false
    },
    success: {
        icon: CheckCircle2,
        bgColor: 'bg-status-success/10 dark:bg-status-success/20',
        textColor: 'text-status-success dark:text-status-success',
        borderColor: 'border-l-emerald-500',
        badgeColor: 'bg-status-success',
        animate: false
    }
};

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.action?.href) {
            router.push(notification.action.href);
            onClose();
        }
    };

    // Group by Module
    const groupedNotifications = notifications.reduce((acc: Record<string, Notification[]>, notification: Notification) => {
        const moduleName = notification.module || 'Système';
        if (!acc[moduleName]) {
            acc[moduleName] = [];
        }
        acc[moduleName].push(notification);
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <>
            {/* Museum Gallery Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-surface-sidebar/20 dark:bg-surface-sidebar/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Executive Archive Panel */}
            <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-2 right-2 bottom-2 z-[200] w-[calc(100%-1rem)] md:w-[480px] bg-surface-card dark:bg-surface-sidebar border border-subtle dark:border-accent-gold/20 rounded-[2.5rem] shadow-2xl dark:shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(197,160,89,0.1)] overflow-hidden flex flex-col"
            >
                {/* Visual Glow (Dark Mode Only) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[100px] pointer-events-none hidden dark:block" />

                {/* Master UI Header */}
                <div className="p-6 md:p-10 border-b border-subtle dark:border-white/5 flex items-center justify-between relative z-10 bg-surface-card dark:bg-transparent">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[22px] bg-surface-bg dark:bg-accent-gold/10 flex items-center justify-center border border-subtle dark:border-accent-gold/20 shadow-lg dark:shadow-glow group transition-all duration-700 hover:rotate-6">
                                <Bell className="w-5 h-5 md:w-7 md:h-7 text-primary dark:text-accent-gold" strokeWidth={1.5} />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-status-danger border-4 border-white dark:border-black animate-pulse" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-serif font-black italic text-primary dark:text-text-primary tracking-tighter">Archive<br />des Alertes</h2>
                            <p className="text-[9px] md:text-[10px] font-black text-muted dark:text-accent-gold/60 uppercase tracking-[0.3em] md:tracking-[0.4em] mt-2 md:mt-3">
                                {unreadCount > 0 ? `${unreadCount} TRANSMISSIONS ACTIVES` : 'AUCUN SIGNAL'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-surface-bg dark:bg-surface-card/5 border border-subtle dark:border-subtle flex items-center justify-center text-muted dark:text-text-primary/40 hover:text-primary dark:hover:text-text-primary hover:bg-surface-bg dark:hover:bg-surface-card/10 hover:rotate-90 transition-all duration-500"
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto elegant-scrollbar p-6 space-y-6 relative z-10 bg-surface-bg/50 dark:bg-transparent">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-24 h-24 rounded-full bg-surface-bg dark:bg-accent-gold/5 mb-10 flex items-center justify-center border border-subtle dark:border-accent-gold/10">
                                <CheckCircle2 className="w-10 h-10 text-muted dark:text-accent-gold/20" strokeWidth={1} />
                            </div>
                            <p className="text-muted dark:text-text-primary/40 font-serif italic text-2xl">L'Établissement est en Paix</p>
                            <p className="text-[10px] font-black text-muted dark:text-accent-gold/40 uppercase tracking-[0.3em] mt-4">Tout est sous contrôle exécutif</p>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([moduleName, moduleNotifications]) => (
                            <NotificationCategory
                                key={moduleName}
                                title={moduleName}
                                notifications={moduleNotifications}
                                onRead={handleNotificationClick}
                                onRemove={removeNotification}
                            />
                        ))
                    )}
                </div>

                {/* Footer Controls */}
                {notifications.length > 0 && (
                    <div className="p-10 border-t border-subtle dark:border-white/5 bg-surface-card dark:bg-surface-card/[0.02] flex items-center justify-between relative z-10">
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-3 text-[10px] font-black text-primary dark:text-accent-gold hover:text-secondary dark:hover:text-text-primary transition-colors uppercase tracking-[0.2em]"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Tout archiver
                        </button>
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-3 text-[10px] font-black text-muted dark:text-text-primary/20 hover:text-status-danger transition-colors uppercase tracking-[0.2em]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Purge Totale
                        </button>
                    </div>
                )}
            </motion.div>
        </>
    );
}

function NotificationCategory({
    title,
    notifications,
    onRead,
    onRemove
}: {
    title: string;
    notifications: Notification[];
    onRead: (n: Notification) => void;
    onRemove: (id: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="bg-surface-card dark:bg-surface-card/5 border border-subtle dark:border-white/5 rounded-3xl overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-bg dark:hover:bg-surface-card/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border",
                        unreadCount > 0
                            ? "bg-surface-sidebar dark:bg-accent-gold text-text-primary dark:text-primary border-transparent"
                            : "bg-surface-bg dark:bg-surface-card/5 text-muted dark:text-text-primary/40 border-subtle dark:border-subtle"
                    )}>
                        <Layers className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary dark:text-text-primary">{title}</h3>
                        <p className="text-[10px] font-bold text-muted dark:text-text-primary/40 mt-1">
                            {notifications.length} Notification{notifications.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {unreadCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-status-danger text-text-primary text-[10px] font-black">
                            {unreadCount} NEW
                        </span>
                    )}
                    <ChevronDown className={cn(
                        "w-5 h-5 text-muted transition-transform duration-300",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-4 pb-4 space-y-3 border-t border-subtle dark:border-white/5 pt-4">
                            {notifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onClick={() => onRead(notification)}
                                    onRemove={(id) => onRemove(id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NotificationItem({ notification, onClick, onRemove }: { notification: Notification, onClick: () => void, onRemove: (id: string) => void }) {
    const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
    const Icon = config.icon;
    const timeAgo = formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: fr });

    return (
        <motion.div
            layout
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            onClick={onClick}
            className={cn(
                "group/item relative p-5 rounded-2xl cursor-pointer transition-all duration-500 border overflow-hidden",
                !notification.read
                    ? "bg-surface-bg dark:bg-surface-card/5 border-subtle dark:border-subtle hover:border-default dark:hover:border-accent-gold/40"
                    : "opacity-60 hover:opacity-100 bg-transparent border-transparent hover:bg-surface-bg dark:hover:bg-surface-card/5"
            )}
        >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-surface-bg dark:bg-accent-gold/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />

            <div className="flex gap-5 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-700 group-hover/item:scale-110 group-hover/item:rotate-6",
                    config.bgColor,
                    "border border-subtle dark:border-white/5"
                )}>
                    <Icon className={cn("w-5 h-5", config.textColor, config.animate && "animate-pulse")} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className={cn(
                            "font-serif text-sm leading-tight italic",
                            !notification.read ? "font-black text-primary dark:text-text-primary" : "font-bold text-secondary dark:text-text-primary/60"
                        )}>
                            {notification.title}
                        </h4>
                        <span className="text-[9px] font-black text-muted dark:text-accent-gold/40 uppercase tracking-widest whitespace-nowrap mt-1">{timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-secondary dark:text-text-primary/40 leading-relaxed font-sans line-clamp-2 uppercase tracking-wide">
                        {notification.message}
                    </p>

                    {notification.action && (
                        <button className={cn(
                            "mt-4 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 group/btn",
                            "text-primary dark:text-accent-gold"
                        )}>
                            {notification.action.label}
                            <Zap className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-2" />
                        </button>
                    )}
                </div>
                <div className="flex flex-col opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-4 group-hover/item:translate-x-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(notification.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-surface-bg dark:bg-status-danger/10 flex items-center justify-center text-status-danger hover:bg-status-danger hover:text-text-primary transition-all shadow-sm"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {!notification.read && (
                <div className={cn(
                    "absolute top-5 right-5 w-2 h-2 rounded-full",
                    notification.type === 'critical' ? "bg-status-danger" : "bg-surface-sidebar dark:bg-accent-gold"
                )} />
            )}
        </motion.div>
    );
}
