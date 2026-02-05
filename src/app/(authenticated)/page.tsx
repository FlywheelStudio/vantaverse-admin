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
      defaultValue: { pending: 0, invited: 0, active: 0 },
    },
    compliance: {
      query: () => dashboardQuery.getAggregateCompliance(),
      defaultValue: null,
    },
    needingAttention: {
      query: () => dashboardQuery.getUsersNeedingAttention(),
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
      topContent={
        <div
          className="select-none mb-4 px-5 py-3 sm:py-0 sm:h-12 flex items-center bg-card/90 rounded-[var(--radius-pill)] ring-1 ring-border/50 shadow-[var(--shadow-sm)] overflow-hidden backdrop-blur-md sticky top-0 z-10 shrink-0"
        >
          <p className="text-sm text-dimmed leading-snug">
            This is a list of quick actions to help you get started.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch flex-1 min-h-0 overflow-hidden">
        <StatusCountsCard counts={data.statusCounts ?? { pending: 0, invited: 0, active: 0 }} />
        <ComplianceCard compliance={data.compliance} />
        <NeedingAttentionCard data={data.needingAttention ?? { users: [], total: 0 }} />
      </div>
    </PageWrapper>
  );
}
