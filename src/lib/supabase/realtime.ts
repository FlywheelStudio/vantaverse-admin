import {
  RealtimeChannel,
  RealtimeChannelOptions,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase } from './core/client';

export interface PostgresChangesConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table: string;
  filter?: string;
}

interface RealtimeSubscriptionOptions {
  channelName: string;
  config?: RealtimeChannelOptions;
}

/**
 * Abstract base class for Supabase Realtime subscriptions
 * Provides common functionality for managing realtime channels and subscriptions
 */
export abstract class SupabaseRealtime {
  /**
   * The Supabase client (browser client for realtime)
   */
  protected supabase = supabase;

  /**
   * Active channel subscriptions
   */
  protected channels: Map<string, RealtimeChannel> = new Map();

  constructor() {}

  /**
   * Get the table name to subscribe to
   * Must be implemented by subclasses
   * @returns The table name
   */
  protected abstract getTableName(): string;

  /**
   * Get the channel name prefix
   * Must be implemented by subclasses
   * @returns The channel name prefix
   */
  protected abstract getChannelNamePrefix(): string;

  /**
   * Transform a realtime payload to the expected type
   * Must be implemented by subclasses
   * @param payload - The realtime payload from Supabase
   * @returns The transformed data
   */
  protected abstract transformPayload(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): unknown;

  /**
   * Create and subscribe to a realtime channel
   * @param options - Channel configuration options
   * @returns The created channel
   */
  protected createChannel(
    options: RealtimeSubscriptionOptions,
  ): RealtimeChannel {
    const { channelName, config } = options;

    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.removeChannel(channelName);
    }

    const channel = this.supabase.channel(channelName, config);
    this.channels.set(channelName, channel);

    return channel;
  }

  /**
   * Subscribe to postgres changes
   * @param channel - The channel to subscribe to
   * @param config - Postgres changes configuration
   * @param callback - Callback function for handling changes
   * @returns The channel for chaining
   */
  protected onPostgresChanges<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(
    channel: RealtimeChannel,
    config: PostgresChangesConfig,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  ): RealtimeChannel {
    return channel.on('postgres_changes', config as never, callback);
  }

  /**
   * Subscribe to a channel
   * @param channel - The channel to subscribe to
   * @returns The channel for chaining
   */
  protected subscribe(channel: RealtimeChannel): RealtimeChannel {
    return channel.subscribe();
  }

  /**
   * Remove and unsubscribe from a channel
   * @param channelName - The name of the channel to remove
   */
  protected removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  /**
   * Remove all channels and unsubscribe
   */
  protected removeAllChannels(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  /**
   * Cleanup method to be called when the component unmounts
   * Override this method in subclasses if additional cleanup is needed
   */
  public cleanup(): void {
    this.removeAllChannels();
  }

  /**
   * Get a channel by name
   * @param channelName - The name of the channel
   * @returns The channel or undefined if not found
   */
  protected getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }
}
