export type DashboardRangeKey = '7d' | '30d' | '90d' | 'all';

export const DASHBOARD_RANGES: { key: DashboardRangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];

/** Map a URL param to a valid range key; unknown values fall back to 30d. */
export function parseDashboardRange(value?: string): DashboardRangeKey {
  return DASHBOARD_RANGES.some((r) => r.key === value)
    ? (value as DashboardRangeKey)
    : '30d';
}

/** Range window in days; null = all time. */
export function dashboardRangeDays(range: DashboardRangeKey): number | null {
  switch (range) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    case 'all':
      return null;
    default:
      return 30;
  }
}
