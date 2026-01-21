'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '../chat-actions';
import toast from 'react-hot-toast';
import type { Message } from '@/lib/supabase/schemas/messages';

/**
 * Query key factory for chat
 */
export const chatKeys = {
  all: ['chat'] as const,
  messages: (chatId: string | null | undefined) =>
    [...chatKeys.all, 'messages', chatId] as const,
};

interface SendMessageData {
  content: string;
  userId: string;
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
      const result = await sendMessage(chatId, data.content, data.userId);

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
        queryClient.getQueryData<Message[]>(messagesKey);

      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        content: variables.content,
        message_type: 'admin',
        user_id: variables.userId,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically add message to cache
      queryClient.setQueryData<Message[]>(messagesKey, (old) => {
        if (!old) return [optimisticMessage];
        return [...old, optimisticMessage];
      });

      return { previousMessages };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(messagesKey, context.previousMessages);
      }
      toast.error(error.message || 'Failed to send message');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: messagesKey,
      });
    },
  });
}
