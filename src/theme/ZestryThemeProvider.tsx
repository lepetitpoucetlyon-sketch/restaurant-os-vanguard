// @ts-nocheck
"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { ThemeTokens, ThemeTokensType } from "./tokens";
import { whiteLabelInstanceConfig } from "@/config/instance";

interface ThemeContextType {
  tokens: ThemeTokensType;
  instanceName: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ZestryThemeProvider({ 
  children, 
  instanceName = whiteLabelInstanceConfig.appName 
}: { 
  children: ReactNode;
  instanceName?: string;
}) {
  // Injection industrielle des variables CSS au niveau racine (html)
  useEffect(() => {
    const root = document.documentElement;
    
    const variables = {
      "--brand-primary": whiteLabelInstanceConfig.primaryColor,
      "--brand-secondary": whiteLabelInstanceConfig.secondaryColor,
      "--brand-accent": ThemeTokens.colors.brand.accent,
      "--bg-main": ThemeTokens.colors.bg.main,
      "--bg-card": ThemeTokens.colors.bg.card,
      "--text-primary": ThemeTokens.colors.text.primary,
      "--text-secondary": ThemeTokens.colors.text.secondary,
    };

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ tokens: ThemeTokens, instanceName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ZestryThemeProvider");
  }
  return context;
};
