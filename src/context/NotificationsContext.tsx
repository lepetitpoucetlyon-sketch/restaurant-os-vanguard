"use client";
import { useNexusCore } from '@/engines/core/NexusCoreProvider';
export const useNotifications = () => useNexusCore()?.notif;
export const NotificationsProvider = ({ children }: { children: any }) => <>{children}</>;
