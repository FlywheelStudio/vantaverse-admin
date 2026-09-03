'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type {
  DashboardStatusCounts,
  UserNeedingAttention,
  DashboardAnalyticsPoint,
} from './queries';
import { DashboardUi, type DashboardDelta } from './ui';

type DashboardStatusCountsProp = DashboardStatusCounts & {
  programCompleted?: number;
};

interface DashboardProps {
  statusCounts: DashboardStatusCountsProp;
  compliancePct: number;
  needingAttention: UserNeedingAttention[];
  overdueCount: number;
  series: {
    active: DashboardAnalyticsPoint[];
    inProgram: DashboardAnalyticsPoint[];
    completion: DashboardAnalyticsPoint[];
    overdue: DashboardAnalyticsPoint[];
  };
  deltas: {
    active: number;
    inProgram: number;
    completion: number;
    overdue: number;
  };
}

function attentionDisplayName(item: UserNeedingAttention): string {
  return (
    [item.first_name, item.last_name].filter(Boolean).join(' ') ||
    item.email ||
    'Member'
  );
}

function sparkValues(points: DashboardAnalyticsPoint[]): number[] {
  return points.map((p) => p.value);
}

function formatDelta(value: number, unit = ''): string {
  if (!value) return '';
  const sign = value > 0 ? '+' : '−';
  const magnitude = Math.abs(Math.round(unit ? value * 10 : value) / 10);
  return `${sign}${magnitude}${unit}`;
}

function deltaTrend(value: number): DashboardDelta['trend'] {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

export function Dashboard({
  statusCounts,
  compliancePct,
  needingAttention,
  overdueCount,
  series,
  deltas,
}: DashboardProps): React.ReactElement {
  const router = useRouter();

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

  // "In a program" and "overdue" count members; a decrease is the good direction.
  const memberDeltaTrend = (value: number): DashboardDelta['trend'] =>
    value === 0 ? 'flat' : value < 0 ? 'down' : 'up';

  const tileDeltas: DashboardDelta[] = [
    { text: formatDelta(deltas.active), trend: deltaTrend(deltas.active) },
    {
      text: formatDelta(deltas.inProgram),
      trend: memberDeltaTrend(deltas.inProgram),
    },
    {
      text: formatDelta(deltas.completion, ' pts'),
      trend: deltaTrend(deltas.completion),
    },
    {
      text: formatDelta(deltas.overdue),
      trend: memberDeltaTrend(deltas.overdue),
    },
  ];

  return (
    <DashboardUi
      statusCounts={statusCounts}
      compliancePct={compliancePct}
      attentionCount={needingAttention.length}
      rows={rows}
      overdueCount={overdueCount}
      legend={legend}
      sparks={{
        active: sparkValues(series.active),
        inProgram: sparkValues(series.inProgram),
        completion: sparkValues(series.completion),
        overdue: sparkValues(series.overdue),
      }}
      deltas={tileDeltas}
      onViewAllUsers={() => router.push('/users')}
      onOpenUser={(userId) => router.push(`/users/${encodeURIComponent(userId)}`)}
    />
  );
}
