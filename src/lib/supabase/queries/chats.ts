import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

import { chatSchema, type Chat } from '../schemas/chats';

export const chatKeys = {
  all: ['chats'] as const,
  byId: (chatId: string) => [...chatKeys.all, 'detail', chatId] as const,
  byUser: (userId: string) => [...chatKeys.all, 'user', userId] as const,
};

const chatListSchema = chatSchema.array();

const getOrCreateChatInputSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
});

async function fetchOrCreateChat(
  client: SupabaseClient<Database>,
  input: z.infer<typeof getOrCreateChatInputSchema>,
): Promise<{ data: Chat | null; error: { message: string; code?: string } | null }> {
  const { userId } = input;

  const { data: existingChat, error: fetchError } = await client
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .eq('target_type', 'user')
    .is('organization_id', null)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (existingChat) {
    return { data: existingChat, error: null };
  }

  const { data: profile } = await client
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  const firstName = profile?.first_name || 'User';
  const lastName = profile?.last_name || '';
  const chatName = `${firstName} ${lastName}`.trim();

  const { data, error } = await client
    .from('chats')
    .insert({
      organization_id: null,
      user_id: userId,
      target_type: 'user',
      name: chatName,
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
      error: { message: 'Failed to create chat' },
    };
  }

  return { data, error: null };
}

/** Get or create a user-target chat for a patient. */
export const getOrCreateChat = defineMutation({
  inputSchema: getOrCreateChatInputSchema,
  schema: chatSchema,
  execute: (client, input) => fetchOrCreateChat(client, input),
  targets: (input) => [chatKeys.all, chatKeys.byUser(input.userId)],
});

/** Get a chat by id. */
export const getChatById = defineQuery({
  key: chatKeys.byId,
  schema: chatSchema,
  execute: async (client, chatId: string) => {
    const { data, error } = await client
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Chat not found' } };
    }

    return { data, error: null };
  },
});

/** List chats for a user. */
export const getChatsByUserId = defineQuery({
  key: chatKeys.byUser,
  schema: chatListSchema,
  execute: async (client, userId: string) => {
    const { data, error } = await client
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('last_updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data ?? [], error: null };
  },
});

export type GetOrCreateChatInput = z.infer<typeof getOrCreateChatInputSchema>;
