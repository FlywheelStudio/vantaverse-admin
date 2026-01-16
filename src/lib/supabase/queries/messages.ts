import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { messageSchema, type Message } from '../schemas/messages';

export class MessagesQuery extends SupabaseQuery {
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
  ): Promise<SupabaseSuccess<Message> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content: content.trim(),
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
