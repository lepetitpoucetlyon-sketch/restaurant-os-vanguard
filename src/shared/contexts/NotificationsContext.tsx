"use client";
import { useNexusCore } from '@/shared/hooks';
export const useNotifications = () => useNexusCore()?.notif;
export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
