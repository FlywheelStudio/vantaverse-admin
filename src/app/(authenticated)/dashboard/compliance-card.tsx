'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompliancePieChart } from '@/components/users/compliance-pie-chart';

export function ComplianceCard({
  compliance,
}: {
  compliance: number | null;
}) {
  const value = compliance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 shrink-0 gap-0">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="cursor-default text-xl text-dimmed font-normal tracking-tight">
              <span className="text-xl font-semibold text-foreground">
                Completion
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="cursor-default px-5 py-4 flex-1 flex flex-row items-start justify-center min-h-0 overflow-hidden gap-4">
          <p className="text-xs text-muted-foreground text-left max-w-xs rounded-md bg-muted py-2 flex-1">
            <b className="font-semibold text-foreground">Aggregate for the average of completion for all assigned programs. </b>
            Completion is based on how many sets and exercises have been completed out of the total number of exercises assigned.
          </p>
          <div className="flex items-center justify-center h-48 w-48 shrink-0">
            <CompliancePieChart compliance={value} size={180} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
