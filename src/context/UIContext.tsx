"use client";
import { useUI as useNexusUI } from '@/engines/core/NexusCoreProvider';
export const useUI = useNexusUI;
export const UIProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
