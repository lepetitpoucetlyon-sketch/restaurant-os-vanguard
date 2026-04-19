"use client";
import { useAuth as useNexusAuth } from '@/engines/core/NexusCoreProvider';
export const useAuth = useNexusAuth;
export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
