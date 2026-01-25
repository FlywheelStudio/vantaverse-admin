'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCard } from '@/components/ui/user-card';
import { Input } from '@/components/ui/input';
import { ChatInterface } from '@/app/(authenticated)/users/[id]/partials/chat-interface';
import { getOrCreateChatForPatient } from '@/app/(authenticated)/users/[id]/chat-actions';
import type { UserWithProgramAndGroup } from './actions';

export function UsersWithProgramAndGroupCard({
  users,
}: {
  users: UserWithProgramAndGroup[];
}) {
  const [chatView, setChatView] = React.useState<{
    chatId: string;
    patientName: string;
  } | null>(null);
  const [openingUserId, setOpeningUserId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const q = search.trim().toLowerCase();
  const filtered =
    !q
      ? users
      : users.filter((u) => {
        const fn = (u.first_name ?? '').toLowerCase();
        const ln = (u.last_name ?? '').toLowerCase();
        const fullName = `${fn} ${ln}`.trim();
        const em = (u.email ?? '').toLowerCase();
        return fn.includes(q) || ln.includes(q) || fullName.includes(q) || em.includes(q);
      });

  const handleCloseChat = () => {
    if (openingUserId) return;
    setChatView(null);
  };

  const handleOpenChat = async (u: UserWithProgramAndGroup) => {
    if (openingUserId) return;

    const fullName =
      u.first_name && u.last_name
        ? `${u.first_name} ${u.last_name}`
        : u.first_name || u.last_name || 'Patient';

    setOpeningUserId(u.user_id);

    try {
      const result = await getOrCreateChatForPatient(u.organization_id, u.user_id);

      if (!result.success) {
        toast(result.error || 'Failed to open chat');
        return;
      }

      setChatView({
        chatId: result.data.chatId,
        patientName: fullName,
      });
    } catch (e) {
      console.error(e);
      toast('Failed to open chat');
    } finally {
      setOpeningUserId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        {!chatView && (
          <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
                <span className="text-2xl font-semibold text-foreground">Quick chat</span>
              </CardTitle>
            </div>
          </CardHeader>
        )}

        {chatView ? (
          <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
            <ChatInterface
              chatId={chatView.chatId}
              patientName={chatView.patientName}
              onClose={handleCloseChat}
            />
          </CardContent>
        ) : (
          <CardContent className="p-5 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="relative w-full min-w-0 mt-0.5 mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10 bg-card/90 shadow-[var(--shadow-sm)] border-border/60 rounded-[var(--radius-md)] text-sm"
              />
            </div>
            {users.length === 0 ? (
<div className="flex-1 flex items-center justify-center text-sm text-dimmed">
              No users to chat with (with program and group).
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
                No matches for &quot;{search.trim()}&quot;.
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
                <div className="space-y-3 min-w-0 w-full overflow-hidden">
                  {filtered.map((u, i) => {
                    const isOpening = openingUserId === u.user_id;
                    return (
                      <UserCard
                        key={u.user_id}
                        user={u}
                        index={i}
                        action={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleOpenChat(u)}
                                disabled={!!openingUserId}
                                className="cursor-pointer rounded-[var(--radius-md)] p-2 text-muted-foreground hover:text-primary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {isOpening ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <MessageCircle className="h-5 w-5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open chat</p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

