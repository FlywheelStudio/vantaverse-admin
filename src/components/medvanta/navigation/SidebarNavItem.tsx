'use client';

import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

interface SidebarNavItemProps {
  icon: string;
  label: React.ReactNode;
  active?: boolean;
  badge?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Sidebar navigation row — navy active surface with cyan accent stripe. */
export function SidebarNavItem({
  icon,
  label,
  active = false,
  badge = false,
  collapsed = false,
  onClick,
  className,
  style,
}: SidebarNavItemProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed && typeof label === 'string' ? label : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors duration-[var(--dur-fast)]',
        'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        active
          ? 'bg-[var(--navy-800)] text-[var(--text-inverse)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--navy-50)] hover:text-[var(--text-strong)]',
        collapsed && 'justify-center px-2.5',
        className,
      )}
      style={style}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-[var(--accent)]"
        />
      ) : null}
      <span className="relative inline-flex shrink-0">
        <Icon
          name={icon}
          size={20}
          className={cn(
            active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]',
          )}
        />
        {badge ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--danger)]"
            aria-label="Notification"
          />
        ) : null}
      </span>
      {!collapsed ? (
        <span className="truncate text-[length:var(--text-md)] font-[var(--fw-medium)]">
          {label}
        </span>
      ) : null}
    </button>
  );
}
