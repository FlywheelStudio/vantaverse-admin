'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendBulkInvitations } from '@/app/(authenticated)/users/actions';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { StatusCountsListPanel } from '@/app/(authenticated)/dashboard/status-counts-list-panel';
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
  if (pct >= 50) return 'bg-yellow-200 text-yellow-800';
  if (pct >= 25) return 'bg-orange-200 text-orange-800';
  return 'bg-red-200 text-red-800';
}

type InvitationResult = { success: boolean; email: string; error?: string };

function getSuccessfulInvitationUserIds(
  results: InvitationResult[],
  usersWithEmail: DashboardStatusUser[],
): string[] {
  const successfulEmails = new Set(
    results.filter((r) => r.success).map((r) => r.email),
  );
  return usersWithEmail
    .filter((u) => u.email && successfulEmails.has(u.email))
    .map((u) => u.user_id);
}

function showInvitationResultToasts(results: InvitationResult[]): void {
  const failed = results.filter((r) => !r.success).length;
  const successCount = results.filter((r) => r.success).length;
  if (successCount > 0) {
    toast.success(
      successCount === 1
        ? 'Invitation sent'
        : `Sent ${successCount} invitation${successCount > 1 ? 's' : ''}${failed > 0 ? `; ${failed} failed` : ''}`,
    );
  } else {
    const err = results.find((r) => !r.success);
    toast.error(err?.error ?? `All ${failed} invitation${failed > 1 ? 's' : ''} failed`);
  }
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
  const [showList, setShowList] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter | null>(null);
  const [search, setSearch] = useState('');
  const [optimisticallyInvitedIds, setOptimisticallyInvitedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [sendingBulkInvites, setSendingBulkInvites] = useState(false);
  const [assignProgramUser, setAssignProgramUser] = useState<DashboardStatusUser | null>(null);

  const rawUsers = selectedFilter ? usersByFilter[selectedFilter] : [];
  const users =
    selectedFilter === 'pending'
      ? rawUsers.filter((u) => !optimisticallyInvitedIds.has(u.user_id))
      : rawUsers;

  const isProgramCompleted = selectedFilter === 'programCompleted';
  const isPending = selectedFilter === 'pending';
  const isNoProgram = selectedFilter === 'noProgram';
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

  const handleSendInvitations = useCallback(
    async (usersToInvite: DashboardStatusUser[]) => {
      const withEmail = usersToInvite.filter((u) => u.email?.trim());
      const emails = withEmail.map((u) => u.email!);
      if (emails.length === 0) return;

      setSendingBulkInvites(true);
      try {
        const result = await sendBulkInvitations(emails, false);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        const idsToAdd = getSuccessfulInvitationUserIds(
          result.data.results,
          withEmail,
        );
        if (idsToAdd.length > 0) {
          setOptimisticallyInvitedIds((prev) => {
            const next = new Set(prev);
            idsToAdd.forEach((id) => next.add(id));
            return next;
          });
        }
        showInvitationResultToasts(result.data.results);
      } catch (err) {
        console.error(err);
        toast.error('Failed to send invitation' + (withEmail.length > 1 ? 's' : ''));
      } finally {
        setSendingBulkInvites(false);
      }
    },
    [],
  );

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
              <StatusCountsListPanel
                title={selectedFilter ? FILTER_LABELS[selectedFilter] : ''}
                onBack={() => {
                  setShowList(false);
                  setSelectedFilter(null);
                }}
                search={search}
                onSearchChange={setSearch}
                usersLength={users.length}
                filteredLength={filtered.length}
                searchTrim={search.trim()}
                filtered={filtered}
                isPending={isPending}
                isNoProgram={isNoProgram}
                isProgramCompleted={isProgramCompleted}
                sendingBulkInvites={sendingBulkInvites}
                onSendInvitations={handleSendInvitations}
                onUserClick={handleUserClick}
                onAssignProgram={setAssignProgramUser}
                complianceBadgeClass={complianceBadgeClass}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {assignProgramUser && (
        <AssignProgramModal
          open={assignProgramUser !== null}
          onOpenChange={(open) => {
            if (!open) setAssignProgramUser(null);
          }}
          userId={assignProgramUser.user_id}
          userFirstName={assignProgramUser.first_name ?? undefined}
          userLastName={assignProgramUser.last_name ?? undefined}
          fromPath="/"
          onAssignSuccess={() => {
            router.refresh();
            setAssignProgramUser(null);
          }}
        />
      )}
    </motion.div>
  );
}
