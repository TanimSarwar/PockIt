/**
 * PockIt Theme System v2 — 5 gorgeous palettes, rich tokens, gradient support.
 */

// ─── Theme Palettes ──────────────────────────────────────────────────────────

export type ThemeName = 'violet' | 'ocean' | 'sunset' | 'forest' | 'midnight';
export type ThemeMode = 'light' | 'dark' | 'system';

// Legacy compat
export type AccentColorName = ThemeName;

export interface ThemePalette {
  name: ThemeName;
  label: string;
  emoji: string;
  gradient: readonly [string, string];
  accent: string;
  accentDark: string;
  accentLight: string;
  accentMuted: string;
  alwaysDark?: boolean;
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  violet: {
    name: 'violet',
    label: 'Violet',
    emoji: '💜',
    gradient: ['#7C3AED', '#4F46E5'],
    accent: '#7C3AED',
    accentDark: '#5B21B6',
    accentLight: '#EDE9FE',
    accentMuted: '#F5F3FF',
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    gradient: ['#0284C7', '#06B6D4'],
    accent: '#0284C7',
    accentDark: '#0369A1',
    accentLight: '#E0F2FE',
    accentMuted: '#F0F9FF',
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    gradient: ['#EC4899', '#F97316'],
    accent: '#EC4899',
    accentDark: '#BE185D',
    accentLight: '#FCE7F3',
    accentMuted: '#FDF2F8',
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    emoji: '🌿',
    gradient: ['#059669', '#0891B2'],
    accent: '#059669',
    accentDark: '#047857',
    accentLight: '#D1FAE5',
    accentMuted: '#ECFDF5',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    emoji: '🌙',
    gradient: ['#4C1D95', '#1E1B4B'],
    accent: '#A78BFA',
    accentDark: '#7C3AED',
    accentLight: '#2E1065',
    accentMuted: '#1E1B4B',
    alwaysDark: true,
  },
};

// ─── Category Colors ─────────────────────────────────────────────────────────

export const CATEGORY_COLORS = {
  tools:     { light: { bg: '#EFF6FF', icon: '#3B82F6' }, dark: { bg: '#1E3A5F33', icon: '#60A5FA' } },
  finance:   { light: { bg: '#F0FDF4', icon: '#10B981' }, dark: { bg: '#06402833', icon: '#34D399' } },
  wellness:  { light: { bg: '#FFF1F2', icon: '#F43F5E' }, dark: { bg: '#4C051933', icon: '#FB7185' } },
  utilities: { light: { bg: '#FFF7ED', icon: '#F97316' }, dark: { bg: '#43140733', icon: '#FB923C' } },
  daily:     { light: { bg: '#F5F3FF', icon: '#8B5CF6' }, dark: { bg: '#2E106533', icon: '#A78BFA' } },
} as const;

export type FeatureCategory = keyof typeof CATEGORY_COLORS;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs:    4,
  sm:    8,
  smd:   12,
  md:    16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const borderRadius = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 28,
  full:  9999,
} as const;

// ─── Font ────────────────────────────────────────────────────────────────────

export const fontFamily = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

export const fontSize = {
  xs:    11,
  sm:    12,
  md:    14,
  lg:    16,
  xl:    18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 36,
};

// ─── Color Builders ──────────────────────────────────────────────────────────

