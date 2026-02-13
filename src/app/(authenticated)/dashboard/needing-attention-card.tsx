'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronRight, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

function UserAttentionRow({
  user,
  onClick,
}: {
  user: UserNeedingAttention;
  onClick: () => void;
}) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown';
  const relativeTime = user.last_sign_in
    ? formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: false })
    : null;

  return (
    <div
      className="flex items-center gap-3 py-2.5 -mx-1 px-1 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="size-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-primary/10">
        <Avatar src={user.avatar_url} firstName={user.first_name ?? ''} lastName={user.last_name ?? ''} userId={user.user_id} size={36} className="size-full" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate" title={name}>{name}</span>
        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {relativeTime && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">Active {relativeTime} ago</span>
        )}
        <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">
          {Math.round(user.compliance)}%
        </span>
      </div>
    </div>
  );
}

export function NeedingAttentionCard({
  data
}: {
  data: { users: UserNeedingAttention[]; total: number };
}) {
  const router = useRouter();
  const [showList, setShowList] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const top3 = React.useMemo(
    () => [...data.users].sort((a, b) => a.compliance - b.compliance).slice(0, 3),
    [data.users]
  );

  const q = search.trim().toLowerCase();
  const filtered = !q
    ? data.users
    : data.users.filter((u) => {
        const fn = (u.first_name ?? '').toLowerCase();
        const ln = (u.last_name ?? '').toLowerCase();
        const fullName = `${fn} ${ln}`.trim();
        const em = (u.email ?? '').toLowerCase();
        return fn.includes(q) || ln.includes(q) || fullName.includes(q) || em.includes(q);
      });

  const handleUserClick = (userId: string) => router.push(`/users/${userId}`);

  const alertRow = (
    <div className="px-5 pb-2 shrink-0">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-destructive/10 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl font-bold text-destructive tabular-nums">{data.total}</span>
          <span className="text-sm text-foreground">Users with low compliance</span>
          <span className="relative shrink-0 flex items-center justify-center" aria-hidden>
            <span className="absolute inset-0 w-5 h-5 rounded-full bg-destructive/30 opacity-75 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <AlertCircle className="relative w-4 h-4 text-destructive" />
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col overflow-hidden relative group">
        <AnimatePresence mode="wait">
          {!showList ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col cursor-pointer min-h-0"
              onClick={() => setShowList(true)}
            >
              <CardHeader className="px-5 py-4 shrink-0 gap-0">
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                  Needs Attention
                </CardTitle>
              </CardHeader>
              {alertRow}
              <CardContent className="p-5 pt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                {top3.length > 0 ? (
                  <div className="space-y-0 min-w-0 w-full">
                    {top3.map((u) => (
                      <div key={u.user_id} onClick={(e) => e.stopPropagation()}>
                        <UserAttentionRow user={u} onClick={() => handleUserClick(u.user_id)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No users need attention.
                  </div>
                )}
                <div className="absolute bottom-4 right-5 text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View all {data.total} users <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground tracking-tight">
                  Needs Attention
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowList(false)}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Back
                </Button>
              </CardHeader>
              {alertRow}
              <CardContent className="p-5 pt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="relative w-full min-w-0 mb-3 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-10 bg-card border rounded-md text-sm"
                  />
                </div>
                {data.users.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No users need attention.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No matches for &quot;{search.trim()}&quot;.
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
                    <div className="space-y-0 min-w-0 w-full">
                      {filtered.map((u) => (
                        <UserAttentionRow key={u.user_id} user={u} onClick={() => handleUserClick(u.user_id)} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
