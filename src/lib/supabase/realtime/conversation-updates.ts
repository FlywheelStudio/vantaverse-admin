import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseRealtime } from '../realtime';

/** Topic pattern: org:{organizationId}:conversation_updates. Event: last_message_updated. Requires DB trigger. */
const ORG_CONVERSATION_TOPIC_PREFIX = 'org';
const ORG_CONVERSATION_TOPIC_SUFFIX = 'conversation_updates';
const LAST_MESSAGE_UPDATED_EVENT = 'last_message_updated';

/**
 * Payload broadcast by the DB trigger for conversation list updates.
 * Use to update a conversation card's last message without subscribing per chat.
 */
export type LastMessageUpdatedPayload = {
  user_id: string;
  chat_id: string;
  content: string;
  created_at: string | null;
};

/**
 * Realtime subscriptions for conversation list (last message per card).
 * Subscribe to one channel per org; DB trigger broadcasts when any message is inserted in that org.
 * Use on the messages page so many cards stay in sync without N channels.
 *
 * @example
 * const realtime = new ConversationUpdatesRealtime();
 * realtime.subscribeToOrg(orgId, (payload) => {
 *   updateConversationLastMessage(payload.user_id, payload);
 * });
 * // Subscribe to each admin org. On unmount: realtime.cleanup();
 */
export class ConversationUpdatesRealtime extends SupabaseRealtime {
  /**
   * Subscribe to last-message updates for an organization. Call once per org the admin belongs to.
   * Topic: org:{organizationId}:conversation_updates, event: last_message_updated.
   * @param organizationId - Organization UUID
   * @param callback - Called with user_id, chat_id, content, created_at
   */
  public subscribeToOrg(
    organizationId: string,
    callback: (payload: LastMessageUpdatedPayload) => void,
  ): RealtimeChannel {
    const topic = `${ORG_CONVERSATION_TOPIC_PREFIX}:${organizationId}:${ORG_CONVERSATION_TOPIC_SUFFIX}`;

    const channel = this.createChannel({
      channelName: topic,
      config: { config: { private: true } },
    });

    this.onBroadcast<LastMessageUpdatedPayload>(
      channel,
      LAST_MESSAGE_UPDATED_EVENT,
      callback,
    );

    this.subscribe(channel);
    return channel;
  }
}
