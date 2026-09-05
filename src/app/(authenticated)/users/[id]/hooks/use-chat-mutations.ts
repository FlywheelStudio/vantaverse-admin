'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { sendMessage } from '../chat-actions';
import toast from 'react-hot-toast';
import type { MessagesPage } from '@/lib/supabase/queries/messages';
import type {
  Message,
  MessageAttachment,
} from '@/lib/supabase/schemas/messages';

/**
 * Query key factory for chat
 */
export const chatKeys = {
  all: ['chat'] as const,
  messages: (chatId: string | null | undefined) =>
    [...chatKeys.all, 'messages', chatId] as const,
};

/**
 * Append a message to the newest infinite page, replacing a matching temp row.
 */
export const appendChatMessage = (
  old: InfiniteData<MessagesPage, number> | undefined,
  message: Message,
): InfiniteData<MessagesPage, number> => {
  if (!old || old.pages.length === 0) {
    return {
      pages: [{ messages: [message], hasMore: false }],
      pageParams: [0],
    };
  }

  if (
    old.pages.some((page) =>
      page.messages.some((item) => item.id === message.id),
    )
  ) {
    return old;
  }

  const [newestPage, ...olderPages] = old.pages;
  const withoutTemp = newestPage.messages.filter((item) => {
    if (!item.id.startsWith('temp-')) return true;
    return !(
      item.content.trim() === message.content.trim() &&
      item.message_type === message.message_type
    );
  });

  return {
    ...old,
    pages: [
      { ...newestPage, messages: [...withoutTemp, message] },
      ...olderPages,
    ],
  };
};

interface SendMessageData {
  content: string;
  userId: string;
  attachment?: MessageAttachment | null;
}

/**
 * Mutation hook for sending a message in a chat
 * Includes optimistic updates and error rollback
 */
export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();
  const messagesKey = chatKeys.messages(chatId);

  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      const result = await sendMessage(
        chatId,
        data.content,
        data.userId,
        data.attachment ?? null,
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesKey });

      // Snapshot previous value
      const previousMessages =
        queryClient.getQueryData<InfiniteData<MessagesPage, number>>(
          messagesKey,
        );

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        content: variables.content,
        attachments: variables.attachment ?? null,
        message_type: 'admin',
        user_id: variables.userId,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<MessagesPage, number>>(
        messagesKey,
        (old) => appendChatMessage(old, optimisticMessage),
      );

      return { previousMessages };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(messagesKey, context.previousMessages);
      }
      toast.error(error.message || 'Failed to send message');
    },
  });
}
