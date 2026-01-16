import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { chatSchema, type Chat } from '../schemas/chats';

export class ChatsQuery extends SupabaseQuery {
  /**
   * Get or create a chat for an organization and user
   * @param organizationId - The organization ID
   * @param userId - The user ID (patient)
   * @returns Success with chat or error
   */
  public async getOrCreateChat(
    organizationId: string,
    userId: string,
  ): Promise<SupabaseSuccess<Chat> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    // Check if chat already exists (user chats don't have organization_id per constraint)
    const { data: existingChat, error: fetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', 'user')
      .is('organization_id', null)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      return this.parseResponsePostgresError(
        fetchError,
        'Failed to check for existing chat',
      );
    }

    // Return existing chat if found
    if (existingChat) {
      const result = chatSchema.safeParse(existingChat);

      if (!result.success) {
        return this.parseResponseZodError(result.error);
      }

      return {
        success: true,
        data: result.data,
      };
    }

    // Generate chat name from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    const firstName = profile?.first_name || 'User';
    const lastName = profile?.last_name || '';
    const chatName = `${firstName} ${lastName}`.trim();

    // Create new chat (user chats must have organization_id as NULL per constraint)
    const { data, error } = await supabase
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
      return this.parseResponsePostgresError(
        error,
        'Failed to create chat',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create chat',
      };
    }

    const result = chatSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get a chat by ID
   * @param chatId - The chat ID
   * @returns Success with chat or error
   */
  public async getChatById(
    chatId: string,
  ): Promise<SupabaseSuccess<Chat> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get chat');
    }

    if (!data) {
      return {
        success: false,
        error: 'Chat not found',
      };
    }

    const result = chatSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get all chats for a user
   * @param userId - The user ID
   * @returns Success with chats array or error
   */
  public async getChatsByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<Chat[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('last_updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get chats');
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    const result = chatSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
