'use client';

import { cn } from '../utils/cn';

export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Multi-line text input matching Input styling. */
export function Textarea({
  value,
  defaultValue,
  placeholder,
  rows = 4,
  disabled = false,
  invalid = false,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  style,
}: TextareaProps): React.ReactElement {
  return (
    <textarea
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full resize-y px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-[length:var(--text-md)] leading-[var(--lh-normal)] text-[var(--text-strong)]',
        'rounded-[var(--radius-md)] border outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)]',
        'focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]',
        invalid
          ? 'border-[var(--danger)]'
          : 'border-[var(--border-default)]',
        disabled
          ? 'cursor-not-allowed bg-[var(--slate-50)] opacity-60'
          : 'bg-[var(--surface-card)]',
        className,
      )}
      style={style}
    />
  );
}
