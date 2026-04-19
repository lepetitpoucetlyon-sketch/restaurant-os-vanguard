"use client";
import { useNexusFiscal } from '@/engines/fiscal/NexusFiscalProvider';
export const useRegistre = () => useNexusFiscal()?.registre;
export const RegistreProvider = ({ children }: { children: any }) => <>{children}</>;
