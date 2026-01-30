import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseRealtime } from '../realtime';
import type { Message } from '../schemas/messages';

/** Topic pattern: chat:{chatId}:messages. Event: message_created. Requires DB trigger. */
const CHAT_MESSAGES_TOPIC_PREFIX = 'chat';
const CHAT_MESSAGES_TOPIC_SUFFIX = 'messages';
const CHAT_MESSAGE_CREATED_EVENT = 'message_created';

/**
 * Realtime subscriptions for messages, using **broadcast** (not postgres_changes).
 * Requires database triggers that call realtime.send() on messages INSERT.
 *
 * @example
 * const realtime = new MessagesRealtime();
 * realtime.subscribeToChat(chatId, (message) => { ... });
 * on unmount: realtime.cleanup();
 */
export class MessagesRealtime extends SupabaseRealtime {
  /**
   * Subscribe to new messages for one chat. Use when the chat is open.
   * Topic: chat:{chatId}:messages, event: message_created.
   * @param chatId - Chat UUID
   * @param callback - Called with the new message (from DB trigger payload)
   */
  public subscribeToChat(
    chatId: string,
    callback: (message: Message) => void,
  ): RealtimeChannel {
    const topic = `${CHAT_MESSAGES_TOPIC_PREFIX}:${chatId}:${CHAT_MESSAGES_TOPIC_SUFFIX}`;

    const channel = this.createChannel({
      channelName: topic,
      config: { config: { private: true } },
    });

    this.onBroadcast<Message>(channel, CHAT_MESSAGE_CREATED_EVENT, (data) => {
      callback(data as Message);
    });

    this.subscribe(channel);
    return channel;
  }
}
