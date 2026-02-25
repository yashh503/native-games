// Font families — loaded in App.tsx via useFonts
// Barlow: body text, labels, buttons, UI elements
// Kanit: headings, scores, numbers, game titles, streak counters
export const FONTS = {
  // Barlow weights (body text, labels, UI)
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semiBold: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  extraBold: 'Barlow_800ExtraBold',
  // Kanit weights (headings, scores, big numbers)
  headingMedium: 'Kanit_500Medium',
  headingSemiBold: 'Kanit_600SemiBold',
  headingBold: 'Kanit_700Bold',
};

export const COLORS = {
  // Page & surface backgrounds
  bg: '#F5F6FA',
  bgCard: '#FFFFFF',
  bgCardInner: '#F0F2F8',

  // Brand / primary
  primary: '#4F46E5',        // indigo — buttons, active states
  primaryLight: '#EEF2FF',   // indigo tint for backgrounds

  // Accent palette
  accentGreen: '#16A34A',    // success, completion
  accentGold: '#D97706',     // points, rewards
  accentBlue: '#2563EB',     // links, info
  accentRed: '#DC2626',      // errors, danger

  // Streak / gamification
  streakOrange: '#EA580C',   // streak fire
  urgentAmber: '#B45309',    // urgency (<4h countdown)
  freezeGlow: '#4F46E5',     // freeze button highlight

  // Typography
  text: '#111827',           // primary text
  textSub: '#374151',        // secondary text
  textMuted: '#6B7280',      // hints, meta
  textDim: '#9CA3AF',        // disabled / placeholders

  // Borders & dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Shadow base
  shadow: '#1E293B',
};

export const STREAK_TARGET = 50;

export const STREAK_MILESTONES = [7, 14, 30, 50];

export const BADGE_LABELS: Record<string, string> = {
  streak_7: '7-Day Streak 🔥',
  streak_14: '14-Day Streak 💪',
  streak_30: '30-Day Streak 🌟',
  streak_50: '50-Day Legend 👑',
};

// Milestone hints: shown when streak is in this range and badge not yet earned
export const MILESTONE_HINTS: Array<{ from: number; to: number; label: string }> = [
  { from: 5, to: 6, label: '7-day badge' },
  { from: 11, to: 13, label: '14-day badge' },
  { from: 27, to: 29, label: '30-day badge' },
  { from: 47, to: 49, label: '50-day badge' },
];
