import { RealtimeChannel, RealtimeChannelOptions } from '@supabase/supabase-js';
import { supabase } from './core/client';

/**
 * Options when creating a realtime channel.
 * Use `config: { private: true }` for production (authorization via Realtime/RLS).
 */
export interface RealtimeSubscriptionOptions {
  /** Unique channel name. Prefer topic pattern: `scope:id:entity` (e.g. `chat:123:messages`) */
  channelName: string;
  /** Channel config; set `{ private: true }` for private channels */
  config?: RealtimeChannelOptions;
}

/**
 * Broadcast payload shape: Supabase sends `{ payload: T }` to the callback.
 */
export type BroadcastPayload<T = unknown> = { payload: T };

/**
 * Base class for Supabase Realtime using **broadcast** (recommended over postgres_changes).
 * Manages channel lifecycle and broadcast subscriptions with cleanup.
 *
 * @example
 * Subscribe to a private channel and listen for an event
 * const channel = this.createChannel({
 *   channelName: 'chat:abc-123:messages',
 *   config: { private: true },
 * });
 * this.onBroadcast<Message>(channel, 'message_created', (data) => {
 *   console.log('New message', data);
 * });
 * this.subscribe(channel);
 */
export abstract class SupabaseRealtime {
  protected supabase = supabase;
  protected channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Create a channel (does not subscribe yet). Use with onBroadcast + subscribe.
   * @param options.channelName - Topic-style name, e.g. `chat:{chatId}:messages`
   * @param options.config - e.g. `{ private: true }` for private channels
   */
  protected createChannel(
    options: RealtimeSubscriptionOptions,
  ): RealtimeChannel {
    const { channelName, config } = options;

    if (this.channels.has(channelName)) {
      this.removeChannel(channelName);
    }

    const channel = this.supabase.channel(channelName, config);
    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Listen for a broadcast event on a channel. Call after createChannel, before subscribe.
   * @param channel - Channel from createChannel
   * @param event - Event name (snake_case), e.g. `message_created`
   * @param callback - Receives the broadcast payload (the object sent by the server)
   */
  protected onBroadcast<T>(
    channel: RealtimeChannel,
    event: string,
    callback: (data: T) => void,
  ): RealtimeChannel {
    return (
      channel.on as (
        type: string,
        filter: { event: string },
        cb: (p: BroadcastPayload<T>) => void,
      ) => RealtimeChannel
    )('broadcast', { event }, (payload) => callback(payload.payload));
  }

  /**
   * Subscribe the channel. Call after createChannel and onBroadcast.
   */
  protected subscribe(channel: RealtimeChannel): RealtimeChannel {
    return channel.subscribe();
  }

  protected removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  protected removeAllChannels(): void {
    this.channels.forEach((ch) => ch.unsubscribe());
    this.channels.clear();
  }

  /**
   * Unsubscribe all channels. Call on component unmount.
   */
  public cleanup(): void {
    this.removeAllChannels();
  }

  protected getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }
}
