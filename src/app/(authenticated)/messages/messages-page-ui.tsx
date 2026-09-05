'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
import { HtmlAvatar } from '../users/html-helpers';
import { getOrCreateChatForPatient } from '@/app/(authenticated)/users/[id]/chat-actions';
import { getMessagesConversationPreheatQueries } from '@/components/navigation/list-row-preheat';
import { getConversationsForAdmin } from './actions';
import { MessagesChatThread } from './messages-chat-thread';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import { usePreheat, type PreheatHandlers } from '@/hooks/use-preheat';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';
import {
  ConversationUpdatesRealtime,
  type LastMessageUpdatedPayload,
} from '@/lib/supabase/realtime/conversation-updates';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

const MESSAGES_STALE_MS = 60_000;

/**
 * Update ?userId= without App Router navigation (avoids RSC refetch of conversations).
 */
function syncUserIdInUrl(userId: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const current = url.searchParams.get('userId');
  if (userId) {
    if (current === userId) return;
    url.searchParams.set('userId', userId);
  } else {
    if (!current) return;
    url.searchParams.delete('userId');
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, '', next);
}

type ConvFilter = 'all' | 'unread';

const sortConversations = (items: ConversationItem[]): ConversationItem[] =>
  [...items].sort((left, right) => {
    const leftAt = left.last_message_at ?? '';
    const rightAt = right.last_message_at ?? '';
    if (leftAt && rightAt) return rightAt.localeCompare(leftAt);
    if (leftAt) return -1;
    if (rightAt) return 1;
    return 0;
  });

const applyLastMessageUpdate = (
  items: ConversationItem[],
  payload: LastMessageUpdatedPayload,
  currentUserId: string | undefined,
  selectedChatId: string | null,
): ConversationItem[] => {
  const next = items.map((item) => {
    if (item.user_id !== payload.user_id) return item;

    const isOwn =
      payload.sender_id != null && payload.sender_id === currentUserId;
    const isOpen =
      selectedChatId != null && selectedChatId === payload.chat_id;
    const shouldBumpUnread =
      payload.message_type === 'user' && !isOwn && !isOpen;

    return {
      ...item,
      chat_id: item.chat_id ?? payload.chat_id,
      last_message_content: payload.content,
      last_message_at: payload.created_at,
      unread_count: shouldBumpUnread
        ? item.unread_count + 1
        : item.unread_count,
    };
  });

  return sortConversations(next);
};

function formatConvTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h a').toLowerCase().replace(' ', '');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEE');
  return format(date, 'd MMM');
}

function buildSubtitle(conversations: ConversationItem[]): string {
  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + (conversation.unread_count ?? 0),
    0,
  );
  const waiting = conversations.filter((conversation) => {
    if (!conversation.last_message_at || conversation.unread_count === 0) {
      return false;
    }
    const hours =
      (Date.now() - new Date(conversation.last_message_at).getTime()) /
      (1000 * 60 * 60);
    return hours >= 24;
  }).length;

  const parts: string[] = [];
  if (unreadTotal > 0) {
    parts.push(`${unreadTotal} unread`);
  }
  if (waiting > 0) {
    parts.push(
      `${waiting} member${waiting !== 1 ? 's' : ''} waiting more than 24 hours`,
    );
  }
  return parts.length > 0 ? parts.join(' · ') : 'All caught up';
}

interface MessagesPageUIProps {
  organizations: Array<{ id: string; name: string }>;
  conversations: ConversationItem[];
}

