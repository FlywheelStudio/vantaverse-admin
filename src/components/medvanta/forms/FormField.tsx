'use client';

import { cn } from '../utils/cn';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Label + hint/error wrapper around any form control. */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
  style,
}: FormFieldProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} style={style}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--text-strong)]"
        >
          {label}
          {required ? (
            <span className="ml-[3px] text-[var(--danger)]" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
