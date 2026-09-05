import type { UseInfiniteQueryOptions } from '@tanstack/react-query';

import type { DalError } from '@/lib/dal';
import { getMessagesPage } from '@/app/(authenticated)/users/[id]/chat-actions';
import { chatKeys } from '@/app/(authenticated)/users/[id]/hooks/use-chat-mutations';
import type { PreheatQueryTarget } from '@/hooks/use-preheat';
import {
  MESSAGES_PAGE_SIZE,
  type MessagesPage,
} from '@/lib/supabase/queries/messages';

const MESSAGES_STALE_MS = 60_000;

/**
 * Conversation list rows prefetch the first message page via `chatKeys`
 * (matches `MessagesChatThread`).
 */
export function getMessagesConversationPreheatQueries(
  chatId: string,
): readonly PreheatQueryTarget[] {
  return [
    {
      kind: 'infinite',
      options: {
        queryKey: chatKeys.messages(chatId),
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
          const skip = typeof pageParam === 'number' ? pageParam : 0;
          const result = await getMessagesPage(
            chatId,
            skip,
            MESSAGES_PAGE_SIZE,
          );
          if (!result.success) {
            throw new Error(result.error || 'Failed to load messages');
          }
          return result.data;
        },
        getNextPageParam: (lastPage, _pages, lastPageParam) => {
          const page = lastPage as MessagesPage;
          const skip = typeof lastPageParam === 'number' ? lastPageParam : 0;
          return page.hasMore ? skip + MESSAGES_PAGE_SIZE : undefined;
        },
        staleTime: MESSAGES_STALE_MS,
      } as UseInfiniteQueryOptions<unknown, DalError>,
    },
  ];
}
