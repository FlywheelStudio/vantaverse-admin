'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/medvanta';
import { HtmlAvatar, HtmlRowMenu } from '../users/html-helpers';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import { MessagesRealtime } from '@/lib/supabase/realtime/messages';
import type { Message } from '@/lib/supabase/schemas/messages';
import {
  getMessagesByChatId,
  markLastUserMessageSeen,
} from '@/app/(authenticated)/users/[id]/chat-actions';
import { useSendMessage } from '@/app/(authenticated)/users/[id]/hooks/use-chat-mutations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/app/(authenticated)/users/[id]/hooks/use-chat-mutations';
import { useAuth } from '@/hooks/use-auth';
import { format, isToday, isYesterday } from 'date-fns';
import Image from 'next/image';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';

interface MessagesChatThreadProps {
  chatId: string;
  conversation: ConversationItem;
  onMarkedAsSeen?: () => void;
}

function formatBubbleTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a').toLowerCase();
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a').toLowerCase()}`;
  return format(date, 'MMM d, h:mm a').toLowerCase();
}

function formatActiveTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isToday(date)) return `Active ${format(date, 'h:mm a').toLowerCase()}`;
  if (isYesterday(date)) return 'Active yesterday';
  return `Active ${format(date, 'MMM d')}`;
}

export function MessagesChatThread({
  chatId,
  conversation,
  onMarkedAsSeen,
}: MessagesChatThreadProps): React.ReactElement {
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<MessagesRealtime | null>(null);
  const markSeenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markedSeenForChatIdRef = useRef<string | null>(null);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage(chatId);

  const patientName =
    conversation.first_name && conversation.last_name
      ? `${conversation.first_name} ${conversation.last_name}`
      : conversation.first_name || conversation.last_name || 'Patient';

  const messagesKey = chatKeys.messages(chatId);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: messagesKey,
    queryFn: async () => {
      const result = await getMessagesByChatId(chatId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }
      return result.data;
    },
    enabled: !!chatId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const showMessagesSpinner = isLoading && messages.length === 0;

  const markLastUserMessageAsSeen = useCallback(async (): Promise<void> => {
    if (!chatId) return;
    const result = await markLastUserMessageSeen(chatId);
    if (!result.success) {
      console.error(result.error || 'Failed to mark last user message as seen');
      return;
    }
    if (result.data.updated) {
      onMarkedAsSeen?.();
    }
  }, [chatId, onMarkedAsSeen]);

  const scheduleDebouncedMarkAsSeen = useCallback((): void => {
    if (markSeenTimeoutRef.current) {
      clearTimeout(markSeenTimeoutRef.current);
    }
    markSeenTimeoutRef.current = setTimeout(() => {
      markSeenTimeoutRef.current = null;
      void markLastUserMessageAsSeen();
    }, 3000);
  }, [markLastUserMessageAsSeen]);

  useEffect(() => {
    if (!chatId || showMessagesSpinner) return;
    if (markedSeenForChatIdRef.current === chatId) return;
    markedSeenForChatIdRef.current = chatId;
    void markLastUserMessageAsSeen();
  }, [chatId, showMessagesSpinner, markLastUserMessageAsSeen]);

  useEffect(() => {
    if (!chatId) return;

    const handleFocus = (): void => {
      scheduleDebouncedMarkAsSeen();
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        scheduleDebouncedMarkAsSeen();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (markSeenTimeoutRef.current) {
        clearTimeout(markSeenTimeoutRef.current);
        markSeenTimeoutRef.current = null;
      }
    };
  }, [chatId, scheduleDebouncedMarkAsSeen]);

  useEffect(() => {
    if (!chatId || showMessagesSpinner) return;

    let isMounted = true;
    const realtime = new MessagesRealtime();

    realtime.subscribeToChat(chatId, (newMessage) => {
      if (!isMounted) return;
      queryClient.setQueryData<Message[]>(messagesKey, (old) => {
        if (!old) return [newMessage];
        if (old.some((msg) => msg.id === newMessage.id)) return old;
        const filtered = old.filter((msg) => {
          const isTemp = msg.id.startsWith('temp-');
          if (!isTemp) return true;
          return !(
            msg.content.trim() === newMessage.content.trim() &&
            msg.message_type === newMessage.message_type
          );
        });
        return [...filtered, newMessage];
      });
    });

    realtimeRef.current = realtime;

    return () => {
      isMounted = false;
      realtime.cleanup();
      realtimeRef.current = null;
    };
  }, [chatId, showMessagesSpinner, messagesKey, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (): Promise<void> => {
    if (!messageContent.trim() || sendMessage.isPending || !currentUser) {
      return;
    }

    await sendMessage.mutateAsync(
      { content: messageContent, userId: currentUser.id },
      { onSuccess: () => setMessageContent('') },
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSend();
    }
  };

  const renderAttachment = (message: Message): React.ReactNode => {
    if (!message.attachments) return null;

    if (message.attachments.type === 'image') {
      return (
        <a href={message.attachments.url} target="_blank" rel="noreferrer">
          <Image
            src={message.attachments.url}
            alt="Image attachment"
            className="mt-2 max-h-56 w-full rounded-[var(--radius-md)] object-cover"
            width={560}
            height={320}
          />
        </a>
      );
    }

    if (message.attachments.type === 'video') {
      return (
        <video
          src={message.attachments.url}
          controls
          className="mt-2 max-h-64 w-full rounded-[var(--radius-md)]"
        />
      );
    }

    return (
      <a
        href={message.attachments.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[length:var(--text-xs)] underline underline-offset-4 opacity-90"
      >
        Open document
      </a>
    );
  };

  const isSending = sendMessage.isPending;
  const isComposerBusy = isSending;

  return (
    <>
      <div className="th-hd">
        <HtmlAvatar
          name={patientName}
          src={conversation.avatar_url}
          size={36}
          status
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-strong)',
            }}
          >
            {patientName}
          </span>
          <span
            className="row"
            style={{
              gap: 8,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <span>{conversation.organization_name}</span>
            {conversation.program_name ? (
              <>
                <span className="faint">·</span>
                <span>{conversation.program_name}</span>
              </>
            ) : null}
            <span className="faint">·</span>
            <span className="row" style={{ gap: 4 }}>
              <Icon name="CircleDot" size={11} className="text-[var(--cyan-500)]" />
              {formatActiveTime(conversation.last_message_at)}
            </span>
          </span>
        </span>
        <Link href={`/users/${conversation.user_id}`} className="btn btn-sec btn-sm">
          <Icon name="CircleUser" size={15} />
          Open profile
        </Link>
        <HtmlRowMenu
          items={[
            {
              id: 'view-program',
              label: 'View program',
              onSelect: () => toastUnavailable('View program'),
            },
            {
              id: 'assign',
              label: 'Assign program',
              onSelect: () => toastUnavailable('Assign program'),
            },
            {
              id: 'unread',
              label: 'Mark unread',
              onSelect: () => toastUnavailable('Mark unread'),
            },
            {
              id: 'mute',
              label: 'Mute',
              onSelect: () => toastUnavailable('Mute'),
            },
          ]}
        />
      </div>

      <div ref={scrollRef} className="th-body">
        {showMessagesSpinner ? (
          <div className="empty">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
            <span className="es">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty">
            <div className="ei">
              <Icon name="MessageSquare" size={24} />
            </div>
            <div className="et">No messages yet</div>
            <div className="es">Send the first message below.</div>
          </div>
        ) : (
          <>
            <div className="th-day">
              <i />
              <span>Today</span>
              <i />
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bub ${message.message_type === 'admin' ? 'me' : 'them'}`}
              >
                {message.content}
                {renderAttachment(message)}
                <div className="bt">{formatBubbleTime(message.created_at)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="th-comp">
        <span
          className="fld"
          style={{ flex: 1, height: 'auto', padding: '9px 14px', alignItems: 'center' }}
        >
          <input
            value={messageContent}
            onChange={(event) => setMessageContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Write a message to ${conversation.first_name || 'member'}…`}
            disabled={isComposerBusy}
            style={{ fontSize: 'var(--text-md)' }}
          />
        </span>
        <div className="tip">
          <button
            type="button"
            className="ib ib-sec ib-sq"
            aria-label="Insert template"
            disabled
            title="Saved replies coming soon"
          >
            <Icon name="FileText" size={17} />
          </button>
          <span className="tt">Insert a saved reply</span>
        </div>
        <div className="tip">
          <button
            type="button"
            className="ib ib-sec ib-sq"
            aria-label="Attach"
            disabled
            title="Attachments coming soon"
          >
            <Icon name="Paperclip" size={17} />
          </button>
          <span className="tt">Attach a file</span>
        </div>
        <button
          type="button"
          className="btn btn-pri"
          onClick={() => void handleSend()}
          disabled={!messageContent.trim() || isComposerBusy}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon name="Send" size={17} />
          )}
          Send
        </button>
      </div>
    </>
  );
}
