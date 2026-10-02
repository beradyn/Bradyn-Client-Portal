import colors from '@/constants/colors';
import { useThemeMode } from '@/components/ThemeProvider';

/** Returns the design tokens for the user's saved appearance setting. */
export function useColors() {
  const { mode } = useThemeMode();
  const palette = mode === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
