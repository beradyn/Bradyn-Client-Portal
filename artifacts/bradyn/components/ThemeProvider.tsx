import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import colors from '@/constants/colors';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const THEME_STORAGE_KEY = 'bradyn-theme-mode-v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') setMode(saved);
      })
      .catch((error) => console.warn('Could not load the saved appearance setting.', error));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(mode);
    const background = mode === 'dark' ? colors.dark.background : colors.light.background;
    void SystemUI.setBackgroundColorAsync(background).catch((error) => {
      console.warn('Could not update the app background appearance.', error);
    });
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch((error) => {
        console.warn('Could not save the appearance setting.', error);
      });
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeMode must be used within ThemeProvider.');
  return value;
}