function makeColors(isDark: boolean, p: ThemePalette) {
  const base = isDark
    ? {
        text:                '#F0F0F8',
        textSecondary:       '#9090B0',
        textTertiary:        '#55557A',
        textInverse:         '#0A0A18',
        background:          '#080814',
        backgroundSecondary: '#0D0D1E',
        surface:             '#121228',
        surfaceSecondary:    '#181830',
        surfaceTertiary:     '#1E1E38',
        surfaceElevated:     '#1C1C34',
        border:              '#28283E',
        borderLight:         '#1E1E32',
        success:    '#34D399',  successBg:  '#06402830',
        error:      '#FB7185',  errorBg:    '#4C051930',
        warning:    '#FCD34D',  warningBg:  '#78350F30',
        info:       '#60A5FA',  infoBg:     '#1E3A5F30',
        overlay:            'rgba(0, 0, 0, 0.75)',
      }
    : {
        text:                '#0F0F20',
        textSecondary:       '#505078',
        textTertiary:        '#8888AA',
        textInverse:         '#FFFFFF',
        background:          '#F4F4FA',
        backgroundSecondary: '#EAEAF4',
        surface:             '#FFFFFF',
        surfaceSecondary:    '#F8F8FC',
        surfaceTertiary:     '#F0F0F8',
        surfaceElevated:     '#FFFFFF',
        border:              '#E0E0F0',
        borderLight:         '#EEEEF8',
        success:    '#059669',  successBg:  '#D1FAE5',
        error:      '#DC2626',  errorBg:    '#FEE2E2',
        warning:    '#D97706',  warningBg:  '#FEF3C7',
        info:       '#0284C7',  infoBg:     '#E0F2FE',
        overlay:            'rgba(0, 0, 0, 0.5)',
      };

  return {
    ...base,
    gradient:    p.gradient,
    accent:      p.accent,
    accentDark:  p.accentDark,
    accentLight: isDark ? p.accentLight : p.accentLight,
    accentMuted: isDark ? p.accentMuted : p.accentMuted,
  };
}

function makeShadows(isDark: boolean) {
  return isDark
    ? {
        sm:   { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5,  shadowRadius: 6,  elevation: 3 },
        card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6,  shadowRadius: 12, elevation: 6 },
        lg:   { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7,  shadowRadius: 24, elevation: 12 },
      }
    : {
        sm:   { shadowColor: '#1010408A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,  elevation: 2 },
        card: { shadowColor: '#1010408A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 14, elevation: 4 },
        lg:   { shadowColor: '#1010408A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 28, elevation: 8 },
      };
}

// ─── createTheme ─────────────────────────────────────────────────────────────

export function createTheme(
  modeOrBool: 'light' | 'dark' | boolean,
  themeNameOrAccent: ThemeName | string = 'violet',
) {
  // accept both old (resolvedMode string) and new (boolean) first arg
  const isDark =
    typeof modeOrBool === 'boolean' ? modeOrBool : modeOrBool === 'dark';

  // map legacy accent names → new theme names
  const legacyMap: Record<string, ThemeName> = {
    indigo: 'violet',
    emerald: 'forest',
    rose:    'sunset',
    amber:   'sunset',
    sky:     'ocean',
    // already-new names
    violet: 'violet', ocean: 'ocean', sunset: 'sunset', forest: 'forest', midnight: 'midnight',
  };
  const themeName: ThemeName = legacyMap[themeNameOrAccent] ?? 'violet';
  const palette = THEME_PALETTES[themeName];

  const effectiveDark = palette.alwaysDark ? true : isDark;


  const colors   = makeColors(effectiveDark, palette);
  const shadows  = makeShadows(effectiveDark);

  const typography = {
    hero:    { fontFamily: fontFamily.bold,     fontSize: fontSize['4xl'], lineHeight: 44 },
    h1:      { fontFamily: fontFamily.bold,     fontSize: fontSize['3xl'], lineHeight: 36 },
    h2:      { fontFamily: fontFamily.bold,     fontSize: fontSize['2xl'], lineHeight: 30 },
    h3:      { fontFamily: fontFamily.semiBold, fontSize: fontSize.xl,     lineHeight: 26 },
    h4:      { fontFamily: fontFamily.semiBold, fontSize: fontSize.lg,     lineHeight: 24 },
    body:    { fontFamily: fontFamily.regular,  fontSize: fontSize.md,     lineHeight: 22 },
    bodySm:  { fontFamily: fontFamily.regular,  fontSize: fontSize.sm,     lineHeight: 18 },
    caption: { fontFamily: fontFamily.regular,  fontSize: fontSize.xs,     lineHeight: 16 },
    label:   { fontFamily: fontFamily.medium,   fontSize: fontSize.sm,     lineHeight: 16 },
    button:  { fontFamily: fontFamily.semiBold, fontSize: fontSize.md,     lineHeight: 20 },
  };

  return { palette, colors, shadows, typography, spacing, borderRadius, fontFamily, fontSize };
}

export type Theme = ReturnType<typeof createTheme>;
