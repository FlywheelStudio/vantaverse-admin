'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { UserCard } from '@/components/ui/user-card';
import { Button } from '@/components/ui/button';
import type {
  DashboardStatusCounts,
  DashboardStatusUser,
  UserNeedingAttention,
} from '@/lib/supabase/queries/dashboard';

export type StatusFilter =
  | 'pending'
  | 'invited'
  | 'active'
  | 'noProgram'
  | 'inProgram'
  | 'programCompleted';

type StatusCountsWithProgramCompleted = DashboardStatusCounts & {
  programCompleted?: number;
};

const FILTER_LABELS: Record<StatusFilter, string> = {
  pending: 'Pending',
  invited: 'Invited',
  active: 'Active',
  noProgram: 'No program',
  inProgram: 'In program',
  programCompleted: 'Program completed',
};

const BADGES: { key: StatusFilter; countKey: keyof StatusCountsWithProgramCompleted; label: string }[] = [
  { key: 'pending', countKey: 'pending', label: 'Pending' },
  { key: 'invited', countKey: 'invited', label: 'Invited' },
  { key: 'active', countKey: 'active', label: 'Active' },
  { key: 'noProgram', countKey: 'noProgram', label: 'No program' },
  { key: 'inProgram', countKey: 'inProgram', label: 'In program' },
  { key: 'programCompleted', countKey: 'programCompleted', label: 'Program completed' },
];

function complianceBadgeClass(compliance: number): string {
  const pct = Math.round(compliance);
  if (pct >= 100) return 'bg-emerald-600 text-white';
  if (pct >= 90) return 'bg-emerald-400 text-emerald-900';
  if (pct >= 80) return 'bg-emerald-200 text-emerald-800';
  return 'bg-emerald-100 text-emerald-800';
}

export function StatusCountsCard({
  counts,
  usersByFilter,
}: {
  counts: StatusCountsWithProgramCompleted;
  usersByFilter: {
    pending: DashboardStatusUser[];
    invited: DashboardStatusUser[];
    active: DashboardStatusUser[];
    noProgram: DashboardStatusUser[];
    inProgram: DashboardStatusUser[];
    programCompleted: UserNeedingAttention[];
  };
}) {
  const router = useRouter();
  const [showList, setShowList] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState<StatusFilter | null>(null);
  const [search, setSearch] = React.useState('');

  const users = selectedFilter ? usersByFilter[selectedFilter] : [];
  const isProgramCompleted = selectedFilter === 'programCompleted';
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

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleBadgeClick = (filter: StatusFilter) => {
    setSelectedFilter(filter);
    setShowList(true);
    setSearch('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!showList ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
                <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
                  <span className="text-2xl">Member</span>{' '}
                  <span className="text-2xl font-semibold text-foreground">
                    Status
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-center align-middle min-h-0 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {BADGES.slice(0, 3).map(({ key, countKey, label }, i) => (
                    <motion.div
                      key={key}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.98 }}  
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/90 border border-border/60 shadow-(--shadow-sm) cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/20"
                      onClick={() => handleBadgeClick(key)}
                    >
                      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {counts[countKey]}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1 font-medium">
                        {label}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {BADGES.slice(3, 5).map(({ key, countKey, label }, i) => (
                    <motion.div
                      key={key}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25, delay: (3 + i) * 0.05 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/90 border border-border/60 shadow-(--shadow-sm) cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/20"
                      onClick={() => handleBadgeClick(key)}
                    >
                      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {counts[countKey]}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1 font-medium">
                        {label}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4 justify-center align-middle">
                  {BADGES.slice(5, 6).map(({ key, countKey, label }, i) => (
                    <motion.div
                      key={key}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25, delay: (5 + i) * 0.05 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-[50%] justify-self-center flex flex-col items-center justify-center p-4 rounded-lg bg-muted/90 border border-border/60 shadow-(--shadow-sm) cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/20"
                      onClick={() => handleBadgeClick(key)}
                    >
                      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {counts[countKey] ?? 0}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1 font-medium">
                        {label}
                      </span>
                    </motion.div>
                  ))}
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
                  {selectedFilter ? FILTER_LABELS[selectedFilter] : ''}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowList(false);
                    setSelectedFilter(null);
                  }}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Back
                </Button>
              </CardHeader>
              <CardContent className="p-5 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="relative w-full min-w-0 mt-0.5 mb-4 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-10 bg-card/90 shadow-sm border-border/60 rounded-md text-sm"
                  />
                </div>
                {users.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
                    No users in this category.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
                    No matches for &quot;{search.trim()}&quot;.
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
                    <div className="space-y-3 min-w-0 w-full overflow-hidden">
                      {filtered.map((u, i) => (
                        <div
                          key={u.user_id}
                          className="cursor-pointer"
                          onClick={() => handleUserClick(u.user_id)}
                        >
                          <UserCard
                            user={u}
                            index={i}
                            action={
                              isProgramCompleted && 'compliance' in u ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-semibold px-2 py-1 rounded-full ${complianceBadgeClass((u as UserNeedingAttention).compliance)}`}
                                  >
                                    {Math.round((u as UserNeedingAttention).compliance)}%
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )
                            }
                          />
                        </div>
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
