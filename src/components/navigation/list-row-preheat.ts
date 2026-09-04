import type { UseQueryOptions } from '@tanstack/react-query';

import type { DalError } from '@/lib/dal';
import { getMessagesByChatId } from '@/app/(authenticated)/users/[id]/chat-actions';
import { chatKeys } from '@/app/(authenticated)/users/[id]/hooks/use-chat-mutations';
import type { PreheatQueryTarget } from '@/hooks/use-preheat';

const MESSAGES_STALE_MS = 60_000;

/**
 * Conversation list rows prefetch via `chatKeys` (matches `MessagesChatThread`),
 * not DAL `messageKeys`.
 */
export function getMessagesConversationPreheatQueries(
  chatId: string,
): readonly PreheatQueryTarget[] {
  return [
    {
      kind: 'query',
      options: {
        queryKey: chatKeys.messages(chatId),
        queryFn: async () => {
          const result = await getMessagesByChatId(chatId);
          if (!result.success) {
            throw new Error(result.error || 'Failed to load messages');
          }
          return result.data;
        },
        staleTime: MESSAGES_STALE_MS,
      } as UseQueryOptions<unknown, DalError>,
    },
  ];
}
