'use client';

import { useState } from 'react';
import { cn } from '../utils/cn';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Pill toggle for on/off settings. */
export function Switch({
  checked,
  defaultChecked,
  label,
  disabled = false,
  onChange,
  className,
  style,
}: SwitchProps): React.ReactElement {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isActive = isControlled ? checked : internalChecked;

  const handleToggle = (): void => {
    if (disabled) return;
    const next = !isActive;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
      style={style}
      onClick={handleToggle}
    >
      <span
        className={cn(
          'inline-flex h-[23px] w-10 shrink-0 items-center rounded-[var(--radius-pill)] p-0.5 transition-[background] duration-[var(--dur-base)] ease-[var(--ease-out)]',
          isActive ? 'bg-[var(--accent)]' : 'bg-[var(--slate-300)]',
        )}
      >
        <span
          className={cn(
            'h-[19px] w-[19px] rounded-[var(--radius-pill)] bg-[var(--white)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]',
            isActive ? 'translate-x-[17px]' : 'translate-x-0',
          )}
        />
      </span>
      {label ? (
        <span className="text-[length:var(--text-md)] text-[var(--text-body)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
