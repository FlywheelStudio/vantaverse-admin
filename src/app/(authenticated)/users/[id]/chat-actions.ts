'use server';

import { formatDalError, mutate, type DalResult } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { getOrCreateChat } from '@/lib/supabase/queries/chats';
import {
  createMessage,
  getLastUserMessageIdByCreatedAt,
  getMessagesByChatId as getMessagesByChatIdQuery,
  setMessageLastSeenAtIfNull,
} from '@/lib/supabase/queries/messages';
import {
  type Message,
  type MessageAttachment,
} from '@/lib/supabase/schemas/messages';
import { createClient } from '@/lib/supabase/core/server';

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

/**
 * Get or create a chat for a patient
 * @param organizationId - The organization ID
 * @param patientId - The patient user ID
 * @returns Success with chat ID or error
 */
export async function getOrCreateChatForPatient(
  organizationId: string,
  patientId: string,
): Promise<LegacyResult<{ chatId: string }>> {
  const client = await createClient();
  const result = await mutate(
    getOrCreateChat,
    { organizationId, userId: patientId },
    { client },
  );
  const mapped = fromDalResult(result);
  if (!mapped.success) {
    return mapped;
  }

  return {
    success: true,
    data: { chatId: mapped.data.id },
  };
}

/**
 * Get messages for a chat
 * @param chatId - The chat ID
 * @returns Success with messages array or error
 */
export async function getMessagesByChatId(
  chatId: string,
): Promise<LegacyResult<Message[]>> {
  return fromDalResult(await queryWithSession(getMessagesByChatIdQuery, chatId));
}

/**
 * Mark the latest user message as seen if its last_seen_at is null
 * Latest is determined only by created_at desc
 */
export async function markLastUserMessageSeen(
  chatId: string,
): Promise<LegacyResult<{ updated: boolean }>> {
  const lastUserMessageResult = fromDalResult(
    await queryWithSession(getLastUserMessageIdByCreatedAt, chatId),
  );
  if (!lastUserMessageResult.success) {
    return lastUserMessageResult;
  }

  if (!lastUserMessageResult.data) {
    return {
      success: true,
      data: { updated: false },
    };
  }

  const client = await createClient();
  const updateResult = fromDalResult(
    await mutate(
      setMessageLastSeenAtIfNull,
      { messageId: lastUserMessageResult.data },
      { client },
    ),
  );
  if (!updateResult.success) {
    return updateResult;
  }

  return {
    success: true,
    data: { updated: updateResult.data.updated },
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
): Promise<LegacyResult<{ messageId: string }>> {
  const client = await createClient();
  const result = fromDalResult(
    await mutate(
      createMessage,
      {
        chatId,
        content,
        userId,
        messageType: 'admin' as const,
        attachments: attachment,
      },
      { client },
    ),
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { messageId: result.data.id },
  };
}
