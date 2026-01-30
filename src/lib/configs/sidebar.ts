// Sidebar configuration constants
import {
  LayoutDashboard,
  Building2,
  Users,
  Dumbbell,
  Activity,
} from 'lucide-react';

// Vantabuddy trigger position and dimensions
export const VANTABUDDY_CONFIG = {
  top: 10,
  left: 0,
  width: 64,
  height: 64,
} as const;

// Sidebar dimensions
export const SIDEBAR_CONFIG = {
  width: 240, // w-60 = 240px
} as const;

// Header height
export const HEADER_HEIGHT = 0;

// Navigation links
export const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/builder', label: 'Programs', icon: Dumbbell },
  { href: '/exercises', label: 'Exercises', icon: Activity },
] as const;
