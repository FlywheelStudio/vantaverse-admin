'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompliancePieChart } from '@/components/users/compliance-pie-chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

export function ComplianceCard({
  compliance,
  programCompletion = null,
}: {
  compliance: number | null;
  programCompletion?: number | null;
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
        <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl text-dimmed font-normal tracking-tight">
              <span className="text-2xl font-semibold text-foreground">
                Compliance
              </span>
              <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 justify-baseline cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Aggregate for the average of compliance for all assigned programs.</p>
              </TooltipContent>
            </Tooltip>
            </CardTitle>
            
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4 flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden gap-4">
          <div className="flex items-center justify-center h-48 w-48 shrink-0">
            <CompliancePieChart
              compliance={value}
              programCompletion={programCompletion ?? 0}
              size={180}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Compliance is based on how many sets and exercises have been completed out of the total number of exercises assigned. Program completion is based on the number of days that have passed since the program was assigned.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
