import { Suspense } from 'react';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { formatDalError } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { createParallelQueries } from '@/lib/supabase/query';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import {
  getConversationsForAdmin,
  type ConversationItem,
} from '@/lib/supabase/queries/conversations';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { MessagesPageUI } from './messages-page-ui';

export default async function MessagesPage(): Promise<React.ReactElement> {
  const orgMembersQuery = new OrganizationMembers();

  const data = await createParallelQueries({
    currentUser: {
      query: () => getAuthProfile(),
      required: true,
    },
    adminOrgs: {
      query: (deps: { currentUser: ProfileWithStats }) =>
        orgMembersQuery.getOrganizationsWhereUserIsAdmin(deps.currentUser.id),
      dependsOn: ['currentUser'] as const,
      defaultValue: [] as Array<{ id: string; name: string }>,
    },
    conversations: {
      query: async (deps: { currentUser: ProfileWithStats }) => {
        const [err, conversations] = await queryWithSession(
          getConversationsForAdmin,
          deps.currentUser.id,
        );
        if (err) {
          return { success: false, error: formatDalError(err) };
        }
        return { success: true, data: conversations };
      },
      dependsOn: ['currentUser'] as const,
      defaultValue: [] as ConversationItem[],
    },
  });

  return (
    <Suspense fallback={null}>
      <MessagesPageUI
        organizations={data.adminOrgs}
        conversations={data.conversations}
      />
    </Suspense>
  );
}
