// @ts-nocheck
export interface ThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    mode: 'light' | 'dark' | 'auto';
    fontPrimary: string;
    fontHeadings: string;
    borderRadius: 'none' | 'small' | 'medium' | 'large';
    buttonStyle: 'flat' | 'outlined' | 'gradient';
    animationsEnabled: boolean;
}
