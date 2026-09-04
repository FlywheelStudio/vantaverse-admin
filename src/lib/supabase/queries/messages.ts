import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

import {
  messageAttachmentSchema,
  messageSchema,
  messageTypeSchema,
  type Message,
  type MessageAttachment,
} from '../schemas/messages';

export const messageKeys = {
  all: ['messages'] as const,
  byChat: (chatId: string) => [...messageKeys.all, 'chat', chatId] as const,
  lastUserMessage: (chatId: string) =>
    [...messageKeys.byChat(chatId), 'lastUser'] as const,
};

const lastUserMessageIdSchema = z.string().uuid().nullable();
const messageListSchema = messageSchema.array();

const setLastSeenResultSchema = z.object({
  id: z.string().uuid(),
  updated: z.boolean(),
});

const setMessageLastSeenInputSchema = z.object({
  messageId: z.string().uuid(),
});

const createMessageInputSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string(),
  userId: z.string().uuid(),
  messageType: messageTypeSchema,
  attachments: messageAttachmentSchema.nullable(),
});

type MessagesWithStatsRow = {
  id: string | null;
  chat_id: string | null;
  user_id: string | null;
  sender_id: string | null;
  content: string | null;
  attachments: MessageAttachment | null;
  message_type: string | null;
  metadata: unknown;
  created_at: string | null;
  updated_at: string | null;
  sender_first_name: string | null;
  sender_last_name: string | null;
  sender_avatar_url: string | null;
  sender_is_admin: boolean | null;
};

async function fetchLastUserMessageIdByCreatedAt(
  client: SupabaseClient<Database>,
  chatId: string,
): Promise<{ data: string | null; error: { message: string; code?: string } | null }> {
  const { data, error } = await client
    .from('messages')
    .select('id')
    .eq('chat_id', chatId)
    .eq('message_type', 'user')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return { data: null, error };
  }

  return { data: data?.[0]?.id ?? null, error: null };
}

async function fetchMessagesByChatId(
  client: SupabaseClient<Database>,
  chatId: string,
): Promise<{ data: Message[]; error: { message: string; code?: string } | null }> {
  const { data, error } = await client
    .from('messages_with_stats')
    .select('*')
    .eq('chat_id', chatId)
    .neq('message_type', 'system')
    .order('created_at', { ascending: true });

  if (error) {
    return { data: [], error };
  }

  if (!data) {
    return { data: [], error: null };
  }

  const normalized = (data as MessagesWithStatsRow[])
    .filter((row) => row.id && row.chat_id && row.message_type)
    .map((row) => ({
      id: row.id as string,
      chat_id: row.chat_id as string,
      user_id: row.user_id ?? row.sender_id,
      content: row.content ?? '',
      attachments: row.attachments,
      message_type: row.message_type as Message['message_type'],
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sender_id: row.sender_id,
      sender_first_name: row.sender_first_name,
      sender_last_name: row.sender_last_name,
      sender_avatar_url: row.sender_avatar_url,
      sender_is_admin: row.sender_is_admin,
    }));

  return { data: normalized, error: null };
}

/** Latest user message id in a chat (by created_at desc). */
export const getLastUserMessageIdByCreatedAt = defineQuery({
  key: messageKeys.lastUserMessage,
  schema: lastUserMessageIdSchema,
  execute: (client, chatId: string) =>
    fetchLastUserMessageIdByCreatedAt(client, chatId),
});

/** All non-system messages for a chat. */
export const getMessagesByChatId = defineQuery({
  key: messageKeys.byChat,
  schema: messageListSchema,
  execute: (client, chatId: string) => fetchMessagesByChatId(client, chatId),
});

/** Set message last_seen_at when currently null. */
export const setMessageLastSeenAtIfNull = defineMutation({
  inputSchema: setMessageLastSeenInputSchema,
  schema: setLastSeenResultSchema,
  execute: async (client, input) => {
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('messages')
      .update({
        last_seen_at: now,
        updated_at: now,
      })
      .eq('id', input.messageId)
      .is('last_seen_at', null)
      .select('id');

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        id: input.messageId,
        updated: (data?.length ?? 0) > 0,
      },
      error: null,
    };
  },
  targets: () => [messageKeys.all],
});

/** Create a message and bump chat last_updated_at. */
export const createMessage = defineMutation({
  inputSchema: createMessageInputSchema,
  schema: messageSchema,
  execute: async (client, input) => {
    const { data, error } = await client
      .from('messages')
      .insert({
        chat_id: input.chatId,
        content: input.content.trim(),
        attachments: input.attachments,
        user_id: input.userId,
        message_type: input.messageType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to create message' },
      };
    }

    await client
      .from('chats')
      .update({ last_updated_at: new Date().toISOString() })
      .eq('id', input.chatId);

    return { data, error: null };
  },
  targets: (input) => [messageKeys.all, messageKeys.byChat(input.chatId)],
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type SetMessageLastSeenInput = z.infer<
  typeof setMessageLastSeenInputSchema
>;
