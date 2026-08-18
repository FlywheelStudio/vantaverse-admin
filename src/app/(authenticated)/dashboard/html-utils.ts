/** Avatar tone class from HTML prototype `tone()`. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return `av-t${1 + (hash % 4)}`;
}

/** Initials from display name — matches HTML `initials()`. */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Time-of-day greeting prefix. */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Formatted dashboard subtitle from real counts. */
export function formatDashboardSubtitle(
  needingAttentionTotal: number,
): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const day = now.getDate();
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const attention =
    needingAttentionTotal === 1
      ? '1 member needs attention'
      : `${needingAttentionTotal} members need attention`;
  return `${weekday} ${day} ${month} · ${attention}`;
}

/** Issue label derived from available user fields (no invented SLA backend). */
function attentionIssueLabel(
  compliance: number,
  lastSignIn: string | null,
): string {
  const pct = Math.round(compliance);
  if (pct <= 10) return `Completion stalled at ${pct}%`;

  if (lastSignIn) {
    const daysSince =
      (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 90) return 'No activity in 3 months';
    if (daysSince > 30) return `No activity in ${Math.floor(daysSince)} days`;
  } else {
    return 'No recent sign-in';
  }

  return `Low completion (${pct}%)`;
}
