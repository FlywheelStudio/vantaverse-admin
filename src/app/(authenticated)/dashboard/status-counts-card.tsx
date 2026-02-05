'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStatusCounts } from '@/lib/supabase/queries/dashboard';

export function StatusCountsCard({ counts }: { counts: DashboardStatusCounts }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
          <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
            <span className="text-2xl">Member</span>{' '}
            <span className="text-2xl font-semibold text-foreground">
              Status
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-card/50 border border-border/50">
              <span className="text-3xl font-bold text-foreground">{counts.pending}</span>
              <span className="text-sm text-muted-foreground mt-1">Pending</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-card/50 border border-border/50">
              <span className="text-3xl font-bold text-foreground">{counts.invited}</span>
              <span className="text-sm text-muted-foreground mt-1">Invited</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-card/50 border border-border/50">
              <span className="text-3xl font-bold text-foreground">{counts.active}</span>
              <span className="text-sm text-muted-foreground mt-1">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
