'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCard } from '@/components/ui/user-card';
import { Input } from '@/components/ui/input';
import { AssignGroupModal } from '@/app/(authenticated)/users/[id]/partials/assign-group-modal';

type OrgUnassignedUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export function QuickTakeActionCard({ users }: { users: OrgUnassignedUser[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalUserId, setModalUserId] = React.useState<string | null>(null);
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

  const handleAssignSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setModalUserId(null);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
          <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
            <span className="text-2xl">Assign to a</span>{' '}
            <span className="text-2xl font-semibold text-foreground">
              group
            </span>
          </CardTitle>
        </CardHeader>
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
              No unassigned users.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
              No matches for &quot;{search.trim()}&quot;.
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
              <div className="space-y-3 min-w-0 w-full overflow-hidden">
                {filtered.map((u, i) => (
                  <div key={u.user_id}>
                    <UserCard
                      user={u}
                      index={i}
                      action={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setModalUserId(u.user_id)}
                              className="cursor-pointer rounded-[var(--radius-md)] p-2 text-muted-foreground hover:text-primary hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <UserPlus className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Assign group</p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    />
                    <AssignGroupModal
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
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

