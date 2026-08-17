'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, StatCard } from '@/components/medvanta';
import { CompliancePieChart } from '@/components/users/compliance-pie-chart';

export function ComplianceCard({
  compliance,
}: {
  compliance: number | null;
}): React.ReactElement {
  const value = compliance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="min-w-0 flex-1"
    >
      <Card padding={0} className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 px-5 pt-5">
          <CardHeader
            title="Completion"
            subtitle="Aggregate average of completion for all assigned programs."
            className="mb-0"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-row items-stretch gap-4 p-5 pt-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <StatCard
              label="Average completion"
              value={`${Math.round(value)}%`}
              icon="Target"
              accent="var(--primary)"
            />
            <p className="rounded-[var(--radius-sm)] bg-[var(--slate-50)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--text-muted)]">
              <span className="font-[var(--fw-semibold)] text-[var(--text-strong)]">
                Based on sets and exercises completed
              </span>{' '}
              out of the total number of exercises assigned.
            </p>
          </div>
          <div className="flex h-48 w-48 shrink-0 items-center justify-center">
            <CompliancePieChart compliance={value} size={180} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
