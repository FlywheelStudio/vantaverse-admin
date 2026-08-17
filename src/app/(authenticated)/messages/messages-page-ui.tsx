'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Avatar,
  Card,
  Icon,
  Input,
} from '@/components/medvanta';
import { ChatInterface } from '@/app/(authenticated)/users/[id]/partials/chat-interface';
import { getOrCreateChatForPatient } from '@/app/(authenticated)/users/[id]/chat-actions';
import { getConversationsForAdmin } from './actions';
import { useDebounce } from '@/hooks/use-debounce';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';
import { cn } from '@/lib/utils';
import NextLink from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatMessageTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return format(d, 'EEEE');
  return format(d, 'MMM d');
}

type FilterType = 'all' | { type: 'org'; orgId: string };

interface MessagesPageUIProps {
  organizations: Array<{ id: string; name: string }>;
  conversations: ConversationItem[];
}

export function MessagesPageUI({
  organizations,
  conversations,
}: MessagesPageUIProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<{
    chatId: string;
    patientName: string;
    organizationId: string;
    userId: string;
  } | null>(null);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: conversationsData } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const result = await getConversationsForAdmin();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: conversations,
  });
  const conversationsList = conversationsData ?? conversations;

  const q = debouncedSearch.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    let list = conversationsList;

    if (filter !== 'all' && filter.type === 'org') {
      list = list.filter((c) => c.organization_id === filter.orgId);
    }

    if (q) {
      list = list.filter((c) => {
        const fn = (c.first_name ?? '').toLowerCase();
        const ln = (c.last_name ?? '').toLowerCase();
        const fullName = `${fn} ${ln}`.trim();
        const em = (c.email ?? '').toLowerCase();
        const org = (c.organization_name ?? '').toLowerCase();
        return (
          fn.includes(q) ||
          ln.includes(q) ||
          fullName.includes(q) ||
          em.includes(q) ||
          org.includes(q)
        );
      });
    }

    return list;
  }, [conversationsList, filter, q]);

  const orgCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of conversationsList) {
      counts.set(c.organization_id, (counts.get(c.organization_id) ?? 0) + 1);
    }
    return counts;
  }, [conversationsList]);

  const handleSelectConversation = async (c: ConversationItem) => {
    if (openingUserId) return;

    const patientName =
      c.first_name && c.last_name
        ? `${c.first_name} ${c.last_name}`
        : c.first_name || c.last_name || 'Patient';

    if (c.chat_id) {
      setSelected({
        chatId: c.chat_id,
        patientName,
        organizationId: c.organization_id,
        userId: c.user_id,
      });
      return;
    }

    setOpeningUserId(c.user_id);
    try {
      const result = await getOrCreateChatForPatient(
        c.organization_id,
        c.user_id,
      );
      if (!result.success) {
        toast(result.error || 'Failed to open chat');
        return;
      }
      setSelected({
        chatId: result.data.chatId,
        patientName,
        organizationId: c.organization_id,
        userId: c.user_id,
      });
    } catch (e) {
      console.error(e);
      toast('Failed to open chat');
    } finally {
      setOpeningUserId(null);
    }
  };

  const handleCloseChat = () => {
    if (openingUserId) return;
    setSelected(null);
  };

  const isFilterActive = (f: FilterType) => {
    if (f === 'all' && filter === 'all') return true;
    if (f !== 'all' && filter !== 'all' && f.type === 'org' && filter.type === 'org')
      return f.orgId === filter.orgId;
    return false;
  };

  return (
    <Card padding={0} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            'flex min-w-0 shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)]',
            'w-[320px] max-w-[320px]',
          )}
        >
          <div className="shrink-0 space-y-2 p-4">
            <Input
              type="search"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              iconLeft="Search"
            />

            <div className="slim-scrollbar -mx-1 w-full overflow-x-auto overflow-y-hidden px-1 pb-2">
              <div className="flex w-max min-w-0 gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-[var(--radius-pill)] border px-3 py-1 text-[length:var(--text-sm)] font-[var(--fw-medium)] transition-colors',
                    isFilterActive('all')
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text-inverse)]'
                      : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-body)] hover:bg-[var(--bg-subtle)]',
                  )}
                >
                  All
                </button>
                {organizations.length > 0 ? (
                  organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setFilter({ type: 'org', orgId: org.id })}
                      className={cn(
                        'shrink-0 cursor-pointer whitespace-nowrap rounded-[var(--radius-pill)] border px-3 py-1 text-[length:var(--text-sm)] font-[var(--fw-medium)] transition-colors',
                        isFilterActive({ type: 'org', orgId: org.id })
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text-inverse)]'
                          : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-body)] hover:bg-[var(--bg-subtle)]',
                      )}
                    >
                      {org.name} ({orgCounts.get(org.id) ?? 0})
                    </button>
                  ))
                ) : (
                  <span className="flex h-7 shrink-0 items-center justify-center px-3 text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-muted)]">
                    No groups assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="messages-conversations-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="slim-scrollbar min-h-0 min-w-0 flex-1">
              <div className="w-full min-w-0 space-y-1 px-2 pb-2 pt-2.5">
                {filteredConversations.length === 0 ? (
                  <div className="py-8 text-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    {conversationsList.length === 0
                      ? 'No conversations yet'
                      : q
                        ? `No matches for "${debouncedSearch.trim()}"`
                        : 'No conversations in this filter'}
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isOpening = openingUserId === c.user_id;
                    const isSelected = selected?.userId === c.user_id;
                    const fullName =
                      c.first_name && c.last_name
                        ? `${c.first_name} ${c.last_name}`
                        : c.first_name || c.last_name || 'Unknown';

                    return (
                      <button
                        key={c.user_id}
                        type="button"
                        onClick={() => handleSelectConversation(c)}
                        disabled={!!openingUserId}
                        className={cn(
                          'w-full min-w-0 cursor-pointer rounded-[var(--radius-sm)] p-3 text-left transition-colors',
                          'hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected && 'bg-[var(--navy-50)] ring-1 ring-[var(--border-default)]',
                        )}
                      >
                        <div className="flex min-w-0 gap-3">
                          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-visible">
                            {isOpening ? (
                              <Icon
                                name="LoaderCircle"
                                size={20}
                                className="animate-spin text-[var(--text-muted)]"
                              />
                            ) : (
                              <>
                                <Avatar
                                  name={fullName}
                                  src={c.avatar_url ?? undefined}
                                  size="md"
                                />
                                {c.unread_count > 0 ? (
                                  <span
                                    aria-hidden
                                    className="absolute -right-0.5 -top-0.5 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--danger)] bg-[var(--surface-card)] px-1 text-[10px] font-[var(--fw-semibold)] leading-none text-[var(--danger)] shadow-[var(--shadow-sm)]"
                                  >
                                    {c.unread_count}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="truncate text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-strong)]">
                              {fullName}
                            </div>
                            <div className="mt-0.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[length:var(--text-xs)] text-[var(--text-muted)]">
                              {c.last_message_content ?? 'No messages yet'}
                            </div>
                            <div className="mt-1.5 flex min-w-0 items-center gap-2 overflow-hidden">
                              <span className="shrink-0 text-[length:var(--text-xs)] text-[var(--text-muted)]">
                                {formatMessageTime(c.last_message_at)}
                              </span>
                              {c.program_name && c.program_assignment_id ? (
                                <NextLink
                                  href={`/builder/${c.program_assignment_id}?from=messages`}
                                  className="block min-w-0 flex-1 cursor-pointer truncate text-[length:var(--text-xs)] text-[var(--text-body)] no-underline hover:text-[var(--primary)] hover:underline"
                                >
                                  {c.program_name}
                                </NextLink>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {selected ? (
            <div className="mv-messages-plain-compose flex min-h-0 flex-1 p-4 [&_.border-t>div.flex>button.self-end:first-of-type]:hidden [&_input[type=file]]:hidden">
              <ChatInterface
                chatId={selected.chatId}
                patientName={selected.patientName}
                onClose={handleCloseChat}
                onMarkedAsSeen={() =>
                  queryClient.invalidateQueries({
                    queryKey: ['messages', 'conversations'],
                  })
                }
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
