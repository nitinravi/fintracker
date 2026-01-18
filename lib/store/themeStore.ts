import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (theme: ColorSchemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize with system theme
  const systemTheme = Appearance.getColorScheme();
  
  return {
    theme: systemTheme,
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
  };
});
