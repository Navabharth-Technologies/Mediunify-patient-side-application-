/**
 * MediUnify Official Design Token & Color System
 *
 * ONLY 6 MAIN UI COLORS:
 * 1. Teal:        #00B894 (Primary Brand, "Unify", Key Actions, Primary Buttons, Active Tabs)
 * 2. Navy Blue:   #1E3A8A (Primary Headings, "Medi", Top Nav, High-Priority Elements)
 * 3. Aqua:        #00C2CB (Secondary Accent, Diagnostics, Radiology, Interactive Highlights)
 * 4. Fresh Green: #7BC96F (Success States, Verified Badges, Positive Metrics)
 * 5. Coral:       #FF7F50 (Warnings, Cancellation, Delete, Return, Attention Actions - Used Sparingly)
 * 6. Slate:       #64748B (Secondary Text, Subtitles, Icons, Borders, Metadata)
 */

export const PALETTE = {
  teal: '#00B894',
  navyBlue: '#1E3A8A',
  aqua: '#00C2CB',
  freshGreen: '#7BC96F',
  coral: '#FF7F50',
  slate: '#64748B',
};

// Aliased brand tokens
export const BRAND_COLORS = {
  ...PALETTE,
  navy: '#1E3A8A',
  green: '#7BC96F',
};

// Root / Global Banner Themes for consistent page headers across MediUnify
export const BANNER_THEMES = {
  teal: {
    bg: '#F0FDF9',
    gradient: 'linear-gradient(135deg, #E6F8F4 0%, #F0FDF9 50%, #FFFFFF 100%)',
    borderColor: '#A7F3D0',
    badgeBg: '#E6F8F4',
    badgeBorder: '#00B894',
    badgeText: '#00B894',
    iconCircleBg: '#00B894',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  navy: {
    bg: '#F0F5FF',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #F0F5FF 50%, #FFFFFF 100%)',
    borderColor: '#BFDBFE',
    badgeBg: '#EEF2FF',
    badgeBorder: '#1E3A8A',
    badgeText: '#1E3A8A',
    iconCircleBg: '#1E3A8A',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  aqua: {
    bg: '#F0FBFC',
    gradient: 'linear-gradient(135deg, #E0F7FA 0%, #F0FBFC 50%, #FFFFFF 100%)',
    borderColor: '#80DEEA',
    badgeBg: '#E0F7FA',
    badgeBorder: '#00C2CB',
    badgeText: '#00838F',
    iconCircleBg: '#00C2CB',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  freshGreen: {
    bg: '#F2FBF1',
    gradient: 'linear-gradient(135deg, #EBF8E7 0%, #F2FBF1 50%, #FFFFFF 100%)',
    borderColor: '#C2EDB7',
    badgeBg: '#EBF8E7',
    badgeBorder: '#7BC96F',
    badgeText: '#237804',
    iconCircleBg: '#7BC96F',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  green: {
    bg: '#F2FBF1',
    gradient: 'linear-gradient(135deg, #EBF8E7 0%, #F2FBF1 50%, #FFFFFF 100%)',
    borderColor: '#C2EDB7',
    badgeBg: '#EBF8E7',
    badgeBorder: '#7BC96F',
    badgeText: '#237804',
    iconCircleBg: '#7BC96F',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  coral: {
    bg: '#FFF8F5',
    gradient: 'linear-gradient(135deg, #FFF2ED 0%, #FFF8F5 50%, #FFFFFF 100%)',
    borderColor: '#FFD8CC',
    badgeBg: '#FFF2ED',
    badgeBorder: '#FF7F50',
    badgeText: '#FF7F50',
    iconCircleBg: '#FF7F50',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
  slate: {
    bg: '#F8FAFC',
    gradient: 'linear-gradient(135deg, #F1F5F9 0%, #F8FAFC 50%, #FFFFFF 100%)',
    borderColor: '#E2E8F0',
    badgeBg: '#F1F5F9',
    badgeBorder: '#CBD5E1',
    badgeText: '#64748B',
    iconCircleBg: '#64748B',
    iconColor: '#FFFFFF',
    headingColor: '#1E3A8A',
    textColor: '#64748B',
  },
};

const colors = {
  // 6 PRIMARY PALETTE TOKENS
  teal: '#00B894',          // TEAL - Primary Brand, "Unify", Key Actions
  navyBlue: '#1E3A8A',      // NAVY BLUE - Primary Headings, "Medi", Nav
  aqua: '#00C2CB',          // AQUA - Secondary Accent, Diagnostics, Radiology
  freshGreen: '#7BC96F',    // FRESH GREEN - Success, Verified Badges
  coral: '#FF7F50',         // CORAL - Warnings, Cancellation, Delete
  slate: '#64748B',         // SLATE - Secondary Text, Borders, Subtitles

  // SEMANTIC SHORTCUTS
  primary: '#00B894',       // TEAL (Primary CTAs, active buttons, links)
  secondary: '#1E3A8A',     // NAVY BLUE (Headings, primary typography)
  accent: '#00C2CB',        // AQUA (Highlights, diagnostics)
  success: '#7BC96F',       // FRESH GREEN (Verified, confirmed)
  warning: '#FF7F50',       // CORAL (Attention required)
  danger: '#FF7F50',        // CORAL (Cancellation, destructive actions)
  error: '#FF7F50',         // CORAL
  muted: '#64748B',         // SLATE

  // NEUTRALS & CLEAN BACKGROUNDS
  background: '#FAFCFD',    // Clean light neutral
  pageBg: '#FFFFFF',        // Pure white
  pageBgOff: '#FAFCFD',     // Clean light off-white
  white: '#FFFFFF',
  black: '#0F172A',
  cardBg: '#FFFFFF',

  // SOFT LIGHT TINTS DERIVED FROM THE 6 APPROVED COLORS
  lightTeal: '#E6F8F4',
  lightNavy: '#EFF6FF',
  lightAqua: '#E0F7FA',
  lightGreen: '#EBF8E7',
  lightCoral: '#FFF2ED',
  lightSlate: '#F1F5F9',

  // SECTION BACKGROUND TINTS
  sectionLightBlue: '#EFF6FF',
  sectionLightBlueSubtle: '#F0F5FF',
  sectionSoftMint: '#E6F8F4',
  sectionSoftMintLight: '#F0FDF9',
  sectionAquaTint: '#E0F7FA',
  sectionCoralTint: '#FFF2ED',

  // SERVICE CARDS PASTEL BACKGROUNDS (strictly within 6-color system)
  pastelLightBlue: '#EEF7FC',
  pastelLightMint: '#E6F8F4',
  pastelSoftAqua: '#E0F7FA',
  pastelSoftGreen: '#EBF8E7',
  pastelSoftCoral: '#FFF2ED',
  pastelSoftNavy: '#EEF2FF',

  // TYPOGRAPHY & BORDERS
  text: '#0F172A',
  textSecondary: '#64748B', // SLATE
  textDark: '#1E3A8A',      // NAVY BLUE
  textMuted: '#94A3B8',
  border: '#E2E8F0',        // Subtle slate border
  borderSubtle: '#E2E8F0',
};

export default colors;