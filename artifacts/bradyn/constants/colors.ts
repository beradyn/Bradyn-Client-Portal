/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#171B23',
    tint: '#1878E7',
    background: '#F5F7FA',
    foreground: '#171B23',
    card: '#FFFFFF',
    cardForeground: '#171B23',
    primary: '#1878E7',
    primaryForeground: '#FFFFFF',
    secondary: '#EEF1F5',
    secondaryForeground: '#303744',
    muted: '#EEF1F5',
    mutedForeground: '#667184',
    accent: '#E8F2FF',
    accentForeground: '#175EA9',
    destructive: '#CC3447',
    destructiveForeground: '#FFFFFF',
    border: '#DCE2EA',
    input: '#EDF0F5',
  },
  dark: {
    text: '#F4F5F7',
    tint: '#2488FF',
    background: '#050608',
    foreground: '#F4F5F7',
    card: '#0C0D10',
    cardForeground: '#F4F5F7',
    primary: '#2488FF',
    primaryForeground: '#FFFFFF',
    secondary: '#111317',
    secondaryForeground: '#ECEEF2',
    muted: '#111317',
    mutedForeground: '#858B96',
    accent: '#10203A',
    accentForeground: '#9BC9FF',
    destructive: '#FF5D68',
    destructiveForeground: '#FFFFFF',
    border: '#202329',
    input: '#181B20',
  },
  radius: 8,
};

export default colors;
