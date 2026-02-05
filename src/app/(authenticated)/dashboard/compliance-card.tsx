'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CompliancePieChart } from '@/components/users/compliance-pie-chart';

export function ComplianceCard({ compliance }: { compliance: number | null }) {
  const value = compliance ?? 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex-1 min-w-0"
    >
      <Card className="h-full min-h-0 flex flex-col gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
              <span className="text-2xl font-semibold text-foreground">
                Compliance
              </span>
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Aggregate compliance is the average of the compliance value from the program_with_stats view across all program assignments. The view’s compliance (or program_completion_percentage) reflects completion progress per assignment.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
          <div className="flex items-center justify-center h-48 w-48">
            <CompliancePieChart compliance={value} size={180} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
