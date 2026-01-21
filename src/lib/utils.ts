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

export function getDayOfWeek(day_index: number) {
  return [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ][day_index - 1];
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format date to YYYY-MM-DD in UTC to match Supabase timezone
 * Creates a UTC date from local date components to ensure the date string matches what the user sees
 * @param date - The date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForDB(date: Date): string {
  // Extract local date components (what user sees in calendar)
  const localYear = date.getFullYear();
  const localMonth = date.getMonth();
  const localDay = date.getDate();
  // Create UTC date from local components to ensure consistent storage
  const utcDate = new Date(Date.UTC(localYear, localMonth, localDay));
  // Format as YYYY-MM-DD using UTC methods
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate end date from start date and weeks
 * @param startDate - The start date
 * @param weeks - Number of weeks to add
 * @returns The end date or undefined if startDate is invalid or weeks < 1
 */
export function calculateEndDate(
  startDate: Date | undefined,
  weeks: number,
): Date | undefined {
  if (!startDate || weeks < 1) return undefined;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);
  return endDate;
}
