import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  messageSchema,
  type Message,
  type MessageAttachment,
} from '../schemas/messages';

export class MessagesQuery extends SupabaseQuery {
  /**
   * Get the latest user message id in a chat (ordered by created_at desc only)
   */
  public async getLastUserMessageIdByCreatedAt(
    chatId: string,
  ): Promise<SupabaseSuccess<string | null> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)
      .eq('message_type', 'user')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get last user message',
      );
    }

    return {
      success: true,
      data: data?.[0]?.id ?? null,
    };
  }

  /**
   * Set message last_seen_at to now only when it is currently null
   */
  public async setMessageLastSeenAtIfNull(
    messageId: string,
  ): Promise<SupabaseSuccess<{ updated: boolean }> | SupabaseError> {
    const supabase = await this.getClient('service_role');
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('messages')
      .update({
        last_seen_at: now,
        updated_at: now,
      })
      .eq('id', messageId)
      .is('last_seen_at', null)
      .select('id');

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to update last seen timestamp',
      );
    }

    return {
      success: true,
      data: { updated: (data?.length ?? 0) > 0 },
    };
  }

  /**
   * Get all messages for a chat
   * @param chatId - The chat ID
   * @returns Success with messages array or error
   */
  public async getMessagesByChatId(
    chatId: string,
  ): Promise<SupabaseSuccess<Message[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .neq('message_type', 'system')
      .order('created_at', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get messages');
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    const result = messageSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Create a new message
   * @param chatId - The chat ID
   * @param content - The message content
   * @param userId - The user ID (admin sending the message)
   * @param messageType - The message type (defaults to 'admin')
   * @returns Success with created message or error
   */
  public async createMessage(
    chatId: string,
    content: string,
    userId: string,
    messageType: 'admin' | 'user' | 'system' = 'admin',
    attachments: MessageAttachment | null = null,
  ): Promise<SupabaseSuccess<Message> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content: content.trim(),
        attachments,
        user_id: userId,
        message_type: messageType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to create message');
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create message',
      };
    }

    // Update chat's last_updated_at
    await supabase
      .from('chats')
      .update({ last_updated_at: new Date().toISOString() })
      .eq('id', chatId);

    const result = messageSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
