import { Suspense } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Dashboard } from '@/components/widgets';
import { DashboardSkeleton } from '@/components/widgets/dashboard/skeleton';
import {
  dashboardRangeDays,
  parseDashboardRange,
} from '@/components/widgets/app-bar-actions/ranges';
import { DashboardAppBarActions } from '@/components/widgets/app-bar-actions';
import {
  formatDashboardSubtitle,
  getGreeting,
} from '@/components/widgets/utils';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { getAuthProfileQuery } from '@/lib/supabase/queries/admins';
import {
  DashboardQuery,
  type DashboardAnalytics,
  type NeedsAttentionResult,
} from '@/lib/supabase/queries/dashboard';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/query';

function unwrap<T>(
  result: SupabaseSuccess<T> | SupabaseError,
  fallback: T,
): T {
  return result.success ? result.data : fallback;
}

const EMPTY_ANALYTICS: DashboardAnalytics = {
  statusCounts: {
    pending: 0,
    invited: 0,
    active: 0,
    inProgram: 0,
    noProgram: 0,
    programCompleted: 0,
  },
  series: { active: [], inProgram: [], completion: [], overdue: [] },
  deltas: { active: 0, inProgram: 0, completion: 0, overdue: 0 },
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function DashboardContent({
  groupId,
  range,
}: {
  groupId?: string;
  range: ReturnType<typeof parseDashboardRange>;
}): Promise<React.ReactElement> {
  const dashboardQuery = new DashboardQuery();

  const days = dashboardRangeDays(range);
  const to = new Date().toISOString().slice(0, 10);
  const from =
    days === null
      ? undefined
      // eslint-disable-next-line react-hooks/purity -- async server component, not hook render
      : new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const [profileResult, analytics, attention] = await Promise.all([
    queryWithSession(getAuthProfileQuery),
    dashboardQuery.getDashboardAnalytics({
      organizationIds: groupId ? [groupId] : null,
      from,
      to,
      bucket: range === 'all' ? 'month' : range === '90d' ? 'week' : 'day',
    }),
    dashboardQuery.getNeedsAttention({
      organizationIds: groupId ? [groupId] : null,
    }),
  ]);

  const profileData = profileResult[0]
    ? null
    : profileResult[1];
  const analyticsData = unwrap<DashboardAnalytics>(analytics, EMPTY_ANALYTICS);
  const attentionData = unwrap<NeedsAttentionResult>(attention, {
    users: [],
    total: 0,
  });

  const firstName = profileData?.first_name ?? undefined;
  const greeting = getGreeting();
  const title = firstName ? `${greeting}, ${firstName}` : greeting;

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Dashboard' }]}
        title={title}
        subtitle={formatDashboardSubtitle(attentionData.total)}
        actions={
          <DashboardAppBarActions groupId={groupId} range={range} />
        }
      />
      {/* Latest completion bucket = current aggregate completion. */}
      <Dashboard
        statusCounts={analyticsData.statusCounts}
        compliancePct={analyticsData.series.completion.at(-1)?.value ?? 0}
        needingAttention={attentionData.users}
        overdueCount={analyticsData.series.overdue.at(-1)?.value ?? 0}
        series={analyticsData.series}
        deltas={analyticsData.deltas}
      />
    </>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const groupParam = firstParam(params.group);
  // Only well-formed UUIDs reach the query layer.
  const groupId = /^[0-9a-fA-F-]{36}$/.test(groupParam ?? '')
    ? groupParam
    : undefined;
  const range = parseDashboardRange(firstParam(params.range));
  const viewKey = `${groupId ?? 'all'}-${range}`;

  return (
    <Suspense key={viewKey} fallback={<DashboardSkeleton />}>
      <DashboardContent groupId={groupId} range={range} />
    </Suspense>
  );
}
