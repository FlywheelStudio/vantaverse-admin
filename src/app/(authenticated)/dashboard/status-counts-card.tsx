'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendBulkInvitations } from '@/app/(authenticated)/users/actions';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { StatusCountsListPanel } from '@/app/(authenticated)/dashboard/status-counts-list-panel';
import { Badge, Card, CardHeader } from '@/components/medvanta';
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

type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

const FILTER_LABELS: Record<StatusFilter, string> = {
  pending: 'Pending',
  invited: 'Invited',
  active: 'Active',
  noProgram: 'No program',
  inProgram: 'In program',
  programCompleted: 'Program completed',
};

const BADGES: {
  key: StatusFilter;
  countKey: keyof StatusCountsWithProgramCompleted;
  label: string;
  tone: BadgeTone;
}[] = [
  { key: 'active', countKey: 'active', label: 'Active', tone: 'success' },
  { key: 'pending', countKey: 'pending', label: 'Pending', tone: 'warning' },
  { key: 'invited', countKey: 'invited', label: 'Invited', tone: 'brand' },
  { key: 'noProgram', countKey: 'noProgram', label: 'No program', tone: 'neutral' },
  { key: 'inProgram', countKey: 'inProgram', label: 'In program', tone: 'accent' },
  { key: 'programCompleted', countKey: 'programCompleted', label: 'Program completed', tone: 'success' },
];

function complianceBadgeTone(compliance: number): BadgeTone {
  const pct = Math.round(compliance);
  if (pct >= 80) return 'success';
  if (pct >= 50) return 'warning';
  return 'danger';
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
}): React.ReactElement {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('active');
  const [search, setSearch] = useState('');
  const [optimisticallyInvitedIds, setOptimisticallyInvitedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [sendingBulkInvites, setSendingBulkInvites] = useState(false);
  const [assignProgramUser, setAssignProgramUser] = useState<DashboardStatusUser | null>(null);

  const rawUsers = selectedFilter ? usersByFilter[selectedFilter] : [];
  const users =
    selectedFilter === 'pending'
      ? rawUsers.filter((u) => !optimisticallyInvitedIds.has(u.user_id))
      : rawUsers;

  const isPending = selectedFilter === 'pending' || selectedFilter === 'invited';
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

  const handleUserClick = (userId: string): void => {
    router.push(`/users/${userId}`);
  };

  const handleBadgeClick = (filter: StatusFilter): void => {
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
      className="min-w-0 flex-1 pb-2"
    >
      <Card padding={0} className="flex h-full min-h-[500px] flex-col overflow-hidden">
        <div className="shrink-0 px-5 pt-5">
          <CardHeader title="Member Status" className="mb-0" />
        </div>

        <div className="flex min-h-0 flex-1 flex-row">
          <div className="flex w-1/4 min-w-[200px] flex-col border-r border-[var(--border-subtle)] bg-[var(--slate-50)]">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-3">
                {BADGES.map((badge) => (
                  <button
                    key={badge.key}
                    type="button"
                    onClick={() => handleBadgeClick(badge.key)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[length:var(--text-sm)] transition-all',
                      selectedFilter === badge.key
                        ? 'bg-[var(--navy-100)] font-[var(--fw-semibold)] text-[var(--primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-strong)]',
                    )}
                  >
                    <span>{badge.label}</span>
                    <Badge tone={badge.tone}>{counts[badge.countKey] ?? 0}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-w-0 flex-1 flex-col bg-[var(--surface-card)]">
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
              complianceBadgeTone={complianceBadgeTone}
            />
          </div>
        </div>
      </Card>

      {assignProgramUser ? (
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
      ) : null}
    </motion.div>
  );
}
