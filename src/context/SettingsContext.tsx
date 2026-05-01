"use client";
import { useSettings as useNexusSettings } from '@/engines/core/NexusCoreProvider';
export const useSettings = useNexusSettings;
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SettingsContextModule = {};
export default SettingsContextModule;
