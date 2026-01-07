import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string,
  format: Intl.DateTimeFormatOptions['dateStyle'] = 'medium',
) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: format }).format(
    new Date(date),
  );
}
