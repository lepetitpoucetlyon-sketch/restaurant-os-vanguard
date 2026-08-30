"use client";

// @wip owner:hr-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import React, { createContext, useContext, useReducer } from 'react';
import type { PlanningContextValue, PlanningState, PlanningAction } from '@/shared/nexus/contracts/context/planning.contracts';
import { CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { Shift as DomainShift } from '@nexus/contracts';

export type Shift = DomainShift;

const PlanningContext = createContext<PlanningContextValue | null>(null);

const initialState: PlanningState = {
    slots: [],
    resources: [],
    conflicts: [],
    status: 'idle',
    error: null,
};

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
    switch (action.type) {
        case 'SET_SLOTS':    return { ...state, slots: action.payload };
        case 'SET_STATUS':   return { ...state, status: action.payload };
        case 'SET_ERROR':    return { ...state, error: action.payload };
        default:             return state;
    }
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(planningReducer, initialState);
    return (
        <PlanningContext.Provider value={{ state, dispatch }}>
            {children}
        </PlanningContext.Provider>
    );
}

export function usePlanning(): PlanningContextValue {
    const ctx = useContext(PlanningContext);
    if (!ctx) {
        throw new Error(`[${CoreErrorCode.MAPPING_FAILURE}] PlanningContext must be used within PlanningProvider`);
    }
    return ctx;
}
