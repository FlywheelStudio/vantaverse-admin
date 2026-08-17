'use client';

import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  options?: (string | SelectOption)[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'h-[34px]',
  md: 'h-10',
  lg: 'h-[46px]',
} as const;

/** Native dropdown styled to match Input. */
export function Select({
  value,
  defaultValue,
  options = [],
  placeholder,
  size = 'md',
  disabled = false,
  invalid = false,
  onChange,
  className,
  style,
}: SelectProps): React.ReactElement {
  return (
    <div
      className={cn('relative inline-flex w-full', className)}
      style={style}
    >
      <select
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        className={cn(
          'w-full appearance-none rounded-[var(--radius-md)] border pr-[38px] pl-3.5 font-[family-name:var(--font-sans)] text-[length:var(--text-md)] text-[var(--text-strong)] outline-none',
          invalid
            ? 'border-[var(--danger)]'
            : 'border-[var(--border-default)]',
          disabled
            ? 'cursor-not-allowed bg-[var(--slate-50)] opacity-60'
            : 'cursor-pointer bg-[var(--surface-card)]',
          sizeClasses[size],
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={`${optionValue}-${index}`} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      <Icon
        name="ChevronDown"
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)]"
      />
    </div>
  );
}
