export const DEFAULT_SCREENING_BASE =
  'https://calendly.com/movebetter-medvanta/vantamotion-screening-app-pilot';

/**
 * Validate + normalize a pasted Calendly event link.
 * Returns '' for empty input, the trimmed URL when valid, null when invalid.
 */
export function normalizeCalendlyUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const hostOk =
      url.protocol === 'https:' &&
      (url.hostname === 'calendly.com' || url.hostname.endsWith('.calendly.com'));
    return hostOk ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Build a personalized booking link from a Calendly event base URL.
 * Appends utm_term/utm_content plus name/email prefill params.
 */
export function buildBookingLink(
  base: string,
  utmContent: string,
  user: { uid: string; firstName: string; lastName: string; email: string },
): string {
  const sep = base.includes('?') ? '&' : '?';
  const first = user.firstName.trim();
  const last = user.lastName.trim();
  const name = first && last ? `${first} ${last}` : first || last;
  let link = `${base}${sep}utm_term=${encodeURIComponent(user.uid)}&utm_content=${encodeURIComponent(utmContent)}`;
  if (name) link += `&name=${encodeURIComponent(name)}`;
  if (first) link += `&first_name=${encodeURIComponent(first)}`;
  if (last) link += `&last_name=${encodeURIComponent(last)}`;
  if (user.email.trim()) link += `&email=${encodeURIComponent(user.email.trim())}`;
  return link;
}
