import { PageWrapper } from '@/components/page-wrapper';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { createParallelQueries } from '@/lib/supabase/query';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { ConversationsQuery } from '@/lib/supabase/queries/conversations';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';
import { MessagesPageUI } from './messages-page-ui';

export default async function MessagesPage() {
  const orgMembersQuery = new OrganizationMembers();
  const conversationsQuery = new ConversationsQuery();

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
      query: (deps: { currentUser: ProfileWithStats }) =>
        conversationsQuery.getConversationsForAdmin(deps.currentUser.id),
      dependsOn: ['currentUser'] as const,
      defaultValue: [] as ConversationItem[],
    },
  });

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Messages
        </h1>
      }
    >
      <MessagesPageUI
        organizations={data.adminOrgs}
        conversations={data.conversations}
      />
    </PageWrapper>
  );
}
