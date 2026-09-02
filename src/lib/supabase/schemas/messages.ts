import { z } from 'zod';

export const messageTypeSchema = z.enum(['admin', 'user', 'system'], {
  message: 'Invalid message type',
});

export const attachmentTypeSchema = z.enum(['video', 'image', 'document'], {
  message: 'Invalid attachment type',
});

export const messageAttachmentSchema = z.object({
  url: z.url(),
  type: attachmentTypeSchema,
});

export const messageSchema = z.object({
  id: z.uuid(),
  chat_id: z.uuid(),
  user_id: z.uuid().nullable(),
  content: z.string(),
  attachments: messageAttachmentSchema.nullable(),
  message_type: messageTypeSchema,
  metadata: z.unknown().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  /** Present when loaded from `messages_with_stats`. */
  sender_id: z.uuid().nullable().optional(),
  sender_first_name: z.string().nullable().optional(),
  sender_last_name: z.string().nullable().optional(),
  sender_avatar_url: z.string().nullable().optional(),
  sender_is_admin: z.boolean().nullable().optional(),
});

export type MessageType = z.infer<typeof messageTypeSchema>;
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;
export type Message = z.infer<typeof messageSchema>;
