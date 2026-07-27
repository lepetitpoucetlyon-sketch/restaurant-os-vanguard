"use client";
import React, { createContext, useMemo, ReactNode } from 'react';
import { useAtom } from 'jotai';
import { 
    isSidebarCollapsedAtom, isLaunchpadOpenAtom, isCommandOpenAtom, 
    isMobileMenuOpenAtom, isDocsOpenAtom, isMap3DOpenAtom
} from '@nexus/state/SovereignGenome';
import { 
    themeModeAtom, accentColorAtom, uiDensityAtom, 
    borderRadiusAtom, glassmorphismAtom, animationsEnabledAtom 
} from '@/store/themeAtoms';
import { useSettings as useSettingsInternal } from '@/hooks/useSettings';
import type { NexusUIState, NexusTheme } from '@nexus/contracts/nexus.types';

export const UIThemeContext = createContext<{ ui: NexusUIState, theme: NexusTheme, settings: ReturnType<typeof useSettingsInternal> } | undefined>(undefined);

export const UIThemeProvider: React.FC<{ children: ReactNode, unreadCount: number }> = ({ children, unreadCount }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useAtom(isSidebarCollapsedAtom);
    const [isLaunchpadOpen, setIsLaunchpadOpen] = useAtom(isLaunchpadOpenAtom);
    const [isCommandOpen, setIsCommandOpen] = useAtom(isCommandOpenAtom);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useAtom(isMobileMenuOpenAtom);
    const [isDocsOpen, setIsDocsOpen] = useAtom(isDocsOpenAtom);
    const [isMap3DOpen, setIsMap3DOpen] = useAtom(isMap3DOpenAtom);

    const [themeMode, setThemeMode] = useAtom(themeModeAtom);
    const [accentColor, setAccentColor] = useAtom(accentColorAtom);
    const [uiDensity, setUiDensity] = useAtom(uiDensityAtom);
    const [borderRadius, setBorderRadius] = useAtom(borderRadiusAtom);
    const [glassmorphism, setGlassmorphism] = useAtom(glassmorphismAtom);
    const [animationsEnabled, setAnimationsEnabled] = useAtom(animationsEnabledAtom);

    const settingsModule = useSettingsInternal();

    const uiValue: NexusUIState = useMemo(() => ({
        isSidebarCollapsed,
        setSidebarCollapsed: (v: boolean) => setIsSidebarCollapsed(v),
        toggleSidebar: () => setIsSidebarCollapsed(p => !p),
        isLaunchpadOpen,
        setIsLaunchpadOpen: (v: boolean) => setIsLaunchpadOpen(v),
        toggleLaunchpad: () => setIsLaunchpadOpen(p => !p),
        isMap3DOpen,
        setIsMap3DOpen: (v: boolean) => setIsMap3DOpen(v),
        isMobileMenuOpen,
        toggleMobileMenu: () => setIsMobileMenuOpen(p => !p),
        closeMobileMenu: () => setIsMobileMenuOpen(false),
        openMobileMenu: () => setIsMobileMenuOpen(true),
        isCommandOpen,
        openCommandPalette: () => setIsCommandOpen(true),
        closeCommandPalette: () => setIsCommandOpen(false),
        isDocumentationOpen: isDocsOpen,
        openDocumentation: () => setIsDocsOpen(true),
        closeDocumentation: () => setIsDocsOpen(false),
        theme: themeMode === 'auto' ? 'dark' : themeMode as 'light' | 'dark',
        toggleTheme: () => setThemeMode(p => p === 'light' ? 'dark' : 'light'),
        unreadCount,
        sidebarOpen: !isSidebarCollapsed,
        settings: settingsModule.settings
    }), [isSidebarCollapsed, isLaunchpadOpen, isMap3DOpen, isMobileMenuOpen, isCommandOpen, isDocsOpen, themeMode, unreadCount, settingsModule.settings, setIsSidebarCollapsed, setIsLaunchpadOpen, setIsMap3DOpen, setIsMobileMenuOpen, setIsCommandOpen, setIsDocsOpen, setThemeMode]);

    const themeValue: NexusTheme = useMemo(() => ({
        mode: themeMode,
        setMode: setThemeMode,
        accentColor,
        setAccentColor,
        density: uiDensity,
        setDensity: setUiDensity,
        borderRadius,
        setBorderRadius,
        glassmorphism,
        setGlassmorphism,
        animations: animationsEnabled,
        setAnimations: setAnimationsEnabled
    }), [themeMode, setThemeMode, accentColor, setAccentColor, uiDensity, setUiDensity, borderRadius, setBorderRadius, glassmorphism, setGlassmorphism, animationsEnabled, setAnimationsEnabled]);

    const value = useMemo(() => ({ ui: uiValue, theme: themeValue, settings: settingsModule }), [uiValue, themeValue, settingsModule]);

    return <UIThemeContext.Provider value={value}>{children}</UIThemeContext.Provider>;
};
