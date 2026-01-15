// Sidebar configuration constants
import {
  LayoutDashboard,
  Building2,
  Users,
  Dumbbell,
  Activity,
  Calendar,
  Settings,
} from 'lucide-react';

// Vantabuddy trigger position and dimensions
export const VANTABUDDY_CONFIG = {
  // Position: top-16 (64px) left-0 (0px)
  top: 10, // top-16 = 64px
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
export const HEADER_HEIGHT = 0; // h-16 = 64px

// Navigation links
export const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups & Teams', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/builder', label: 'Programs', icon: Dumbbell },
  { href: '/exercises', label: 'Exercises', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;
