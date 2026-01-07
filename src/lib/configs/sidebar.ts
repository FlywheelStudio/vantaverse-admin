// Sidebar configuration constants

// Vantabuddy trigger position and dimensions
export const VANTABUDDY_CONFIG = {
  // Position: top-16 (64px) left-0 (0px)
  top: 64, // top-16 = 64px
  left: 0, // left-0 = 0px
  // Size: w-16 h-16 (64px)
  width: 64,
  height: 64,
} as const;

// Sidebar dimensions
export const SIDEBAR_CONFIG = {
  width: 240, // w-60 = 240px
  animation: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
    initialScale: 0.3,
  },
} as const;

// Header height
export const HEADER_HEIGHT = 64; // h-16 = 64px

// Navigation links
export const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/organizations', label: 'Organizations', icon: '🏢' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/workouts', label: 'Programs', icon: '💪' },
  { href: '/exercises', label: 'Exercises', icon: '🏋️' },
  { href: '/schedules', label: 'Schedules', icon: '📅' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
] as const;
