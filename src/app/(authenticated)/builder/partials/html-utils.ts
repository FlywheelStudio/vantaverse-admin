import { formatDistanceToNow } from 'date-fns';

/** Relative edited label for program table rows. */
export function formatRelativeEdited(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}
