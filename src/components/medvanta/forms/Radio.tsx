'use client';

import { useState } from 'react';
import { cn } from '../utils/cn';

interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value?: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Single labeled radio option, brand-cyan when selected. */
export function Radio({
  checked,
  defaultChecked,
  label,
  name,
  value,
  disabled = false,
  onChange,
  className,
  style,
}: RadioProps): React.ReactElement {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isActive = isControlled ? checked : internalChecked;

  const handleSelect = (): void => {
    if (disabled) return;
    if (!isControlled) setInternalChecked(true);
    onChange?.(value);
  };

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
      style={style}
      onClick={handleSelect}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={isControlled ? checked : undefined}
        defaultChecked={!isControlled ? defaultChecked : undefined}
        disabled={disabled}
        onChange={() => handleSelect()}
        className="sr-only"
      />
      <span
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border-[1.5px] bg-[var(--surface-card)] transition-[border-color] duration-[var(--dur-fast)]',
          isActive ? 'border-[var(--accent)]' : 'border-[var(--border-strong)]',
        )}
      >
        {isActive ? (
          <span className="h-2.5 w-2.5 rounded-[var(--radius-pill)] bg-[var(--accent)]" />
        ) : null}
      </span>
      {label ? (
        <span className="text-[length:var(--text-md)] text-[var(--text-body)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
