import { Suspense } from 'react';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { resolveActionResult } from '@/lib/server';
import { getAuthProfileQuery } from '@/lib/supabase/queries/admins';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import {
  getConversationsForAdmin,
  type ConversationItem,
} from '@/lib/supabase/queries/conversations';
import { MessagesPageUI } from './messages-page-ui';
import { MessagesLoadingSkeleton } from './messages-loading-skeleton';

export default async function MessagesPage(): Promise<React.ReactElement> {
  const orgMembersQuery = new OrganizationMembers();

  const [profileErr, profileData] = await queryWithSession(getAuthProfileQuery);
  if (profileErr || !profileData) {
    resolveActionResult({
      success: false,
      status: 500,
      error: profileErr?.message ?? 'Unauthorized',
    });
    throw new Error('Unreachable');
  }

  const currentUser = profileData;

  const [adminOrgsResult, conversationsResult] = await Promise.all([
    orgMembersQuery.getOrganizationsWhereUserIsAdmin(currentUser.id),
    queryWithSession(getConversationsForAdmin, currentUser.id),
  ]);

  const adminOrgs =
    adminOrgsResult.success && Array.isArray(adminOrgsResult.data)
      ? adminOrgsResult.data
      : ([] as Array<{ id: string; name: string }>);

  const [conversationsErr, conversationsData] = conversationsResult;
  const conversations: ConversationItem[] =
    conversationsErr || !conversationsData ? [] : conversationsData;

  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesPageUI
        organizations={adminOrgs}
        conversations={conversations}
      />
    </Suspense>
  );
}
