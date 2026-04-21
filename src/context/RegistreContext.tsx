"use client";
import React from 'react';
import { useNexusFiscal } from '@/engines/fiscal/NexusFiscalProvider';
export const useRegistre = () => useNexusFiscal()?.registre;
export const RegistreProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