export function MessagesPageUI({
  organizations,
  conversations,
}: MessagesPageUIProps): React.ReactElement {
  const searchParams = useSearchParams();
  const deepLinkUserId = searchParams.get('userId');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [convFilter, setConvFilter] = useState<ConvFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [orgFilter, setOrgFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const deepLinkHandledRef = useRef<string | null>(null);
  const missingUserToastRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { preheat, getPreheatHandlers } = usePreheat();
  const selectedChatIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | undefined>(undefined);

  const { data: conversationsData } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const result = await getConversationsForAdmin();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: conversations,
    staleTime: MESSAGES_STALE_MS,
  });

  const conversationsList = conversationsData ?? conversations;
  selectedChatIdRef.current = selected?.chat_id ?? null;
  currentUserIdRef.current = currentUser?.id;
  const subtitle = useMemo(
    () => buildSubtitle(conversationsList),
    [conversationsList],
  );
  const unreadCount = useMemo(
    () =>
      conversationsList.filter((conversation) => conversation.unread_count > 0)
        .length,
    [conversationsList],
  );

  const q = debouncedSearch.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    let list = conversationsList;

    if (convFilter === 'unread') {
      list = list.filter((conversation) => conversation.unread_count > 0);
    }

    if (orgFilter) {
      list = list.filter(
        (conversation) => conversation.organization_id === orgFilter,
      );
    }

    if (q) {
      list = list.filter((conversation) => {
        const firstName = (conversation.first_name ?? '').toLowerCase();
        const lastName = (conversation.last_name ?? '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const email = (conversation.email ?? '').toLowerCase();
        const org = (conversation.organization_name ?? '').toLowerCase();
        return (
          firstName.includes(q) ||
          lastName.includes(q) ||
          fullName.includes(q) ||
          email.includes(q) ||
          org.includes(q)
        );
      });
    }

    return list;
  }, [conversationsList, convFilter, orgFilter, q]);

  const activeFilterCount = orgFilter ? 1 : 0;

  const preheatConversationMessages = useCallback(
    (chatId: string | null): void => {
      if (!chatId) return;
      preheat('/messages', getMessagesConversationPreheatQueries(chatId));
    },
    [preheat],
  );

  const getConversationPreheatHandlers = useCallback(
    (chatId: string | null): Partial<PreheatHandlers> => {
      if (!chatId) {
        return {};
      }
      return getPreheatHandlers(
        '/messages',
        getMessagesConversationPreheatQueries(chatId),
      );
    },
    [getPreheatHandlers],
  );

  const handleSelectConversation = useCallback(
    async (conversation: ConversationItem): Promise<void> => {
      if (openingUserId && openingUserId !== conversation.user_id) return;

      // Optimistic: select immediately, shallow URL (no RSC refetch).
      syncUserIdInUrl(conversation.user_id);

      if (conversation.chat_id) {
        setSelected(conversation);
        preheatConversationMessages(conversation.chat_id);
        return;
      }

      setOpeningUserId(conversation.user_id);
      setSelected(conversation);
      try {
        const result = await getOrCreateChatForPatient(
          conversation.organization_id,
          conversation.user_id,
        );
        if (!result.success) {
          toast.error(result.error || 'Failed to open chat');
          return;
        }
        const withChat: ConversationItem = {
          ...conversation,
          chat_id: result.data.chatId,
        };
        setSelected(withChat);
        queryClient.setQueryData<ConversationItem[]>(
          ['messages', 'conversations'],
          (prev) =>
            (prev ?? []).map((item) =>
              item.user_id === conversation.user_id ? withChat : item,
            ),
        );
        preheatConversationMessages(result.data.chatId);
      } catch (error) {
        console.error(error);
        toast.error('Failed to open chat');
      } finally {
        setOpeningUserId(null);
      }
    },
    [openingUserId, preheatConversationMessages, queryClient],
  );

  // Deep-link from ?userId= (Message button / hard navigation) — once per id.
  useEffect(() => {
    if (!deepLinkUserId) return;
    if (deepLinkHandledRef.current === deepLinkUserId) return;
    if (selected?.user_id === deepLinkUserId) {
      deepLinkHandledRef.current = deepLinkUserId;
      return;
    }

    const match = conversationsList.find(
      (conversation) => conversation.user_id === deepLinkUserId,
    );
    if (!match) {
      if (missingUserToastRef.current !== deepLinkUserId) {
        toast.error('No conversation found for this member');
        missingUserToastRef.current = deepLinkUserId;
      }
      deepLinkHandledRef.current = deepLinkUserId;
      return;
    }

    deepLinkHandledRef.current = deepLinkUserId;
    missingUserToastRef.current = null;
    void handleSelectConversation(match);
  }, [deepLinkUserId, conversationsList, selected?.user_id, handleSelectConversation]);

  const organizationIds = useMemo(
    () => organizations.map((organization) => organization.id).join(','),
    [organizations],
  );

  useEffect(() => {
    if (organizations.length === 0) return;

    const realtime = new ConversationUpdatesRealtime();
    for (const organization of organizations) {
      realtime.subscribeToOrg(organization.id, (payload) => {
        queryClient.setQueryData<ConversationItem[]>(
          ['messages', 'conversations'],
          (prev) =>
            applyLastMessageUpdate(
              prev ?? [],
              payload,
              currentUserIdRef.current,
              selectedChatIdRef.current,
            ),
        );
      });
    }

    return () => {
      realtime.cleanup();
    };
  }, [organizationIds, organizations, queryClient]);

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Messages' }]}
        title="Messages"
        subtitle={subtitle}
      />

      <div className="body-flush">
        <div className="msg-wrap">
          <div className="conv-list">
            <div className="conv-hd">
              <div className="row" style={{ gap: 7 }}>
                <span className="fld fld-sm" style={{ flex: 1 }}>
                  <Icon name="Search" size={15} />
                  <input
                    value={search}
                    placeholder="Search conversations…"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </span>
                <button
                  type="button"
                  className="btn btn-sec btn-sm"
                  style={{ padding: '0 10px' }}
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  <Icon name="Funnel" size={15} />
                  {activeFilterCount > 0 ? (
                    <span
                      className="bdg bdg-b"
                      style={{ padding: '0 5px', fontSize: 10 }}
                    >
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
              </div>

              {filtersOpen && organizations.length > 0 ? (
                <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${orgFilter === null ? 'btn-pri' : 'btn-sec'}`}
                    onClick={() => setOrgFilter(null)}
                  >
                    All groups
                  </button>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      className={`btn btn-sm ${orgFilter === org.id ? 'btn-pri' : 'btn-sec'}`}
                      onClick={() => setOrgFilter(org.id)}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              ) : null}

              <span className="seg" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={convFilter === 'unread' ? 'on' : undefined}
                  style={{ flex: 1, padding: '0 8px' }}
                  onClick={() => setConvFilter('unread')}
                >
                  Unread
                  {unreadCount > 0 ? (
                    <span
                      className="bdg bdg-b"
                      style={{ padding: '0 5px', fontSize: 10 }}
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className={convFilter === 'all' ? 'on' : undefined}
                  style={{ flex: 1, padding: '0 8px' }}
                  onClick={() => setConvFilter('all')}
                >
                  All
                </button>
              </span>
            </div>

            <div className="conv-scroll">
              {filteredConversations.length === 0 ? (
                <div className="empty" style={{ padding: '32px 16px' }}>
                  <div className="es">
                    {conversationsList.length === 0
                      ? 'No conversations yet'
                      : q
                        ? `No matches for "${debouncedSearch.trim()}"`
                        : 'No conversations in this filter'}
                  </div>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isOpening = openingUserId === conversation.user_id;
                  const isActive = selected?.user_id === conversation.user_id;
                  const fullName =
                    conversation.first_name && conversation.last_name
                      ? `${conversation.first_name} ${conversation.last_name}`
                      : conversation.first_name ||
                        conversation.last_name ||
                        'Unknown';

                  return (
                    <button
                      key={conversation.user_id}
                      type="button"
                      className={`conv${isActive ? ' on' : ''}`}
                      onClick={() => void handleSelectConversation(conversation)}
                      {...getConversationPreheatHandlers(conversation.chat_id)}
                      disabled={isOpening}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      {isOpening ? (
                        <span
                          className="av av-36 av-t1"
                          style={{ width: 36, height: 36 }}
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                        </span>
                      ) : (
                        <HtmlAvatar
                          name={fullName}
                          src={conversation.avatar_url}
                          size={36}
                        />
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="row" style={{ gap: 8 }}>
                          <span className="cn">{fullName}</span>
                          <span className="sp ct2">
                            {formatConvTime(conversation.last_message_at)}
                          </span>
                        </span>
                        <span
                          className="cp"
                          style={{
                            display: 'block',
                            color: 'var(--text-faint)',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            letterSpacing: '.03em',
                            textTransform: 'uppercase',
                            marginTop: 1,
                          }}
                        >
                          {conversation.organization_name}
                        </span>
                        <span className="cp" style={{ display: 'block' }}>
                          {conversation.last_message_content ?? 'No messages yet'}
                        </span>
                      </span>
                      {conversation.unread_count > 0 ? (
                        <span className="ub" aria-hidden />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="thread">
            {selected?.chat_id ? (
              <MessagesChatThread
                chatId={selected.chat_id}
                conversation={selected}
                onMarkedAsSeen={() => {
                  queryClient.setQueryData<ConversationItem[]>(
                    ['messages', 'conversations'],
                    (prev) =>
                      (prev ?? []).map((item) =>
                        item.user_id === selected.user_id
                          ? { ...item, unread_count: 0 }
                          : item,
                      ),
                  );
                }}
              />
            ) : openingUserId ? (
              <div className="empty" style={{ flex: 1 }}>
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
                <div className="es" style={{ marginTop: 12 }}>
                  Opening chat…
                </div>
              </div>
            ) : (
              <div className="empty" style={{ flex: 1 }}>
                <div className="ei">
                  <Icon name="MessageSquare" size={24} />
                </div>
                <div className="et">Select a conversation</div>
                <div className="es">
                  Choose a member from the list to view and reply.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
