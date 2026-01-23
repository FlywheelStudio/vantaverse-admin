'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
      className="h-full"
    >
      <Card className="h-full min-h-0 flex flex-col gap-y-0 overflow-hidden">
      {!chatView && (
        <CardHeader className="p-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#1E3A5F]">Quick chat</CardTitle>
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                type="search"
                placeholder="Name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 bg-white/80 border-[#E2E8F0]"
              />
            </div>
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
        <CardContent className="pb-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          {users.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
              No users to chat with (with program and group).
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
              No matches for &quot;{search.trim()}&quot;.
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
              <div className="space-y-2 min-w-0 w-full overflow-hidden">
                {filtered.map((u) => {
                  const fullName =
                    u.first_name && u.last_name
                      ? `${u.first_name} ${u.last_name}`
                      : u.first_name || u.last_name || 'Unknown';

                  const isOpening = openingUserId === u.user_id;

                  return (
                    <div key={u.user_id} className="min-w-0 overflow-hidden">
                      <div className="flex items-center gap-3 rounded-lg border bg-white/50 px-3 py-2 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                          <div className="size-10 shrink-0 flex items-center justify-center">
                            <Avatar
                              src={u.avatar_url}
                              firstName={u.first_name || ''}
                              lastName={u.last_name || ''}
                              userId={u.user_id}
                              size={40}
                            />
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-medium text-sm text-[#1E3A5F] truncate">
                              {fullName}
                            </div>
                            {u.email ? (
                              <div className="text-xs text-[#64748B] truncate">
                                {u.email}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleOpenChat(u)}
                                disabled={!!openingUserId}
                                className="text-[#64748B] hover:text-[#1E3A5F] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </div>
                      </div>
                    </div>
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

