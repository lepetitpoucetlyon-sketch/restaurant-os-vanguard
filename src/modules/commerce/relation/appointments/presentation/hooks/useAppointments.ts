"use client";

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTenant } from '@/kernel/hooks';
import { AppointmentService } from '../../application/services/AppointmentService';
import {
  appointmentsAtom,
  appointmentsLoadingAtom,
  selectedDateAtom,
  appointmentFiltersAtom,
  filteredAppointmentsAtom,
  type AppointmentFilters,
} from '../../application/store/appointmentsAtom';
import type { AppointmentCreateInput } from '../../domain/types/appointment';

export function useAppointments() {
  const { activeTenantId } = useTenant();
  const [appointments, setAppointments] = useAtom(appointmentsAtom);
  const [loading, setLoading] = useAtom(appointmentsLoadingAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [filters, setFilters] = useAtom(appointmentFiltersAtom);
  const filtered = useAtomValue(filteredAppointmentsAtom);
  const setFiltersAtom = useSetAtom(appointmentFiltersAtom);

  const loadByDate = useCallback(async (date: string) => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const list = await AppointmentService.listByDate(activeTenantId, date);
      setAppointments(list);
      setSelectedDate(date);
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, setAppointments, setLoading, setSelectedDate]);

  const create = useCallback(async (input: AppointmentCreateInput) => {
    if (!activeTenantId) throw new Error('No active tenant');
    const appt = await AppointmentService.create(activeTenantId, input);
    setAppointments(prev => [...prev, appt]);
    return appt;
  }, [activeTenantId, setAppointments]);

  const confirm = useCallback(async (id: string) => {
    if (!activeTenantId) return;
    await AppointmentService.confirm(activeTenantId, id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' as const } : a));
  }, [activeTenantId, setAppointments]);

  const cancel = useCallback(async (id: string) => {
    if (!activeTenantId) return;
    await AppointmentService.cancel(activeTenantId, id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
  }, [activeTenantId, setAppointments]);

  const complete = useCallback(async (id: string) => {
    if (!activeTenantId) return;
    await AppointmentService.complete(activeTenantId, id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' as const } : a));
  }, [activeTenantId, setAppointments]);

  const updateFilters = useCallback((f: Partial<AppointmentFilters>) => {
    setFiltersAtom(prev => ({ ...prev, ...f }));
  }, [setFiltersAtom]);

  return {
    appointments,
    filtered,
    loading,
    selectedDate,
    filters,
    loadByDate,
    create,
    confirm,
    cancel,
    complete,
    updateFilters,
  };
}
