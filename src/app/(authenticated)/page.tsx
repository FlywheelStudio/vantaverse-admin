import { AppBar } from '@/components/medvanta/shell';
import { createParallelQueries } from '@/lib/supabase/query';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { DashboardQuery } from '@/lib/supabase/queries/dashboard';
import { DashboardAppBarActions } from '@/app/(authenticated)/dashboard/dashboard-app-bar-actions';
import { HtmlDashboard } from '@/app/(authenticated)/dashboard/html-dashboard';
import {
  formatDashboardSubtitle,
  getGreeting,
} from '@/components/widgets/utils';

export default async function HomePage(): Promise<React.ReactElement> {
  const profilesQuery = new ProfilesQuery();
  const dashboardQuery = new DashboardQuery();

  const data = await createParallelQueries({
    profile: {
      query: () => profilesQuery.getAuthProfile(),
      defaultValue: null,
    },
    statusCounts: {
      query: () => dashboardQuery.getStatusCounts(),
      defaultValue: {
        pending: 0,
        invited: 0,
        active: 0,
        noProgram: 0,
        inProgram: 0,
      },
    },
    compliance: {
      query: () => dashboardQuery.getAggregateCompliance(),
      defaultValue: { compliance: 0, programCompletion: 0 },
    },
    needingAttention: {
      query: () => dashboardQuery.getUsersNeedingAttention(),
      defaultValue: { users: [], total: 0 },
    },
    programCompleted: {
      query: () => dashboardQuery.getUsersProgramCompleted(),
      defaultValue: { users: [], total: 0 },
    },
  });

  const firstName = data.profile?.first_name ?? undefined;
  const greeting = getGreeting();
  const title = firstName ? `${greeting}, ${firstName}` : greeting;
  const needingTotal = data.needingAttention?.total ?? 0;

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Dashboard' }]}
        title={title}
        subtitle={formatDashboardSubtitle(needingTotal)}
        actions={<DashboardAppBarActions />}
      />
      <HtmlDashboard
        statusCounts={{
          ...(data.statusCounts ?? {
            pending: 0,
            invited: 0,
            active: 0,
            noProgram: 0,
            inProgram: 0,
          }),
          programCompleted: data.programCompleted?.total ?? 0,
        }}
        compliancePct={data.compliance?.compliance ?? 0}
        needingAttention={data.needingAttention?.users ?? []}
      />
    </>
  );
}
