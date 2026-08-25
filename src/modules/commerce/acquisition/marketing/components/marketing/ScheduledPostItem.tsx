"use client";

import { Edit3, Trash2, Image as ImageIcon, Video } from "lucide-react";

interface ScheduledPostItemProps {
    post: {
        id: string;
        platforms: string[];
        content: string;
        media: { type: string, url: string };
        scheduledFor: string;
    };
    socialAccounts: (import('../../store/marketingAtoms').SocialAccount & { icon?: import("react").ComponentType<{ size?: number; strokeWidth?: number }>, color?: string })[];
}

export function ScheduledPostItem({ post, socialAccounts }: ScheduledPostItemProps) {
    return (
        <div className="group flex flex-col md:flex-row items-start gap-6 p-6 rounded-3xl bg-surface-card/60 dark:bg-surface-card/5 border border-default dark:border-white/5 hover:border-text-primary/20 hover:bg-surface-card/80 dark:hover:bg-surface-card/10 transition-all duration-300">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-surface-bg dark:bg-surface-sidebar overflow-hidden shrink-0 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center text-text-muted group-hover:scale-110 transition-transform duration-700">
                    {post.media.type === 'image' ? <ImageIcon size={32} /> : <Video size={32} />}
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-surface-sidebar/60 backdrop-blur-md rounded-lg text-nano font-bold text-text-primary uppercase tracking-wider border border-subtle">
                    {new Date(post.scheduledFor).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>
            </div>

            <div className="flex-1 min-w-0 py-1 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {post.platforms.map((p) => {
                            const account = socialAccounts.find(a => a.id === p);
                            if (!account) return null;
                            const Icon = account.icon as import("react").FC<{ size?: number; style?: import("react").CSSProperties }> | undefined;
                            return (
                                <div key={p} className="p-1.5 rounded-lg bg-surface-card dark:bg-surface-sidebar/20 text-text-primary shadow-sm ring-1 ring-black/5">
                                    { Icon ? <Icon size={14} style={{ color: account.color }} /> : null }
                                </div>
                            );
                        })}
                        <div className="w-px h-4 bg-border mx-1" />
                        <span className="text-nano font-black text-text-muted uppercase tracking-widest">
                            {new Date(post.scheduledFor).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <button className="p-2 hover:bg-surface-sidebar/5 dark:hover:bg-surface-card/10 rounded-xl transition-colors">
                            <Edit3 size={16} className="text-text-secondary" />
                        </button>
                        <button className="p-2 hover:bg-status-danger/10 hover:text-status-danger rounded-xl transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <p className="text-sm font-medium text-text-primary/80 leading-relaxed max-w-2xl line-clamp-2">
                    {post.content}
                </p>
            </div>
        </div>
    );
}
