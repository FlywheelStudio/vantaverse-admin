'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BookPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import type { UserWithoutProgram } from './actions';

export function UsersWithoutProgramCard({ users }: { users: UserWithoutProgram[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalUserId, setModalUserId] = React.useState<string | null>(null);

  const handleAssignSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
    setModalUserId(null);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="h-full"
    >
      <Card className="h-full min-h-0 flex flex-col gap-y-0 overflow-hidden">
      <CardHeader className="p-3 shrink-0">
        <CardTitle className="text-[#1E3A5F]">Members without a program</CardTitle>
      </CardHeader>
      <CardContent className="pb-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
            No users without a program.
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
            <div className="space-y-2 min-w-0 w-full overflow-hidden">
              {users.map((u) => {
                const fullName =
                  u.first_name && u.last_name
                    ? `${u.first_name} ${u.last_name}`
                    : u.first_name || u.last_name || 'Unknown';

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
                              onClick={() => setModalUserId(u.user_id)}
                              className="text-[#64748B] hover:text-[#1E3A5F] cursor-pointer transition-colors"
                            >
                              <BookPlus className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to assign program</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <AssignProgramModal
                      open={modalUserId === u.user_id}
                      onOpenChange={(open) =>
                        setModalUserId(open ? u.user_id : null)
                      }
                      userId={u.user_id}
                      onAssignSuccess={handleAssignSuccess}
                      userFirstName={u.first_name}
                      userLastName={u.last_name}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}
