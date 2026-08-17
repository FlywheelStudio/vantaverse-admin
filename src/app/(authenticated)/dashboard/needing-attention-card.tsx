'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Icon,
  Input,
  StatCard,
} from '@/components/medvanta';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

function UserAttentionRow({
  user,
  onClick,
}: {
  user: UserNeedingAttention;
  onClick: () => void;
}): React.ReactElement {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown';
  const relativeTime = user.last_sign_in
    ? formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: false })
    : null;

  return (
    <div
      className="-mx-1 flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-1 py-2.5 transition-colors hover:bg-[var(--bg-subtle)]"
      onClick={onClick}
    >
      <Avatar name={name} src={user.avatar_url ?? undefined} size="md" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="truncate text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-strong)]"
          title={name}
        >
          {name}
        </span>
        <span className="truncate text-[length:var(--text-xs)] text-[var(--text-muted)]">
          {user.email}
        </span>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-2">
        {relativeTime ? (
          <span className="whitespace-nowrap text-[length:var(--text-xs)] text-[var(--text-muted)]">
            Active {relativeTime} ago
          </span>
        ) : null}
        <Badge tone="danger">{Math.round(user.compliance)}%</Badge>
      </div>
    </div>
  );
}

export function NeedingAttentionCard({
  data,
}: {
  data: { users: UserNeedingAttention[]; total: number };
}): React.ReactElement {
  const router = useRouter();
  const [showList, setShowList] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const top3 = React.useMemo(
    () => [...data.users].sort((a, b) => a.compliance - b.compliance).slice(0, 3),
    [data.users],
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

  const handleUserClick = (userId: string): void => {
    router.push(`/users/${userId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="min-w-0 flex-1"
    >
      <Card padding={0} className="group relative flex h-full min-h-0 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!showList ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 flex-1 cursor-pointer flex-col"
              onClick={() => setShowList(true)}
            >
              <div className="shrink-0 px-5 pt-5">
                <CardHeader title="Needs Attention" className="mb-0" />
              </div>
              <div className="shrink-0 px-5 pb-2 pt-2">
                <StatCard
                  label="Users with low compliance"
                  value={data.total}
                  icon="AlertCircle"
                  accent="var(--danger)"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-0">
                {top3.length > 0 ? (
                  <div className="min-w-0 w-full space-y-0 p-2">
                    {top3.map((u) => (
                      <div key={u.user_id} onClick={(e) => e.stopPropagation()}>
                        <UserAttentionRow user={u} onClick={() => handleUserClick(u.user_id)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    No users need attention.
                  </div>
                )}
                <div className="absolute bottom-4 right-5 flex items-center gap-1 text-[length:var(--text-xs)] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                  View all {data.total} users
                  <Icon name="ChevronRight" size={12} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-5">
                <div className="my-3 flex shrink-0 items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    iconLeft="Search"
                    className="min-w-0 flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => setShowList(false)}>
                    Back
                  </Button>
                </div>
                {data.users.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    No users need attention.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    No matches for &quot;{search.trim()}&quot;.
                  </div>
                ) : (
                  <ScrollArea className="slim-scrollbar min-h-0 flex-1 pr-2">
                    <div className="min-w-0 w-full space-y-0 p-2">
                      {filtered.map((u) => (
                        <UserAttentionRow
                          key={u.user_id}
                          user={u}
                          onClick={() => handleUserClick(u.user_id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
