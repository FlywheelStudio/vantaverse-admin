'use server';

import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { formatDalError, type DalResult } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import {
  getConversationsForAdmin as getConversationsForAdminQuery,
  hasUnreadMessagesForAdmin as hasUnreadMessagesForAdminQuery,
  type ConversationItem,
} from '@/lib/supabase/queries/conversations';

type LegacySuccess<T> = { success: true; data: T };
type LegacyError = { success: false; error: string };
type LegacyResult<T> = LegacySuccess<T> | LegacyError;

function fromDalResult<T>(result: DalResult<T>): LegacyResult<T> {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

export async function getConversationsForAdmin(): Promise<
  LegacyResult<ConversationItem[]>
> {
  const profile = await getAuthProfile();
  if (!profile.success) {
    return { success: false, error: profile.error ?? 'Unauthorized' };
  }

  return fromDalResult(
    await queryWithSession(getConversationsForAdminQuery, profile.data.id),
  );
}

export async function hasUnreadMessagesForAdmin(): Promise<
  LegacyResult<boolean>
> {
  const profile = await getAuthProfile();
  if (!profile.success) {
    return { success: false, error: profile.error ?? 'Unauthorized' };
  }

  return fromDalResult(
    await queryWithSession(hasUnreadMessagesForAdminQuery, profile.data.id),
  );
}
