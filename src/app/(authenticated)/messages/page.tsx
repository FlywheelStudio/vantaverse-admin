import { Suspense } from 'react';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { resolveActionResult } from '@/lib/server';
import { getAuthProfileQuery } from '@/lib/supabase/queries/admins';
import {
  getConversationsForAdmin,
  getMessagingOrganizationsForAdmin,
  type ConversationItem,
} from '@/lib/supabase/queries/conversations';
import { MessagesPageUI } from './messages-page-ui';
import { MessagesLoadingSkeleton } from './messages-loading-skeleton';

export default async function MessagesPage(): Promise<React.ReactElement> {
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

  const [messagingOrgsResult, conversationsResult] = await Promise.all([
    queryWithSession(getMessagingOrganizationsForAdmin, currentUser.id),
    queryWithSession(getConversationsForAdmin, currentUser.id),
  ]);

  const [messagingOrgsErr, messagingOrgsData] = messagingOrgsResult;
  const organizations =
    messagingOrgsErr || !messagingOrgsData
      ? ([] as Array<{ id: string; name: string }>)
      : messagingOrgsData;

  const [conversationsErr, conversationsData] = conversationsResult;
  const conversations: ConversationItem[] =
    conversationsErr || !conversationsData ? [] : conversationsData;

  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesPageUI
        organizations={organizations}
        conversations={conversations}
      />
    </Suspense>
  );
}
