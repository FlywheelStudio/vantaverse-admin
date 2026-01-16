import { SupabaseRealtime, type PostgresChangesConfig } from '../realtime';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '../schemas/messages';

export class MessagesRealtime extends SupabaseRealtime {
  protected getTableName(): string {
    return 'messages';
  }

  protected getChannelNamePrefix(): string {
    return 'messages';
  }

  protected transformPayload(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): Message {
    return payload.new as Message;
  }

  /**
   * Subscribe to messages for a specific chat
   * @param chatId - The chat ID to subscribe to
   * @param callback - Callback function for new messages
   * @returns The channel for chaining
   */
  public subscribeToChat(chatId: string, callback: (message: Message) => void) {
    const channelName = `${this.getChannelNamePrefix()}_${chatId}`;

    const channel = this.createChannel({
      channelName,
    });

    const config: PostgresChangesConfig = {
      event: 'INSERT',
      schema: 'public',
      table: this.getTableName(),
      filter: `chat_id=eq.${chatId}`,
    };

    this.onPostgresChanges<Message>(channel, config, (payload) => {
      if (payload.eventType === 'INSERT') {
        const message = this.transformPayload(payload);
        callback(message);
      }
    });

    this.subscribe(channel);

    return channel;
  }
}
