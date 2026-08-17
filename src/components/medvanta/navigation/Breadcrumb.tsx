import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface Crumb {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbProps {
  items?: Crumb[];
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Members', href: '/users' },
  { label: 'Jane Doe' },
];

/** Horizontal breadcrumb trail with chevron separators. */
export function Breadcrumb({
  items = DEFAULT_ITEMS,
  className,
  style,
}: BreadcrumbProps): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={cn(className)} style={style}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <Icon
                  name="ChevronRight"
                  size={14}
                  className="shrink-0 text-[var(--text-faint)]"
                />
              ) : null}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-[length:var(--text-sm)] text-[var(--text-link)] hover:text-[var(--accent-press)]"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'text-[length:var(--text-sm)]',
                    isLast
                      ? 'font-[var(--fw-semibold)] text-[var(--text-strong)]'
                      : 'text-[var(--text-muted)]',
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
