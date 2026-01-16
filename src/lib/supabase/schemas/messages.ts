import { z } from 'zod';

export const messageTypeSchema = z.enum(['admin', 'user', 'system'], {
  message: 'Invalid message type',
});

export const messageSchema = z.object({
  id: z.uuid(),
  chat_id: z.uuid(),
  user_id: z.uuid().nullable(),
  content: z.string(),
  message_type: messageTypeSchema,
  metadata: z.unknown().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type MessageType = z.infer<typeof messageTypeSchema>;
export type Message = z.infer<typeof messageSchema>;
