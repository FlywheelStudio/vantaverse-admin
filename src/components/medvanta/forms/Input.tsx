'use client';

import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  id?: string;
  iconLeft?: string;
  iconRight?: string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'h-[34px]',
  md: 'h-10',
  lg: 'h-[46px]',
} as const;

/** Text field with optional leading/trailing Lucide icon. */
export function Input({
  value,
  defaultValue,
  placeholder,
  type = 'text',
  id,
  iconLeft,
  iconRight,
  size = 'md',
  invalid = false,
  disabled = false,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  style,
}: InputProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3.5 rounded-[var(--radius-md)] border transition-[border-color,box-shadow] duration-[var(--dur-fast)]',
        'focus-within:border-[var(--border-focus)] focus-within:shadow-[var(--shadow-focus)]',
        invalid
          ? 'border-[var(--danger)]'
          : 'border-[var(--border-default)]',
        disabled
          ? 'bg-[var(--slate-50)] opacity-60'
          : 'bg-[var(--surface-card)]',
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {iconLeft ? (
        <Icon
          name={iconLeft}
          size={16}
          className="shrink-0 text-[var(--text-muted)]"
        />
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 border-none bg-transparent font-[family-name:var(--font-sans)] text-[length:var(--text-md)] text-[var(--text-strong)] outline-none disabled:cursor-not-allowed"
      />
      {iconRight ? (
        <Icon
          name={iconRight}
          size={16}
          className="shrink-0 text-[var(--text-muted)]"
        />
      ) : null}
    </div>
  );
}
