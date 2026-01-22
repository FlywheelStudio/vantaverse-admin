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
        <h1 className="text-2xl font-medium">
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </h1>
      }
      topContent={
        <div
          className="select-none mb-4 px-4 py-3 sm:py-0 sm:h-12 text-card-foreground flex items-center bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm sticky top-0 z-10 shrink-0"
          style={{
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p className="text-sm md:text-base text-gray-700 leading-snug">
            Click on{' '}
            <span className="font-semibold text-gray-900">Vanta Buddy</span> to
            open the menu and start today&apos;s journey, or check out the quick
            actions below.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 grid-rows-3 md:grid-cols-3 md:grid-rows-1 gap-6 md:items-stretch h-[calc(100vh-220px)] min-h-0">
        <QuickTakeActionCard users={data.unassigned ?? []} />
        <UsersWithoutProgramCard users={data.withoutProgram ?? []} />
        <UsersWithProgramAndGroupCard users={data.withProgramAndGroup ?? []} />
      </div>
    </PageWrapper>
  );
}
