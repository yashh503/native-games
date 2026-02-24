export const COLORS = {
  bg: '#0f0f1a',
  bgCard: '#1a1a2e',
  bgCardInner: '#16213e',
  accent: '#e94560',
  accentGold: '#f5a623',
  accentGreen: '#4ade80',
  accentBlue: '#60a5fa',
  text: '#ffffff',
  textMuted: '#888888',
  textDim: '#555555',
  border: '#2a2a4a',
  streakOrange: '#ff6b35',
  streakRed: '#ff3d3d',
  // Urgency amber — used when < 4 hours remain in the day
  urgentAmber: '#f59e0b',
  // Freeze button glow border highlight when available
  freezeGlow: '#60a5fa',
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
