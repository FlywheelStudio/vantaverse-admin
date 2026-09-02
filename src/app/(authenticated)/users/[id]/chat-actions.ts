'use server';

import { ChatsQuery } from '@/lib/supabase/queries/chats';
import { MessagesQuery } from '@/lib/supabase/queries/messages';
import {
  type Message,
  type MessageAttachment,
} from '@/lib/supabase/schemas/messages';


/**
 * Get or create a chat for a patient
 * @param organizationId - The organization ID
 * @param patientId - The patient user ID
 * @param adminId - The admin user ID (current admin viewing)
 * @returns Success with chat ID or error
 */
export async function getOrCreateChatForPatient(
  organizationId: string,
  patientId: string,
): Promise<
  | { success: true; data: { chatId: string } }
  | { success: false; error: string }
> {
  const chatsQuery = new ChatsQuery();
  const result = await chatsQuery.getOrCreateChat(organizationId, patientId);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { chatId: result.data.id },
  };
}

/**
 * Get messages for a chat
 * @param chatId - The chat ID
 * @returns Success with messages array or error
 */
export async function getMessagesByChatId(
  chatId: string,
): Promise<
  { success: true; data: Message[] } | { success: false; error: string }
> {
  const messagesQuery = new MessagesQuery();
  const result = await messagesQuery.getMessagesByChatId(chatId);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Mark the latest user message as seen if its last_seen_at is null
 * Latest is determined only by created_at desc
 */
export async function markLastUserMessageSeen(
  chatId: string,
): Promise<
  | { success: true; data: { updated: boolean } }
  | { success: false; error: string }
> {
  const messagesQuery = new MessagesQuery();

  const lastUserMessageResult =
    await messagesQuery.getLastUserMessageIdByCreatedAt(chatId);
  if (!lastUserMessageResult.success) {
    return lastUserMessageResult;
  }

  if (!lastUserMessageResult.data) {
    return {
      success: true,
      data: { updated: false },
    };
  }

  const updateResult = await messagesQuery.setMessageLastSeenAtIfNull(
    lastUserMessageResult.data,
  );
  if (!updateResult.success) {
    return updateResult;
  }

  return {
    success: true,
    data: updateResult.data,
  };
}

/**
 * Send a message in a chat
 * @param chatId - The chat ID
 * @param content - The message content
 * @param userId - The user ID (admin sending the message)
 * @returns Success with message or error
 */
export async function sendMessage(
  chatId: string,
  content: string,
  userId: string,
  attachment: MessageAttachment | null = null,
): Promise<
  | { success: true; data: { messageId: string } }
  | { success: false; error: string }
> {
  const messagesQuery = new MessagesQuery();
  const result = await messagesQuery.createMessage(
    chatId,
    content,
    userId,
    'admin',
    attachment,
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { messageId: result.data.id },
  };
}

