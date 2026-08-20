'use client';

import { useMemo } from 'react';
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

/** Proxy for HTML "overdue" when due-date data is not available. */
const URGENT_COMPLIANCE_LT = 30;

 type DashboardStatusCountsProp = DashboardStatusCounts & {
  programCompleted?: number;
};

function isUrgentAttention(item: UserNeedingAttention): boolean {
  return item.compliance < URGENT_COMPLIANCE_LT;
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

  const overdue = needingAttention.filter(isUrgentAttention);

  const rows = useMemo(
    () =>
      needingAttention.map((item) => ({
        item,
        name: attentionDisplayName(item),
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

  return (
    <DashboardUi
      statusCounts={statusCounts}
      compliancePct={compliancePct}
      attentionCount={needingAttention.length}
      rows={rows}
      overdueCount={overdue.length}
      legend={legend}
      sparks={MOCK_SPARKS}
      onViewAllUsers={() => router.push('/users')}
      onOpenUser={(userId) => router.push(`/users/${encodeURIComponent(userId)}`)}
    />
  );
}
