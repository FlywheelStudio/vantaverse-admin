import { PageWrapper } from '@/components/page-wrapper';
import { StatusCountsCard } from '@/app/(authenticated)/dashboard/status-counts-card';
import { ComplianceCard } from '@/app/(authenticated)/dashboard/compliance-card';
import { NeedingAttentionCard } from '@/app/(authenticated)/dashboard/needing-attention-card';
import { createParallelQueries } from '@/lib/supabase/query';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { DashboardQuery } from '@/lib/supabase/queries/dashboard';

export default async function HomePage() {
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
    usersPending: {
      query: () => dashboardQuery.getUsersByStatus('pending'),
      defaultValue: [],
    },
    usersInvited: {
      query: () => dashboardQuery.getUsersByStatus('invited'),
      defaultValue: [],
    },
    usersActive: {
      query: () => dashboardQuery.getUsersByStatus('active'),
      defaultValue: [],
    },
    usersNoProgram: {
      query: () => dashboardQuery.getUsersWithNoProgram(),
      defaultValue: [],
    },
    usersInProgram: {
      query: () => dashboardQuery.getUsersInProgram(),
      defaultValue: [],
    },
    programCompleted: {
      query: () => dashboardQuery.getUsersProgramCompleted(),
      defaultValue: { users: [], total: 0 },
    },
  });

  const firstName = data.profile?.first_name ?? undefined;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </h1>
      }
    >
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div className="flex flex-col md:flex-row gap-6 shrink-0 h-[340px]">
          <NeedingAttentionCard data={data.needingAttention ?? { users: [], total: 0 }} />
          <ComplianceCard compliance={data.compliance?.compliance ?? 0} />
        </div>
        <div className="flex-1 min-h-[500px]">
          <StatusCountsCard
            counts={{
              ...(data.statusCounts ?? {
                pending: 0,
                invited: 0,
                active: 0,
                noProgram: 0,
                inProgram: 0,
              }),
              programCompleted: data.programCompleted?.total ?? 0,
            }}
            usersByFilter={{
              pending: data.usersPending ?? [],
              invited: data.usersInvited ?? [],
              active: data.usersActive ?? [],
              noProgram: data.usersNoProgram ?? [],
              inProgram: data.usersInProgram ?? [],
              programCompleted: data.programCompleted?.users ?? [],
            }}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
