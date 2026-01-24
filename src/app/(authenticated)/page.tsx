import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { getUnassignedUsers } from '@/app/(authenticated)/groups/[id]/actions';
import { PageWrapper } from '@/components/page-wrapper';
import { QuickTakeActionCard } from '@/app/(authenticated)/dashboard/no-group';
import { UsersWithoutProgramCard } from '@/app/(authenticated)/dashboard/no-program';
import { UsersWithProgramAndGroupCard } from '@/app/(authenticated)/dashboard/quick-chat';
import {
  getUsersWithoutProgram,
  getUsersWithProgramAndGroup,
} from '@/app/(authenticated)/dashboard/actions';
import { createParallelQueries } from '@/lib/supabase/query';

export default async function HomePage() {
  const data = await createParallelQueries({
    profile: {
      query: () => getAuthProfile(),
      defaultValue: null,
    },
    unassigned: {
      query: () => getUnassignedUsers(),
      defaultValue: [],
    },
    withoutProgram: {
      query: () => getUsersWithoutProgram(),
      defaultValue: [],
    },
    withProgramAndGroup: {
      query: () => getUsersWithProgramAndGroup(),
      defaultValue: [],
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
            Click on{' '}
            <span className="text-base font-semibold">Vanta Buddy</span> to
            open the menu and start today&apos;s journey, or check out the quick
            actions below.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch min-h-[calc(100dvh-18rem)]">
        <QuickTakeActionCard users={data.unassigned ?? []} />
        <UsersWithoutProgramCard users={data.withoutProgram ?? []} />
        <UsersWithProgramAndGroupCard users={data.withProgramAndGroup ?? []} />
      </div>
    </PageWrapper>
  );
}
