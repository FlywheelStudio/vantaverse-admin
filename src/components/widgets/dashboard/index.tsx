'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  DashboardStatusCounts,
  UserNeedingAttention,
} from '@/lib/supabase/queries/dashboard';
import { DashboardUi } from './ui';

/** Mock spark series when real time-series data is unavailable (HTML scDashboard). */
const MOCK_SPARKS = {
  active: [44, 47, 46, 51, 54, 53, 57, 61],
  inProgram: [36, 38, 39, 41, 40, 43, 44, 45],
  completion: [19, 18, 17, 17, 15, 15, 14, 13],
  overdue: [2, 3, 3, 4, 4, 5, 5, 6],
};

const MOCK_FUNNEL = [
  { label: 'Intake survey signed', count: 88, total: 129 },
  { label: 'Screening attended', count: 74, total: 129 },
  { label: 'Consultation attended', count: 61, total: 129 },
  { label: 'Program assigned', count: 45, total: 129 },
] as const;

const MOCK_ACTIVITY = [
  { name: 'Nadia Okonjo', text: 'completed Week 3 Day 2', when: '2h ago' },
  { name: 'Chuck Bolland', text: 'logged a check-in — pain 2/10', when: '5h ago' },
  { name: 'Temi Adeyemi', text: 'signed the intake survey', when: '5h ago' },
  { name: 'Kiyoko Mori', text: 'opened the app', when: '6h ago' },
] as const;

/** Proxy for HTML "overdue" when due-date data is not available. */
const URGENT_COMPLIANCE_LT = 30;

export type DashboardStatusCountsProp = DashboardStatusCounts & {
  programCompleted?: number;
};

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function isUrgentAttention(item: UserNeedingAttention): boolean {
  return item.compliance < URGENT_COMPLIANCE_LT;
}

function attentionReason(item: UserNeedingAttention): string {
  const compliance = Math.round(item.compliance);
  if (isUrgentAttention(item)) {
    return item.program_name
      ? `Very low compliance (${compliance}%) · ${item.program_name}`
      : `Very low compliance (${compliance}%)`;
  }
  return item.program_name
    ? `Low compliance (${compliance}%) · ${item.program_name}`
    : `Low compliance (${compliance}%)`;
}

function attentionDisplayName(item: UserNeedingAttention): string {
  return (
    [item.first_name, item.last_name].filter(Boolean).join(' ') ||
    item.email ||
    'Member'
  );
}

export function Dashboard({
  statusCounts,
  needingAttention,
  compliancePct,
}: {
  statusCounts: DashboardStatusCountsProp;
  needingAttention: UserNeedingAttention[];
  compliancePct: number;
}): React.ReactElement {
  const router = useRouter();
  const [assignProgramUser, setAssignProgramUser] =
    useState<UserNeedingAttention | null>(null);

  const overdue = needingAttention.filter(isUrgentAttention);

  const rows = useMemo(
    () =>
      needingAttention.map((item) => ({
        item,
        name: attentionDisplayName(item),
        isOverdue: isUrgentAttention(item),
        reason: attentionReason(item),
      })),
    [needingAttention],
  );

  const legend = useMemo(() => {
    const inProgram = statusCounts.inProgram ?? 0;
    const invited = statusCounts.invited ?? 0;
    const active = statusCounts.active ?? 0;
    const noProgram =
      statusCounts.noProgram ?? Math.max(active - inProgram, 0);
    const programCompleted = statusCounts.programCompleted ?? 0;
    return [
      { label: 'In a program', value: inProgram, color: 'var(--cyan-500)' },
      {
        label: 'Program completed',
        value: programCompleted,
        color: 'var(--navy-700)',
      },
      { label: 'No program yet', value: noProgram, color: 'var(--slate-300)' },
      { label: 'Invited, not started', value: invited, color: 'var(--slate-200)' },
    ];
  }, [statusCounts]);

  const funnel = useMemo(
    () =>
      MOCK_FUNNEL.map((step) => ({
        ...step,
        share: pct(step.count, step.total),
      })),
    [],
  );

  return (
    <DashboardUi
      statusCounts={statusCounts}
      compliancePct={compliancePct}
      attentionCount={needingAttention.length}
      rows={rows}
      overdueCount={overdue.length}
      legend={legend}
      sparks={MOCK_SPARKS}
      funnel={funnel}
      activity={MOCK_ACTIVITY}
      assignProgramUser={assignProgramUser}
      onAssignOpen={setAssignProgramUser}
      onAssignClose={() => setAssignProgramUser(null)}
      onAssignSuccess={() => {
        router.refresh();
        setAssignProgramUser(null);
      }}
      onViewAllUsers={() => router.push('/users')}
      onMessageUser={(userId) => {
        router.push(`/messages?userId=${encodeURIComponent(userId)}`);
      }}
    />
  );
}
