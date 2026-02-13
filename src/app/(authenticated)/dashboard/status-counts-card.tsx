'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendBulkInvitations } from '@/app/(authenticated)/users/actions';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { StatusCountsListPanel } from '@/app/(authenticated)/dashboard/status-counts-list-panel';
import { cn } from '@/lib/utils';
import type {
  DashboardStatusCounts,
  DashboardStatusUser,
  UserNeedingAttention,
} from '@/lib/supabase/queries/dashboard';

type StatusFilter =
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

const BADGES: { key: StatusFilter; countKey: keyof StatusCountsWithProgramCompleted; label: string; colorClass?: string }[] = [
  { key: 'active', countKey: 'active', label: 'Active', colorClass: 'text-emerald-500' },
  { key: 'pending', countKey: 'pending', label: 'Pending', colorClass: 'text-orange-500' },
  { key: 'invited', countKey: 'invited', label: 'Invited', colorClass: 'text-violet-500' },
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
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('active');
  const [search, setSearch] = useState('');
  const [optimisticallyInvitedIds, setOptimisticallyInvitedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [sendingBulkInvites, setSendingBulkInvites] = useState(false);
  const [assignProgramUser, setAssignProgramUser] = useState<DashboardStatusUser | null>(null);

  const totalCount = new Set(
    Object.values(usersByFilter).flat().map((u) => u.user_id)
  ).size;

  const rawUsers = selectedFilter ? usersByFilter[selectedFilter] : [];
  const users =
    selectedFilter === 'pending'
      ? rawUsers.filter((u) => !optimisticallyInvitedIds.has(u.user_id))
      : rawUsers;

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
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex-1 min-w-0 pb-2"
    >
      <Card className="h-full min-h-[500px] flex flex-col overflow-hidden gap-0">
        {/* Header */}
        <div className="px-5 py-4 shrink-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Member Status</h2>
        </div>

        {/* Summary cards: 50% each */}
        <div className="grid grid-cols-2 gap-3 shrink-0 px-5 pb-5">
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums block">
              {counts.active}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Active members</span>
          </div>
          <div className="p-5 rounded-xl bg-card">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums block">
              {totalCount}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Total Members</span>
          </div>
        </div>

        {/* Status menu + user list */}
        <div className="flex-1 flex flex-row min-h-0">
          <div className="w-1/4 min-w-[200px] border-r border-border/60 flex flex-col bg-muted/20">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {BADGES.map((badge) => (
                  <button
                    key={badge.key}
                    onClick={() => handleBadgeClick(badge.key)}
                    className={cn(
                      "cursor-pointer w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-all text-left",
                      selectedFilter === badge.key
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{badge.label}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-auto text-xs h-5 px-1.5 min-w-6 justify-center bg-muted",
                        selectedFilter === badge.key && "text-primary"
                      )}
                    >
                      {counts[badge.countKey] ?? 0}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-card">
            <StatusCountsListPanel
              title={FILTER_LABELS[selectedFilter]}
              hideListHeader
              search={search}
              onSearchChange={setSearch}
              usersLength={users.length}
              filteredLength={filtered.length}
              searchTrim={search.trim()}
              filtered={filtered}
              isPending={isPending}
              isNoProgram={isNoProgram}
              sendingBulkInvites={sendingBulkInvites}
              onSendInvitations={handleSendInvitations}
              onUserClick={handleUserClick}
              onAssignProgram={setAssignProgramUser}
              complianceBadgeClass={complianceBadgeClass}
            />
          </div>
        </div>
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
