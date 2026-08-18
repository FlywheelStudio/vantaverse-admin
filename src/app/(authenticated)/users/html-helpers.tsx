'use client';

import Image from 'next/image';
import { Icon } from '@/components/medvanta';
import {
  HtmlActionsMenu,
  type HtmlActionsMenuItem,
} from '@/components/medvanta/shell/HtmlActionsMenu';
import { avatarTone } from '@/app/(authenticated)/dashboard/html-utils';

/** HTML `.av` avatar with optional image — tones via design-system `av-t1`…`av-t4`. */
export function HtmlAvatar({
  name,
  src,
  size = 36,
  status,
}: {
  name: string;
  src?: string | null;
  size?: 24 | 28 | 32 | 36 | 44 | 56 | 72;
  status?: boolean;
}): React.ReactElement {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const sizeClass = `av-${size}`;
  const toneClass = avatarTone(name);

  return (
    <span
      className={`av ${sizeClass} ${toneClass}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || '?'
      )}
      {status ? <span className="av-st" aria-hidden /> : null}
    </span>
  );
}

/** HTML `.cb` checkbox control. */
export function HtmlCheckbox({
  checked = false,
  onChange,
  ariaLabel,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  ariaLabel?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`cb${checked ? ' on' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onChange?.(!checked);
      }}
    >
      {checked ? <Icon name="Check" size={14} strokeWidth={3} /> : null}
    </button>
  );
}

/** HTML `.gate` onboarding progress segments. */
export function HtmlGate({
  unlocked = 0,
  total = 4,
}: {
  unlocked?: number | null;
  total?: number;
}): React.ReactElement {
  const n = Math.min(Math.max(unlocked ?? 0, 0), total);
  return (
    <span className="gate">
      <span className="segs">
        {Array.from({ length: total }, (_, index) => (
          <i key={index} className={index < n ? 'f' : undefined} />
        ))}
      </span>
      <span className="gl">
        {n}/{total}
      </span>
    </span>
  );
}

/** HTML `.pbw` completion bar + label. */
export function HtmlCompletion({
  value,
}: {
  value?: number | null;
}): React.ReactElement {
  const pct = Math.max(Math.min(value ?? 0, 100), 0);
  const width = Math.max(pct, pct > 0 ? 2 : 0);
  return (
    <div className="pbw" style={{ maxWidth: 104 }}>
      <span className="pb pb-6 pb-n">
        <i style={{ width: `${width}%` }} />
      </span>
      <span className="v">{pct}%</span>
    </div>
  );
}

/** HTML status badge from profile status string. */
export function HtmlStatusBadge({
  status,
}: {
  status?: string | null;
}): React.ReactElement {
  if (!status) return <span className="faint">—</span>;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  if (status === 'active' || status === 'assigned') {
    return (
      <span className="bdg bdg-b">
        <i className="dot" aria-hidden />
        {label}
      </span>
    );
  }
  if (status === 'invited' || status === 'pending') {
    return <span className="bdg bdg-o">{label}</span>;
  }
  return <span className="bdg">{label}</span>;
}

interface HtmlRowMenuProps {
  label?: string;
  items?: HtmlActionsMenuItem[];
}

function parseLegacyMenuItems(text: string): HtmlActionsMenuItem[] {
  return text
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => ({
      id: `legacy-${index}`,
      label: part,
      disabled: true,
    }));
}

/** HTML row overflow menu — delegates to {@link HtmlActionsMenu}. */
export function HtmlRowMenu({ label, items }: HtmlRowMenuProps): React.ReactElement {
  const menuItems = items ?? (label ? parseLegacyMenuItems(label) : []);
  return <HtmlActionsMenu items={menuItems} size="sm" />;
}

/** HTML search field matching `.fld.grow`. */
export function HtmlSearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}): React.ReactElement {
  return (
    <span className="fld grow">
      <Icon name="Search" size={16} />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

/** Sortable table header matching HTML `.srt`. */
export function HtmlSortHeader({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="srt" onClick={onToggle}>
      {label}
      {sorted === 'asc' ? (
        <Icon name="ChevronUp" size={14} className="inline ml-1" />
      ) : sorted === 'desc' ? (
        <Icon name="ChevronDown" size={14} className="inline ml-1" />
      ) : null}
    </button>
  );
}
