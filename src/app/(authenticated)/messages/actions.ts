'use server';

import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { ConversationsQuery } from '@/lib/supabase/queries/conversations';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';

export async function getConversationsForAdmin(): Promise<
  | { success: true; data: ConversationItem[] }
  | { success: false; error: string }
> {
  const profile = await getAuthProfile();
  if (!profile.success) {
    return { success: false, error: profile.error ?? 'Unauthorized' };
  }
  const conversationsQuery = new ConversationsQuery();
  return conversationsQuery.getConversationsForAdmin(profile.data.id);
}
