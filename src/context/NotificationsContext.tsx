"use client";
import React from 'react';
import { useNexusCore } from '@/hooks';
export const useNotifications = () => useNexusCore()?.notif;
export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
