// Sidebar configuration constants
import {
  LayoutDashboard,
  Building2,
  Users,
  Dumbbell,
  Activity,
  MessageSquare,
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
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    supportsUnreadBadge: false,
  },
  {
    href: '/groups',
    label: 'Groups',
    icon: Building2,
    supportsUnreadBadge: false,
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    supportsUnreadBadge: false,
  },
  {
    href: '/builder',
    label: 'Programs',
    icon: Dumbbell,
    supportsUnreadBadge: false,
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageSquare,
    supportsUnreadBadge: true,
  },
  {
    href: '/exercises',
    label: 'Exercises',
    icon: Activity,
    supportsUnreadBadge: false,
  },
] as const;
