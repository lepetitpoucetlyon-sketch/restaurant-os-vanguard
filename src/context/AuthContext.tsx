"use client";
import { useAuth as useNexusAuth, useTenant as useNexusTenant } from '@/engines/core/NexusCoreProvider';
export const useAuth = useNexusAuth;
export const useTenant = useNexusTenant;
export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
