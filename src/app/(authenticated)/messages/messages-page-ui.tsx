'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Search } from 'lucide-react';
import NextLink from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInterface } from '@/app/(authenticated)/users/[id]/partials/chat-interface';
import { getOrCreateChatForPatient } from '@/app/(authenticated)/users/[id]/chat-actions';
import { getConversationsForAdmin } from './actions';
import { useDebounce } from '@/hooks/use-debounce';
import type { ConversationItem } from '@/lib/supabase/queries/conversations';
import { cn } from '@/lib/utils';

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
    <Card className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <CardContent className="p-0 flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          <div
            className={cn(
              'flex flex-col border-r border-border shrink-0 min-w-0 overflow-hidden',
              'w-[320px] max-w-[320px]',
            )}
          >
        <div className="p-4 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10 rounded-md bg-background"
            />
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'shrink-0 h-7 px-3 rounded-full text-sm font-medium transition-colors cursor-pointer',
                  'border',
                  isFilterActive('all')
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted/60',
                )}
              >
                All
              </button>
              {organizations.length > 0 ? organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setFilter({ type: 'org', orgId: org.id })}
                  className={cn(
                    'shrink-0 h-7 px-3 rounded-full text-sm font-medium transition-colors cursor-pointer',
                    'border',
                    isFilterActive({ type: 'org', orgId: org.id })
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted/60',
                  )}
                >
                  {org.name} ({orgCounts.get(org.id) ?? 0})
                </button>
              )) : (
                <div className="flex shrink-0 h-7 px-3 text-sm font-medium text-muted-foreground text-center items-center justify-center">
                  No groups assigned
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="messages-conversations-scroll flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0 min-w-0 slim-scrollbar">
            <div className="p-2 space-y-1 w-full min-w-0">
            {filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {conversationsList.length === 0
                  ? 'No conversations yet'
                  : q
                    ? `No matches for "${debouncedSearch.trim()}"`
                    : 'No conversations in this filter'}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isOpening = openingUserId === c.user_id;
                const isSelected =
                  selected?.userId === c.user_id;
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
                      'w-full min-w-0 text-left rounded-lg p-3 transition-colors cursor-pointer overflow-hidden',
                      'hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed',
                      isSelected && 'bg-muted/80 ring-1 ring-border/60',
                    )}
                  >
                    <div className="flex gap-3 min-w-0 overflow-hidden">
                      <div className="size-10 shrink-0 flex items-center justify-center">
                        {isOpening ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <Avatar
                            src={c.avatar_url}
                            firstName={c.first_name ?? ''}
                            lastName={c.last_name ?? ''}
                            userId={c.user_id}
                            size={40}
                            disableNavigation
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-highlighted truncate">
                          {fullName}
                        </div>
                        <div className="text-xs text-dimmed mt-0.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {c.last_message_content ?? 'No messages yet'}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 min-w-0 overflow-hidden">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatMessageTime(c.last_message_at)}
                          </span>
                          {c.unread_count > 0 && (
                            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-red-500 px-1 text-[10px] font-semibold leading-none text-red-500">
                              {c.unread_count}
                            </span>
                          )}
                          {c.program_name && c.program_assignment_id && (
                            <NextLink
                              href={`/builder/${c.program_assignment_id}?from=messages`}
                              className="text-xs text-foreground no-underline hover:underline hover:text-primary cursor-pointer truncate min-w-0 flex-1 block"
                            >
                              {c.program_name}
                            </NextLink>
                          )}
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

          <div className="flex-1 min-w-0 flex flex-col">
            {selected ? (
              <div className="flex-1 min-h-0 p-4">
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
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
