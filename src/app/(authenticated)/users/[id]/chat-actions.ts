'use server';

import { randomUUID } from 'node:crypto';
import { ChatsQuery } from '@/lib/supabase/queries/chats';
import { MessagesQuery } from '@/lib/supabase/queries/messages';
import {
  type Message,
  type MessageAttachment,
} from '@/lib/supabase/schemas/messages';
import { SupabaseStorage } from '@/lib/supabase/storage';

const CHAT_FILE_EXPIRATION = 1000 * 365 * 24 * 60 * 60;
const MAX_CHAT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const normalized = trimmed || 'file';
  return normalized.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function resolveAttachmentType(
  contentType: string,
): MessageAttachment['type'] | null {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (DOCUMENT_MIME_TYPES.has(contentType)) return 'document';
  return null;
}

function getBase64PayloadSizeBytes(value: string): number {
  const payload = value.includes(',') ? (value.split(',').pop() ?? '') : value;
  const normalized = payload.trim();
  if (!normalized) return 0;
  const paddingMatch = normalized.match(/=+$/);
  const padding = paddingMatch?.[0]?.length ?? 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

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

export async function uploadChatFile(
  chatId: string,
  fileBase64: string,
  fileName: string,
  contentType: string,
  _userId: string,
): Promise<
  { success: true; data: MessageAttachment } | { success: false; error: string }
> {
  const normalizedContentType = contentType.trim().toLowerCase();
  const attachmentType = resolveAttachmentType(normalizedContentType);

  if (!attachmentType) {
    return {
      success: false,
      error:
        'Invalid file type. Only video, image and document files are allowed.',
    };
  }

  if (!fileBase64) {
    return {
      success: false,
      error: 'File payload is required.',
    };
  }

  const fileSizeBytes = getBase64PayloadSizeBytes(fileBase64);
  if (fileSizeBytes > MAX_CHAT_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File is too large. Maximum size is 5MB.',
    };
  }

  const safeName = sanitizeFileName(fileName);
  const filePath = `${chatId}/${randomUUID()}_${safeName}`;
  const storage = new SupabaseStorage();

  const uploadResult = await storage.upload({
    bucket: 'chats',
    path: filePath,
    body: fileBase64,
    contentType: normalizedContentType,
    upsert: false,
    getPublicUrl: false,
  });

  if (!uploadResult.success) {
    return uploadResult;
  }

  const signedUrlResult = await storage.createSignedUrl(
    'chats',
    filePath,
    CHAT_FILE_EXPIRATION,
  );

  if (!signedUrlResult.success) {
    return signedUrlResult;
  }

  return {
    success: true,
    data: {
      url: signedUrlResult.data,
      type: attachmentType,
    },
  };
}
