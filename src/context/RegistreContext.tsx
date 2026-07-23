"use client";
import React, { createContext, useContext, useReducer } from 'react';
import { RegistreContextValue, RegistreState, RegistreAction } from '@/shared/nexus/contracts/context/registre.contracts';
import { CoreErrorCode } from '@/shared/nexus/contracts/errors.types';

const RegistreContext = createContext<RegistreContextValue | null>(null);

const initialState: RegistreState = {
  vassals: [],
  activeVassalId: null,
  status: 'idle',
  error: null
};

function registreReducer(state: RegistreState, action: RegistreAction): RegistreState {
  switch (action.type) {
    case 'SET_VASSALS':
      return { ...state, vassals: action.payload };
    case 'SET_ACTIVE':
      return { ...state, activeVassalId: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function RegistreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(registreReducer, initialState);
  return (
    <RegistreContext.Provider value={{ state, dispatch }}>
      {children}
    </RegistreContext.Provider>
  );
}

export function useRegistre(): RegistreContextValue {
  const ctx = useContext(RegistreContext);
  if (!ctx) {
    throw new Error(`[${CoreErrorCode.MAPPING_FAILURE}] RegistreContext must be used within RegistreProvider`);
  }
  return ctx;
}
