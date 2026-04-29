"use client";
import React from 'react';
import { useNexusFiscal } from '@/engines/fiscal/NexusFiscalProvider';
export const useRegistre = () => (useNexusFiscal() as any)?.registre || { data: [], isLoading: false, entries: [] };
export const RegistreProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
