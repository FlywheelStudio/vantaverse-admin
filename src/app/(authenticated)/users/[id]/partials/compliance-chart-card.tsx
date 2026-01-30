'use client';

import { Card } from '@/components/ui/card';
import { CompliancePieChart } from '@/components/users/compliance-pie-chart';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface ComplianceChartCardProps {
  compliance: number | null;
  programAssignment: ProgramAssignmentWithTemplate | null;
}

export function ComplianceChartCard({
  compliance,
  programAssignment,
}: ComplianceChartCardProps) {
  if (programAssignment === null || compliance == null) return null;

  return (
    <Card
      className="mt-6 border-0 rounded-xl p-6 flex justify-center items-center min-h-[240px] overflow-hidden relative"
      style={{
        background:
          'linear-gradient(135deg, oklch(0.96 0.02 195) 0%, oklch(0.98 0.01 195) 50%, oklch(1 0 0) 100%)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'oklch(0.65 0.12 195)',
          transform: 'translate(50%, -50%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'oklch(0.65 0.12 195)',
          transform: 'translate(-50%, 50%)',
        }}
      />
      <div className="relative z-10">
        <CompliancePieChart compliance={compliance} size={200} />
      </div>
      <p
        className="absolute bottom-3 left-4 z-10 text-xs font-normal text-muted-foreground truncate max-w-[calc(100%-2rem)]"
        title={programAssignment.program_template.name}
      >
        {programAssignment.program_template.name}
      </p>
    </Card>
  );
}
